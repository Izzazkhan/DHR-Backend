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
          { 'processTime.processName': 'Registration Officer' },
          { registrationStatus: 'completed' },
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
          { 'processTime.processName': 'Registration Officer' },
          { registrationStatus: 'completed' },
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
          { 'processTime.processName': 'Registration Officer' },
          { registrationStatus: 'completed' },
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
          { 'processTime.processName': 'Registration Officer' },
          { registrationStatus: 'completed' },
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
          { 'processTime.processName': 'Registration Officer' },
          { registrationStatus: 'completed' },
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
          { 'processTime.processName': 'Registration Officer' },
          { registrationStatus: 'completed' },
          { 'processTime.processStartTime': { $gte: sixHour } },
          { 'processTime.processEndTime': { $lte: secondHour } },
        ],
      },
    },
  ]);

  // arr.push({ label: sixHour, value: firstHourPatient.length });
  arr.push({ label: sixHour, value: 1 });

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
    registrationPerHour: arr,
    averageTAT: averageRegistrationTime,
    registeredPatients: patients.length,
  });
});

exports.roSenseiPending = asyncHandler(async (req, res, next) => {
  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();
  //   * Pending Registration After Sensei
  const pendingSensei = await Patient.find({
    'processTime.processName': 'Sensei',
    // registrationStatus: 'pending',
    $and: [
      { 'processTime.processStartTime': { $gte: sixHour } },
      // { 'processTime.processEndTime': { $lte: currentTime } },
    ],
  });

  const totalSenseiPending = pendingSensei.length;

  const averageSenseiRegisterTime = 360 / totalSenseiPending;

  // * Sensei Per Hour

  const senseiArr = [];

  const sixthHourPatientSensei = await Patient.find({
    'processTime.processName': 'Sensei',
    registrationStatus: 'pending',
    $and: [
      { 'processTime.processStartTime': { $gte: lastHour } },
      { 'processTime.processEndTime': { $lte: currentTime } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: lastHour, value: sixthHourPatientSensei });
  senseiArr.push({ label: lastHour, value: 5 });

  const fifthHourPatientSensei = await Patient.find({
    'processTime.processName': 'Sensei',
    registrationStatus: 'pending',
    $and: [
      { 'processTime.processStartTime': { $gte: fifthHour } },
      { 'processTime.processEndTime': { $lte: lastHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: fifthHour, value: fifthHourPatientSensei });
  senseiArr.push({ label: fifthHour, value: 4 });
  const fourthHourPatientSensei = await Patient.find({
    'processTime.processName': 'Sensei',
    registrationStatus: 'pending',
    $and: [
      { 'processTime.processStartTime': { $gte: fourthHour } },
      { 'processTime.processEndTime': { $lte: fifthHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: fourthHour, value: fourthHourPatientSensei });
  senseiArr.push({ label: fourthHour, value: 10 });

  const thirdHourPatientSensei = await Patient.find({
    'processTime.processName': 'Sensei',
    registrationStatus: 'pending',
    $and: [
      { 'processTime.processStartTime': { $gte: thirdHour } },
      { 'processTime.processEndTime': { $lte: fourthHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: thirdHour, value: thirdHourPatientSensei });
  senseiArr.push({ label: thirdHour, value: 12 });

  const secondHourPatientSensei = await Patient.find({
    'processTime.processName': 'Sensei',
    registrationStatus: 'pending',
    $and: [
      { 'processTime.processStartTime': { $gte: secondHour } },
      { 'processTime.processEndTime': { $lte: thirdHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: secondHour, value: secondHourPatientSensei });
  senseiArr.push({ label: secondHour, value: 9 });

  const firstHourPatientSensei = await Patient.find({
    'processTime.processName': 'Sensei',
    registrationStatus: 'pending',
    $and: [
      { 'processTime.processStartTime': { $gte: sixHour } },
      { 'processTime.processEndTime': { $lte: secondHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: sixHour, value: firstHourPatientSensei });
  senseiArr.push({ label: sixHour, value: 1 });

  res.status(200).json({
    status: 'Success',
    pendingRegistrationSensei: {
      averageTAT: averageSenseiRegisterTime,
      totalSenseiPending,
      senseiPerHour: senseiArr,
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
    assignedTime: { $gte: sixHour },
  }).countDocuments();

  const averageRoomTAT = 360 / roomPending;

  // Room Cleaning Completed
  const roomComplete = await HKRequests.find({
    status: 'completed',
    completedAt: { $gte: sixHour },
  }).countDocuments();

  const averageCompleteRoomTAT = 360 / roomComplete;

  // Cumulative total Beds Cleaned
  const totalCleanedBeds = await HKRequests.find({
    status: 'completed',
    task: 'Cleaned',
  }).countDocuments();

  res.status(200).json({
    status: 'Success',
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
    status: 'Success',
    totalRequests: {
      pendingTat,
      totalPending: pending.length,
      totalRequestPerHour: pendingArr,
    },
  });
});
