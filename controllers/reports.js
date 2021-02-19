const moment = require('moment');
const Patient = require('../models/patient/patient');
const Room = require('../models/room');
const HKRequests = require('../models/houseKeepingRequest');

const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');

// Registration Officer Dashboard Stats
exports.roDashboard = asyncHandler(async (req, res) => {
  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();

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

  // Registration Officer Completed Per Hour
  const completedArr = [];
  let sixthHourPatient = 0;
  let fifthHourPatient = 0;
  let fourthHourPatient = 0;
  let thirdHourPatient = 0;
  let secondHourPatient = 0;
  let firstHourPatient = 0;
  patients.map((p) => {
    let hour, patientHours;
    if (
      p.processTime.processStartTime > lastHour &&
      p.processTime.processEndTime < currentTime
    ) {
      sixthHourPatient++;
      console.log('sixthHourPatient', sixthHourPatient);
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
    completedArr.push({ label: sixHour, value: firstHourPatient });
  });
  completedArr.push({ label: lastHour, value: sixthHourPatient });
  completedArr.push({ label: fifthHour, value: fifthHourPatient });
  completedArr.push({ label: fourthHour, value: fourthHourPatient });
  completedArr.push({ label: thirdHour, value: thirdHourPatient });
  completedArr.push({ label: secondHour, value: secondHourPatient });
  completedArr.push({ label: sixHour, value: firstHourPatient });

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
  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();

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
  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();

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

// House Keeper Dashboard
exports.hkDashboard = asyncHandler(async (req, res, next) => {
  const currentTime = moment().utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();

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
  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();

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
  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();

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

  const pendingTat = 360 / pending.length;

  res.status(200).json({
    success: true,
    totalRequests: {
      pendingTat,
      totalPending: pending.length,
      totalRequestPerHour: pendingArr,
    },
  });
});
