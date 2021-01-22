const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');

exports.getLab = asyncHandler(async (req, res, next) => {
  const labs = await EDR.find({
    labRequest: { $ne: [] },
    $or: [
      { 'labRequest.status': 'pending approval' },
      { 'labRequest.status': 'completed' },
    ],
  })
    .select('patientId labRequest')
    .populate('patientId', 'identifier name createdAt labRequest');

  res.status(200).json({
    success: true,
    data: labs,
  });
});

exports.getRad = asyncHandler(async (req, res, next) => {
  const rads = await EDR.find({
    radRequest: { $ne: [] },
    $or: [
      { 'radRequest.status': 'pending approval' },
      { 'radRequest.status': 'completed' },
    ],
  })
    .select('patientId radRequest')
    .populate('patientId', 'identifier name createdAt radRequest');

  res.status(200).json({
    success: true,
    data: rads,
  });
});
