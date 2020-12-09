const requestNoFormat = require('dateformat');
const Lab = require('../models/service/lab');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.addLabService = asyncHandler(async (req, res, next) => {
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
      value: 'LR' + day + requestNoFormat(new Date(), 'yyHHMMss'),
    },
  ];
  const { name, type, price, status } = req.body;
  const lab = await Lab.create({
    identifier: MRN,
    name,
    type,
    price,
    status,
  });

  res.status(201).json({
    success: true,
    data: lab,
  });
});
