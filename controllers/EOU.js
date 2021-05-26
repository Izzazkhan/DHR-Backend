/* eslint-disable no-await-in-loop */
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const generateReqNo = require('../components/requestNoGenerator');
const EOU = require('../models/EOU');
const EOUBed = require('../models/EouBed');

exports.createEOU = asyncHandler(async (req, res, next) => {
  const newEou = await EOU.create(req.body);

  res.status(201).json({
    success: true,
    data: newEou,
  });
});

exports.createBed = asyncHandler(async (req, res, next) => {
  const { createdBy } = req.body;

  const bedNo = await EOUBed.find().countDocuments();

  const bedId = generateReqNo('BID');
  const bed = await EOUBed.create({
    bedId,
    bedNo: bedNo + 1,
    availability: true,
    createdBy,
    disabled: false,
  });
  const beds = [];
  beds.push({ bedId: bed._id });

  await EOU.findOneAndUpdate(
    { name: 'EOU' },
    { $push: { beds } },
    { $new: true }
  );

  res.status(200).json({
    success: true,
    data: bed,
  });
});
