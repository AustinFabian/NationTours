const fs = require('fs');

// requiring the tourModel module
const Tour = require('./../models/tourModel');

// requiring our mongoose query constructor module
const APIfeatures = require('./../utils/APIfeatures');

// Requiring the AppError module and errorController module
const AppError = require('./../utils/AppError');
const errorController = require('./../controllers/errorController');

// Getting our catch async function from the module
const catchAsync = require('./../utils/catchAsync')

// requiring our custom handler factory function
const handler = require('./handlerFactory');

// requiring the sharp module used for processing images to suit our style
const sharp = require('sharp');
// MAKING USE OF THE MULTER SPECIAL MIDDLEWARE FOR UPLOADING FILES FROM A FORM
const multer = require('multer')

// CODES CONSIGNING EXPRESS AND OUR DATABASE(MONGOOSE)

const multerStorage = multer.memoryStorage()

const multerFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null,true)
  }else{
    cb(new AppError('Not an Image please upload only Images',400),false)
  }
}

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});
exports.uploadTourImages = upload.fields([
  {
    name: 'imageCover',
    maxCount: 1
  },
  {
    name: 'images',
    maxCount: 3
  }
]);

// code to resize the image files using multer
exports.resizeTourImages = catchAsync(async (req,res,next)=>{
  console.log(req.files)
  if(!req.files.imageCover || !req.files.images) return next()


  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`

  // FOR IMAGES
  await sharp(req.files.imageCover[0].buffer)
  .resize(2000,1333)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/tours/${req.body.imageCover}`)


  // FOR IMAGE COVER
  req.body.images = [];

  await Promise.all
    (req.files.images.map(async (file, i)=>{
      const filename =  `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`
      
      await sharp(file.buffer)
      .resize(2000,1333)
      .toFormat('jpeg')
      .jpeg({quality: 90})
      .toFile(`public/img/tours/${filename}`)

      req.body.images.push(filename)
    })
  );


  next();
});

// Writing a middleware function for aliasTopTours 
exports.aliasTopTours = (req,res,next) =>{
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

// getTours function
exports.getTours = handler.getAll(Tour);

// getTour function
exports.getTour = handler.getOne(Tour, {path: 'reviews'});
// OR
// exports.getTour = catchAsync(async (req,res,next)=>{


//         var param = req.params;

//         var id = param.id;

//         const tour = await Tour.findById(id).populate('reviews');

//         if(!tour){
//             return next(new AppError('No tour found with that ID',404))
//         }

//         // You can also use the findOne() method with the _id: being the req.params.id
//         // Syntax Tour.findOne(_id:req.params.id); 

//         res.status(200).json({
//             status: 'success',
//             data:{
//                 tour
//             }
//         });
// });

// createTour function
exports.createTour = handler.createOne(Tour);
// OR
// exports.createTour = catchAsync(async(req,res,next)=>{
//     const newTour = await Tour.create(req.body);

//         res.status(201).json({
//         status: 'success',
//         data:{
//             tour: newTour
//         }
//         });
   
// });

// updateTour function
exports.updateTour = handler.updateOne(Tour);
// OR
// exports.updateTour = catchAsync(async(req,res,next)=>{

//         const tour = await Tour.findByIdAndUpdate(req.params.id,req.body,{
//             new: true,
//             runValidators:true
//         });

//         if(!tour){
//             return next(new AppError('No tour found with that ID',404))
//         }

//         res.status(200).json({
//             status:'success',
//             data:{
//                 tour
//             }
//         })
// });

// Delete tour function
exports.deleteTour = handler.deleteOne(Tour);
// OR
// exports.deleteTour = catchAsync(async(req,res,next)=>{
//         const tour = await Tour.findByIdAndDelete(req.params.id);

//         if(!tour){
//             return next(new AppError('No tour found with that ID',404))
//         }

//         res.status(200).json({
//             status: 'success',
//             data: null
//         });
// });

// AGGREGATION FUNCTION
exports.getTourStats = catchAsync(async (req,res,next)=>{
        const stats = await Tour.aggregate([
            {
                $match:{ratingsAverage: {$gt: 4.5}}
            },
            {
                $group: {
                    _id: {$toUpper:'$difficulty'},
                    numTours:{ $sum: 1},
                    numRating:{ $sum: '$ratingsQuantity'},
                    avgRating:{ $avg: '$ratingsAverage' },
                    avgPrice:{ $avg: '$price' },
                    minPrice:{ $min: '$price' },
                    maxPrice:{ $max: '$price' }
                }
            },
            {
                $sort:{
                    avgprice: 1
                }
            },
            // {
            //     $match:{
            //         _id: {$ne: 'EASY'}
            //     }
            // }
        ]);
        res.status(200).json({
            status:'success',
            result: stats.length,
            data:{
                stats
            }
        })
});

// AGGREGATION FUNCTION FOR MOST REQUESTED TOUR FOR THE YEAR
exports.getMonthlyPlan = catchAsync(async (req,res,next)=>{
        const year = req.params.year * 1;

        console.log(year)

        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match:{
                    startDates:{
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`) 
                    }
                }
            },
            {
                $group:{
                    _id: {$month: '$startDates'},
                    numMonths: {$sum: 1},
                    tours: {$push:'$name'}
                }
            },
            {
               $addFields: { month: '$_id' }
            },
            {
                $project:{_id: 0}
            },
            {
                $sort:{
                    numMonths: -1
                }
            },
            {
                $limit: 6
            }
        ]);

        console.log('we got here');
        res.status(200).json({
            status:'success',
            result : plan.length,
            data:{
                plan
            }
        })
});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
  
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
  
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitutr and longitude in the format lat,lng.',
          400
        )
      );
    }
  
    const tours = await Tour.find({
      startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    });
  
    res.status(200).json({
      status: 'success',
      results: tours.length,
      data: {
        data: tours
      }
    });
  });
  
  exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
  
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  
    if (!lat || !lng) {
      next(
        new AppError(
          'Please provide latitute and longitude in the format lat,lng.',
          400
        )
      );
    }
  
    const distances = await Tour.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng * 1, lat * 1]
          },
          distanceField: 'distance',
          distanceMultiplier: multiplier
        }
      },
      {
        $project: {
          distance: 1,
          name: 1
        }
      }
    ]);
  
    res.status(200).json({
      status: 'success',
      data: {
        data: distances
      }
    });
  });
  





// const Tours = fs.readFileSync(__dirname + '/../dev-data/data/tours-simple.json','utf-8');

// const tour = JSON.parse(Tours);

// console.log(__dirname);

// exports.getTours = catchAsync(async(req,res,next)=>{
        // FILTERING THROUGH OUR API

        // destructuring the req.query object and gettimg info with matching properties
        // const queries = {...req.query};
        // console.log(queries);

        // Excluding some parameters or queries or api fields that will be needed specially
        // const excludedFields = ['page', 'sort', 'limit', 'fields'];

        // excludedFields.forEach(function(el){
        //     delete queries[el];
        // });

        // console.log(queries);

        // ADVANCED FILTERING
        // let queryStr = JSON.stringify(queries);
        // queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, function(match){
        //     return `$${match}`
        // })

        // console.log(JSON.parse(queryStr));

        // Making use of the mongoose filter first solution
        // let query = Tour.find(JSON.parse(queryStr));

        // Or make use of the second solution
        // const query = Tour
        // .find()
        // .where('difficulty')
        // .equals('easy')
        // .where('duration')
        // .equals(5);

        // Sorting

        // if(req.query.sort){
        //     const sortBy = req.query.sort.split(',').join(' ');
        //     console.log(sortBy);
        //     query = query.sort(sortBy);
        // }else{
        //     query = query.sort('-createdAt');
        // }

        // Field limiting

        // if(req.query.fields){
        //     const fields = req.query.fields.split(',').join(' ');
        //     query = query.select(fields)
        // }else{
        //     query = query.select('-__v')
        // }

        // Pagination
        // const page = req.query.page * 1 || 1;

        // const limit = req.query.limit * 1 || 100;

        // console.log(limit);

        // const skip = (page - 1) * limit;

        // console.log(skip);

        // query = query.skip(skip).limit(limit);

        // if(req.query.page){
        //     const numTours = await Tour.countDocuments();
        //     if(skip >= numTours) throw new Error
        // }

        // const features = new APIfeatures(Tour.find(),req.query)
        // .filter()
        // .sort()
        // .limitFields()
        // .paginate();

        // const tours = await features.query;

        // console.log(req.headers);

//     res.status(200).json({
//         status:'success',
//         result: tours.length, 
//         data:{
//             tours
//         }
//     });
// });




// AN ASYNC FUNCTION CODE
// exports.getTours = async(req,res)=>{
//     try{
//         // FILTERING THROUGH OUR API

//         // destructuring the req.query object and gettimg info with matching properties
//         // const queries = {...req.query};
//         // console.log(queries);

//         // Excluding some parameters or queries or api fields that will be needed specially
//         // const excludedFields = ['page', 'sort', 'limit', 'fields'];

//         // excludedFields.forEach(function(el){
//         //     delete queries[el];
//         // });

//         // console.log(queries);

//         // ADVANCED FILTERING
//         // let queryStr = JSON.stringify(queries);
//         // queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, function(match){
//         //     return `$${match}`
//         // })

//         // console.log(JSON.parse(queryStr));

//         // Making use of the mongoose filter first solution
//         // let query = Tour.find(JSON.parse(queryStr));

//         // Or make use of the second solution
//         // const query = Tour
//         // .find()
//         // .where('difficulty')
//         // .equals('easy')
//         // .where('duration')
//         // .equals(5);

//         // Sorting

//         // if(req.query.sort){
//         //     const sortBy = req.query.sort.split(',').join(' ');
//         //     console.log(sortBy);
//         //     query = query.sort(sortBy);
//         // }else{
//         //     query = query.sort('-createdAt');
//         // }

//         // Field limiting

//         // if(req.query.fields){
//         //     const fields = req.query.fields.split(',').join(' ');
//         //     query = query.select(fields)
//         // }else{
//         //     query = query.select('-__v')
//         // }

//         // Pagination
//         // const page = req.query.page * 1 || 1;

//         // const limit = req.query.limit * 1 || 100;

//         // console.log(limit);

//         // const skip = (page - 1) * limit;

//         // console.log(skip);

//         // query = query.skip(skip).limit(limit);

//         // if(req.query.page){
//         //     const numTours = await Tour.countDocuments();
//         //     if(skip >= numTours) throw new Error
//         // }

//         const features = new APIfeatures(Tour.find(),req.query)
//         .filter()
//         .sort()
//         .limitFields()
//         .paginate();

//         const tours = await features.query;

//         console.log(features.query);

//     res.status(200).json({
//         status:'success',
//         result: tours.length, 
//         data:{
//             tours
//         }
//     });
//     }catch(err){
//         res.status(404).json({
//             status: 'failed',
//             message: err
//         });
//     }
// };




// Using the url param method to checkId
// exports.checkId = (req,res,next, val)=>{

//     console.log(`id ${val}`)
//     var param = req.params;
//     if (param.id * 1 > tour.length){
//         return res.status(404).json({
//             status: 'failed',
//             message: 'Invalid Id'
//         })
//     }
//     next();
// }

// exports.checkBody = (req,res,next)=>{
//     if((!req.body.name) || (!req.body.price)){
//         return res.status(400).json({
//             status: 'failed',
//             message: 'Missen name or price'
//         });
//     }
//     next();
// }

// All codes below are for node.js, expresscode without mongodb and mongoose

// exports.getTours = (req,res)=>{
//     res.status(200).json({
//         status: 'success',
//         number: tour.length,
//         requestedAt: req.date,
//         data: {
//             tour
//         }
//     });
// };

// exports.getTour = (req,res)=>{
//     console.log(req.params);

//     var param = req.params;

//     var id = param.id * 1;

//     const currentTour = tour.find(function(el){
//         return el.id === id;
//     });

//     res.status(200).json({
//         status: 'success',
//         data: {
//             currentTour
//         }
//     });
// };

// // Function for post request
// exports.createTour = (req, res)=>{
//     console.log(req.body);
// //    res.send('done');

// var newId = tour[tour.length - 1].id + 1;

// var newtour = Object.assign({id : newId}, req.body);

// tour.push(newtour);

// fs.writeFile(__dirname + '/dev-data/data/tours-simple.json',JSON.stringify(tour), function(err){
//     if(err)return err.status;
//     res.status(201).json({
//         status: 'success',
//         data: {
//             tour: newtour
//         }
//     });
// });

// };

// // Function to update our api or json
// exports.updateTour = (req,res)=>{
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tour: '<Updated tour>'
//         }
//     });
// }

// // function to delete a request
// exports.deleteTour = (req,res)=>{
//     res.status(200).json({
//         status: 'Success',
//         data: null
//     });
// }