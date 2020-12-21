const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const Staff = require('../models/staffFhir/staff');
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
