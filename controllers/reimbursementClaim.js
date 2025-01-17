const moment = require('moment');
const nodemailer = require('nodemailer');
const requestNoFormat = require('dateformat');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const EDR = require('../models/EDR/EDR');
const RC = require('../models/reimbursementClaim');
const IT = require('../models/insuranceItem');
const Staff = require('../models/staffFhir/staff');
const searchEdrPatient = require('../components/searchEdr');
const generateReqNo = require('../components/requestNoGenerator');

exports.getClaims = asyncHandler(async (req, res) => {
  const rc = await RC.find()
    .populate('generatedBy')
    .populate('patient')
    .populate('insurer');
  // .populate('item.itemId');
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
  const patients = await EDR.find({
    status: { $ne: 'Discharged' },
    paymentMethod: 'Insured',
  }).populate('patientId');

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getPatientDischarged = asyncHandler(async (req, res) => {
  const patients = await EDR.find({
    status: 'Discharged',
    paymentMethod: 'Insured',
  }).populate('patientId');

  const arr = searchEdrPatient(req, patients);
  res.status(200).json({
    success: true,
    data: arr,
  });
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
    { $set: { claimed: true } },
    { new: true }
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
      const requestNo = generateReqNo('RC');
      rc = await RC.create({
        requestNo,
        generatedBy: parsed.generatedBy,
        patient: parsed.patient,
        insurer: parsed.insurer,
        treatmentDetail: parsed.treatmentDetail,
        responseCode: parsed.responseCode,
        document: arr,
        status: parsed.status,
      });
    } else {
      const requestNo = generateReqNo('RC');
      rc = await RC.create({
        requestNo,
        generatedBy: parsed.generatedBy,
        patient: parsed.patient,
        insurer: parsed.insurer,
        treatmentDetail: parsed.treatmentDetail,
        responseCode: parsed.responseCode,
        document: '',
        status: parsed.status,
      });
    }
    const sender = await Staff.findOne({ _id: parsed.generatedBy }).select(
      'telecom'
    );
    const receiver = await Staff.find({ staffType: 'Admin' }).select('telecom');
    const filteredEmails = [];
    for (let index = 0; index < receiver.length; index++) {
      filteredEmails.push(receiver[index].telecom[0].value);
    }

    const senderEmail = sender.telecom[0].value;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'pmdevteam0@gmail.com',
        pass: 'SysJunc#@!',
      },
    });

    const mailOptions = {
      from: senderEmail,
      to: filteredEmails,
      subject: treatmentDetail,
      html: `<p>${document}<p>`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
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
  if (req.files && req.files.length > 0) {
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
    await RC.updateOne({ _id: _id }, JSON.parse(req.body.data));
    rc = await RC.findOneAndUpdate(
      { _id: _id },
      { $set: { document: rc.document } },
      JSON.parse(req.body.data)
    );
  }
  res.status(200).json({ success: true, data: rc });
});

exports.getEDRorIPR = asyncHandler(async (req, res) => {
  const rc = await RC.findOne(
    { patient: req.params._id },
    {},
    { sort: { createdAt: -1 } }
  );
  const a = await EDR.findOne({ patientId: req.params._id });
  if (a !== null) {
    var edr = await EDR.findOne({ patientId: req.params._id })
      .populate('patientId')
      // .populate('consultationNote.requester')
      .populate({
        path: 'pharmacyRequest',
        populate: [
          {
            path: 'item.itemId',
          },
        ],
      })
      // .populate('pharmacyRequest.item.itemId')
      // .populate('labRequest.requester')
      .populate('labRequest.serviceId')
      .populate('radRequest.serviceId');
    // .populate('radRequest.requester')
    // .populate('residentNotes.doctor')
    // .populate('residentNotes.doctorRef')
    // .populate('dischargeRequest.dischargeMedication.requester')
    // .populate('dischargeRequest.dischargeMedication.medicine.itemId')
    // .populate('triageAssessment.requester')
    // .sort({
    //   createdAt: 'desc',
    // })
    // console.log("EDR DATA", edr)
  }
  if (a) {
    const insurance = await IT.find({ providerId: edr.insurerId });

    var insured = [];
    for (let i = 0; i < edr.pharmacyRequest.length; i++) {
      for (let j = 0; j < edr.pharmacyRequest[i].item.length; j++) {
        for (let k = 0; k < insurance.length; k++) {
          if (
            JSON.parse(
              JSON.stringify(edr.pharmacyRequest[i].item[j].itemId._id)
            ) == insurance[k].itemId
          ) {
            insured.push(insurance[k]);
          }
        }
      }
    }
    for (let i = 0; i < edr.labRequest.length; i++) {
      for (let j = 0; j < insurance.length; j++) {
        if (
          JSON.parse(JSON.stringify(edr.labRequest[i].serviceId._id)) ==
          insurance[j].laboratoryServiceId
        ) {
          insured.push(insurance[j]);
        }
      }
    }
    for (let i = 0; i < edr.radRequest.length; i++) {
      for (let j = 0; j < insurance.length; j++) {
        if (
          JSON.parse(JSON.stringify(edr.radRequest[i].serviceId._id)) ==
          insurance[j].radiologyServiceId
        ) {
          insured.push(insurance[j]);
        }
      }
    }
    var uniqueArray = (function (insured) {
      var m = {},
        uniqueArray = [];
      for (var i = 0; i < insured.length; i++) {
        var v = insured[i];
        if (!m[v]) {
          uniqueArray.push(v);
          m[v] = true;
        }
      }
      return uniqueArray;
    })(insured);
    res
      .status(200)
      .json({ success: true, data: edr, rc: rc, insured: uniqueArray });
  } else {
    res.status(200).json({ success: false, data: 'User not found' });
  }
});

exports.getInsuredEDRs = asyncHandler(async (req, res, next) => {
  const edrs = await EDR.find({
    paymentMethod: 'Insured',
    status: { $ne: 'Discharged' },
  })
    .select('patientId')
    .populate('patientId');
  res.status(200).json({
    success: true,
    data: edrs,
  });
});

exports.getDischargedEDRs = asyncHandler(async (req, res, next) => {
  const edrs = await EDR.find({
    paymentMethod: 'Insured',
    status: 'Discharged',
  })
    .select('patientId')
    .populate('patientId');
  res.status(200).json({
    success: true,
    data: edrs,
  });
});
