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

exports.updateRadService = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: req.body.staffId,
    reason: req.body.reason,
  };
  const body = {
    name: req.body.name,
    price: req.body.price,
    type: req.body.type,
  };
  let updatedRad;
  updatedRad = await Radiology.findByIdAndUpdate(
    req.body._id,
    { $push: { updateRecord } },
    {
      new: true,
    }
  );
  updatedRad = await Radiology.findByIdAndUpdate(req.body._id, body, {
    new: true,
  });
  console.log(updatedRad);
  if (!updatedRad) {
    return next(
      new ErrorResponse(
        `No Rad Service found with this id: ${req.body._id}`,
        404
      )
    );
  }
  res.status(200).json({
    success: true,
    data: updatedRad,
  });
});

exports.getAllRadServices = asyncHandler(async (req, res, next) => {
  const radServices = await Radiology.paginate({}, { limit: 100 });
  res.status(200).json({
    success: true,
    data: radServices,
  });
});

exports.disableRadService = asyncHandler(async (req, res) => {
  console.log(req.body);
  const rad = await Radiology.findOne({ _id: req.params.id });
  if (rad.avairadility === false) {
    res.status(200).json({
      success: false,
      data: 'Rad Service not available for disabling',
    });
  } else if (rad.disabled === true) {
    res
      .status(200)
      .json({ success: false, data: 'Rad Service already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Radiology.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Rad service status changed to disable' });
  }
});

exports.enableRadService = asyncHandler(async (req, res) => {
  const rad = await Radiology.findOne({ _id: req.params.id });
  if (rad.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Radiology.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'rad status changed to enable' });
  } else {
    res
      .status(200)
      .json({ success: false, data: 'rad service already enabled' });
  }
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
