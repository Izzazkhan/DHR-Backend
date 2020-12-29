const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');
const CareStream = require('../models/CareStreams/CareStreams');
const EDR = require('../models/EDR/EDR');

exports.addCareStream = asyncHandler(async (req, res, next) => {
  const {
    name,
    inclusionCriteria,
    exclusionCriteria,
    investigations,
    precautions,
    treatmentOrders,
    fluidsIV,
    medications,
    mdNotification,
    createdBy,
  } = req.body;
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
      value: 'CS' + day + requestNoFormat(new Date(), 'yyHHMMss'),
    },
  ];
  const careStream = await CareStream.create({
    identifier: MRN,
    name,
    inclusionCriteria,
    exclusionCriteria,
    investigations,
    precautions,
    treatmentOrders,
    fluidsIV,
    medications,
    mdNotification,
    createdBy,
  });
  res.status(201).json({
    success: true,
    data: careStream,
  });
});

exports.getAllCareStreams = asyncHandler(async (req, res, next) => {
  const careStreams = await CareStream.paginate({}, { limit: 100 });
  res.status(200).json({
    success: true,
    data: careStreams,
  });
});

exports.disableCareStream = asyncHandler(async (req, res) => {
  const careStream = await CareStream.findOne({ _id: req.params.id });
  if (careStream.availability === false) {
    res.status(200).json({
      success: false,
      data: 'CareStream not availabele for disabling',
    });
  } else if (careStream.disabled === true) {
    res
      .status(200)
      .json({ success: false, data: 'CareStream already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await CareStream.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'CareStream status changed to disable' });
  }
});

exports.enableCareStreamService = asyncHandler(async (req, res) => {
  const careStream = await CareStream.findOne({ _id: req.params.id });
  if (careStream.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await CareStream.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'careStream status changed to enable' });
  } else {
    res
      .status(200)
      .json({ success: false, data: 'careStream already enabled' });
  }
});

exports.getMedicationsCareStreams = asyncHandler(async (req, res, next) => {
  const careStreams = await CareStream.find().select({
    name: 1,
    _id: 1,
    identifier: 1,
    createdAt: 1,
  });
  res.status(200).json({
    success: true,
    data: careStreams,
  });
});
exports.getMedicationsByIdCareStreams = asyncHandler(async (req, res, next) => {
  const careStreams = await CareStream.findOne({ _id: req.params.id }).select({
    medications: 1,
    _id: 0,
  });
  res.status(200).json({
    success: true,
    data: careStreams,
  });
});

exports.getCSPatients = asyncHandler(async (req, res, next) => {
  const csPatients = await EDR.find({
    status: 'pending',
    careStream: { $eq: [] },
    room: { $ne: [] },
  }).populate('patientId');

  res.status(200).json({
    success: true,
    data: csPatients,
  });
});

exports.asignCareStream = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const edrCheck = await EDR.find({ _id: req.body.edrId }).populate(
    'patientId'
  );
  // const latestEdr = edrCheck.length - 1;
  const latestCS = edrCheck[0].careStream.length - 1;
  const updatedVersion = latestCS + 2;

  const versionNo = edrCheck[0].requestNo + '-' + updatedVersion;

  const careStream = {
    versionNo,
    name: req.body.name,
    inclusionCriteria: req.body.inclusionCriteria,
    exclusionCriteria: req.body.exclusionCriteria,
    investigations: req.body.investigations,
    precautions: req.body.precautions,
    treatmentOrders: req.body.treatmentOrders,
    fluidsIV: req.body.fluidsIV,
    medications: req.body.medications,
    mdNotification: req.body.mdNotification,
    careStreamId: req.body.careStreamId,
    assignedBy: req.body.staffId,
    assignedTime: Date.now(),
    reason: req.body.reason,
    status: req.body.status,
  };
  const assignedCareStream = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { careStream } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: assignedCareStream,
  });
});

exports.getCSPatientByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    status: 'pending',
    careStream: { $eq: [] },
    room: { $ne: [] },
  }).populate('patientId');

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

exports.getEDRswithCS = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    careStream: { $ne: [] },
    room: { $ne: [] },
  }).populate('patientId');

  res.status(200).json({
    success: true,
    data: patients,
  });
});
