const moment = require('moment');
const Patient = require('../models/patient/patient');
const Room = require('../models/room');

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

  //   Registrations Per Hour
  const patients = await Patient.find({
    // 'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: sixHour } },
      { 'processTime.processEndTime': { $lte: currentTime } },
    ],
  });
  //   console.log(patients.length);
  const averageRegistrationTime = 360 / patients.length;

  const sixthHourPatient = await Patient.find({
    // 'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: lastHour } },
      { 'processTime.processEndTime': { $lte: currentTime } },
    ],
  }).countDocuments();
  const fifthHourPatient = await Patient.find({
    // 'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: fifthHour } },
      { 'processTime.processEndTime': { $lte: lastHour } },
    ],
  }).countDocuments();

  const fourthHourPatient = await Patient.find({
    // 'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: fourthHour } },
      { 'processTime.processEndTime': { $lte: fifthHour } },
    ],
  }).countDocuments();

  const thirdHourPatient = await Patient.find({
    // 'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: thirdHour } },
      { 'processTime.processEndTime': { $lte: fourthHour } },
    ],
  }).countDocuments();

  const secondHourPatient = await Patient.find({
    // 'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: secondHour } },
      { 'processTime.processEndTime': { $lte: thirdHour } },
    ],
  }).countDocuments();

  const firstHourPatient = await Patient.find({
    // 'processTime.processName': 'Registration Officer',
    $and: [
      { 'processTime.processStartTime': { $gte: sixHour } },
      { 'processTime.processEndTime': { $lte: secondHour } },
    ],
  }).countDocuments();

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

  res.status(200).json({
    success: true,
    totalInsured: edrInsured,
    totalUnInsured: edrUnInsured,
    availableEdBeds: EdBeds,
    registrationPerHour: {
      averageTAT: averageRegistrationTime,
      sixthHourPatient,
      fifthHourPatient,
      fourthHourPatient,
      thirdHourPatient,
      secondHourPatient,
      firstHourPatient,
    },
  });
});
