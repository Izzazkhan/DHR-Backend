const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.paramedicsEdr = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
    patientInHospital: false,
  })
    .populate('patientId', 'identifier name age gender telecom createdAt')
    .select('patientId');
  res.status(200).json({
    success: true,
    data: paramedicsEdr,
  });
});

exports.edrTransfer = asyncHandler(async (req, res, next) => {
  const transferredEdr = await EDR.findOneAndUpdate(
    { _id: req.params.edrId },
    { $set: { patientInHospital: true } },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: transferredEdr,
  });
});

exports.transferredParamedicsEdr = asyncHandler(async (req, res, next) => {
  const paramedicsEdr = await EDR.find({
    generatedFrom: 'Paramedics',
    patientInHospital: true,
  })
    .populate('patientId', 'identifier name age gender telecom createdAt')
    .select('patientId');
  res.status(200).json({
    success: true,
    data: paramedicsEdr,
  });
});
