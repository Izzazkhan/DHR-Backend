const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const CareStream = require('../models/CareStreams/CareStreams');

exports.addCareStream = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
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

exports.updateCareStream = asyncHandler(async (req, res, next) => {
  const updatedCareStream = await CareStream.findByIdAndUpdate(
    req.body._id,
    req.body,
    {
      new: true,
    }
  );
  if (!updatedCareStream) {
    return next(
      new ErrorResponse(
        `No carestream found with this id: ${req.body._id}`,
        404
      )
    );
  }
  res.status(200).json({
    success: true,
    data: updatedCareStream,
  });
});

exports.getAllCareStreams = asyncHandler(async (req, res, next) => {
  const careStreams = await CareStream.paginate({}, { limit: 100 });
  res.status(200).json({
    success: true,
    data: careStreams,
  });
});

// Disable CareStream
exports.activeCareStream = asyncHandler(async (req, res, next) => {
  const carestream = await CareStream.findByIdAndUpdate(
    req.body.id,
    {
      avtive: req.body.active,
      reason: req.body.reason,
      changedBy: req.body.changedBy,
      changedAt: req.body.changedAt,
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    data: carestream,
  });
});
