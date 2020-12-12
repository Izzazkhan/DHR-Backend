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
  let profileId;
  switch (parsed.staffType) {
    case 'Doctor':
      profileId = 'Dr' + day + requestNoFormat(new Date(), 'yyHHMMss');
      break;
    case 'Sensei':
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
  const staffId = [
    {
      value: profileId,
    },
  ];
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
      addedBy: parsed.addedBy,
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
      addedBy: parsed.addedBy,
    });
    res.status(201).json({
      success: true,
      data: staff,
    });
  }
});

exports.getAllStaff = asyncHandler(async (req, res, next) => {
  const options = {
    populate: [
      {
        path: 'addedBy',
        select: ['name'],
      },
    ],

    limit: 100,
  };
  const staff = await Staff.paginate({}, options);
  res.status(200).json({
    success: true,
    data: staff,
  });
});

// // Disable staff
// exports.activeStaff = asyncHandler(async (req, res, next) => {
//   console.log(req.body.active);
//   const staff = await Staff.findByIdAndUpdate(
//     req.params.id,

//     { $push: { active: req.body.active } },

//     {
//       new: true,
//     }
//   );
//   res.status(200).json({
//     success: true,
//     data: staff,
//   });
// });

exports.disableStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id });
  if (staff.availability === false) {
    res
      .status(200)
      .json({ success: false, data: 'staff not available for disabling' });
  } else if (staff.disabled === true) {
    res.status(200).json({ success: false, data: 'Staff already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Staff.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord: updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Staff status changed to disable' });
  }
});

exports.enableStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findOne({ _id: req.params.id });
  if (staff.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Staff.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord: updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Staff status changed to enable' });
  } else {
    res.status(200).json({ success: false, data: 'Staff already enabled' });
  }
});

exports.updateStaff = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: parsed.staffId,
    reason: parsed.reason,
  };
  let staff = await Staff.findById(parsed._id);
  if (!staff) {
    return next(
      new ErrorResponse(`staff not found with id of ${parsed._id}`, 404)
    );
  }
  if (req.file) {
    parsed.photo[0].url = req.file.path;
    staff = await Staff.findOneAndUpdate(
      { _id: parsed._id },
      parsed,
      {
        new: true,
      }
    );
    res.status(200).json({ success: true, data: staff });
  } else {
    staff = await Staff.findOneAndUpdate({ _id: parsed._id }, parsed, {
      new: true,
    });
    res.status(200).json({ success: true, data: staff });
  }
});

exports.getDoctorSubTypes = asyncHandler(async (req, res, next) => {
  const subtypes = [
    'Internal',
    'External',
    'Anesthesiologist',
    'ED Doctor',
    'Rad Doctor',
  ];
  res.status(200).json({
    success: true,
    data: subtypes,
  });
});

exports.getNurseSubTypes = asyncHandler(async (req, res, next) => {
  const subtypes = ['ED Nurse', 'EOU Nurse', 'Nurse Technician'];
  res.status(200).json({
    success: true,
    data: subtypes,
  });
});

exports.getDoctorSpecialty = asyncHandler(async (req, res, next) => {
  const specialties = [
    'Eye Specialist',
    'Skin Specialist',
    'Ent Specialist',
    'Dentist',
    'Dermatologists',
  ];
  res.status(200).json({
    success: true,
    data: specialties,
  });
});

exports.getNurseSpecialty = asyncHandler(async (req, res, next) => {
  const specialties = [
    'General Nurse',
    'Clinical Nurse',
    'Psychiatric Nurse',
    'Criritcal Care Nurse',
    'Nursing Administrator',
  ];
  res.status(200).json({
    success: true,
    data: specialties,
  });
});
