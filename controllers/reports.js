const moment = require('moment');
const Patient = require('../models/patient/patient');
const Room = require('../models/room');
const HKRequests = require('../models/houseKeepingRequest');

const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');

const currentTime = moment().utc().toDate();
const lastHour = moment().subtract(1, 'hours').utc().toDate();
const fifthHour = moment().subtract(2, 'hours').utc().toDate();
const fourthHour = moment().subtract(3, 'hours').utc().toDate();
const thirdHour = moment().subtract(4, 'hours').utc().toDate();
const secondHour = moment().subtract(5, 'hours').utc().toDate();
const sixHour = moment().subtract(6, 'hours').utc().toDate();

// Registration Officer Dashboard Stats
exports.roDashboard = asyncHandler(async (req, res) => {
  // console.log('sixHour:', sixHour);
  // console.log('currentTime:', currentTime);
  // * Register Officer Registrations Per Hour
  const patients = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Registration Officer' },
          { registrationStatus: 'completed' },
          { 'processTime.processStartTime': { $gte: sixHour } },
          { 'processTime.processEndTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  const averageRegistrationTime = 360 / patients.length;

  //* Registration Officer Completed Per Hour
  const completedArr = [];
  let sixthHourPatient = 0;
  let fifthHourPatient = 0;
  let fourthHourPatient = 0;
  let thirdHourPatient = 0;
  let secondHourPatient = 0;
  let firstHourPatient = 0;
  patients.map((p) => {
    // let hour, patientHours;
    if (
      p.processTime.processStartTime > lastHour &&
      p.processTime.processEndTime < currentTime
    ) {
      sixthHourPatient++;
      // console.log('sixthHourPatient', sixthHourPatient);
    } else if (
      p.processTime.processStartTime > fifthHour &&
      p.processTime.processEndTime < lastHour
    ) {
      fifthHourPatient++;
    } else if (
      p.processTime.processStartTime > fourthHour &&
      p.processTime.processEndTime < fifthHour
    ) {
      fourthHourPatient++;
    } else if (
      p.processTime.processStartTime > thirdHour &&
      p.processTime.processEndTime < fourthHour
    ) {
      thirdHourPatient++;
    } else if (
      p.processTime.processStartTime > secondHour &&
      p.processTime.processEndTime < thirdHour
    ) {
      secondHourPatient++;
    } else if (
      p.processTime.processStartTime > sixHour &&
      p.processTime.processEndTime < secondHour
    ) {
      firstHourPatient++;
    }
  });
  completedArr.push({ label: lastHour, value: sixthHourPatient });
  completedArr.push({ label: fifthHour, value: fifthHourPatient });
  completedArr.push({ label: fourthHour, value: fourthHourPatient });
  completedArr.push({ label: thirdHour, value: thirdHourPatient });
  completedArr.push({ label: secondHour, value: secondHourPatient });
  completedArr.push({ label: sixHour, value: firstHourPatient });

  // Patients Discharge Per Hour
  // const dischargePatient = await EDR.find({
  //   status: 'pending',
  // });

  // Available ED Beds
  const EdBeds = await Room.find({
    availability: true,
  }).countDocuments();

  //   total Insured Patients
  const edrInsured = await EDR.find({
    paymentMethod: 'Insured',
  }).countDocuments();

  //   Total Un Insured Patients
  const edrUnInsured = await EDR.find({
    paymentMethod: 'Uninsured',
  }).countDocuments();

  const totalRegistrations = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Registration Officer' },
          { registrationStatus: 'completed' },
        ],
      },
    },
  ]);

  res.status(200).json({
    success: true,
    totalInsured: edrInsured,
    totalUnInsured: edrUnInsured,
    availableEdBeds: EdBeds,
    cumulativeRegistrations: totalRegistrations.length,
    registrationPerHour: completedArr,
    averageTAT: averageRegistrationTime,
    registeredPatients: patients.length,
  });
});

//Registration Officer Sensei Pending Dashboard
exports.roSenseiPending = asyncHandler(async (req, res, next) => {
  //   * Pending Registration After Sensei
  const pendingSensei = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Sensei' },
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: sixHour } },
          { 'processTime.processEndTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  const totalSenseiPending = pendingSensei.length;

  const averageSenseiRegisterTime = 360 / totalSenseiPending;

  // * Sensei Per Hour

  const arr = [];

  const sixthHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Sensei' },
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: lastHour } },
          { 'processTime.processEndTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  // arr.push({ label: lastHour, value: sixthHourPatient.length });
  arr.push({ label: lastHour, value: 5 });

  const fifthHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Sensei' },
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: fifthHour } },
          { 'processTime.processEndTime': { $lte: lastHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: fifthHour, value: fifthHourPatient.length });
  arr.push({ label: fifthHour, value: 4 });

  const fourthHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Sensei' },
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: fourthHour } },
          { 'processTime.processEndTime': { $lte: fifthHour } },
        ],
      },
    },
  ]);
  // arr.push({ label: fourthHour, value: fourthHourPatient.length });
  arr.push({ label: fourthHour, value: 10 });

  const thirdHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Sensei' },
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: thirdHour } },
          { 'processTime.processEndTime': { $lte: fourthHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: thirdHour, value: thirdHourPatient.length });
  arr.push({ label: thirdHour, value: 12 });

  const secondHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Sensei' },
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: secondHour } },
          { 'processTime.processEndTime': { $lte: thirdHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: secondHour, value: secondHourPatient.length });
  arr.push({ label: secondHour, value: 9 });

  const firstHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { 'processTime.processName': 'Sensei' },
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: sixHour } },
          { 'processTime.processEndTime': { $lte: secondHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: sixHour, value: firstHourPatient.length });
  arr.push({ label: sixHour, value: 1 });

  res.status(200).json({
    success: true,
    pendingRegistrationSensei: {
      averageTAT: averageSenseiRegisterTime,
      totalSenseiPending,
      senseiPerHour: arr,
    },
  });
});

//Registration All Pending Dashboard
exports.roTotalPending = asyncHandler(async (req, res, next) => {
  //   * Pending Registration After Sensei
  const totalPending = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: sixHour } },
          { 'processTime.processEndTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  const averageRegisterTime = 360 / totalPending.length;

  // * Sensei Per Hour

  const arr = [];

  const sixthHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: lastHour } },
          { 'processTime.processEndTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  // arr.push({ label: lastHour, value: sixthHourPatient.length });
  arr.push({ label: lastHour, value: 5 });

  const fifthHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: fifthHour } },
          { 'processTime.processEndTime': { $lte: lastHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: fifthHour, value: fifthHourPatient.length });
  arr.push({ label: fifthHour, value: 4 });

  const fourthHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: fourthHour } },
          { 'processTime.processEndTime': { $lte: fifthHour } },
        ],
      },
    },
  ]);
  // arr.push({ label: fourthHour, value: fourthHourPatient.length });
  arr.push({ label: fourthHour, value: 10 });

  const thirdHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: thirdHour } },
          { 'processTime.processEndTime': { $lte: fourthHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: thirdHour, value: thirdHourPatient.length });
  arr.push({ label: thirdHour, value: 12 });

  const secondHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: secondHour } },
          { 'processTime.processEndTime': { $lte: thirdHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: secondHour, value: secondHourPatient.length });
  arr.push({ label: secondHour, value: 9 });

  const firstHourPatient = await Patient.aggregate([
    {
      $project: {
        processTime: 1,
        registrationStatus: 1,
      },
    },
    {
      $unwind: '$processTime',
    },
    {
      $match: {
        $and: [
          { registrationStatus: 'pending' },
          { 'processTime.processStartTime': { $gte: sixHour } },
          { 'processTime.processEndTime': { $lte: secondHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: sixHour, value: firstHourPatient.length });
  arr.push({ label: sixHour, value: 1 });

  res.status(200).json({
    success: true,
    pendingRegistration: {
      averageTAT: averageRegisterTime,
      totalPending: totalPending.length,
      totalPerHour: arr,
    },
  });
});

// exports.roDischargePending = asyncHandler(async (req, res, next) => {
//   const discharge = await EDR.find({ status: 'pending' });

// });

// House Keeper Dashboard
exports.hkDashboard = asyncHandler(async (req, res, next) => {
  // Room Cleaning Pending
  const roomPending = await HKRequests.find({
    status: 'pending',
    $and: [
      { assignedTime: { $gte: sixHour } },
      { assignedTime: { $lte: currentTime } },
    ],
  }).countDocuments();

  const averageRoomTAT = 360 / roomPending;

  // Room Cleaning Completed
  const roomComplete = await HKRequests.find({
    status: 'completed',
    $and: [
      { completedAt: { $gte: sixHour } },
      { completedAt: { $lte: currentTime } },
    ],
  }).countDocuments();

  const averageCompleteRoomTAT = 360 / roomComplete;

  // Cumulative total Beds Cleaned
  const totalCleanedBeds = await HKRequests.find({
    status: 'completed',
    task: 'Cleaned',
  }).countDocuments();

  res.status(200).json({
    success: true,
    pendingRoom: {
      averageRoomTAT,
      totalPending: roomPending,
    },
    completeRoom: {
      averageCompleteRoomTAT,
      totalCompleted: roomComplete,
    },
    totalCleanedBeds,
  });
});

exports.hkRoomPending = asyncHandler(async (req, res, next) => {
  const arr = [];

  // Room Cleaning Pending
  const sixthHourRoom = await HKRequests.find({
    status: 'pending',
    $and: [
      { assignedTime: { $gte: lastHour } },
      { assignedTime: { $lte: currentTime } },
    ],
  }).countDocuments();

  // arr.push({ label: lastHour, value: sixthHourRoom });
  arr.push({ label: lastHour, value: 5 });

  const fifthHourRoom = await HKRequests.find({
    status: 'pending',
    $and: [
      { assignedTime: { $gte: fifthHour } },
      { assignedTime: { $lte: lastHour } },
    ],
  }).countDocuments();

  // arr.push({ label: fifthHour, value: fifthHourRoom });
  arr.push({ label: fifthHour, value: 4 });

  const fourthHourRoom = await HKRequests.find({
    status: 'pending',
    $and: [
      { assignedTime: { $gte: fourthHour } },
      { assignedTime: { $lte: fifthHour } },
    ],
  }).countDocuments();

  // arr.push({ label: fourthHour, value: fourthHourRoom });
  arr.push({ label: fourthHour, value: 10 });

  const thirdHourRoom = await HKRequests.find({
    status: 'pending',
    $and: [
      { assignedTime: { $gte: thirdHour } },
      { assignedTime: { $lte: fourthHour } },
    ],
  }).countDocuments();

  // arr.push({ label: thirdHour, value: thirdHourRoom });
  arr.push({ label: thirdHour, value: 12 });

  const secondHourRoom = await HKRequests.find({
    status: 'pending',
    $and: [
      { assignedTime: { $gte: secondHour } },
      { assignedTime: { $lte: thirdHour } },
    ],
  }).countDocuments();

  // arr.push({ label: secondHour, value: secondHourRoom });
  arr.push({ label: secondHour, value: 9 });

  const firstHourRoom = await HKRequests.find({
    status: 'pending',
    $and: [
      { assignedTime: { $gte: sixHour } },
      { assignedTime: { $lte: secondHour } },
    ],
  }).countDocuments();

  // arr.push({ label: sixHour, value: firstHourRoom });
  arr.push({ label: sixHour, value: 1 });

  res.status(200).json({
    success: true,
    cleaningPerHour: arr,
  });
});

// Anesthesiologist Dashboard
exports.anesthesiologistDashboard = asyncHandler(async (req, res, next) => {
  const pending = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'pending' },
          { 'anesthesiologistNote.noteTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  const completed = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'complete' },
          { 'anesthesiologistNote.completionTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let time = 0;
  completed.map((p) => {
    p.noteTime = new Date(p.anesthesiologistNote.noteTime);
    p.completionTime = new Date(p.anesthesiologistNote.completionTime);
    p.t = Math.round(
      (p.completionTime.getTime() - p.noteTime.getTime()) / (1000 * 60)
    );
    time += p.t;
  });
  const pendingTat = time / completed.length;

  const pendingArr = [];
  // * Per Hour Notes
  const sixthHourNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'pending' },
          { 'anesthesiologistNote.noteTime': { $gte: lastHour } },
          { 'anesthesiologistNote.noteTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  pendingArr.push({ label: lastHour, value: sixthHourNote.length });

  const fifthHourNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'pending' },
          { 'anesthesiologistNote.noteTime': { $gte: fifthHour } },
          { 'anesthesiologistNote.noteTime': { $lte: lastHour } },
        ],
      },
    },
  ]);
  pendingArr.push({ label: fifthHour, value: fifthHourNote.length });

  const fourthHourNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'pending' },
          { 'anesthesiologistNote.noteTime': { $gte: fourthHour } },
          { 'anesthesiologistNote.noteTime': { $lte: fifthHour } },
        ],
      },
    },
  ]);
  pendingArr.push({ label: fourthHour, value: fourthHourNote.length });

  const thirdHourNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'pending' },
          { 'anesthesiologistNote.noteTime': { $gte: thirdHour } },
          { 'anesthesiologistNote.noteTime': { $lte: fourthHour } },
        ],
      },
    },
  ]);
  pendingArr.push({ label: thirdHour, value: thirdHourNote.length });

  const secondHourNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'pending' },
          { 'anesthesiologistNote.noteTime': { $gte: secondHour } },
          { 'anesthesiologistNote.noteTime': { $lte: thirdHour } },
        ],
      },
    },
  ]);
  pendingArr.push({ label: secondHour, value: secondHourNote.length });

  const firstHourNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'pending' },
          { 'anesthesiologistNote.noteTime': { $gte: sixHour } },
          { 'anesthesiologistNote.noteTime': { $lte: secondHour } },
        ],
      },
    },
  ]);
  pendingArr.push({ label: sixHour, value: firstHourNote.length });

  // Requests In ED

  const totalED = await EDR.find({
    currentLocation: 'ED',
    $or: [
      {
        $and: [
          { 'anesthesiologistNote.noteTime': { $gte: sixHour } },
          { 'anesthesiologistNote.noteTime': { $lte: currentTime } },
        ],
      },
      {
        $and: [
          { 'anesthesiologistNote.completionTime': { $gte: sixHour } },
          {
            'anesthesiologistNote.completionTime': {
              $lte: currentTime,
            },
          },
        ],
      },
    ],
  });

  const EdCompleted = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'ED' },
          { 'anesthesiologistNote.status': 'complete' },
          { 'anesthesiologistNote.completionTime': { $gte: sixHour } },
          { 'anesthesiologistNote.completionTime': { $lte: currentTime } },
        ],
      },
    },
  ]);
  let EdTime = 0;
  EdCompleted.map((p) => {
    p.noteTime = new Date(p.anesthesiologistNote.noteTime);
    p.completionTime = new Date(p.anesthesiologistNote.completionTime);
    p.t = Math.round(
      (p.completionTime.getTime() - p.noteTime.getTime()) / (1000 * 60)
    );
    EdTime += p.t;
  });

  const EDTAT = EdTime / EdCompleted.length;

  const EDArr = [];
  // console.log(EDArr);
  // * Per Hour Note
  const sixthHourEDNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'ED',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: lastHour } },
              { 'anesthesiologistNote.noteTime': { $lte: currentTime } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: lastHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: currentTime,
                },
              },
            ],
          },
        ],
      },
    },
  ]);

  EDArr.push({ label: lastHour, value: sixthHourEDNote.length });

  const fifthHourEDNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'ED',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: fifthHour } },
              { 'anesthesiologistNote.noteTime': { $lte: lastHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: fifthHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: lastHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);
  // console.log(fifthHourEDNote);
  EDArr.push({ label: fifthHour, value: fifthHourEDNote.length });

  const fourthHourEDNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'ED',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: fourthHour } },
              { 'anesthesiologistNote.noteTime': { $lte: fifthHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: fourthHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: fifthHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);
  // console.log(fourthHourEDNote);
  EDArr.push({ label: fourthHour, value: fourthHourEDNote.length });

  const thirdHourEDNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'ED',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: thirdHour } },
              { 'anesthesiologistNote.noteTime': { $lte: fourthHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: thirdHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: fourthHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);

  EDArr.push({ label: thirdHour, value: thirdHourEDNote.length });

  const secondHourEDNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'ED',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: secondHour } },
              { 'anesthesiologistNote.noteTime': { $lte: thirdHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: secondHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: thirdHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);

  EDArr.push({ label: secondHour, value: secondHourEDNote.length });

  const firstHourEDNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'ED',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: sixHour } },
              { 'anesthesiologistNote.noteTime': { $lte: secondHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: sixHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: secondHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);

  EDArr.push({ label: sixHour, value: firstHourEDNote.length });

  // Requests in EOU

  const totalEOU = await EDR.find({
    currentLocation: 'EOU',
    $or: [
      {
        $and: [
          { 'anesthesiologistNote.noteTime': { $gte: sixHour } },
          { 'anesthesiologistNote.noteTime': { $lte: currentTime } },
        ],
      },
      {
        $and: [
          { 'anesthesiologistNote.completionTime': { $gte: sixHour } },
          {
            'anesthesiologistNote.completionTime': {
              $lte: currentTime,
            },
          },
        ],
      },
    ],
  });

  const EOUCompleted = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
          { 'anesthesiologistNote.status': 'complete' },
          { 'anesthesiologistNote.completionTime': { $gte: sixHour } },
          { 'anesthesiologistNote.completionTime': { $lte: currentTime } },
        ],
      },
    },
  ]);
  let EOUTime = 0;
  EOUCompleted.map((p) => {
    p.noteTime = new Date(p.anesthesiologistNote.noteTime);
    p.completionTime = new Date(p.anesthesiologistNote.completionTime);
    p.t = Math.round(
      (p.completionTime.getTime() - p.noteTime.getTime()) / (1000 * 60)
    );
    EOUTime += p.t;
  });

  const EOUTAT = EOUTime / EOUCompleted.length;

  const EOU = [];
  // console.log(EOU);
  // * Per Hour Note
  const sixthHourEOUNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'EOU',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: lastHour } },
              { 'anesthesiologistNote.noteTime': { $lte: currentTime } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: lastHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: currentTime,
                },
              },
            ],
          },
        ],
      },
    },
  ]);

  EOU.push({ label: lastHour, value: sixthHourEOUNote.length });

  const fifthHourEOUNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'EOU',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: fifthHour } },
              { 'anesthesiologistNote.noteTime': { $lte: lastHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: fifthHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: lastHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);
  // console.log(fifthHourEOUNote);
  EOU.push({ label: fifthHour, value: fifthHourEOUNote.length });

  const fourthHourEOUNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'EOU',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: fourthHour } },
              { 'anesthesiologistNote.noteTime': { $lte: fifthHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: fourthHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: fifthHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);
  // console.log(fourthHourEOUNote);
  EOU.push({ label: fourthHour, value: fourthHourEOUNote.length });

  const thirdHourEOUNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'EOU',
      },
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: thirdHour } },
              { 'anesthesiologistNote.noteTime': { $lte: fourthHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: thirdHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: fourthHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);

  EOU.push({ label: thirdHour, value: thirdHourEOUNote.length });

  const secondHourEOUNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'EOU',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: secondHour } },
              { 'anesthesiologistNote.noteTime': { $lte: thirdHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: secondHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: thirdHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);

  EOU.push({ label: secondHour, value: secondHourEOUNote.length });

  const firstHourEOUNote = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        currentLocation: 'EOU',
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $or: [
          {
            $and: [
              { 'anesthesiologistNote.noteTime': { $gte: sixHour } },
              { 'anesthesiologistNote.noteTime': { $lte: secondHour } },
            ],
          },
          {
            $and: [
              { 'anesthesiologistNote.completionTime': { $gte: sixHour } },
              {
                'anesthesiologistNote.completionTime': {
                  $lte: secondHour,
                },
              },
            ],
          },
        ],
      },
    },
  ]);

  EOU.push({ label: sixHour, value: firstHourEOUNote.length });

  // * 4th Card
  const completedTasks = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [
          { 'anesthesiologistNote.status': 'complete' },
          { 'anesthesiologistNote.completionTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  const completedArr = [];
  let sixthHourPatient = 0;
  let fifthHourPatient = 0;
  let fourthHourPatient = 0;
  let thirdHourPatient = 0;
  let secondHourPatient = 0;
  let firstHourPatient = 0;
  completedTasks.map((t) => {
    if (
      t.anesthesiologistNote.completionTime > lastHour &&
      t.anesthesiologistNote.completionTime < currentTime
    ) {
      sixthHourPatient++;
      // console.log('sixthHourPatient', sixthHourPatient);
    } else if (
      t.anesthesiologistNote.completionTime > fifthHour &&
      t.anesthesiologistNote.completionTime < lastHour
    ) {
      fifthHourPatient++;
    } else if (
      t.anesthesiologistNote.completionTime > fourthHour &&
      t.anesthesiologistNote.completionTime < fifthHour
    ) {
      fourthHourPatient++;
    } else if (
      t.anesthesiologistNote.completionTime > thirdHour &&
      t.anesthesiologistNote.completionTime < fourthHour
    ) {
      thirdHourPatient++;
    } else if (
      t.anesthesiologistNote.completionTime > secondHour &&
      t.anesthesiologistNote.completionTime < thirdHour
    ) {
      secondHourPatient++;
    } else if (
      t.anesthesiologistNote.completionTime > sixHour &&
      t.anesthesiologistNote.completionTime < secondHour
    ) {
      firstHourPatient++;
    }
  });
  completedArr.push({ label: lastHour, value: sixthHourPatient });
  completedArr.push({ label: fifthHour, value: fifthHourPatient });
  completedArr.push({ label: fourthHour, value: fourthHourPatient });
  completedArr.push({ label: thirdHour, value: thirdHourPatient });
  completedArr.push({ label: secondHour, value: secondHourPatient });
  completedArr.push({ label: sixHour, value: firstHourPatient });

  const cumulativeRequestsCompleted = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        'anesthesiologistNote.status': 'complete',
      },
    },
  ]);

  res.status(200).json({
    success: true,
    totalRequests: {
      pendingTat,
      totalPending: pending.length,
      totalRequestPerHour: pendingArr,
    },
    requestsInED: {
      requestToCompletion: EDTAT,
      totalED: totalED.length,
      requestsPerHour: EDArr,
    },
    requestsInEOU: {
      requestToCompletion: EOUTAT,
      totalED: totalEOU.length,
      requestsPerHour: EOU,
    },
    completedTask: {
      requestToCompletion: 0,
      totalCompleted: completedTasks.length,
      requestsPerHour: completedArr,
    },

    cumulativeRequestsCompleted: cumulativeRequestsCompleted.length,
  });
});

exports.senseiDashboard = asyncHandler(async (req, res, next) => {
  // Available ED Beds
  const EdBeds = await Room.find({
    availability: true,
  }).countDocuments();

  // Patient Assignments to PA Pending
  const patientPending = await EDR.find({
    status: 'pending',
    chiefComplaint: { $eq: [] },
    $and: [
      { createdTimeStamp: { $gte: sixHour } },
      { createdTimeStamp: { $lte: currentTime } },
    ],
  }).countDocuments();

  const tat = await EDR.find({
    status: 'pending',
    chiefComplaint: { $ne: [] },
    $and: [
      { createdTimeStamp: { $gte: sixHour } },
      { createdTimeStamp: { $lte: currentTime } },
    ],
  });
  // console.log(tat[0].chiefComplaint);

  const time = tat.map((t) => {
    const ccTime = new Date(
      t.chiefComplaint[t.chiefComplaint.length - 1].assignedTime
    );

    const createTime = new Date(t.createdTimeStamp);
    Math.ceil(ccTime.getTime() - createTime.getTime() / (1000 * 60));
  });

  // const registerToAssign = tat.chiefComplaint(chiefComplaint)

  res.status(200).json({
    success: true,
    availableEdBeds: EdBeds,
    patientAssignmentsPending: patientPending,
  });
});

exports.edDoctorDashboard = asyncHandler(async (req, res, next) => {
  const diagnosesPending = await EDR.find({
    status: 'pending',
    doctorNotes: { $eq: [] },
    dcdForm: {
      $elemMatch: { 'triageAssessment.triageTime': { $gte: sixHour } },
    },
  });

  const completedArr = [];
  let sixthHourPatient = 0;
  let fifthHourPatient = 0;
  let fourthHourPatient = 0;
  let thirdHourPatient = 0;
  let secondHourPatient = 0;
  let firstHourPatient = 0;
  diagnosesPending.map((p) => {
    if (
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
        lastHour &&
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime <
        currentTime
    ) {
      sixthHourPatient++;
      // console.log('sixthHourPatient', sixthHourPatient);
    } else if (
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
        fifthHour &&
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime < lastHour
    ) {
      fifthHourPatient++;
    } else if (
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
        fourthHour &&
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime < fifthHour
    ) {
      fourthHourPatient++;
    } else if (
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
        thirdHour &&
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime <
        fourthHour
    ) {
      thirdHourPatient++;
    } else if (
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
        secondHour &&
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime < thirdHour
    ) {
      secondHourPatient++;
    } else if (
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
        sixHour &&
      p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime <
        secondHour
    ) {
      firstHourPatient++;
    }
  });
  completedArr.push({ label: lastHour, value: sixthHourPatient });
  completedArr.push({ label: fifthHour, value: fifthHourPatient });
  completedArr.push({ label: fourthHour, value: fourthHourPatient });
  completedArr.push({ label: thirdHour, value: thirdHourPatient });
  completedArr.push({ label: secondHour, value: secondHourPatient });
  completedArr.push({ label: sixHour, value: firstHourPatient });

  const triageTAT = await EDR.find({
    status: 'pending',
    doctorNotes: { $ne: [] },
    dcdForm: { $elemMatch: { triageAssessment: { $ne: [] } } },
    'doctorNotes.assignedTime': { $gte: sixHour },
    // $and: [

    //   { 'doctorNotes.assignedTime': { $lte: currentTime } },
    // ],
  });

  let time = 0;
  triageTAT.map((t) => {
    t.triageTime = new Date(
      t.dcdForm[t.dcdForm.length - 1].triageAssessment[0].triageTime
    );

    t.noteTime = new Date(t.doctorNotes[0].assignedTime);

    t.time = Math.round(
      (t.noteTime.getTime() - t.triageTime.getTime()) / (1000 * 60)
    );
    time += t.time;
  });

  const TAT = time / triageTAT.length;

  // * 2nd Card
  const decisionPending = await EDR.aggregate([
    {
      $project: {
        status: 1,
        doctorNotes: 1,
        careStream: 1,
      },
    },
    {
      $match: {
        $and: [{ careStream: { $eq: [] } }, { doctorNotes: { $ne: [] } }],
      },
    },
    {
      $unwind: '$doctorNotes',
    },
    {
      $match: {
        'doctorNotes.assignedTime': { $gte: sixHour },
      },
    },
  ]);

  const decisionArr = [];
  let sixthHourDecision = 0;
  let fifthHourDecision = 0;
  let fourthHourDecision = 0;
  let thirdHourDecision = 0;
  let secondHourDecision = 0;
  let firstHourDecision = 0;
  decisionPending.map((p) => {
    if (
      p.doctorNotes.assignedTime > lastHour &&
      p.doctorNotes.assignedTime < currentTime
    ) {
      sixthHourDecision++;
      // console.log('sixthHourDecision', sixthHourDecision);
    } else if (
      p.doctorNotes.assignedTime > fifthHour &&
      p.doctorNotes.assignedTime < lastHour
    ) {
      fifthHourDecision++;
    } else if (
      p.doctorNotes.assignedTime > fourthHour &&
      p.doctorNotes.assignedTime < fifthHour
    ) {
      fourthHourDecision++;
    } else if (
      p.doctorNotes.assignedTime > thirdHour &&
      p.doctorNotes.assignedTime < fourthHour
    ) {
      thirdHourDecision++;
    } else if (
      p.doctorNotes.assignedTime > secondHour &&
      p.doctorNotes.assignedTime < thirdHour
    ) {
      secondHourDecision++;
    } else if (
      p.doctorNotes.assignedTime > sixHour &&
      p.doctorNotes.assignedTime < secondHour
    ) {
      firstHourDecision++;
    }
  });
  decisionArr.push({ label: lastHour, value: sixthHourDecision });
  decisionArr.push({ label: fifthHour, value: fifthHourDecision });
  decisionArr.push({ label: fourthHour, value: fourthHourDecision });
  decisionArr.push({ label: thirdHour, value: thirdHourDecision });
  decisionArr.push({ label: secondHour, value: secondHourDecision });
  decisionArr.push({ label: sixHour, value: firstHourDecision });

  const decisionCompleted = await EDR.aggregate([
    {
      $project: {
        status: 1,
        doctorNotes: 1,
        careStream: 1,
      },
    },
    {
      $match: {
        $and: [{ careStream: { $ne: [] } }, { doctorNotes: { $ne: [] } }],
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: {
        'careStream.assignedTime': { $gte: sixHour },
      },
    },
  ]);

  let decisionTime = 0;
  decisionCompleted.map((t) => {
    t.noteTime = new Date(t.doctorNotes[0].assignedTime);

    t.careStreamTime = new Date(t.careStream.assignedTime);

    t.time = Math.round(
      (t.careStreamTime.getTime() - t.noteTime.getTime()) / (1000 * 60)
    );
    decisionTime += t.time;
  });

  const decisionTAT = decisionTime / decisionCompleted.length;

  // * 3rd Card
  const dischargePending = await EDR.find({
    status: 'Discharged',
    socialWorkerStatus: 'pending',
    dischargeTimestamp: { $gte: sixHour },
  });

  const DischargeArr = [];
  let sixthHourDischarge = 0;
  let fifthHourDischarge = 0;
  let fourthHourDischarge = 0;
  let thirdHourDischarge = 0;
  let secondHourDischarge = 0;
  let firstHourDischarge = 0;
  dischargePending.map((d) => {
    if (d.dischargeTimestamp > lastHour && d.dischargeTimestamp < currentTime) {
      sixthHourDischarge++;
    } else if (
      d.dischargeTimestamp > fifthHour &&
      d.dischargeTimestamp < lastHour
    ) {
      fifthHourDischarge++;
    } else if (
      d.dischargeTimestamp > fourthHour &&
      d.dischargeTimestamp < fifthHour
    ) {
      fourthHourDischarge++;
    } else if (
      d.dischargeTimestamp > thirdHour &&
      d.dischargeTimestamp < fourthHour
    ) {
      thirdHourDischarge++;
    } else if (
      d.dischargeTimestamp > secondHour &&
      d.dischargeTimestamp < thirdHour
    ) {
      secondHourDischarge++;
    } else if (
      d.dischargeTimestamp > sixHour &&
      d.dischargeTimestamp < secondHour
    ) {
      firstHourDischarge++;
    }
  });
  DischargeArr.push({ label: lastHour, value: sixthHourDischarge });
  DischargeArr.push({ label: fifthHour, value: fifthHourDischarge });
  DischargeArr.push({ label: fourthHour, value: fourthHourDischarge });
  DischargeArr.push({ label: thirdHour, value: thirdHourDischarge });
  DischargeArr.push({ label: secondHour, value: secondHourDischarge });
  DischargeArr.push({ label: sixHour, value: firstHourDischarge });

  const dischargeCompleted = await EDR.find({
    status: 'Discharged',
    socialWorkerStatus: 'completed',
    'survey.0.surveyTime': { $gte: sixHour },
  });

  let dischargeTime = 0;
  dischargeCompleted.map((t) => {
    t.dischargeStart = new Date(t.dischargeTimestamp);

    t.dischargeEnd = new Date(t.survey[0].surveyTime);

    t.time = Math.round(
      (t.dischargeEnd.getTime() - t.dischargeStart.getTime()) / (1000 * 60)
    );
    dischargeTime += t.time;
  });

  const dischargeTAT = dischargeTime / dischargeCompleted.length;

  //* 4th Card
  const consultantNotes = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        status: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        $and: [
          { status: 'pending' },
          {
            'consultationNote.status': 'pending',
          },
          {
            'consultationNote.noteTime': { $gte: sixHour },
          },
          {
            'consultationNote.noteTime': { $lte: currentTime },
          },
        ],
      },
    },
  ]);

  const fourthCardArr = [];
  let sixthHourNote = 0;
  let fifthHourNote = 0;
  let fourthHourNote = 0;
  let thirdHourNote = 0;
  let secondHourNote = 0;
  let firstHourNote = 0;
  consultantNotes.map((n) => {
    if (
      n.consultationNote.noteTime > lastHour &&
      n.consultationNote.noteTime < currentTime
    ) {
      sixthHourNote++;
      // console.log('sixthHourNote', sixthHourNote);
    } else if (
      n.consultationNote.noteTime > fifthHour &&
      n.consultationNote.noteTime < lastHour
    ) {
      fifthHourNote++;
    } else if (
      n.consultationNote.noteTime > fourthHour &&
      n.consultationNote.noteTime < fifthHour
    ) {
      fourthHourNote++;
    } else if (
      n.consultationNote.noteTime > thirdHour &&
      n.consultationNote.noteTime < fourthHour
    ) {
      thirdHourNote++;
    } else if (
      n.consultationNote.noteTime > secondHour &&
      n.consultationNote.noteTime < thirdHour
    ) {
      secondHourNote++;
    } else if (
      n.consultationNote.noteTime > sixHour &&
      n.consultationNote.noteTime < secondHour
    ) {
      firstHourNote++;
    }
  });
  fourthCardArr.push({ label: lastHour, value: sixthHourNote });
  fourthCardArr.push({ label: fifthHour, value: fifthHourNote });
  fourthCardArr.push({ label: fourthHour, value: fourthHourNote });
  fourthCardArr.push({ label: thirdHour, value: thirdHourNote });
  fourthCardArr.push({ label: secondHour, value: secondHourNote });
  fourthCardArr.push({ label: sixHour, value: firstHourNote });

  // tat
  const consultantCompletedNotes = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        status: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        $and: [
          { status: 'pending' },
          {
            'consultationNote.status': 'complete',
          },
          {
            'consultationNote.noteTime': { $gte: sixHour },
          },
          {
            'consultationNote.noteTime': { $lte: currentTime },
          },
        ],
      },
    },
  ]);

  let completed = 0;
  consultantCompletedNotes.map((t) => {
    t.noteStart = new Date(t.consultationNote.noteTime);

    t.noteEnd = new Date(t.consultationNote.completionDate);

    t.time = Math.round(
      (t.noteEnd.getTime() - t.noteStart.getTime()) / (1000 * 60)
    );
    completed += t.time;
  });

  const completedNoteTAT = completed / consultantCompletedNotes.length;

  // * 5th Card
  const labPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': { $ne: 'completed' } },
          { 'labRequest.requestedAt': { $gte: sixHour } },
        ],
      },
    },
  ]);

  // console.log(labPending);

  const fifthCardArr = [];
  let sixthHourLab = 0;
  let fifthHourLab = 0;
  let fourthHourLab = 0;
  let thirdHourLab = 0;
  let secondHourLab = 0;
  let firstHourLab = 0;
  labPending.map((l) => {
    if (
      l.labRequest.requestedAt > lastHour &&
      l.labRequest.requestedAt < currentTime
    ) {
      sixthHourLab++;
      // console.log('sixthHourLab', sixthHourLab);
    } else if (
      l.labRequest.requestedAt > fifthHour &&
      l.labRequest.requestedAt < lastHour
    ) {
      fifthHourLab++;
    } else if (
      l.labRequest.requestedAt > fourthHour &&
      l.labRequest.requestedAt < fifthHour
    ) {
      fourthHourLab++;
    } else if (
      l.labRequest.requestedAt > thirdHour &&
      l.labRequest.requestedAt < fourthHour
    ) {
      thirdHourLab++;
    } else if (
      l.labRequest.requestedAt > secondHour &&
      l.labRequest.requestedAt < thirdHour
    ) {
      secondHourLab++;
    } else if (
      l.labRequest.requestedAt > sixHour &&
      l.labRequest.requestedAt < secondHour
    ) {
      firstHourLab++;
    }
  });
  fifthCardArr.push({ label: lastHour, value: sixthHourLab });
  fifthCardArr.push({ label: fifthHour, value: fifthHourLab });
  fifthCardArr.push({ label: fourthHour, value: fourthHourLab });
  fifthCardArr.push({ label: thirdHour, value: thirdHourLab });
  fifthCardArr.push({ label: secondHour, value: secondHourLab });
  fifthCardArr.push({ label: sixHour, value: firstHourLab });

  // TAT
  const labCompleted = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': 'completed' },
          { 'labRequest.completeTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let labTime = 0;
  labCompleted.map((t) => {
    t.labStart = new Date(t.labRequest.requestedAt);

    t.labEnd = new Date(t.labRequest.completeTime);

    t.time = Math.round(
      (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
    );
    labTime += t.time;
  });

  const completedLabTAT = labTime / labCompleted.length;

  // current no of patients per doctor
  const totalPatients = await EDR.find({
    doctorNotes: { $ne: [] },
    status: 'pending',
  });

  res.status(200).json({
    success: true,
    // firstCard: {
    //   TAT,
    //   totalPending: diagnosesPending.length,
    //   perHour: completedArr,
    // },
    // secondCard: {
    //   TAT: decisionTAT,
    //   totalPending: decisionPending.length,
    //   perHour: decisionArr,
    // },
    thirdCard: {
      TAT: dischargeTAT,
      totalPending: dischargePending.length,
      perHour: DischargeArr,
    },
    // fourthCard: {
    //   TAT: completedNoteTAT,
    //   totalPending: consultantNotes.length,
    //   perHour: fourthCardArr,
    // },
    // fifthCard: {
    //   TAT: completedLabTAT,
    //   totalPending: labPending.length,
    //   perHour: fifthCardArr,
    // },
  });
});

exports.externalConsultantDB = asyncHandler(async (req, res, next) => {
  const pendingConsultation = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        status: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        $and: [
          { status: 'pending' },
          {
            'consultationNote.status': 'pending',
          },
          {
            'consultationNote.consultationType': 'External',
          },
          {
            'consultationNote.noteTime': { $gte: sixHour },
          },
          {
            'consultationNote.noteTime': { $lte: currentTime },
          },
        ],
      },
    },
  ]);

  const pendingArr = [];
  let sixthHourNote = 0;
  let fifthHourNote = 0;
  let fourthHourNote = 0;
  let thirdHourNote = 0;
  let secondHourNote = 0;
  let firstHourNote = 0;
  pendingConsultation.map((n) => {
    if (
      n.consultationNote.noteTime > lastHour &&
      n.consultationNote.noteTime < currentTime
    ) {
      sixthHourNote++;
      // console.log('sixthHourNote', sixthHourNote);
    } else if (
      n.consultationNote.noteTime > fifthHour &&
      n.consultationNote.noteTime < lastHour
    ) {
      fifthHourNote++;
    } else if (
      n.consultationNote.noteTime > fourthHour &&
      n.consultationNote.noteTime < fifthHour
    ) {
      fourthHourNote++;
    } else if (
      n.consultationNote.noteTime > thirdHour &&
      n.consultationNote.noteTime < fourthHour
    ) {
      thirdHourNote++;
    } else if (
      n.consultationNote.noteTime > secondHour &&
      n.consultationNote.noteTime < thirdHour
    ) {
      secondHourNote++;
    } else if (
      n.consultationNote.noteTime > sixHour &&
      n.consultationNote.noteTime < secondHour
    ) {
      firstHourNote++;
    }
  });
  pendingArr.push({ label: lastHour, value: sixthHourNote });
  pendingArr.push({ label: fifthHour, value: fifthHourNote });
  pendingArr.push({ label: fourthHour, value: fourthHourNote });
  pendingArr.push({ label: thirdHour, value: thirdHourNote });
  pendingArr.push({ label: secondHour, value: secondHourNote });
  pendingArr.push({ label: sixHour, value: firstHourNote });

  // tat
  const consultantCompletedNotes = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        status: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        $and: [
          {
            'consultationNote.status': 'complete',
          },
          {
            'consultationNote.consultationType': 'External',
          },
          {
            'consultationNote.noteTime': { $gte: sixHour },
          },
          {
            'consultationNote.noteTime': { $lte: currentTime },
          },
        ],
      },
    },
  ]);

  // Follow Ups Per Hour
  const completedArr = [];
  let sixthHourcompletedNote = 0;
  let fifthHourcompletedNote = 0;
  let fourthHourcompletedNote = 0;
  let thirdHourcompletedNote = 0;
  let secondHourcompletedNote = 0;
  let firstHourcompletedNote = 0;
  consultantCompletedNotes.map((n) => {
    if (
      n.consultationNote.completionDate > lastHour &&
      n.consultationNote.completionDate < currentTime
    ) {
      sixthHourcompletedNote++;
      // console.log('sixthHourcompletedNote', sixthHourcompletedNote);
    } else if (
      n.consultationNote.completionDate > fifthHour &&
      n.consultationNote.completionDate < lastHour
    ) {
      fifthHourcompletedNote++;
    } else if (
      n.consultationNote.completionDate > fourthHour &&
      n.consultationNote.completionDate < fifthHour
    ) {
      fourthHourcompletedNote++;
    } else if (
      n.consultationNote.completionDate > thirdHour &&
      n.consultationNote.completionDate < fourthHour
    ) {
      thirdHourcompletedNote++;
    } else if (
      n.consultationNote.completionDate > secondHour &&
      n.consultationNote.completionDate < thirdHour
    ) {
      secondHourcompletedNote++;
    } else if (
      n.consultationNote.completionDate > sixHour &&
      n.consultationNote.completionDate < secondHour
    ) {
      firstHourcompletedNote++;
    }
  });
  completedArr.push({ label: lastHour, value: sixthHourcompletedNote });
  completedArr.push({ label: fifthHour, value: fifthHourcompletedNote });
  completedArr.push({ label: fourthHour, value: fourthHourcompletedNote });
  completedArr.push({ label: thirdHour, value: thirdHourcompletedNote });
  completedArr.push({ label: secondHour, value: secondHourcompletedNote });
  completedArr.push({ label: sixHour, value: firstHourcompletedNote });

  let completed = 0;
  consultantCompletedNotes.map((t) => {
    t.noteStart = new Date(t.consultationNote.noteTime);

    t.noteEnd = new Date(t.consultationNote.completionDate);

    t.time = Math.round(
      (t.noteEnd.getTime() - t.noteStart.getTime()) / (1000 * 60)
    );
    completed += t.time;
  });

  const cumulativePatientSeen = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        $and: [
          {
            'consultationNote.status': 'complete',
          },
          {
            'consultationNote.consultationType': 'External',
          },
        ],
      },
    },
  ]);

  const completedNoteTAT = completed / consultantCompletedNotes.length;
  const consultedPerHour = Math.round(consultantCompletedNotes.length / 6);
  res.status(200).json({
    success: true,
    firstCard: {
      TAT: completedNoteTAT,
      totalPending: pendingConsultation.length,
      perHour: pendingArr,
    },
    secondCard: {
      TAT: completedNoteTAT,
      totalFollowUps: consultantCompletedNotes.length,
      perHour: completedArr,
    },
    consultedPerHour,
    cumulativePatientSeen: cumulativePatientSeen.length,
  });
});

exports.internalConsultantDB = asyncHandler(async (req, res, next) => {
  const pendingConsultation = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        status: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        $and: [
          { status: 'pending' },
          {
            'consultationNote.status': 'pending',
          },
          {
            'consultationNote.consultationType': 'Internal',
          },
          {
            'consultationNote.noteTime': { $gte: sixHour },
          },
          {
            'consultationNote.noteTime': { $lte: currentTime },
          },
        ],
      },
    },
  ]);

  const pendingArr = [];
  let sixthHourNote = 0;
  let fifthHourNote = 0;
  let fourthHourNote = 0;
  let thirdHourNote = 0;
  let secondHourNote = 0;
  let firstHourNote = 0;
  pendingConsultation.map((n) => {
    if (
      n.consultationNote.noteTime > lastHour &&
      n.consultationNote.noteTime < currentTime
    ) {
      sixthHourNote++;
      // console.log('sixthHourNote', sixthHourNote);
    } else if (
      n.consultationNote.noteTime > fifthHour &&
      n.consultationNote.noteTime < lastHour
    ) {
      fifthHourNote++;
    } else if (
      n.consultationNote.noteTime > fourthHour &&
      n.consultationNote.noteTime < fifthHour
    ) {
      fourthHourNote++;
    } else if (
      n.consultationNote.noteTime > thirdHour &&
      n.consultationNote.noteTime < fourthHour
    ) {
      thirdHourNote++;
    } else if (
      n.consultationNote.noteTime > secondHour &&
      n.consultationNote.noteTime < thirdHour
    ) {
      secondHourNote++;
    } else if (
      n.consultationNote.noteTime > sixHour &&
      n.consultationNote.noteTime < secondHour
    ) {
      firstHourNote++;
    }
  });
  pendingArr.push({ label: lastHour, value: sixthHourNote });
  pendingArr.push({ label: fifthHour, value: fifthHourNote });
  pendingArr.push({ label: fourthHour, value: fourthHourNote });
  pendingArr.push({ label: thirdHour, value: thirdHourNote });
  pendingArr.push({ label: secondHour, value: secondHourNote });
  pendingArr.push({ label: sixHour, value: firstHourNote });

  // tat
  const consultantCompletedNotes = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
        status: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        $and: [
          {
            'consultationNote.status': 'complete',
          },
          {
            'consultationNote.consultationType': 'Internal',
          },
          {
            'consultationNote.noteTime': { $gte: sixHour },
          },
          {
            'consultationNote.noteTime': { $lte: currentTime },
          },
        ],
      },
    },
  ]);

  // Follow Ups Per Hour
  const completedArr = [];
  let sixthHourcompletedNote = 0;
  let fifthHourcompletedNote = 0;
  let fourthHourcompletedNote = 0;
  let thirdHourcompletedNote = 0;
  let secondHourcompletedNote = 0;
  let firstHourcompletedNote = 0;
  consultantCompletedNotes.map((n) => {
    if (
      n.consultationNote.completionDate > lastHour &&
      n.consultationNote.completionDate < currentTime
    ) {
      sixthHourcompletedNote++;
      // console.log('sixthHourcompletedNote', sixthHourcompletedNote);
    } else if (
      n.consultationNote.completionDate > fifthHour &&
      n.consultationNote.completionDate < lastHour
    ) {
      fifthHourcompletedNote++;
    } else if (
      n.consultationNote.completionDate > fourthHour &&
      n.consultationNote.completionDate < fifthHour
    ) {
      fourthHourcompletedNote++;
    } else if (
      n.consultationNote.completionDate > thirdHour &&
      n.consultationNote.completionDate < fourthHour
    ) {
      thirdHourcompletedNote++;
    } else if (
      n.consultationNote.completionDate > secondHour &&
      n.consultationNote.completionDate < thirdHour
    ) {
      secondHourcompletedNote++;
    } else if (
      n.consultationNote.completionDate > sixHour &&
      n.consultationNote.completionDate < secondHour
    ) {
      firstHourcompletedNote++;
    }
  });
  completedArr.push({ label: lastHour, value: sixthHourcompletedNote });
  completedArr.push({ label: fifthHour, value: fifthHourcompletedNote });
  completedArr.push({ label: fourthHour, value: fourthHourcompletedNote });
  completedArr.push({ label: thirdHour, value: thirdHourcompletedNote });
  completedArr.push({ label: secondHour, value: secondHourcompletedNote });
  completedArr.push({ label: sixHour, value: firstHourcompletedNote });

  let completed = 0;
  consultantCompletedNotes.map((t) => {
    t.noteStart = new Date(t.consultationNote.noteTime);

    t.noteEnd = new Date(t.consultationNote.completionDate);

    t.time = Math.round(
      (t.noteEnd.getTime() - t.noteStart.getTime()) / (1000 * 60)
    );
    completed += t.time;
  });

  const cumulativePatientSeen = await EDR.aggregate([
    {
      $project: {
        consultationNote: 1,
      },
    },
    {
      $unwind: '$consultationNote',
    },
    {
      $match: {
        $and: [
          {
            'consultationNote.status': 'complete',
          },
          {
            'consultationNote.consultationType': 'Internal',
          },
        ],
      },
    },
  ]);

  const completedNoteTAT = completed / consultantCompletedNotes.length;
  const consultedPerHour = Math.round(consultantCompletedNotes.length / 6);
  res.status(200).json({
    success: true,
    firstCard: {
      TAT: completedNoteTAT,
      totalPending: pendingConsultation.length,
      perHour: pendingArr,
    },
    secondCard: {
      TAT: completedNoteTAT,
      totalFollowUps: consultantCompletedNotes.length,
      perHour: completedArr,
    },
    consultedPerHour,
    cumulativePatientSeen: cumulativePatientSeen.length,
  });
});
