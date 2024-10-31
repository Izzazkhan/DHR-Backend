const PA = require('../models/productionArea');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Room = require('../models/room');
const generateReqNo = require('../components/requestNoGenerator');
const CC = require('../models/chiefComplaint/chiefComplaint');

exports.getPAs = asyncHandler(async (req, res) => {
  const getPAs = await PA.find({ disabled: false }).populate('rooms.roomId');
  res.status(200).json({ success: true, data: getPAs });
});

exports.createPA = asyncHandler(async (req, res) => {
  const { paName, rooms } = req.body;
  const nameExist = await PA.findOne({ paName: req.body.paName });
  if (nameExist) {
    return res.status(400).json({
      success: false,
      data: { msg: 'Production area with that name already exist.' },
    });
  }
  const requestNo = generateReqNo('PA');
  const createPAs = await PA.create({
    paId: requestNo,
    paName,
    rooms,
    availability: true,
    disabled: false,
    status: 'not_assigned',
  });

  rooms.forEach(
    async (r) =>
      await Room.findOneAndUpdate(
        { _id: r.roomId },
        { $set: { assingedToPA: true } },
        { new: true }
      )
  );

  const chiefComplaint = await CC.create({
    paName,
    chiefComplaintId: requestNo,
  });
  const productionArea = {
    assignedBy: req.body.staffId,
    productionAreaId: createPAs._id,
    assignedTime: Date.now(),
  };
  await CC.findOneAndUpdate(
    { _id: chiefComplaint._id },
    { $push: { productionArea } },
    {
      new: true,
    }
  );

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

exports.getPARooms = asyncHandler(async (req, res, next) => {
  const paRooms = await PA.findById(req.params.paId)
    .select('rooms')
    .populate('rooms.roomId', 'roomNo');

  res.status(200).json({
    success: true,
    data: paRooms,
  });
});
