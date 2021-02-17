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
  const shifts = await Shift.find({
    // disabled: false,
  });

  //  Checking for existing shift Time
  const existingShift = shifts.filter((shift) => {
    const dbShiftStart = shift.startTime.toISOString().split('T')[1];
    const dbShiftEnd = shift.endTime.toISOString().split('T')[1];
    if (startTime >= dbShiftStart || endTime <= dbShiftEnd) {
      // console.log(shift);
      return shift;
    }
  });
  if (existingShift) {
    return next(
      new ErrorResponse(
        'This shift timing is overlapping an existing shift',
        400
      )
    );
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
