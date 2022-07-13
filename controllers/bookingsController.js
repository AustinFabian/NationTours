const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/AppError');
const handler = require('./handlerFactory');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('./../models/userModel');
const Bookings = require('./../models/bookingsModel');



exports.checkoutSession = catchAsync(async(req,res,next)=>{
    // Get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);
    // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
    //   req.params.tourId
    // }&user=${req.user.id}&price=${tour.price}`,
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [
          `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`
        ],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });
  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
})


// Creating booking checkout
const createBookingCheckout = async session => {
    const tour = session.client_reference_id;
    const user = (await User.findOne({ email: session.customer_email })).id;
    const price = session.display_items[0].amount / 100;
    await Bookings.create({ tour, user, price });
  };


  exports.createBooking = handler.createOne(Bookings);
  exports.getBooking = handler.getOne(Bookings);
  exports.getAllBookings = handler.getAll(Bookings);
  exports.updateBooking = handler.updateOne(Bookings);
  exports.deleteBooking = handler.deleteOne(Bookings);