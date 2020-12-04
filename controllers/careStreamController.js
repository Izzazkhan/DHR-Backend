const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const CareStream = require('../models/CareStreams/CareStreams');

exports.addCareStream = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const careStream = await CareStream.create(req.body);
  res.status(200).json({
    success: true,
    data: careStream,
  });
});
