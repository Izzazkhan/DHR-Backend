/* eslint-disable no-await-in-loop */
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EOU = require('../models/EOU');
const Bed = require('../models/Bed');
const EDR = require('../models/EDR/EDR');

exports.createEOU = asyncHandler(async (req, res, next) => {
  const newEou = await EOU.create(req.body);

  res.status(201).json({
    success: true,
    data: newEou,
  });
});

exports.assignBedToEOU = asyncHandler(async (req, res, next) => {
  const { staffId, eouBeds } = req.body;

  const beds = [];
  for (let i = 0; i < eouBeds.length; i++) {
    const eouBed = await Bed.findOne({ _id: eouBeds[i] });

    if (!eouBed || eouBed.availability === false || eouBed.disabled === true) {
      return next(
        new ErrorResponse('This bed could not be assigned to EOU', 400)
      );
    }

    const bed = {
      bedIdDB: eouBed._id,
      bedId: eouBed.bedId,
      bedNo: eouBed.bedNo,
      availability: true,
      assignedBy: staffId,
      disabled: false,
    };

    beds.push(bed);

    await Bed.findOneAndUpdate(
      { _id: eouBed._id },
      { $set: { availability: false, bedType: 'EOU' } },
      { new: true }
    );
  }

  const assignedBeds = await EOU.findOneAndUpdate(
    { name: 'EOU' },
    { $push: { beds } },
    { $new: true }
  );

  res.status(200).json({
    success: true,
    data: assignedBeds,
  });
});

exports.getAllBeds = asyncHandler(async (req, res, next) => {
  const beds = await EOU.find().select('beds');

  res.status(200).json({
    success: true,
    data: beds,
  });
});

exports.getAvailableBeds = asyncHandler(async (req, res, next) => {
  const beds = await EOU.aggregate([
    {
      $project: {
        beds: 1,
      },
    },
    {
      $unwind: '$beds',
    },
    {
      $match: {
        'beds.availability': true,
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: beds,
  });
});
