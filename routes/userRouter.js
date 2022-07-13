const express = require('express');

const userController = require(__dirname + './../controllers/users');

// requiring the user authentication controller
const authController = require('./../controllers/authController');

// writing code for users

const router = express.Router();

// route for forgot password?
router
.route('/forgotpassword')
.post(authController.forgotPassword);

// route for reset password?
router
.route('/resetpassword/:token')
.patch(authController.resetPassword);

// for user authentication and sign up
router
.route('/signup')
.post(authController.signUp);

// for user authentication during logins
router.post('/login',authController.logIn);


// TO let users loggOut
router.get('/logout',authController.logOut);

// WILL WORK FOR ALL THE ROUTES BELOW
router.use(authController.protect);

// /me route
router
.route('/me')
.get(userController.getMe,userController.getUser)

// route for update password
router
.route('/updatemypassword')
.patch(authController.updatePassword);

// route to let user update
router
.route('/updateme')
.patch(userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe)

// route to let user delete his account
router
.route('/deleteme')
.delete(userController.deleteMe)

// WILL WORK FOR ALL THE ROURTES BELOW

router.use(authController.restrictTo('admin'))

// for user request
router
.route('/')
.get(userController.getUsers)
.post(userController.createUser);

router
.route('/:id')
.get(userController.getUser)
.patch(userController.updateUser)
.delete(userController.deleteUser);

module.exports = router;