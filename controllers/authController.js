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

// register a staff
exports.registerStaff = asyncHandler(async (req, res, next) => {

  const parsed = JSON.parse(req.body.data);

  if (req.file) {
    parsed.photo[0].url = req.file.path
    const staff = await Staff.create({
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      city: parsed.city,
      nationality: parsed.nationality,
      photo: parsed.photo,
      specialty: parsed.specialty,
      communication: parsed.communication,
      education: parsed.education,
      experience: parsed.experience,
      accountInformation: parsed.accountInformation,
    });
    res.status(201).json({
      success: true,
      data: staff,
    });
    sendTokenResponse(staff, 200, res);
  }
  else {
    const staff = await Staff.create({
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      city: parsed.city,
      nationality: parsed.nationality,
      specialty: parsed.specialty,
      communication: parsed.communication,
      education: parsed.education,
      experience: parsed.experience,
      accountInformation: parsed.accountInformation,
    });
    res.status(201).json({
      success: true,
      data: staff,
    });
    sendTokenResponse(staff, 200, res);
  }
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
