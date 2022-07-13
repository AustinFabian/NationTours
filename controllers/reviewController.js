const Review = require('./../models/reviewmodel');
const catchAsync = require('./../utils/catchAsync');
// requiring our custom handler factory function
const handler = require('./handlerFactory');


// GET ALL REVIEWS
exports.getReviews = handler.getAll(Review);
// OR
// exports.getReviews = catchAsync(async (req,res,next)=>{
//     let filter = {};
//     if(req.params.tourId) filter = {tour: req.params.tourId}

//     const reviews = await Review.find(filter);

//     res.status(200).json({
//         status: 'Success',
//         result: reviews.length,
//         data:{
//             reviews
//         }
//     });
// });

// GET ONE REVIEW
exports.getReview = handler.getOne(Review)

// CREATE REVIEW
exports.setTourUserIds = (req,res,next)=>{
    // Allows nested routes
    if(!(req.body.tour)) req.body.tour = req.params.tourId;
    if(!(req.body.user)) req.body.user = req.user.id;

    next();
}
exports.createReview = handler.createOne(Review);
// OR
// exports.createReview = catchAsync(async (req,res,next)=>{
//     const newReview = await Review.create(req.body);

//     res.status(201).json({
//         status: 'Success',
//         result: newReview.length,
//         data:{
//             newReview
//         }
//     });
// });
// UPDATE REVIEW
exports.updateReview = handler.updateOne(Review);
// DELETE REVIEW
exports.deleteReview = handler.deleteOne(Review);
