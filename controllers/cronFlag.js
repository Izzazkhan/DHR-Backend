const moment = require('moment');
const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Room = require('../models/room');
const EouPatients = require('../models/EOUNurse');
const Staff = require('../models/staffFhir/staff');
const CronFlag = require('../models/CronFlag');
const addFlag = require('../components/addFlag');

exports.addFlag = asyncHandler(async (req, res, next) => {
  //   const time = new Date();
  //   time.setMinutes(time.getMinutes() + 5);
  //   const milliseconds = time.getTime();
  //   console.log(milliseconds);
  //   const flag = await CronFlag.create({
  //     taskNAme: 'test',
  //     taskAssignTime: Date.now(),
  //     taskFlagTime: milliseconds,
  //     status: 'pending',
  //     collectionName: 'Flag',
  //     staffId: '3851297u9ujdijv',
  //   });
  //   res.status(200).json({
  //     success: true,
  //     data: flag,
  //   });
  const data = {
    taskName: 'test',
    minutes: 2,
    collectionName: 'test Collection',
    staffId: '60d5a125dd629f31580f8743',
    edrId: '60d5a125dd629f31580f8743',
    patientId: '60d5a125dd629f31580f8743',
    generatedFrom: 'Sensei',
    generatedFor: 'Sensei',
    card: '1st',
    reason: 'no reason',
    emittedFor: 'pendingSensei',
  };

  addFlag(data, res);
});
