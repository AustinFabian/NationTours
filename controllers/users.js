const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/AppError');
// requiring our custom handler factory function
const handler = require('./handlerFactory');
// requiring the sharp module used for processing images to suit our style
const sharp = require('sharp');
// MAKING USE OF THE MULTER SPECIAL MIDDLEWARE FOR UPLOADING FILES FROM A FORM
const multer = require('multer')

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
  };

// route to upload a photo

// Making use of diskStorage
// const multerStorage = multer.diskStorage({
//   destination: (req,file,cb)=>{
//     cb(null,'public/img/users')
//   },
//   filename: (req,file,cb)=>{
//     const ext = file.mimetype.split('/')[1]
//     cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
//   },
// })

// Making use of memoryStorage
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
exports.uploadUserPhoto = upload.single('photo');

// Middle ware to resize user photo after upload
exports.resizeUserPhoto = catchAsync(async (req,res,next)=>{
  if(!req.file) return next();
  
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  await sharp(req.file.buffer)
  .resize(500,500)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/users/${req.file.filename}`)

  next();
})

// /me route code
exports.getMe = (req,res,next)=>{
  req.params.id = req.user.id;
  next();
}

// Update user document
exports.updateMe = catchAsync(async (req, res, next) => {

  // console.log(req.file)
  // console.log(req.body)
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400
        )
      );
    }
  
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if(req.file)filteredBody.photo = req.file.filename
  
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });
  
    res.status(200).json({
      status: 'Success',
      data: {
        user: updatedUser
      }
    });
});

// Delete user document by user
exports.deleteMe = catchAsync(async(req,res,next)=>{
  await User.findByIdAndUpdate(req.user.id, {active:false});

  res.status(204).json({
    status : 'Success',
    data : null
  })
});

// Create User
exports.createUser = (req,res)=>{
    res.status(500).json({
        status: 'success',
        message: 'This route is not yet defined/Please use /signup instead'
    });
};

// GET ALL USERS
exports.getUsers = handler.getAll(User);
// OR
// exports.getUsers = catchAsync(async(req,res, next)=>{

//     const users = await User.find();

//     // Send response
//     res.status(500).json({
//         status: 'success',
//         result: users.length,
//         data:{
//             users
//         }
//     });
// });

// Get user
exports.getUser = handler.getOne(User);

// Update User
exports.updateUser = handler.updateOne(User); // Do not update password with this

// Delete user
exports.deleteUser = handler.deleteOne(User);
