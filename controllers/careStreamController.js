const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const CareStream = require('../models/CareStreams/CareStreams');

exports.addCareStream = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const careStream = await CareStream.create(req.body);
  res.status(200).json({
    success: true,
    data: careStream,
  });
});
