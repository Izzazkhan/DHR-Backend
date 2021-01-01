const requestNoFormat = require('dateformat');
const Flag = require('../models/flag/Flag');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.addFlag = asyncHandler(async (req, res, next) => {
  const { edrId, generatedBy, generatedTo, reason } = req.body;
  const flag = await Flag.create({
    edrId,
    generatedBy,
    generatedTo,
    reason,
  });
  res.status(201).json({
    success: true,
    data: flag,
  });
});

exports.getAllPendingFlag = asyncHandler(async (req, res, next) => {
  const flag = await Flag.find({ status: 'pending' }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
        },
      ],
    },
    {
      path: 'generatedBy',
      model: 'staff',
    },
  ]);
  res.status(200).json({
    success: true,
    data: flag,
  });
});

exports.getAllCompletedFlag = asyncHandler(async (req, res, next) => {
  const flag = await Flag.find({ status: 'completed' }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
        },
      ],
    },
    {
      path: 'generatedBy',
      model: 'staff',
    },
  ]);
  res.status(200).json({
    success: true,
    data: flag,
  });
});

exports.getFlagCount = asyncHandler(async (req, res, next) => {
  const flag = await Flag.find();
  res.status(200).json({
    success: true,
    data: flag.length,
  });
});
