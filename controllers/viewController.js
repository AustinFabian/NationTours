const Tour = require('./../models/tourModel');

const Bookings = require('./../models/bookingsModel')

const catchAsync = require('./../utils/catchAsync');

const AppError = require('./../utils/AppError')

const User = require('./../models/userModel')

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful! Please check your email for a confirmation. If your booking doesn't show up here immediatly, please come back later.";
  next();
};

exports.getOverview = catchAsync(async (req,res,next)=>{
    const tours = await Tour.find()
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    })
});

exports.getTour = catchAsync(async (req,res,next)=>{
    
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
        path: 'reviews',
        fields: 'review rating user'
    });

    if (!tour) {
        return next(new AppError('There is no tour with that name.', 404));
      }
      
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    })
});

exports.getLoginForm = async(req,res)=>{
    res.status(200).render('login',{
        title: 'Log in to your account'
    })
}

exports.getSignupForm = async (req, res) => {
  res.status(200).render('signup', {
    title: 'Signup to create an account',
  });
};

// for user account rendering
exports.getAccount = async(req,res)=>{
    res.status(200).render('account',{
        title: 'Your account'
    })
}

// function and middleware for user booked tour

exports.getMyTours = catchAsync(async(req,res,next)=>{
    // 1 find all bookings
    const bookings = await Bookings.find({user: req.user.id})
    // 2 find tours with the returned IDs
    const tourIDs = await bookings.map(el => el.tour)
    const tours = await Tour.find({_id: {$in: tourIDs}})

    res.status(200).render('overview',{
        title: 'My Tours',
        tours
    })
})

// FOR POST REQUEST TO UPDATE USER DATA FROM HTML
exports.updateUserData = catchAsync(async(req,res,next)=>{
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email:req.body.email
    },
    {
        new:true,
        runValidators: true
    })

    res.status(200).render('account',{
        title: 'Your account',
        user: updatedUser
    })

});




// .setHeader('set-cookie', [' SameSite=None; Secure',])

// https://www.section.io/engineering-education/what-are-cookies-nodejs/