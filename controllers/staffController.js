const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// register a staff
exports.registerStaff = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  // console.log(req.file);

  //   const staff = await Staff.create(req.body);
  const parsed = JSON.parse(req.body.data);
  console.log(req.body.data);
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
    photo: req.file.path,
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
});
