const mongoose = require('mongoose');

const slugify = require('slugify');

const User = require('./userModel');

// Making use of the npm validator module
const validator = require('validator')

const tourSchema = new mongoose.Schema(
{
    name:{
        required: [true,'A tour must have a name'],
        type: String,
        unique: true,
        trim:true,
        maxlength: [40, 'A tour name must have less than 40 characters'],
        minlength: [10, 'A tour name must have more or equal than 10 characters'],
        // validate: [validator.isAlpha, 'Tour name must have no digits attached']
    },
    slug: String,
    duration:{
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize:{
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty:{
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values:['easy', 'medium', 'difficult'],
            message:'A value must iether be easy, medium or difficult '
        }
    },
    ratingsAverage:{
        type: Number,
        default: 4.5,
        min:[1,'A rating must be above one '],
        max:[5, 'A rating must be below 5'],
        set: function(val){
            return Math.round(val * 10) / 10
        }
    },
    ratingsQuantity:{
        type: Number,
        default: 0
    },
    price:{
        required: [true, 'A tour must have a price'],
        type: Number,
    },
    priceDiscount: {
        type: Number,
        validate:{
            // This only works when there is a new document creation
            validator: function(val){
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        }
    },
    summary:{
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary']
    },
    description:{
        type: String,
        trim: true,
    },
    imageCover:{
        type: String,
        required: [true, 'A tour must have an Image Cover']
    },
    images: [String],
    createdAt:{
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
          type: {
            type: String,
            default: 'Point',
            enum: ['Point']
          },
          coordinates: [Number],
          address: String,
          description: String,
          day: Number
        }
    ],
    guides: [
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        }
    ]
},
{
    toJSON:{virtuals: true},
    toObject:{virtuals: true}
}
);

// Compund indexing
tourSchema.index({price: 1, ratingsAverage: -1});

// Single indexing
// tourSchema.index({price: 1});
tourSchema.index({slug: 1});

// indexing for use  Geospacial locations
tourSchema.index({ startLocation: '2dsphere' });

// creating a virtual property schema
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7;
});

// creating a virtual property schema for viewing reviews when a tour is queried without actually storing it in the schema(Pseudoo schema property)
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

// making use of mongoose middle ware

tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

tourSchema.pre(/^find/, function(next) {
    this.populate({
        path:'guides',
        select:'-__v -passwordChangedAt'
    })
    next();
});

// CODE FOR EMBEDDING GUIDES IN THE DB
// tourSchema.pre('save', async function(next) {
//     guides = this.guides.map(async function(id){
//         return await User.findById(id);
//     });
//     this.guides = await Promise.all(guides);
//     next();
// });

// FOR QUERY I.E FIND
tourSchema.pre(/^find/,function(next){
    this.find({secretTour:{$ne: true}});

    this.start = Date.now()
    next()
});

tourSchema.post(/^find/,function(doc,next){
    console.log(`Query took ${Date.now() - this.start} milliseconds`)
    next()
});

// creating a model for our schema

const Tour = mongoose.model('Tour',tourSchema);

module.exports = Tour;