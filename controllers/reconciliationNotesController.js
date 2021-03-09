const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Patient = require('../models/patient/patient');
const Notification = require('../components/notification');
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

exports.getAllReconciliationNotes = asyncHandler(async (req, res) => {
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

exports.completeReconciliationNotes = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  let edr = await EDR.findOne({
    _id: parsed.edrId,
    'pharmacyRequest._id': parsed.pharmacyRequestId,
  });

  let reconciliationNotes;
  let reconNotes;
  for (let i = 0; i < edr.pharmacyRequest.length; i++) {
    reconciliationNotes = edr.pharmacyRequest[i].reconciliationNotes;
    for (let j = 0; j < reconciliationNotes.length; j++) {
      if (reconciliationNotes[j]._id == parsed._id) {
        reconNotes = reconciliationNotes;
        reconNotes[j] = {
          pharmacistComments: reconNotes[j].pharmacistComments,
          requesterComments: parsed.requesterComments,
          pharmacistAudioNotes: reconNotes[j].pharmacistAudioNotes,
          addedBy: reconNotes[j].addedBy,
          status: parsed.status,
          createdAt: reconNotes[j].createdAt,
          updatedAt: reconNotes[j].updatedAt,
          completedAt: parsed.completedAt,
        };
        break;
      }
    }
  }

  let updatedNote = await EDR.findOneAndUpdate(
    {
      _id: parsed.edrId,
      'pharmacyRequest._id': parsed.pharmacyRequestId,
    },
    {
      $set: {
        'pharmacyRequest.$.reconciliationNotes': reconNotes,
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedNote,
  });
});

exports.addReconciliationNotes = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);

  let obj = {
    pharmacistComments: parsed.pharmacistComments,
    requesterComments: '',
    pharmacistAudioNotes: req.file ? req.file.path : null,
    addedBy: parsed.addedBy,
    status: parsed.status,
  };

  let addedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'pharmacyRequest._id': parsed.pharmacyRequestId },
    {
      $push: {
        'pharmacyRequest.$.reconciliationNotes': obj,
      },
    },
    { new: true }
  );

  Notification(
    'Reconciliation Request',
    'Patient Reconciliation Request ',
    'ED Doctor',
    'Clinical Pharmacist',
    '/home/rcm/patientAssessment',
    parsed.edrId,
    ''
  );

  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.updateReconciliationNotes = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  let edr = await EDR.findOne({
    _id: parsed.edrId,
    'pharmacyRequest._id': parsed.pharmacyRequestId,
  });

  let reconciliationNotes;
  let reconNotes;
  for (let i = 0; i < edr.pharmacyRequest.length; i++) {
    reconciliationNotes = edr.pharmacyRequest[i].reconciliationNotes;
    for (let j = 0; j < reconciliationNotes.length; j++) {
      if (reconciliationNotes[j]._id == parsed._id) {
        reconNotes = reconciliationNotes;
        reconNotes[j] = {
          pharmacistComments: parsed.pharmacistComments,
          requesterComments: parsed.requesterComments,
          pharmacistAudioNotes: req.file
            ? req.file.path
            : parsed.pharmacistAudioNotes,
          addedBy: parsed.addedBy,
          status: parsed.status,
          createdAt: reconNotes[j].createdAt,
          updatedAt: reconNotes[j].updatedAt,
        };
        break;
      }
    }
  }

  let updatedNote = await EDR.findOneAndUpdate(
    {
      _id: parsed.edrId,
      'pharmacyRequest._id': parsed.pharmacyRequestId,
    },
    {
      $set: {
        'pharmacyRequest.$.reconciliationNotes': reconNotes,
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedNote,
  });
});
