const crypto = require('crypto')

const mongoose = require('mongoose');

const validator = require('validator');

const bcrypt = require('bcryptjs')

// CREATING USER SCHEMA
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Please tell us your name']
    },
    email:{
        type: String,
        unique: true,
        required: [true, 'A user must have an email'],
        lowercase: true,
        validate: [validator.isEmail,'Please provide a valid Email']
    },
    role: {
        type:String,
        enum:['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    photo: {
        type:String,
        default: 'default.jpg'
    },
    password:{
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 8,
        select: false
    },
    passwordConfirm:{
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(el){
                return el === this.password
            },
            message: 'passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
        type:Boolean,
        default: true,
        select:false
    }
});

// middleware function for pre save when a new document is created
userSchema.pre('save', async function(next){
    // Only run this function if password was actaually modified
    if(!this.isModified('password')){
        return next()
    }

    // Hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);

    // Delete passwordConfirm field
    this.passwordConfirm = undefined;

    next();
});

// middleware function for pre save when a document is updated
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) return next();
  
    this.passwordChangedAt = Date.now() - 1000;
    next();
  });

//   mongoose middleware function for, when a users delete there document
  userSchema.pre(/^find/, function(next) {
    // this points to the current query
    this.find({ active: { $ne: false } });
    next();
  });

// Creating our instance method to check if passwrds are the same as the encrypted password
userSchema.methods.correctPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword);
}

// Creating our instance method to check if user passwOrd was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {

    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
        this.passwordChangedAt.getTime() / 1000,
        10
      )
  
      return JWTTimestamp < changedTimestamp;
    }
  
    return false; //Do this if user does  not change password
  };

//   Creating instance method for creating passwod reset token
    userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    console.log({resetToken},this.passwordResetToken)

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}


const User = mongoose.model('User',userSchema);

module.exports = User;