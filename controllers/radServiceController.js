const requestNoFormat = require('dateformat');
const Radiology = require('../models/service/radiology');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.addRadService = asyncHandler(async (req, res, next) => {
  console.log(req.body);
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
      value: 'Rs' + day + requestNoFormat(new Date(), 'yyHHMMss'),
    },
  ];
  const { name, type, price, status } = req.body;
  const radiology = await Radiology.create({
    identifier: MRN,
    name,
    type,
    price,
    status,
  });

  res.status(201).json({
    success: true,
    data: radiology,
  });
});

exports.updateLabService = asyncHandler(async (req, res, next) => {
  const updateRadiology = await Radiology.findByIdAndUpdate(
    req.body._id,
    req.body,
    {
      new: true,
    }
  );
  if (!updateRadiology) {
    return next(
      new ErrorResponse(`No Radiology found with this id: ${req.body._id}`, 404)
    );
  }
  res.status(200).json({
    success: true,
    data: updateRadiology,
  });
});

exports.getAllRadServices = asyncHandler(async (req, res, next) => {
  const radServices = await Radiology.paginate({}, { limit: 100 });
  res.status(200).json({
    success: true,
    data: radServices,
  });
});

exports.getRadServiceByKeyword = asyncHandler(async (req, res, next) => {
  const radService = await Radiology.aggregate([
    {
      $match: {
        $or: [
          {
            name: { $regex: req.params.keyword, $options: 'i' },
          },
          {
            type: { $regex: req.params.keyword, $options: 'i' },
          },
          {
            'identifier.value': { $regex: req.params.keyword, $options: 'i' },
          },
        ],
      },
    },
  ]).limit(50);

  res.status(200).json({
    success: true,
    data: radService,
  });
});
