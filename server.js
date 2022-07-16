
const mongoose = require('mongoose')

const dotenv = require('dotenv');

// Uncaught exception handler
// process.on('uncaughtException', err => {
//     console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
//     console.log(err.name, err.message);
//     process.exit(1);
//   });

dotenv.config({path:'./config.env'});

// console.log(process.env)

// getting db from the dotenv which has all info about our development environment

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSOWRD);

mongoose.connect(DB,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology:true
}).then(()=>{
    console.log('Database successfully connected');
});

// creating a schema

// const tourSchema = new mongoose.Schema({
//     name:{
//         required: [true,'A tour must have a name'],
//         type: String,
//         unique: true
//     },
//     price:{
//         required: [true,'A tour must have a price'],
//         type: Number,
//     },
//     rating:{
//         type: Number,
//         default: 4.7
//     }
// });

// creating a model for our schema

// const Tour = mongoose.model('Tour',tourSchema);

// Instancing our model constructor to create a new tour

// const tour1 = new Tour({
//     name: 'The Rain Maker',
//     price: 900,
// });

// tour1.save().then(function(data){
//     console.log(data)
// }).catch(function(err){
//     console.log(`ERROR💔: ${err}`)
// })

const app = require('./index');

// console.log(process.env)

const port = process.env.PORT || 3000
const server = app.listen(port, function(){
    console.log('Server running on port 3000')
});


// UnhandledRejection handler
process.on('unhandledRejection',function(err){
    console.log(err.name, err.message);
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    server.close(()=>{
        process.exit(1)
    })
});



