const CronFlag = require('../models/CronFlag');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

const addFlag = asyncHandler(async (data, res) => {
  const time = new Date();
  time.setMinutes(time.getMinutes() + data.minutes);
  const milliseconds = time.getTime();
  console.log(milliseconds);
  await CronFlag.create({
    taskName: data.taskName,
    taskAssignTime: Date.now(),
    taskFlagTime: milliseconds,
    status: 'pending',
    collectionName: data.collection,
    staffId: data.staffId,
    edrId: data.edrId,
    // patientId: data.patientId,
    generatedFrom: data.generatedFrom,
    generatedFor: data.generatedFor,
    card: data.card,
    reason: data.reason,
    emittedFor: data.emittedFor,
    requestId: data.requestId,
  });

  //   res.status(200).json({
  //     success: true,
  //     data: flag,
  //   });
});

module.exports = addFlag;
