const express = require('express');

const reviewController = require('./../controllers/reviewController');

const authController = require('./../controllers/authController');


const router = express.Router({mergeParams:true});

// 
router.use(authController.protect)

// ROUTE TO GET ALL, AND POST REVIEW
router
.route('/')
.get(reviewController.getReviews)
.post(authController.restrictTo('user')
,reviewController.setTourUserIds
,reviewController.createReview);

// ROUTE TO GET ONE  DELETE AND UPDATE A REVIEW
router
.route('/:id')
.get(reviewController.getReview)
.delete(authController.restrictTo('user', 'admin'),reviewController.deleteReview)
.patch(authController.restrictTo('user', 'admin'),reviewController.updateReview)

module.exports = router;