const requestNoFormat = require('dateformat');
const PA = require('../models/productionArea');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.getPAs = asyncHandler(async (req, res) => {
  const getPAs = await PA.find({ disabled: false }).populate('rooms.roomId');
  res.status(200).json({ success: true, data: getPAs });
});

exports.createPA = asyncHandler(async (req, res) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const { paName, rooms } = req.body;
  const createPAs = await PA.create({
    paId: 'PA' + day + requestNoFormat(new Date(), 'yyHHMMss'),
    paName,
    rooms,
    availability: true,
    disabled: false,
    status: 'not_assigned',
  });
  res.status(200).json({ success: true, data: createPAs });
});

exports.disablePA = asyncHandler(async (req, res) => {
  const area = await PA.findOne({ _id: req.params.id });
  if (area.availability === false) {
    res.status(200).json({
      success: false,
      data: 'Production Area not available for disabling',
    });
  } else if (area.disabled === true) {
    res
      .status(200)
      .json({ success: false, data: 'Production Area already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await PA.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord: updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Production Area status changed' });
  }
});

exports.enablePA = asyncHandler(async (req, res) => {
  const area = await PA.findOne({ _id: req.params.id });
  if (area.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await PA.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord: updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'Production Area status changed' });
  } else {
    res
      .status(200)
      .json({ success: false, data: 'Production Area already enabled' });
  }
});
