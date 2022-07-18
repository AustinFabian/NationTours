const crypto = require('crypto');
const util = require('util');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const dotenv = require('dotenv');
const AppError = require('./../utils/AppError');
const Email = require('./../utils/email');

var utils = {...util}

var promisify = utils.promisify

dotenv.config({path:__dirname + '/../config.env'});

// console.log(process.env);

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

function createSendToken(user,statusCode,req,res){

  console.log('God is good');
    const token = signToken(user._id);

    res.cookie('jwt', token, {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    })

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'Success',
        token,
        data:{
          user
        }
    });
}

// To Authenticate a user on signup
exports.signUp = catchAsync(async(req,res)=>{
    const newUser = await User.create({
        name:req.body.name,
        email:req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    const url = `${req.protocol}://${req.get('host')}/me`

    // await new Email(newUser,url).sendWelcome()

    createSendToken(newUser,201,req,res)
});

// To authenticate a user on login
exports.logIn = catchAsync(async(req,res,next)=>{
  const { email, password } = req.body;
  
    // const body = {...req.body}
    // const email = body.email;
    // const password = body.password;
    
    // Check if email and password exists
    if(!email || !password){
       return next(new AppError('please provide email and password', 404));
    }
    // Check if user exists and password is correct
    const user = await User.findOne({email}).select('+password');

    // Check if both passwords encryption is correct
    if(!user || !(await user.correctPassword(password,user.password))){
        return next(new AppError('Email Or password incorrect', 401));
    }

    // If everything is ok send token to client
    // const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
    //     expiresIn: process.env.JWT_EXPIRES_IN
    // });

    createSendToken(user,200,req,res)
});

// Protecting data that can only be viewed when clients are authenticated
exports.protect = catchAsync(async(req,res,next)=>{
// 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }else if(req.cookies.jwt){
    token = req.cookies.jwt
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

// 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    

// 3)Check if user still exists
    const id = decoded.id;
    const currentUser = await User.findById(id);

    if(!currentUser){
        return next(new AppError('The user belonging to this token does not exist anymore',401))
    }

    // check if user passwrd was changed After token was issued
    if(currentUser.changedPasswordAfter(decoded.iat)){
       return next( new AppError('User recently changed password, please login again.', 401))
    }

    req.user = currentUser;
    res.locals.user = currentUser;
    next()
});

// Middle ware for rendererrd page
exports.isLoggedIn = async(req,res,next)=>{
    try{
      if(req.cookies.jwt){
      // 1) Verification of token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
      
  
  // 2)Check if user still exists
      const id = decoded.id;
      const currentUser = await User.findById(id);
  
      if(!currentUser){
          return next()
      }
  
      // check if user passwrd was changed After token was issued
      if(currentUser.changedPasswordAfter(decoded.iat)){
         return next()
      }
      
      // THERE IS A LOGGED IN USER
      res.locals.user = currentUser;
      return next()
    }
    }catch(err){
      return next()
    }
    next();
  };

  exports.logOut = (req,res)=>{
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      status: 'Success'
    })
  } 

// Code for user authorization to do specific activities in the web App
// Making use of the rest parameter syntax (new to restful api)

exports.restrictTo = (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new AppError('You are not allowed to perform this task',403))
        }
        next()
    }
}

// Code for forgot password
exports.forgotPassword = catchAsync(async (req,res,next)=>{
    // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  
  await user.save({ validateBeforeSave: false });

    try{

    // send it to users email
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    // from the Email handler
      await new Email(user,resetURL).sendPasswordReset();

    res.status(200).json({
        status: 'success',
        message: 'token sent to Email'
    })
    }catch(err){
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending the email. Try again later!',500));
    }
});

// code for Reset password
exports.resetPassword = catchAsync(async(req,res,next)=>{
    // Get user based on token
    const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

    const user = await User.findOne({passwordResetToken:hashedToken,passwordResetExpires:{$gt:Date.now()}});

    // if token has not expired and there is user, set the password
    if(!user){
        return next(new AppError('Token is invalid or has expired',400))
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Update changedPasswordAt for the user
    

    // log the user in, send jwt
    // const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
    //     expiresIn: process.env.JWT_EXPIRES_IN
    // });

    createSendToken(user,200,req,res)
});

// writing code to allow user change or update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});
