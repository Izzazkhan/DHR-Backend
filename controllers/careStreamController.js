const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');
const CareStream = require('../models/CareStreams/CareStreams');

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
