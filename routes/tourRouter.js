const express = require('express');

const tourController = require('./../controllers/tours');

const authController = require('./../controllers/authController');

const reviewRouter = require('./reviewRouter');

const router = express.Router();

// router.param('id', tourController.checkId)

// CODE THAT FACILITATE ROUTE MERGING FOR REVIEWS AND TOURS
router.use('/:tourId/reviews', reviewRouter);

// Creating a new route for alias top tours
router
.route('/top-5-cheap-tours')
.get(tourController.aliasTopTours,tourController.getTours);

// Aggregation route
router
.route('/tour-stats')
.get(tourController.getTourStats)

// For get monthlyplan route
router
.route('/monthly-plan/:year')
.get(authController.protect,authController.restrictTo('admin', 'lead-guide', 'guide'),tourController.getMonthlyPlan)

// TOUR GEOSPACIAL ROUTE FOR TOURS WITHINN A SPCIFIC GEOSPACE
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
// /tours-within?distance=233&center=-40,45&unit=mi
// /tours-within/233/center/-40,45/unit/mi

// TOUR GEOSPACIAL ROUTE WTIH ACCORDANCE WITH CLOSER TO FARTHER TOUR LOCATION
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);


// for tour
router
.route('/')
.get(tourController.getTours)
.post(authController.protect,authController.restrictTo('admin', 'lead-guide'),tourController.createTour);
// .post(tourController.checkBody,tourController.createTour);

router
.route('/:id')
.get(tourController.getTour)
.patch(authController.protect
  ,authController.restrictTo('admin','lead-guide')
  ,tourController.uploadTourImages
  ,tourController.resizeTourImages
  ,tourController.updateTour)
.delete(authController.protect
  ,authController.restrictTo('admin','lead-guide')
  ,tourController.deleteTour);

module.exports = router;