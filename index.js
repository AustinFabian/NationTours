// Requiring express module
const Express = require ('express');

require('events').EventEmitter.defaultMaxListeners = 30;

// requiring the fs module
const fs = require('fs');

// requiring the body-perser module
const parser = require('body-parser');

// reguiring node path internal module
const path = require('path')

// requiring the morgan module
const morgan = require('morgan');

// Three main module for security in the project
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// requiring the express-rate-limit module
const rateLimit = require('express-rate-limit');

// requiring our request response cokie parser
const cookieParser = require('cookie-parser');

// requiring the helmet module
const helmet = require('helmet');

// requiring the npm compression package
const compression = require('compression');

// requiring the cors library
const cors = require('cors')
// Requiring the AppError module and errorController module
const AppError = require('./utils/AppError');
const errorController = require('./controllers/errorController');

// requiring the custom tour module
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const bookingsRouter = require('./routes/bookingsRouter');
const bookingsController = require('./controllers/bookingsController');
const viewRouter = require('./routes/viewRouter');


// Making usue of the epress function
const app = Express();

app.enable('trust proxy')

// console.log(app.get('env'))

// GLOBAL MIDDLEWARES

// global miiddle ware function for helmet module
app.use(helmet());

// making use of our cors library
app.use(cors({
    origin: "*"
}))

app.options('*', cors())

// Making use of our node template Engine
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

// 
app.use(Express.static('public'));

// 3rd party middle ware code for morgan
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'));
}
// global miiddle ware function for express-rate-limiter module (Liimit request from same API)
const limiter = rateLimit({
    max: 50,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP please try again in one hour'
});

app.use('/api', limiter);

// FOR STRIPE WEBHOOK CHECKOUT
app.post('/webhook-checkout',Express.raw({type: 'application/json'}).bookingsController.webhookCheckout)

// body-parser reading data from body into req.body
app.use(Express.json({ limit: '10kb' }));
app.use(Express.urlencoded({extended: true ,limit: '10kb'}))

// making use of the cookie parser middle ware
app.use(cookieParser());
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
    hpp({
        whiteList:[
            'duration',
            'ratingsQuantity',
            'ratingsAverage',
            'maxGroupSize',
            'difficulty',
            'price'
        ]
    })
  );

// Writing custom middleware code in express
// app.use(function(req,res,next){
//     console.log('Hello from the middleware');
//     next();
// });


// Test middleware
app.use(function(req,res,next){
    req.date = new Date().toISOString();
    next();
});

const Tour = fs.readFileSync(__dirname + '/dev-data/data/tours-simple.json','utf-8');

const tour = JSON.parse(Tour);
// making use of the compression middleware
app.use(compression())

// calling on a getTours/getUsers request


// app.get('/api/v1/tours',getTours);
// app.get('/api/v1/Users',getUsers);

// calling on a gettour/getUser request

// app.get('/api/v1/tours/:id',getTour);
// app.get('/api/v1/users/:id',getUser);

// calling on a post request to create a new tour/ new user

// app.post('/api/v1/tours',createTour);
// app.post('/api/v1/users',createUser);

// calling on an update request to update a tour/ update user

// app.patch('/api/v1/tours/:id',updateTour);
// app.patch('/api/v1/users/:id',updateUser);

// calling on a delete request to delete a tour/ delete a user

// app.delete('/api/v1/tours/:id',deleteTour);
// app.delete('/api/v1/users/:id',deleteUser);

// All the above routing code can be replaced with the express.js app.route()method

// app.route('/api/v1/tours').get(getTours).post(createTour);

// app.route('/api/v1/tours/:id').get(getTour).patch(updateTour).delete(deleteTour);

// for Users

// app.route('/api/v1/users').get(getUsers).post(createUser);

// app.route('/api/v1/users/:id').get(getUser).patch(updateUser).delete(deleteUser);

// making use of the express.router() method still does same work as the above but makinf use of the tourRouter and userRouter module


// ROUTE
app.use('/',viewRouter);
app.use('/api/v1/tours',tourRouter);
app.use('/api/v1/users',userRouter);
app.use('/api/v1/bookings',bookingsRouter)
app.use('/api/v1/reviews',reviewRouter);

// FOR UNKNOWN URL ROUTE
app.all('*',function(req,res,next){
    
    // const err = new Error(`Can't find ${req.originalUrl} in this server`)
    // err.statusCode  = 404;
    // err.status = 'failed'
    
    // res.status(404)
    // .json({
    //     status: 'failed',
    //     message: `Can't find ${req.originalUrl} in this server`
    // });

    next(new AppError(`Can't find ${req.originalUrl} in this server`,404));
});

// CREATING OUR GLOBAL ERROR HANDLER
app.use(errorController);

// Exporting app
module.exports = app;