const requestNoFormat = require('dateformat');
const Radiology = require('../models/service/radiology');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.addRadiologyService = asyncHandler(async (req, res, next) => {
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

// / Disable Lab Service
exports.activeRadService = asyncHandler(async (req, res, next) => {
  const radService = await Radiology.findByIdAndUpdate(
    req.body.id,
    { $push: { active: req.body.active } },

    {
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    data: radService,
  });
});

exports.getRAdServiceByKeyword = asyncHandler(async (req, res, next) => {
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
  //   console.log(labService);
  //   if (labService.length < 1) {
  //     console.log('abc');
  //     return next(
  //       new ErrorResponse(
  //         `No Data Found With this keyword: ${req.params.keyword}`,
  //         404
  //       )
  //     );
  //   }

  res.status(200).json({
    success: true,
    data: radService,
  });
});
