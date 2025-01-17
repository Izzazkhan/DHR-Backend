const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Shift = require('../models/shift');
const generateReqNo = require('../components/requestNoGenerator');

exports.addShift = asyncHandler(async (req, res, next) => {
  const shiftId = generateReqNo('SID');

  const { name, startTime, endTime, addedBy } = req.body;
  const shiftName = await Shift.findOne({
    name: name,
    // disabled: false,
  });
  if (shiftName) {
    return next(
      new ErrorResponse('A Shift with this name already exists', 400)
    );
  }
  // const shifts = await Shift.find({});
  // //  Checking for existing shift Time
  // if (shifts && shifts.length > 0) {
  //   const existingShift = shifts.filter((shift) => {
  //     // DB Shifts
  //     const dbShiftStart = shift.startTime.toISOString().split('T')[1];
  //     const dbShiftEnd = shift.endTime.toISOString().split('T')[1];

  //     // User Entered Shifts
  // let userStart = new Date(startTime);
  // let userEnd = new Date(endTime);
  // userStart = userStart.toISOString().split('T')[1];
  // userEnd = userEnd.toISOString().split('T')[1];

  //     // Comparing Shift Times
  //     console.log('userStart:', userStart, 'dbShiftStart', dbShiftStart);
  //     console.log('userEnd:', userEnd, 'dbShiftStart', dbShiftStart);
  //     if (userStart < dbShiftEnd || userEnd > dbShiftStart) {
  //       return shift;
  //     }
  //   });

  //   if (existingShift && existingShift.length > 0) {
  //     return next(
  //       new ErrorResponse(
  //         'This shift timing is overlapping an existing shift',
  //         400
  //       )
  //     );
  //   }
  // }

  const newShift = await Shift.create({
    name,
    startTime,
    endTime,
    shiftId,
    addedBy,
    createdAt: Date.now(),
  });

  res.status(200).json({
    success: true,
    data: newShift,
  });
});

exports.updateShift = asyncHandler(async (req, res, next) => {
  const { startTime, endTime, updatedBy, reason, shiftId } = req.body;

  // const shifts = await Shift.find({});

  // //  Checking for existing shift Time
  // if (shifts && shifts.length > 0) {
  //   const existingShift = shifts.filter((shift) => {
  //     // DB Shifts
  //     const dbShiftStart = shift.startTime.toISOString().split('T')[1];
  //     const dbShiftEnd = shift.endTime.toISOString().split('T')[1];

  //     // User Entered Shifts
  //     let userStart = new Date(startTime);
  //     let userEnd = new Date(endTime);
  //     userStart = userStart.toISOString().split('T')[1];
  //     userEnd = userEnd.toISOString().split('T')[1];

  //     // Comparing Shift Times
  //     // console.log('userStart:', userStart, 'dbShiftStart', dbShiftStart);
  //     // console.log('userEnd:', userEnd, 'dbShiftStart', dbShiftStart);
  //     if (userStart < dbShiftEnd || userEnd > dbShiftStart) {
  //       return shift;
  //     }
  //   });

  //   if (existingShift && existingShift.length > 0) {
  //     return next(
  //       new ErrorResponse(
  //         'This shift timing is overlapping an existing shift',
  //         400
  //       )
  //     );
  //   }
  // }

  const updateRecord = {
    updatedBy,
    updatedAt: Date.now(),
    reason,
  };

  let updatedShift = await Shift.findOneAndUpdate(
    { _id: shiftId },
    { $set: { startTime: startTime, endTime: endTime } },
    { new: true }
  );

  updatedShift = await Shift.findOneAndUpdate(
    { _id: shiftId },
    { $push: { updateRecord } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedShift,
  });
});

exports.getAllShifts = asyncHandler(async (req, res, next) => {
  const shifts = await Shift.find().populate('addedBy', 'name');

  res.status(200).json({
    success: true,
    data: shifts,
  });
});
