/* eslint-disable no-await-in-loop */
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const generateReqNo = require('../components/requestNoGenerator');
const EOU = require('../models/EOU');
// const EOUBed = require('../models/EouBed');

exports.createEOU = asyncHandler(async (req, res, next) => {
  const newEou = await EOU.create(req.body);

  res.status(201).json({
    success: true,
    data: newEou,
  });
});

// exports.createBed = asyncHandler(async (req, res, next) => {
//   const { createdBy } = req.body;

//   const bedNo = await EOUBed.find().countDocuments();

//   const bedId = generateReqNo('BID');
//   const bed = await EOUBed.create({
//     bedId,
//     bedNo: bedNo + 1,
//     availability: true,
//     createdBy,
//     disabled: false,
//   });
//   const beds = [];
//   beds.push({ bedId: bed._id });

//   await EOU.findOneAndUpdate(
//     { name: 'EOU' },
//     { $push: { beds } },
//     { $new: true }
//   );

//   res.status(200).json({
//     success: true,
//     data: bed,
//   });
// });

// exports.getAllBeds = asyncHandler(async (req, res, next) => {
//   const beds = await EOUBed.find();

//   res.status(200).json({
//     success: true,
//     data: beds,
//   });
// });

// exports.getAvailableBeds = asyncHandler(async (req, res, next) => {
//   const beds = await EOUBed.find({ disableBed: false, availability: true });

//   res.status(200).json({
//     success: true,
//     data: beds,
//   });
// });

// exports.disableBed = asyncHandler(async (req, res) => {
//   const bed = await EOUBed.findOne({ _id: req.body.bedId });
//   if (bed.availability === false) {
//     res
//       .status(200)
//       .json({ success: false, data: 'Bed not available for disabling' });
//   } else if (bed.disabled === true) {
//     res.status(200).json({ success: false, data: 'Bed already disabled' });
//   } else {
//     const updateRecord = {
//       updatedAt: Date.now(),
//       updatedBy: req.body.staffId,
//       reason: req.body.reason,
//     };
//     await EOUBed.findOneAndUpdate(
//       { _id: req.body.bedId },
//       {
//         $set: { disabled: true },
//         $push: { updateRecord: updateRecord },
//       }
//     );
//     res.status(200).json({ success: true, data: 'Bed status changed' });
//   }
// });

// exports.enableBed = asyncHandler(async (req, res) => {
//   const bed = await EOUBed.findOne({ _id: req.body.bedId });
//   if (bed.disabled === true) {
//     const updateRecord = {
//       updatedAt: Date.now(),
//       updatedBy: req.body.staffId,
//       reason: req.body.reason,
//     };
//     await EOUBed.findOneAndUpdate(
//       { _id: req.body.bedId },
//       {
//         $set: { disabled: false },
//         $push: { updateRecord: updateRecord },
//       }
//     );
//     res.status(200).json({ success: true, data: 'Bed status changed' });
//   } else {
//     res.status(200).json({ success: false, data: 'Bed already enabled' });
//   }
// });
