const moment = require('moment');
const requestNoFormat = require('dateformat');
const patientFHIR = require('../models/patient/patient');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.registerPatient = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const MRN = [
    {
      value: 'dhr' + day + requestNoFormat(new Date(), 'yyHHMMss'),
    },
  ];
  const parsed = JSON.parse(req.body.data);
  console.log(parsed.photo);
  console.log(req.files.file);
  if (parsed.photo && parsed.photo.length > 0) {
    parsed.photo[0].url = req.files.file[0].path;
  } else {
    parsed.photo = null;
  }
  if (
    req.files.file ||
    req.files.front ||
    req.files.back ||
    req.files.insuranceCard
  ) {
    // if (
    //   req.files.file.length > 0 ||
    //   req.files.front.length > 0 ||
    //   req.files.back.length > 0 ||
    //   req.files.insuranceCard.length > 0
    // )
    // {
    // console.log(parsed);

    const newPatient = await patientFHIR.create({
      identifier: MRN,
      nationalID: parsed.nationalID,
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      height: parsed.height,
      weight: parsed.weight,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      city: parsed.city,
      nationality: parsed.nationality,
      blood: parsed.blood,
      photo: parsed.photo,
      idCardFront: req.files.front ? req.files.front[0].path : null,
      idCardBack: req.files.back ? req.files.back[0].path : null,
      otherDetails: parsed.otherDetails,
      contact: parsed.contact,
      paymentMethod: parsed.paymentMethod,
      insuranceNumber: parsed.insuranceNumber,
      insuranceVendor: parsed.insuranceVendor,
      coverageTerms: parsed.coverageTerms,
      coPayment: parsed.coPayment,
      coveredFamilyMember: parsed.coveredFamilyMember,
      coverageDetails: parsed.coverageDetails,
      insuranceDetails: parsed.insuranceDetails,
      insuranceCard: req.files.insuranceCard
        ? req.files.insuranceCard[0].path
        : null,
      processTime: parsed.time,
      registrationStatus: parsed.registrationStatus,
      // claimed,
      // status,
    });
    res.status(201).json({
      success: true,
      data: newPatient,
    });
    // }
  } else {
    const newPatient = await patientFHIR.create({
      identifier: MRN,
      nationalID: parsed.nationalID,
      name: parsed.name,
      gender: parsed.gender,
      birthDate: parsed.birthDate,
      age: parsed.age,
      height: parsed.height,
      weight: parsed.weight,
      telecom: parsed.telecom,
      address: parsed.address,
      country: parsed.country,
      city: parsed.city,
      nationality: parsed.nationality,
      blood: parsed.blood,
      otherDetails: parsed.otherDetails,
      contact: parsed.contact,
      paymentMethod: parsed.paymentMethod,
      insuranceNumber: parsed.insuranceNumber,
      insuranceVendor: parsed.insuranceVendor,
      coverageTerms: parsed.coverageTerms,
      coPayment: parsed.coPayment,
      coveredFamilyMember: parsed.coveredFamilyMember,
      coverageDetails: parsed.coverageDetails,
      insuranceDetails: parsed.insuranceDetails,
      processTime: parsed.time,
      registrationStatus: parsed.registrationStatus,
      // claimed,
      // status,
    });
    res.status(201).json({
      success: true,
      data: newPatient,
    });
  }
});

exports.averageRegistrationTAT = asyncHandler(async (req, res, next) => {
  const currentTime = moment().utc().toDate();
  const sixHours = moment().subtract(6, 'hours').utc().toDate();
  const patients = await patientFHIR.find({
    'process.processName': 'registration',
    $and: [
      { 'processTime.processStartTime': { $gte: sixHours } },
      { 'processTime.processEndTime': { $lte: currentTime } },
    ],
  });
  const averageRegistrationTime = 360 / patients.length;
  res.status(200).json({
    success: true,
    data: averageRegistrationTime,
  });
});

exports.updatePatient = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);

  let patient = await patientFHIR.findById(parsed._id);
  if (!patient) {
    return next(
      new ErrorResponse(`Patient not found with id of ${parsed._id}`, 404)
    );
  }
  if (parsed.photo && parsed.photo.length > 0) {
    parsed.photo[0].url = req.files.file[0].path;
  } else {
    parsed.photo = null;
  }

  if (
    req.files.file ||
    req.files.front ||
    req.files.back ||
    req.files.insuranceCard
  ) {
    // if (
    //   req.files.file.length > 0 ||
    //   req.files.front.length > 0 ||
    //   req.files.back.length > 0 ||
    //   req.files.insuranceCard.length > 0
    // )
    // {

    patient = await patientFHIR.findOneAndUpdate({ _id: parsed._id }, parsed, {
      new: true,
    });
    await patientFHIR.findOneAndUpdate(
      { _id: parsed._id },
      {
        $set: {
          photo: parsed.photo,
          idCardFront: req.files.front ? req.files.front[0].path : null,
          idCardBack: req.files.back ? req.files.back[0].path : null,
          insuranceCard: req.files.insuranceCard
            ? req.files.insuranceCard[0].path
            : null,
        },
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: patient });
    // }
  } else {
    patient = await patientFHIR.findOneAndUpdate({ _id: parsed._id }, parsed, {
      new: true,
    });
    res.status(200).json({ success: true, data: patient });
  }
});

exports.getPatient = asyncHandler(async (req, res, next) => {
  console.log(req.params.patientId);
  const patient = await patientFHIR.findById(req.params.patientId);
  if (!patient) {
    return next(new ErrorResponse('No patient Found with this id', 404));
  }
  res.status(200).json({
    success: true,
    data: patient,
  });
});

exports.getAllPatients = asyncHandler(async (req, res) => {
  const patients = await patientFHIR.find();
  console.log(patients);
  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.getPendingRegistration = asyncHandler(async (req, res, next) => {
  const pendingPatients = await patientFHIR.paginate({
    registrationStatus: 'pending',
  });
  res.status(200).json({
    success: true,
    data: pendingPatients,
  });
});

exports.getCompletedRegistration = asyncHandler(async (req, res, next) => {
  const approvedPatients = await patientFHIR.find({
    registrationStatus: 'completed',
  });
  res.status(200).json({
    success: true,
    data: approvedPatients,
  });
});

exports.getApprovedPatientById = asyncHandler(async (req, res, next) => {
  const patient = await patientFHIR.findOne({
    _id: req.params.patientId,
    status: 'approved',
  });

  if (!patient) {
    return next(new ErrorResponse('No patient found with this id', 404));
  }

  res.status(200).json({
    success: true,
    data: patient,
  });
});

exports.getApprovedPatientByKeyword = asyncHandler(async (req, res, next) => {
  const patient = await patientFHIR
    .aggregate([
      {
        $match: { status: 'completed' },
      },
      {
        $match: {
          // status: 'approved',
          $or: [
            {
              'name.given': { $regex: req.params.keyword, $options: 'i' },
            },
            {
              'name.family': { $regex: req.params.keyword, $options: 'i' },
            },
            {
              'identifier.value': { $regex: req.params.keyword, $options: 'i' },
            },
            { nationalID: { $regex: req.params.keyword, $options: 'i' } },
            {
              'telecom.value': {
                $regex: req.params.keyword,
                $options: 'i',
              },
            },
          ],
        },
      },
    ])
    .limit(50);
  // console.log(patient);
  if (!patient) {
    return next(new ErrorResponse('No Patient Found With this keyword', 404));
  }
  res.status(200).json({
    success: true,
    data: patient,
  });
});

exports.getPatientByKeyword = asyncHandler(async (req, res, next) => {
  const patient = await patientFHIR
    .aggregate([
      {
        $match: {
          $or: [
            {
              'name.given': { $regex: req.params.keyword, $options: 'i' },
            },
            {
              'name.family': { $regex: req.params.keyword, $options: 'i' },
            },
            {
              'identifier.value': { $regex: req.params.keyword, $options: 'i' },
            },
            { nationalID: { $regex: req.params.keyword, $options: 'i' } },
            {
              'telecom.value': {
                $regex: req.params.keyword,
                $options: 'i',
              },
            },
          ],
        },
      },
    ])
    .limit(50);
  if (!patient) {
    return next(new ErrorResponse('No Data Found With this keyword', 404));
  }

  res.status(200).json({
    success: true,
    data: patient,
  });
});
