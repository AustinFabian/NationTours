// code fro reading json file and importing tje json dev data's

const fs = require('fs');

const mongoose = require('mongoose');

const dotenv = require('dotenv');

dotenv.config({path:__dirname + '/../../config.env'});

console.log(process.env);

const Tour = require('./../../models/tourModel');
const User = require('./../../models/userModel');
const Review = require('./../../models/reviewModel');

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

// reading JSON file

var tours = fs.readFileSync(__dirname + '/tours.json', 'utf-8');
var users = fs.readFileSync(__dirname + '/users.json', 'utf-8');
var reviews = fs.readFileSync(__dirname + '/reviews.json', 'utf-8');

tours = JSON.parse(tours);
users = JSON.parse(users);
reviews = JSON.parse(reviews);


// Importing the above data into our database

async function importData(){
    try{
        await Tour.create(tours);
        await User.create(users, {validateBeforeSave: false});
        await Review.create(reviews);
        console.log('all data successfully loaded')
    }catch(err){
        console.log(err)
    }
    process.exit();
}

// Deleting the above data from our data base

async function deleteData(){
    try{
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('alldata successfully deleted')
    }catch(err){
        console.log(err)
    }
    process.exit();
}

console.log(process.argv);

if(process.argv[2] === '--import'){
    importData();
}else if(process.argv[2] === '--delete'){
    deleteData();
}