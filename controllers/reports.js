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
  const patients = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: sixHour } },
      { 'processTime.processEndTime': { $lte: currentTime } },
    ],
  }).countDocuments();

  const averageRegistrationTime = 360 / patients;
  const arr = [];

  const sixthHourPatient = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: lastHour } },
      { 'processTime.processEndTime': { $lte: currentTime } },
    ],
  }).countDocuments();
  // arr.push({ label: lastHour, value: sixthHourPatient });
  arr.push({ label: lastHour, value: 5 });

  const fifthHourPatient = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: fifthHour } },
      { 'processTime.processEndTime': { $lte: lastHour } },
    ],
  }).countDocuments();
  arr.push({ label: fifthHour, value: fifthHourPatient });
  arr.push({ label: fifthHour, value: 4 });
  const fourthHourPatient = await Patient.find({
    // 'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: fourthHour } },
      { 'processTime.processEndTime': { $lte: fifthHour } },
    ],
  }).countDocuments();
  // arr.push({ label: fourthHour, value: fourthHourPatient });
  arr.push({ label: fourthHour, value: 10 });

  const thirdHourPatient = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: thirdHour } },
      { 'processTime.processEndTime': { $lte: fourthHour } },
    ],
  }).countDocuments();
  // arr.push({ label: thirdHour, value: thirdHourPatient });
  arr.push({ label: thirdHour, value: 12 });

  const secondHourPatient = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: secondHour } },
      { 'processTime.processEndTime': { $lte: thirdHour } },
    ],
  }).countDocuments();
  // arr.push({ label: secondHour, value: secondHourPatient });
  arr.push({ label: secondHour, value: 9 });

  const firstHourPatient = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: sixHour } },
      { 'processTime.processEndTime': { $lte: secondHour } },
    ],
  }).countDocuments();
  // arr.push({ label: sixHour, value: firstHourPatient });
  arr.push({ label: sixHour, value: 1 });

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
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: fifthHour } },
      { 'processTime.processEndTime': { $lte: lastHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: fifthHour, value: fifthHourPatientSensei });
  senseiArr.push({ label: fifthHour, value: 4 });
  const fourthHourPatientSensei = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: fourthHour } },
      { 'processTime.processEndTime': { $lte: fifthHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: fourthHour, value: fourthHourPatientSensei });
  senseiArr.push({ label: fourthHour, value: 10 });

  const thirdHourPatientSensei = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: thirdHour } },
      { 'processTime.processEndTime': { $lte: fourthHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: thirdHour, value: thirdHourPatientSensei });
  senseiArr.push({ label: thirdHour, value: 12 });

  const secondHourPatientSensei = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: secondHour } },
      { 'processTime.processEndTime': { $lte: thirdHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: secondHour, value: secondHourPatientSensei });
  senseiArr.push({ label: secondHour, value: 9 });

  const firstHourPatientSensei = await Patient.find({
    'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: sixHour } },
      { 'processTime.processEndTime': { $lte: secondHour } },
    ],
  }).countDocuments();
  // senseiArr.push({ label: sixHour, value: firstHourPatientSensei });
  senseiArr.push({ label: sixHour, value: 1 });

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

  const totalRegistrations = await Patient.find({
    'processTime.processName': 'Registration Officer',
    registrationStatus: 'completed',
  }).countDocuments();

  res.status(200).json({
    success: true,
    totalInsured: edrInsured,
    totalUnInsured: edrUnInsured,
    availableEdBeds: EdBeds,
    cumulativeRegistrations: totalRegistrations,
    registrationPerHour: arr,
    averageTAT: averageRegistrationTime,
    registeredPatients: patients,
    pendingRegistrationSensei: {
      averageTAT: averageSenseiRegisterTime,
      totalSenseiPending,
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
exports.swDashboard = asyncHandler(async (req, res, next) => {
  const currentTime = moment().utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();
  // const totalPending = await EDR.find({ anesthesiologistNote: { $ne: [] } });
  const pending = await EDR.aggregate([
    {
      $project: {
        anesthesiologistNote: 1,
      },
    },
    {
      $match: {
        anesthesiologistNote: { $ne: [] },
      },
    },
    {
      $unwind: '$anesthesiologistNote',
    },
    {
      $match: {
        $and: [{ status: 'pending' }, { noteTime: { $gte: sixHour } }],
      },
    },
  ]);

  const pendingTat = 360 / pending.length;

  res.status(200).json({
    status: 'Success',
    totalRequests: {
      pendingTat,
      totalPending: pending.length,
    },
  });
});
