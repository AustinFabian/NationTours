const express = require('express');
const router = express.Router();
const viewController = require('./../controllers/viewController')
const authController = require('./../controllers/authController')
const bookingsController = require('./../controllers/bookingsController')

router.use(viewController.alerts)

router.get('/', authController.isLoggedIn,viewController.getOverview)

router.get('/tour/:slug',authController.isLoggedIn,viewController.getTour);

router.get('/login',authController.isLoggedIn,viewController.getLoginForm);

router.get('/signup', authController.isLoggedIn, viewController.getSignupForm);

router.get('/me',authController.protect,viewController.getAccount);

router.get('/my-tours',authController.protect,viewController.getMyTours)

router.post('/submit-user-data',authController.protect,viewController.updateUserData);

module.exports = router