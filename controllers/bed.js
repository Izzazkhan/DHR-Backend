const Room = require('../models/room');
const asyncHandler = require('../middleware/async');
const generateReqNo = require('../components/requestNoGenerator');
const Bed = require('../models/Bed');

exports.createBed = asyncHandler(async (req, res, next) => {
  const bedNo = await Bed.find().countDocuments();
  const requestNo = generateReqNo('BD');

  const newBed = await Bed.create({
    bedId: requestNo,
    bedNo: bedNo + 1,
    availability: true,
    disabled: false,
    createdBy: req.body.staffId,
  });
  res.status(200).json({ success: true, data: newBed });
});

exports.getAllBeds = asyncHandler(async (req, res, next) => {
  const beds = await Bed.find();

  res.status(200).json({
    success: true,
    data: beds,
  });
});

exports.getAvailableBeds = asyncHandler(async (req, res, next) => {
  const beds = await Bed.find({ disabled: false, availability: true });

  res.status(200).json({
    success: true,
    data: beds,
  });
});

exports.disableBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findOne({ _id: req.body.bedId });
  if (bed.availability === false) {
    res
      .status(200)
      .json({ success: false, data: 'Bed not available for disabling' });
  } else if (bed.disabled === true) {
    res.status(200).json({ success: false, data: 'Bed already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Bed.findOneAndUpdate(
      { _id: req.body.bedId },
      {
        $set: { disabled: true },
        $push: { updateRecord: updateRecord },
      }
    );
    res.status(200).json({ success: true, data: 'Bed status changed' });
  }
});

exports.enableBed = asyncHandler(async (req, res) => {
  const bed = await Bed.findOne({ _id: req.body.bedId });
  if (bed.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Bed.findOneAndUpdate(
      { _id: req.body.bedId },
      {
        $set: { disabled: false },
        $push: { updateRecord: updateRecord },
      }
    );
    res.status(200).json({ success: true, data: 'Bed status changed' });
  } else {
    res.status(200).json({ success: false, data: 'Bed already enabled' });
  }
});
