const generatePassword = require('password-generator');
const nodemailer = require('nodemailer');
const requestNoFormat = require('dateformat');
const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// register a staff
exports.registerStaff = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const parsed = JSON.parse(req.body.data);
  console.log(parsed.staffType);
  let profileId;
  switch (parsed.staffType) {
    case 'Doctor':
      profileId = 'Dr' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Sensie':
      profileId = 'Se' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Nurse':
      profileId = 'Nu' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Clinical Pharmacist':
      profileId = 'CP' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Registration Officer':
      profileId = 'RO' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Paramedics':
      profileId = 'PM' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Customer Care':
      profileId = 'CC' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Houskeeping':
      profileId = 'HK' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Social Worker':
      profileId = 'SW' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Imaging Technician':
      profileId = 'IT' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Lab Technician':
      profileId = 'LT' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Cashier':
      profileId = 'Ca' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Insurance Claims Manager':
      profileId = 'ICM' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    default:
      profileId = 'St' + day + requestNoFormat(new Date(), 'yyHHMMss');
  }
  // console.log(profileId);
  const staffId = [
    {
      value: profileId,
    },
  ];
  // console.log(staffId);
  if (req.file) {
    parsed.photo[0].url = req.file.path;
    const staff = await Staff.create({
      identifier: staffId,
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      city: parsed.city,
      staffType: parsed.staffType,
      subType: parsed.subType,
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
      identifier: staffId,
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      staffType: parsed.staffType,
      subType: parsed.subType,
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
  const staff = await Staff.paginate({}, { limit: 100 });
  res.status(200).json({
    success: true,
    data: staff,
  });
});

// Disable staff
exports.activeStaff = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, {
    avtive: req.params.active,
  });
  res.status(200).json({
    success: true,
    data: staff,
  });
});

exports.updateStaff = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  // console.log(parsed.photo);

  let staff = await Staff.findById(parsed._id);
  if (!staff) {
    return next(
      new ErrorResponse(`staff not found with id of ${parsed._id}`, 404)
    );
  }

  if (req.photo) {
    if (req.photo.length > 0) {
      parsed.photo[0].url = req.photo.path;

      staff = await Staff.findOneAndUpdate({ _id: parsed._id }, parsed, {
        new: true,
      });
      await Staff.findOneAndUpdate(
        { _id: parsed._id },
        {
          $set: {
            photo: parsed.photo,
          },
        },
        { new: true }
      );
      res.status(200).json({ success: true, data: staff });
    }
  } else {
    staff = await Staff.findOneAndUpdate({ _id: parsed._id }, parsed, {
      new: true,
    });
    res.status(200).json({ success: true, data: staff });
  }
});
