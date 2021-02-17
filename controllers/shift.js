const requestNoFormat = require('dateformat');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Shift = require('../models/shift');

exports.addShift = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const shiftId = 'SID' + day + requestNoFormat(new Date(), 'yyHHMMss');

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
  const shifts = await Shift.find({});
  //  Checking for existing shift Time
  if (shifts && shifts.length > 0) {
    const existingShift = shifts.filter((shift) => {
      // DB Shifts
      const dbShiftStart = shift.startTime.toISOString().split('T')[1];
      const dbShiftEnd = shift.endTime.toISOString().split('T')[1];

      // User Entered Shifts
      let userStart = new Date(startTime);
      let userEnd = new Date(endTime);
      userStart = userStart.toISOString().split('T')[1];
      userEnd = userEnd.toISOString().split('T')[1];

      // Comparing Shift Times
      console.log('userStart:', userStart, 'ddbShiftStart', dbShiftStart);
      console.log('userEnd:', userEnd, 'dbShiftStart', dbShiftStart);
      if (userStart < dbShiftEnd || userEnd > dbShiftStart) {
        return shift;
      }
    });

    if (existingShift && existingShift.length > 0) {
      return next(
        new ErrorResponse(
          'This shift timing is overlapping an existing shift',
          400
        )
      );
    }
  }

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
