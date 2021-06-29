const moment = require('moment');
const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Room = require('../models/room');
const EouPatients = require('../models/EOUNurse');
const Staff = require('../models/staffFhir/staff');
const CronFlag = require('../models/CronFlag');

exports.addFlag = asyncHandler(async (req, res, next) => {
  const time = new Date();
  time.setMinutes(time.getMinutes() + 5);
  console.log(time);
  //   const flag = await CronFlag.create({
  //     taskNAme: 'test',
  //     taskAssignTime: Date.now(),
  //     taskFlagTime: time,
  //     status: 'pending',
  //     collectionName: 'Flag',
  //     staffId: '3851297u9ujdijv',
  //   });

  //   res.status(200).json({
  //     success: true,
  //     data: flag,
  //   });
});
