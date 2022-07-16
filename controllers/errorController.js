const AppError = require('./../utils/AppError');

const dotenv = require('dotenv');

dotenv.config({path:'./../config.env'});

// console.log(process.env)

const sendErrorDev = (err,req,res)=>{
    if(req.originalUrl.startsWith('/api')){
        // FOR API
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            err: err,
            stack: err.stack
        });
    }else{
        // FOR RENDERED WEBSITES
        return res.status(err.statusCode).render('error',{
            title: 'Error: Something went wrong',
            msg: err.message
        })
    }
}

const sendErrorProd = (err,req,res)=>{

    if(req.originalUrl.startsWith('/api')){
            // FOR API
            // Opreational trusted error: send error message to the client
            if(err.isOperational){
                return res.status(err.statusCode).json({
                    status: err.status,
                    message: err.message
                });
            }
            // Programming or other unknown error: dont't leak error details
            // log Error
            console.log('Error :' + err)
            // Swend generic message
            return res.status(500).json({
                status: 'Error',
                message: 'Somethimg went wrong!',
            });
        }

        if(err.isOperational){
            // FOR RENDERED WEBSITES
            // operational trusted error send error to client
            return res.status(err.statusCode).render('error',{
                title: 'Error: Something went wrong',
                msg: err.message
            })
        }
        // Programming or other unknown error: dont't leak error details
        // log Error
        console.log('Error :' + err)
        // Send generic message
        return res.status(err.statusCode).render('error',{
            title: 'Error: Something went wrong',
            msg: 'Please try again later'
        })
}


// HANDLEIDERROR FUNCTION
const handleIdErrorDB = err =>{
    const message = `invalid ${err.path}: ${err.value}.`
    return new AppError(message, 400);
}

// HANDLEDUPLICATEFIELDS FUNCTION
const handleDuplicateFieldsDB = err =>{
   const value = err.keyValue.name;
//   console.log(value);

  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
}

// HANDLEVALIDATIONERRORDB FUNCTION
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
  
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
  };

// HANDLEWEBTOKENERROR FUNCTION
const handleWebTokenError = function(err){
    const message = `${err.message} please log in again`;
    return new AppError(message,400)
}

// HANDLETOKENEXPIREDERROR FUNCTION
const HandleTokenExpiredError = function(err){
    const exp = err.expiredAt * 1;
    const now = Date.now();
    const message = `${err.message} at ${now - exp} please log in again`;
    return new AppError(message,400)
}


// GLOBAL ERROR HANDLER
module.exports = (err, req, res, next)=>{
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'Error';

    // sending back the error message to our server
    if (process.env.NODE_ENV === 'development'){
        // console.log(err)
        sendErrorDev(err,req,res);
    }
    else if(process.env.NODE_ENV === 'production'){

        // console.log(err)
        let error = {...err};

        error.message = err.message

        if(error.path === '_id') error = handleIdErrorDB(error);
        if(error.code === 11000) error = handleDuplicateFieldsDB(error);
        if(error._message === 'Validation failed') error = handleValidationErrorDB(error);
        if(error.name === 'JsonWebTokenError') error = handleWebTokenError(error);
        if(error.name === 'TokenExpiredError') error = HandleTokenExpiredError(error)
        sendErrorProd(error,req,res);
    }
}