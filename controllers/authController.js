const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const Staff = require('../models/staffFhir/staff');
const User = require('../models/Auth/user');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Get token from model, create cookie and send response
const sendTokenResponse = (userOld, statusCode, res, user) => {
  // Create token
  const token = userOld.getSignedJwtToken();

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

// Registering a new User
exports.register = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { name, email, password } = req.body;
  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  sendTokenResponse(user, 200, res);
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  let data;
  let user;
  if (email === 'admin@dhr.com') {
    user = await User.findOne({ email });
    data = {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
      // staffTypeId: user.staffTypeId,
      // staffId: user.staffId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } else {
    user = await Staff.findOne({ email });
    data = {
      _id: user._id,
      name: user.name,
      email: user.email,
      password: user.password,
      // staffTypeId: user.staffTypeId,
      // staffId: user.staffId,
      // functionalUnit: staff.functionalUnit,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    // next();
  }

  // Check for user
  // const user = await User.findOne({ email });
  // if (email === 'superadmin@dhr.com.com') {
  //   data = {
  //     _id: user._id,
  //     name: user.name,
  //     email: user.email,
  //     password: user.password,
  //     staffTypeId: user.staffTypeId,
  //     staffId: user.staffId,
  //     createdAt: user.createdAt,
  //     updatedAt: user.updatedAt,
  //   };
  // }
  // if (email === 'admin@dhr.com') {
  //   data = {
  //     _id: user._id,
  //     name: user.name,
  //     email: user.email,
  //     password: user.password,
  //     // staffTypeId: user.staffTypeId,
  //     // staffId: user.staffId,
  //     createdAt: user.createdAt,
  //     updatedAt: user.updatedAt,
  //   };
  // }
  // } else {
  //   const staff = await Staff.findOne({ _id: user.staffId });
  //   data = {
  //     _id: user._id,
  //     name: user.name,
  //     email: user.email,
  //     password: user.password,
  //     // staffTypeId: user.staffTypeId,
  //     // staffId: user.staffId,
  //     // functionalUnit: staff.functionalUnit,
  //     createdAt: user.createdAt,
  //     updatedAt: user.updatedAt,
  //   };
  // }
  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }
  sendTokenResponse(user, 200, res, data);
});

// Protect Middleware
exports.protect = asyncHandler(async (req, res, next) => {
  let token;
  // 1) Getting token and check of it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }
  // console.log(token);
  if (!token) {
    return next(
      new ErrorResponse(
        'You are not logged in,please log in to get access',
        401
      )
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3) Check if user still exists
  const currentUser = await Staff.findById(decoded.id);
  if (!currentUser) {
    return next(
      new ErrorResponse(
        `The user belongs to this token does not exist anymore`,
        401
      )
    );
  }

  // // 4) Check if user changed password after the token was issued
  // if (currentUser.passwordChangedAfter(decoded.iat)) {
  //   return next(
  //     new ErrorResponse(
  //       'User changed password after token issued,please log in again',
  //       401
  //     )
  //   );
  // }

  req.user = currentUser;
  next();
});
