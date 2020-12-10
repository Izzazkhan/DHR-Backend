const requestNoFormat = require('dateformat');
const Lab = require('../models/service/lab');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.addLabService = asyncHandler(async (req, res, next) => {
  // console.log(req.body.params);
  console.log(req.body);
  // console.log(req.body.data);
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
      value: 'LS' + day + requestNoFormat(new Date(), 'yyHHMMss'),
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

exports.updateLabService = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  let updatedLab;
  updatedLab = await Lab.findByIdAndUpdate(
    req.body._id,
    // req.body,
    { $push: { updateRecord: req.body.updateRecord } },
    {
      new: true,
    }
  );
  updatedLab = await Lab.findByIdAndUpdate(
    req.body._id,
    req.body,
    // { $push: { updateRecord: req.body.updateRecord } },
    {
      new: true,
    }
  );
  if (!updatedLab) {
    return next(
      new ErrorResponse(
        `No LabService found with this id: ${req.body._id}`,
        404
      )
    );
  }
  res.status(200).json({
    success: true,
    data: updatedLab,
  });
});

exports.getAllLabServices = asyncHandler(async (req, res, next) => {
  const labServices = await Lab.paginate({}, { limit: 100 });
  res.status(200).json({
    success: true,
    data: labServices,
  });
});

// / Disable Lab Service
exports.activeLabService = asyncHandler(async (req, res, next) => {
  const labService = await Lab.findByIdAndUpdate(
    req.body.id,
    { $push: { active: req.body.active } },
    {
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    data: labService,
  });
});

exports.getLabSeriviceByKeyword = asyncHandler(async (req, res, next) => {
  const labService = await Lab.aggregate([
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
    data: labService,
  });
});
