const mongoose = require('mongoose');
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({
    review:{
        type: String,
        required: [true, 'Review cannot be empty']
    },
    ratings:{
        type: Number,
        default: 4.5,
        min:[1,'A rating must be above one '],
        max:[5, 'A rating must be below 5']
    },
    createdAt:{
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour.']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }
});

// MONGOOSE MIDDLEWARE FUNCTIONS
reviewSchema.pre(/^find/, function(next){
    // this.populate({
    //     path:'tour',
    //     select:'name'
    // })
    this.populate({
        path:'user',
        select:'name photo'
    })
    next()
});

// creating a static function
reviewSchema.statics.calcAverageRatings = async function(tourId){
    const stats = await this.aggregate([
        {
            $match : {tour: tourId}
        },
        {
            $group : {
                _id: '$tour',
                nRating: {$sum: 1},
                avgRating: {$avg: '$ratings'}
            }
        }
    ]);

    console.log(stats);
    if (stats.length > 0){
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    }else{
        await Tour.findByIdAndUpdate(tourId,{
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        })
    }
};

// INDEXING USER REVIEW TO NOT ALLOW A USER POST A REVIEW TWICE
reviewSchema.index({tour:1, user:1}, {unique: true});

reviewSchema.post('save', function(){
    // this points to current review
    this.constructor.calcAverageRatings(this.tour);
    // this.constructor points to the current Model used in place of Review
})

// FOR DELETING AND UPDATING REVIEWS TO MAKE EFFET IN THE TOUR HOME PAGE
reviewSchema.pre(/^findOneAnd/, async function(next){
    this.r = await this.findOne();
    console.log(this.r);
    next();
});

reviewSchema.post(/^findOneAnd/, async function(){
   await this.r.constructor.calcAverageRatings(this.r.tour);
});

const Review = mongoose.model('Review',reviewSchema);

module.exports = Review;
