const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { promisify } = require('util');
const Staff = require('../models/staffFhir/staff');
const Subscriber = require('../models/subscriber/subscriber');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: false,
  };
  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }
  const data = {
    token,
    user,
  };
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    data,
    token,
  });
};

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  let data;
  let user;
  user = await Staff.findOne({ email });
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  sendTokenResponse(user, 200, res, data);
});

exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) {
    return next(
      new ErrorResponse(
        'You are not logged in,please log in to get access',
        401
      )
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await Staff.findById(decoded.id);
  if (!currentUser) {
    return next(
      new ErrorResponse(
        `The user belongs to this token does not exist anymore`,
        401
      )
    );
  }
  req.user = currentUser;
  next();
});

exports.logout = asyncHandler(async (req, res, next) => {
  const { userId, token } = req.body;
  let data;
  await Subscriber.deleteMany({ user: userId });
  return res.json({ success: true, msg: 'Subscription Removed' });
});

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await Staff.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorResponse('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  // console.log(resetToken);

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/staff/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pmdevteam0@gmail.com',
      pass: 'SysJunc1$',
    },
  });
  const mailOptions = {
    from: 'pmdevteam0@gmail.com',
    to: 'naeemtahir775@gmail.com',
    subject: 'Forgot Password',
    html: `<p>${message}<p>`,
  };

  transporter.sendMail(mailOptions, async (err, info) => {
    if (err) {
      console.log(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({
        success: false,
        data: 'Error In Sending Email,Please Try Again',
      });
    } else {
      console.log(`Email Sent : ${info.response}`);
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    }
  });
});

// Reset Password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  //  1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await Staff.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ErrorResponse('Token is invalid or has expired', 401));
  }
  // 2) if token has not expired and there is user, set the new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  // 3) Log the user in, Send jwt
  sendTokenResponse(user, 200, res);
});

// Update Password
exports.updatePassword = asyncHandler(async (req, res, next) => {
  // Get User from collection
  const user = await Staff.findById(req.body.id).select('+password');

  // Check if posted current Password is correct
  const correct = await user.matchPassword(
    req.body.currentPassword,
    user.password
  );
  if (!correct) {
    return next(
      new ErrorResponse(
        'Your current password is not correct,please enter right password',
        401
      )
    );
  }

  // Update the password if current password is correct
  user.password = req.body.password;
  await user.save();

  // Log user in and send token
  sendTokenResponse(user, 200, res);
});
