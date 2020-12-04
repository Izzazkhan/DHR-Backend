const generatePassword = require('password-generator');
const nodemailer = require('nodemailer');
const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// register a staff
exports.registerStaff = asyncHandler(async (req, res, next) => {
  // const pass = generatePassword();
  // const staff = await Staff.create(req.body);
  // res.status(201).json({
  //   success: true,
  //   data: staff,
  // });
  const parsed = JSON.parse(req.body.data);
  if (req.file) {
    parsed.photo[0].url = req.file.path;
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
      email: parsed.email,
      password: parsed.password,
    });
    res.status(201).json({
      success: true,
      data: staff,
    });
  } else {
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
      email: parsed.email,
      password: parsed.password,
    });
    res.status(201).json({
      success: true,
      data: staff,
    });
  }
});

exports.getAllStaff = asyncHandler(async (req, res, next) => {
  const staff = await Staff.paginate();
  res.status(200).json({
    success: true,
    data: staff,
  });
});
