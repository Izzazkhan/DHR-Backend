const moment = require('moment');
const requestNoFormat = require('dateformat');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const EDR = require('../models/EDR/EDR');
const RC = require('../models/reimbursementClaim');
const IT = require('../models/insuranceItem');
// const Patient = require('../models/patient');
exports.getClaims = asyncHandler(async (req, res) => {
  const rc = await RC.find()
    .populate('generatedBy')
    .populate('patient')
    .populate('insurer');
  res.status(200).json({ success: true, data: rc });
});
exports.getClaimsKeyword = asyncHandler(async (req, res) => {
  const rc = await RC.find()
    .populate('generatedBy')
    .populate('patient')
    .populate('insurer');
  const arr = [];
  for (let i = 0; i < rc.length; i++) {
    if (
      rc[i].requestNo &&
      rc[i].requestNo.toLowerCase().startsWith(req.params.keyword.toLowerCase())
    ) {
      arr.push(rc[i]);
    }
  }
  res.status(200).json({ success: true, data: arr });
});

exports.getPatient = asyncHandler(async (req, res) => {
  const array = [];
  const secondArray = [];
  // const ipr = await IPR.find({
  //   functionalUnit: req.params.id,
  //   status: { $ne: 'Discharged' },
  // })
  //   .populate(
  //     'patientId',
  //     'profileNo firstName lastName SIN mobileNumber phoneNumber age gender drugAllergy weight'
  //   )
  //   .select({ patientId: 1 });
  // for (let i = 0; i < ipr.length; i++) {
  //   array.push(ipr[i].patientId);
  // }
  const edr = await EDR.find({ status: { $ne: 'Discharged' } })
    .populate(
      'patientId',
      'profileNo firstName lastName SIN mobileNumber phoneNumber age gender drugAllergy weight'
    )
    .select({ patientId: 1 });
  for (let i = 0; i < edr.length; i++) {
    array.push(edr[i].patientId);
  }
  const unique = Array.from(new Set(array));
  for (let i = 0; i < unique.length; i++) {
    const fullName = unique[i].firstName + ' ' + unique[i].lastName;
    if (
      (unique[i].profileNo &&
        unique[i].profileNo
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      // (unique[i].firstName && unique[i].firstName.toLowerCase().startsWith(req.params.keyword.toLowerCase()))||
      // (unique[i].lastName && unique[i].lastName.toLowerCase().startsWith(req.params.keyword.toLowerCase()))||
      (unique[i].phoneNumber &&
        unique[i].phoneNumber.startsWith(req.params.keyword)) ||
      (unique[i].SIN &&
        unique[i].SIN.toLowerCase().startsWith(
          req.params.keyword.toLowerCase()
        )) ||
      (unique[i].mobileNumber &&
        unique[i].mobileNumber.startsWith(req.params.keyword)) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase())
    ) {
      secondArray.push(unique[i]);
    }
  }
  const uniqueArray = (function (secondArray) {
    const m = {};
    // uniqueArray = [];
    for (const i = 0; i < secondArray.length; i++) {
      const v = secondArray[i];
      if (!m[v]) {
        uniqueArray.push(v);
        m[v] = true;
      }
    }
    return uniqueArray;
  })(secondArray);
  const response = uniqueArray.slice(0, 50);
  res.status(200).json({ success: true, data: response });
});

exports.getPatientInsurance = asyncHandler(async (req, res) => {
  const array = [];
  const secondArray = [];
  const patients = await EDR.find({
    status: { $ne: 'Discharged' },
    paymentMethod: 'Insurance',
  })
    .populate(
      'patientId',
      'profileNo firstName lastName SIN mobileNumber phoneNumber age gender weight QR createdAt'
    )
    .select({ patientId: 1 });
  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getPatientDischarged = asyncHandler(async (req, res) => {
  var array = [];
  var secondArray = [];
  const edr = await EDR.find({ status: 'Discharged' })
    .populate(
      'patientId',
      'profileNo firstName lastName SIN mobileNumber phoneNumber age gender amountReceived QR insuranceVendor insuranceNo weight'
    )
    .select({ patientId: 1 });
  for (let i = 0; i < edr.length; i++) {
    array.push(edr[i].patientId);
  }
  const unique = Array.from(new Set(array));
  for (let i = 0; i < unique.length; i++) {
    var fullName = unique[i].firstName + ' ' + unique[i].lastName;
    if (
      (unique[i].profileNo &&
        unique[i].profileNo
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      // (unique[i].firstName && unique[i].firstName.toLowerCase().startsWith(req.params.keyword.toLowerCase()))||
      // (unique[i].lastName && unique[i].lastName.toLowerCase().startsWith(req.params.keyword.toLowerCase()))||
      (unique[i].phoneNumber &&
        unique[i].phoneNumber.startsWith(req.params.keyword)) ||
      (unique[i].SIN &&
        unique[i].SIN.toLowerCase().startsWith(
          req.params.keyword.toLowerCase()
        )) ||
      (unique[i].mobileNumber &&
        unique[i].mobileNumber.startsWith(req.params.keyword)) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase())
    ) {
      secondArray.push(unique[i]);
    }
  }
  var uniqueArray = (function (secondArray) {
    var m = {},
      uniqueArray = [];
    for (var i = 0; i < secondArray.length; i++) {
      var v = secondArray[i];
      if (!m[v]) {
        uniqueArray.push(v);
        m[v] = true;
      }
    }
    return uniqueArray;
  })(secondArray);
  let response = uniqueArray.slice(0, 50);
  res.status(200).json({ success: true, data: response });
});

exports.getPatientHistoryAll = asyncHandler(async (req, res) => {
  var array = [];
  var secondArray = [];
  const edr = await EDR.find()
    .populate(
      'patientId',
      'profileNo firstName lastName SIN mobileNumber phoneNumber age gender weight'
    )
    .select({ patientId: 1 });
  for (let i = 0; i < edr.length; i++) {
    array.push(edr[i].patientId);
  }
  const unique = Array.from(new Set(array));
  for (let i = 0; i < unique.length; i++) {
    var fullName = unique[i].firstName + ' ' + unique[i].lastName;
    if (
      (unique[i].profileNo &&
        unique[i].profileNo
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      // (unique[i].firstName && unique[i].firstName.toLowerCase().startsWith(req.params.keyword.toLowerCase()))||
      // (unique[i].lastName && unique[i].lastName.toLowerCase().startsWith(req.params.keyword.toLowerCase()))||
      (unique[i].phoneNumber &&
        unique[i].phoneNumber.startsWith(req.params.keyword)) ||
      (unique[i].SIN &&
        unique[i].SIN.toLowerCase().startsWith(
          req.params.keyword.toLowerCase()
        )) ||
      (unique[i].mobileNumber &&
        unique[i].mobileNumber.startsWith(req.params.keyword)) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase())
    ) {
      secondArray.push(unique[i]);
    }
  }
  var uniqueArray = (function (secondArray) {
    var m = {},
      uniqueArray = [];
    for (var i = 0; i < secondArray.length; i++) {
      var v = secondArray[i];
      if (!m[v]) {
        uniqueArray.push(v);
        m[v] = true;
      }
    }
    return uniqueArray;
  })(secondArray);
  let response = uniqueArray.slice(0, 50);
  res.status(200).json({ success: true, data: response });
});

exports.addClaims = asyncHandler(async (req, res) => {
  const {
    generatedBy,
    patient,
    insurer,
    treatmentDetail,
    responseCode,
    document,
    status,
  } = req.body.data;

  const parsed = JSON.parse(req.body.data);

  const claimSolution = await EDR.findOne({ _id: parsed.edriprId });
  await EDR.findOneAndUpdate(
    { _id: parsed.edriprId },
    { $set: { claimed: true } }
  );
  var rc;
  if (claimSolution.claimed === true) {
    res.status(200).json({ success: false });
  } else {
    if (req.files) {
      var arr = [];
      for (let i = 0; i < req.files.length; i++) {
        arr.push(req.files[i].path);
      }
      var now = new Date();
      var start = new Date(now.getFullYear(), 0, 0);
      var diff =
        now -
        start +
        (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
      var oneDay = 1000 * 60 * 60 * 24;
      var day = Math.floor(diff / oneDay);
      rc = await RC.create({
        requestNo: 'RC' + day + requestNoFormat(new Date(), 'yyHHMMss'),
        generatedBy: parsed.generatedBy,
        patient: parsed.patient,
        insurer: parsed.insurer,
        treatmentDetail: parsed.treatmentDetail,
        responseCode: parsed.responseCode,
        document: arr,
        status: parsed.status,
      });
    } else {
      rc = await RC.create({
        requestNo: 'RC' + day + requestNoFormat(new Date(), 'yyHHMMss'),
        generatedBy: parsed.generatedBy,
        patient: parsed.patient,
        insurer: parsed.insurer,
        treatmentDetail: parsed.treatmentDetail,
        responseCode: parsed.responseCode,
        document: '',
        status: parsed.status,
      });
    }
    res.status(200).json({ success: true, data: rc });
  }
});

exports.updateClaims = asyncHandler(async (req, res, next) => {
  var { _id } = JSON.parse(req.body.data);

  var rc = await RC.findById(_id);
  if (!rc) {
    return next(
      new ErrorResponse(`Reimbursement Claim not found with id of ${_id}`, 404)
    );
  }
  if (req.files) {
    var arr = [];
    for (let i = 0; i < req.files.length; i++) {
      arr.push(req.files[i].path);
    }
    await RC.updateOne({ _id: _id }, JSON.parse(req.body.data));
    rc = await RC.findOneAndUpdate(
      { _id: _id },
      { $set: { document: arr } },
      JSON.parse(req.body.data)
    );
  } else {
    rc = await RC.findOneAndUpdate({ _id: _id }, JSON.parse(req.body.data));
  }
  res.status(200).json({ success: true, data: rc });
});
