const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Patient = require('../models/patient/patient');
const CronFlag = require('../models/CronFlag');
// const Staff = require('../models/staffFhir/staff');

exports.getAllPendingConsultationNotes = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    status: { $eq: 'pending' },
  })
    // .select({
    //   patientId: 1,
    //   anesthesiologistNote: 1,
    //   chiefComplaint: 1,
    //   createdTimeStamp: 1,
    //   requestNo: 1,
    //   room: 1,
    // })
    .populate('patientId')
    .populate('anesthesiologistNote.anesthesiologist')
    .populate({
      path: 'chiefComplaint',
      populate: { path: 'chiefComplaintId' },
    })
    .populate('room.roomId')
    .populate('pharmacyRequest.item.itemId');

  let response = [];
  for (let i = 0; i < edr.length; i++) {
    for (let j = 0; j < edr[i].anesthesiologistNote.length; j++) {
      if (
        edr[i].anesthesiologistNote[j].status !== 'complete' &&
        edr[i].anesthesiologistNote[j].anesthesiologist._id == req.params.id
      ) {
        console.log(edr[i].anesthesiologistNote[j].anesthesiologist._id);
        let obj = JSON.parse(JSON.stringify(edr[i]));
        obj.anesthesiologistNote = edr[i].anesthesiologistNote[j];
        response.push(obj);
      }
    }
  }

  res.status(200).json({ success: true, data: response });
});

exports.getAllCompletedConsultationNotes = asyncHandler(async (req, res) => {
  const edr = await EDR
    .find
    //   {
    //   status: { $eq: 'pending' },
    // }
    ()
    .select({
      dcdForm: 0,
    })
    .populate('patientId')
    .populate('consultationNote.consultant')
    .populate('consultationNote.addedBy');
  // .populate({
  //   path: 'chiefComplaint',
  //   populate: { path: 'chiefComplaintId' },
  // })
  // .populate('room.roomId')
  // .populate('pharmacyRequest.item.itemId');

  let response = [];
  for (let i = 0; i < edr.length; i++) {
    for (let j = 0; j < edr[i].consultationNote.length; j++) {
      if (
        edr[i].consultationNote[j].status === 'complete' &&
        edr[i].consultationNote[j].consultant._id == req.params.id
      ) {
        let obj = JSON.parse(JSON.stringify(edr[i]));
        obj.consultationNote = edr[i].consultationNote[j];
        response.push(obj);
      }
    }
  }
  res.status(200).json({ success: true, data: response });
});

exports.completeConsultationNotes = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);

  const addedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'consultationNote._id': parsed._id },
    {
      $set: {
        'consultationNote.$.consultantNotes': parsed.consultantNotes,
        'consultationNote.$.status': parsed.status,
        'consultationNote.$.completionDate': parsed.completionDate,
        'consultationNote.$.consultantVoiceNotes': req.file
          ? req.file.path
          : null,
      },
    },
    {
      new: true,
    }
  );

  // Preventing from raising flag if task is completed
  await CronFlag.findOneAndUpdate(
    { requestId: parsed._id, taskName: 'Doctor Consultation Pending' },
    { $set: { status: 'completed' } },
    { new: true }
  );

  const edrNote = await EDR.findOne({
    _id: parsed.edrId,
    'consultationNote._id': parsed._id,
  }).select('consultationNote');

  if (edrNote.consultationNote[0].consultationType === 'Internal') {
    await CronFlag.findOneAndUpdate(
      { requestId: parsed._id, taskName: 'Internal Consultation Pending' },
      { $set: { status: 'completed' } },
      { new: true }
    );
  }

  if (edrNote.consultationNote[0].consultationType === 'External') {
    await CronFlag.findOneAndUpdate(
      { requestId: parsed._id, taskName: 'External Consultation Pending' },
      { $set: { status: 'completed' } },
      { new: true }
    );
  }
  res.status(200).json({
    success: true,
    data: addedNote,
  });
});
