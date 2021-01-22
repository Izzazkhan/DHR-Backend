const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');

exports.getPendingTransfers = asyncHandler(async (req, res, next) => {
  const transferEdrs = await EDR.find({
    nurseTechnicianStatus: 'pending',
  });
  res.status(200).json({
    success: true,
    data: transferEdrs,
  });
});
