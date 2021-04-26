const requestNoFormat = require('dateformat');
const Lab = require('../models/service/lab');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const generateReqNo = require('../components/requestNoGenerator');

exports.addLabService = asyncHandler(async (req, res, next) => {
  const MRN = [
    {
      value: generateReqNo('LS'),
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
  let updatedLab;
  updatedLab = await Lab.findByIdAndUpdate(
    req.body._id,
    { $push: { updateRecord } },
    {
      new: true,
    }
  );
  updatedLab = await Lab.findByIdAndUpdate(req.body._id, body, {
    new: true,
  });
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
  const labServices = await Lab.find({ disabled: false });
  res.status(200).json({
    success: true,
    data: labServices,
  });
});

exports.AllLabServices = asyncHandler(async (req, res, next) => {
  const labServices = await Lab.find();
  res.status(200).json({
    success: true,
    data: labServices,
  });
});

exports.disableLabService = asyncHandler(async (req, res) => {
  const lab = await Lab.findOne({ _id: req.params.id });
  if (lab.availability === false) {
    res
      .status(200)
      .json({ success: false, data: 'Lab not available for disabling' });
  } else if (lab.disabled === true) {
    res.status(200).json({ success: false, data: 'Lab already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Lab.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Lab status changed to disable' });
  }
});

exports.enableLabService = asyncHandler(async (req, res) => {
  const lab = await Lab.findOne({ _id: req.params.id });
  if (lab.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Lab.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Lab status changed to enable' });
  } else {
    res.status(200).json({ success: false, data: 'Lab already enabled' });
  }
});

exports.getLabServiceByKeyword = asyncHandler(async (req, res, next) => {
  const labService = await Lab.aggregate([
    {
      $match: {
        disabled: false,
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
    data: labService,
  });
});

exports.LabServiceByKeyword = asyncHandler(async (req, res, next) => {
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

  res.status(200).json({
    success: true,
    data: labService,
  });
});
