const requestNoFormat = require('dateformat');
// const moment = require('moment');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Patient = require('../models/patient/patient');
const HK = require('../models/houseKeepingRequest');
const Staff = require('../models/staffFhir/staff');
const CCRequest = require('../models/customerCareRequest');
const Notification = require('../components/notification');
const Flag = require('../models/flag/Flag');
const searchPatient = require('../components/searchEdr');
const generateReqNo = require('../components/requestNoGenerator');
const addFlag = require('../components/addFlag.js');
const CronFlag = require('../models/CronFlag');

exports.generateEDR = asyncHandler(async (req, res, next) => {
  let newEDR;
  const patient = await Patient.findOne({ _id: req.body.patientId });
  const requestNo = generateReqNo('EDR');
  const dcdFormVersion = [
    {
      versionNo: patient.identifier[0].value + '-' + requestNo + '-' + '1',
    },
  ];

  const paymentMethod = patient.paymentMethod[0].payment;
  const {
    patientId,
    generatedBy,
    consultationNote,
    residentNotes,
    pharmacyRequest,
    chiefComplaint,
    labRequest,
    radiologyRequest,
    dischargeRequest,
    status,
    verified,
    insurerId,
    // dcdForm,
    claimed,
    generatedFrom,
    patientInHospital,
  } = req.body;

  newEDR = await EDR.create({
    requestNo,
    patientId,
    generatedBy: generatedBy,
    consultationNote,
    residentNotes,
    pharmacyRequest,
    labRequest,
    chiefComplaint,
    radiologyRequest,
    dischargeRequest,
    status,
    verified,
    insurerId,
    claimed,
    generatedFrom,
    patientInHospital,
  });

  await EDR.findOneAndUpdate(
    { _id: newEDR._id },
    {
      $set: {
        dcdForm: dcdFormVersion,
        generatedFrom: generatedFrom,
        patientInHospital: patientInHospital,
        createdTimeStamp: Date.now(),
      },
    }
  );
  await EDR.findOneAndUpdate(
    { _id: newEDR._id },
    {
      $set: {
        paymentMethod: paymentMethod,
      },
    }
  );
  newEDR = await EDR.findOne({ _id: newEDR._id }).populate('patientId');

  //   Cron Flag for Sensei
  const data = {
    taskName: 'PA Assignment Pending',
    minutes: 4,
    collectionName: 'EDR',
    staffId: generatedBy,
    patientId: newEDR._id,
    onModel: 'EDR',
    generatedFrom: 'Sensei',
    card: '1st',
    generatedFor: ['Sensei'],
    reason: 'Patients pending for production area',
    emittedFor: 'pendingSensei',
    requestId: newEDR._id,
  };

  addFlag(data);
  // * Sending Notifications

  // Notification from Paramedics
  if (newEDR.generatedFrom === 'Paramedics') {
    Notification(
      'ADT_A04',
      'Details from Paramedics',
      'Registration Officer',
      'Paramedics',
      '/dashboard/home/patientregistration',
      newEDR._id,
      '',
      ''
    );
    Notification(
      'ADT_A04',
      'New patient from Paramedics',
      'Admin',
      'Paramedics',
      '/dashboard/home/patientregistration',
      newEDR._id,
      '',
      ''
    );
  }

  if (newEDR.generatedFrom === 'Sensei') {
    Notification(
      'ADT_A04',
      'Details from Sensei',
      'Registration Officer',
      'Sensei',
      '/dashboard/home/patientregistration',
      newEDR._id,
      '',
      ''
    );
  }

  Notification(
    'ADT_A01',
    'New Patient Arrived',
    'Doctor',
    'Sensei',
    '/dashboard/home/patientmanagement/careStreamPatients',
    newEDR._id,
    '',
    'ED Doctor'
  );

  res.status(201).json({
    success: true,
    data: newEDR,
  });
});

exports.getEDRById = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findById(
    { _id: req.params.id },
    { dcdForm: { $slice: -1 } }
  ).populate('patientId ');
  if (!edr) {
    return next(new ErrorResponse('No Edr found for this patient', 404));
  }

  res.status(200).json({
    success: true,
    data: edr,
  });
});

exports.getEdrsByPatient = asyncHandler(async (req, res, next) => {
  const edrs = await EDR.find({ patientId: req.params.id });
  res.status(200).json({
    status: 'Success',
    data: edrs,
  });
});

exports.getEDRs = asyncHandler(async (req, res, next) => {
  const Edrs = await EDR.find({ patientInHospital: true })
    .populate('patientId')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
          },
        ],
      },
    ])
    .populate('newChiefComplaint.newChiefComplaintId')
    .populate('room.roomId')
    .select(
      'patientId dcdFormStatus status labRequest careStream room requestNo radRequest newChiefComplaint'
    );
  res.status(201).json({
    success: true,
    count: Edrs.length,
    data: Edrs,
  });
});

exports.getPendingEDRs = asyncHandler(async (req, res, next) => {
  const Edrs = await EDR.find({
    status: 'pending',
    patientInHospital: true,
    // currentLocation: 'ED',
  })
    .select(
      'patientId dcdFormStatus status labRequest radRequest patientInHospital chiefComplaint'
    )
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId name',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        // select: 'identifier name',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
      {
        path: 'careStream.careStreamId',
        model: 'careStream',
      },

      {
        path: 'pharmacyRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.item.itemId',
        model: 'Item',
      },
      {
        path: 'doctorNotes.addedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
      },
    ])
    .populate('newChiefComplaint.newChiefComplaintId');
  res.status(201).json({
    success: true,
    count: Edrs.length,
    data: Edrs,
  });
});

exports.getSenseiPendingEDRs = asyncHandler(async (req, res, next) => {
  const Edrs = await EDR.find({
    status: 'pending',
    generatedFrom: 'Sensei',
    patientInHospital: true,
  })
    .populate('patientId')
    .populate('chiefComplaint.chiefComplaintId', 'name')
    .select(
      'patientId dcdFormStatus status labRequest radRequest generatedFrom patientInHospital'
    );
  res.status(201).json({
    success: true,
    count: Edrs.length,
    data: Edrs,
  });
});

exports.getPendingDcd = asyncHandler(async (req, res, next) => {
  const pendingDCD = await EDR.find({
    dcdFormStatus: 'pending',
    status: 'pending',
  })
    .select('patientId chiefComplaint.chiefComplaintId')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);

  res.status(200).json({
    success: true,
    data: pendingDCD,
  });
});

exports.updatedDcdFormStatus = asyncHandler(async (req, res, next) => {
  const updatedDcd = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $set: { dcdFormStatus: 'completed' } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedDcd,
  });
});

exports.getEdrPatientByKeyword = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({ patientInHospital: true })
    .populate('patientId')
    .populate('chiefComplaint.chiefComplaintId')
    .populate('room.roomId');

  // Search Function
  const arr = searchPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getPendingEdrByKeyword = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    patientInHospital: true,
  })
    .populate('patientId')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
          },
        ],
      },
    ]);

  const arr = searchPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getSenseiPendingEdrByKeyword = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    generatedFrom: 'Sensei',
    patientInHospital: true,
  }).populate('patientId');

  const arr = searchPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.addDoctorNotes = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  const doctorNotes = {
    addedBy: parsed.addedBy,
    assignedTime: Date.now(),
    notes: parsed.notes,
    code: parsed.code,
    section: parsed.section,
    voiceNotes: req.file ? req.file.path : null,
  };
  const addedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { doctorNotes } },
    {
      new: true,
    }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  //   Checking For Flags

  await CronFlag.findOneAndUpdate(
    { requestId: parsed.edrId, taskName: 'Diagnoses Pending' },
    { $set: { status: 'completed' } },
    { new: true }
  );

  const diagnosePending = await EDR.find({
    status: 'pending',
    doctorNotes: { $eq: [] },
  });

  if (diagnosePending.length > 5) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'Sensei',
      card: '3rd',
      generatedFor: ['Sensei', 'Medical Director'],
      reason: 'Patients diagnoses pending from Doctor',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Sensei',
      status: 'pending',
    });
    globalVariable.io.emit('pendingSensei', flags);
  }

  if (diagnosePending.length > 6) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'ED Doctor',
      card: '1st',
      generatedFor: ['ED Doctor', 'Medical Director'],
      reason: 'Patients diagnoses pending from Doctor',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'ED Doctor',
      status: 'pending',
    });
    globalVariable.io.emit('pendingDoctor', flags);
  }

  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.updateDoctorNotes = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);

  const updateRecord = {
    updatedAt: Date.now(),
    reason: parsed.reason,
    updatedBy: parsed.addedBy,
  };

  await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'doctorNotes._id': parsed.noteId },
    {
      $push: {
        'doctorNotes.$.updateRecord': updateRecord,
      },
    },

    { new: true }
  );
  const updatedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'doctorNotes._id': parsed.noteId },
    {
      $set: {
        'doctorNotes.$.notes': parsed.notes,
        'doctorNotes.$.code': parsed.code,
        'doctorNotes.$.section': parsed.section,
        'doctorNotes.$.voiceNotes': req.file
          ? req.file.path
          : parsed.voiceNotes,
      },
    },
    { new: true }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  res.status(200).json({
    success: true,
    data: updatedNote,
  });
});

// Doctor Notes API's for Admin
exports.pendingDoctorNotes = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    patientInHospital: true,
    doctorNotes: { $eq: [] },
  })
    .select('patientId chiefComplaint careStream.name createdTimeStamp')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
    ]);
  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.inprogressDoctorNotes = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    patientInHospital: true,
    doctorNotes: { $ne: [] },
  })
    .select('patientId chiefComplaint careStream.name createdTimeStamp')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
    ]);
  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.completedDoctorNotes = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: { $ne: 'pending' },
    patientInHospital: true,
    doctorNotes: { $ne: [] },
  })
    .select('patientId chiefComplaint careStream.name createdTimeStamp')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
      {
        path: 'patientId',
        model: 'patientfhir',
        select: 'identifier name',
      },
    ]);
  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.addLabRequest = asyncHandler(async (req, res, next) => {
  const parsed = req.body;

  // Sample Collection Task
  const currentStaff = await Staff.findById(parsed.staffId).select('shift');

  const nurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'Nurse Technician',
    disabled: false,
    shift: currentStaff.shift,
  }).select('identifier name');

  const random = Math.floor(Math.random() * (nurses.length - 1));
  const nurseTechnician = nurses[random];

  const requestId = generateReqNo('LR');

  const labRequest = {
    requestId,
    name: parsed.name,
    serviceId: parsed.serviceId,
    type: parsed.type,
    price: parsed.price,
    status: parsed.status,
  };

  const newLab = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { labRequest } },
    { new: true }
  );

  const assignedLab = await EDR.findOneAndUpdate(
    {
      _id: parsed.edrId,
      'labRequest._id': newLab.labRequest[newLab.labRequest.length - 1]._id,
    },
    {
      $set: {
        'labRequest.$.priority': parsed.priority,
        'labRequest.$.requestedBy': parsed.staffId,
        'labRequest.$.requestedAt': Date.now(),
        'labRequest.$.assignedTo': nurseTechnician._id,
        'labRequest.$.labTechnicianId': parsed.labTechnicianId,
        'labRequest.$.reason': parsed.reason,
        'labRequest.$.notes': parsed.notes,
        'labRequest.$.voiceNotes': req.file ? req.file.path : null,
      },
    },
    { new: true }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  // Checking for flag
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
        $and: [{ 'labRequest.status': { $ne: 'completed' } }],
      },
    },
  ]);

  if (labPending.length > 5) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'Sensei',
      card: '5th',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Too Many Lab Results Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Sensei',
      status: 'pending',
    });
    globalVariable.io.emit('pendingSensei', flags);
  }

  if (labPending.length > 5) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'Lab Technician',
      card: '2nd',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Too Many Lab Results Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Lab Technician',
      status: 'pending',
    });
    globalVariable.io.emit('ltPending', flags);
  }

  if (labPending.length > 6) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'ED Nurse',
      card: '6th',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Lab Results Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'ED Nurse',
      status: 'pending',
    });
    globalVariable.io.emit('edNursePending', flags);
  }

  // Lab Technician Flags
  const samplePending = await EDR.aggregate([
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
          { 'labRequest.type': { $ne: 'Blood' } },
          { 'labRequest.nurseTechnicianStatus': 'Not Collected' },
        ],
      },
    },
  ]);
  if (samplePending.length > 6) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'Lab Technician',
      card: '1st',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Sample Collection Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Lab Technician',
      status: 'pending',
    });
    globalVariable.io.emit('ltPending', flags);
  }

  const bloodPending = await EDR.aggregate([
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
          { 'labRequest.type': 'Blood' },
          { 'labRequest.nurseTechnicianStatus': 'Not Collected' },
        ],
      },
    },
  ]);

  if (bloodPending.length > 10) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'Lab Technician',
      card: '3rd',
      generatedFor: ['Lab Supervisor'],
      reason: 'Blood Sample Collection Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Lab Technician',
      status: 'pending',
    });
    globalVariable.io.emit('ltPending', flags);
  }

  const resultsPending = await EDR.aggregate([
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
          { 'labRequest.type': 'Blood' },
        ],
      },
    },
  ]);

  if (resultsPending.length > 10) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'Lab Technician',
      card: '4th',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Blood Test Results Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Lab Technician',
      status: 'pending',
    });
    globalVariable.io.emit('ltPending', flags);
  }

  Notification(
    'Lab Test',
    'Lab Test Request',
    'Lab Technician',
    'ED Doctor',
    '/dashboard/taskslist',
    parsed.edrId,
    ''
  );

  Notification(
    'Lab Request',
    'Lab Request',
    'Admin',
    'Lab Requests',
    '/dashboard/taskslist',
    parsed.edrId,
    ''
  );

  res.status(200).json({
    success: true,
    data: assignedLab,
  });
});

exports.updateLab = asyncHandler(async (req, res, next) => {
  const parsed = req.body;
  const lab = await EDR.findOne({ _id: parsed.edrId });
  let note;
  for (let i = 0; i < lab.labRequest.length; i++) {
    if (lab.labRequest[i]._id == parsed.labId) {
      note = i;
    }
  }

  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: parsed.addedBy,
    reason: parsed.reason,
  };

  await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $push: {
        [`labRequest.${note}.updateRecord`]: updateRecord,
      },
    },
    { new: true }
  );

  const updatedLab = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`labRequest.${note}.notes`]: parsed.notes,
        [`labRequest.${note}.priority`]: parsed.priority,
        [`labRequest.${note}.voiceNotes`]: req.file
          ? req.file.path
          : parsed.voiceNotes,
      },
    },
    { new: true }
  )
    .populate('labRequest.serviceId')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            populate: [
              {
                path: 'rooms.roomId',
                model: 'room',
              },
            ],
          },
        ],
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
      },
      {
        path: 'careStream.careStreamId',
        model: 'careStream',
      },
      {
        path: 'consultationNote.addedBy',
        model: 'staff',
      },
      {
        path: 'consultationNote.consultant',
        model: 'staff',
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'radRequest.serviceId',
        model: 'RadiologyService',
      },
      {
        path: 'radRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'labRequest.serviceId',
        model: 'LaboratoryService',
      },
      {
        path: 'labRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.item.itemId',
        model: 'Item',
      },
      {
        path: 'doctorNotes.addedBy',
        model: 'staff',
      },
      {
        path: 'edNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'eouNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'nurseTechnicianRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'anesthesiologistNote.addedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
      },
    ]);

  res.status(200).json({
    success: true,
    data: updatedLab,
  });
});

exports.addConsultationNote = asyncHandler(async (req, res, next) => {
  const requestNo = generateReqNo('CN');

  const parsed = JSON.parse(req.body.data);
  const consultationNote = {
    consultationNo: requestNo,
    addedBy: parsed.addedBy,
    consultant: parsed.consultant,
    noteTime: Date.now(),
    notes: parsed.notes,
    consultationType: parsed.subType,
    voiceNotes: req.file ? req.file.path : null,
    speciality: parsed.speciality,
  };
  const addedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { consultationNote } },
    {
      new: true,
    }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  // Checking for flag
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
        'consultationNote.status': 'pending',
      },
    },
  ]);
  if (consultantNotes.length > 6) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'ED Doctor',
      card: '4th',
      generatedFor: ['Medical Director'],
      reason: 'Consultant Notes Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'ED Doctor',
      status: 'pending',
    });
    globalVariable.io.emit('pendingDoctor', flags);
  }

  if (parsed.subType === 'Internal') {
    Notification(
      'Internal Consultant Request',
      'Ed Doctor has requested an Internal Consultant',
      'Sensei',
      'ED Doctor',
      '/dashboard/home/notes',
      parsed.edrId,
      '',
      ''
    );

    Notification(
      'Internal Consultant Request',
      'Ed Doctor has requested an Internal Consultant',
      'Doctor',
      'ED Doctor',
      '/dashboard/home/notes',
      parsed.edrId,
      '',
      'Internal'
    );

    // Flags
    const pendingConsultationInternal = await EDR.aggregate([
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
          ],
        },
      },
    ]);
    if (pendingConsultationInternal.length > 4) {
      await Flag.create({
        edrId: parsed.edrId,
        generatedFrom: 'Internal',
        card: '1st',
        generatedFor: ['ED Doctor', 'Medical Director'],
        reason: 'Patient Consultations Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'Internal',
        status: 'pending',
        // card: '1st',
      });

      globalVariable.io.emit('internalPending', flags);
    }
  }

  if (parsed.subType === 'External') {
    Notification(
      'External Consultant Request',
      'Ed Doctor has requested an External Consultant',
      'Sensei',
      'ED Doctor',
      '/dashboard/home/notes',
      parsed.edrId,
      '',
      ''
    );

    Notification(
      'External Consultant Request',
      'Ed Doctor has requested an External Consultant',
      'Doctor',
      'ED Doctor',
      '/dashboard/home/notes',
      parsed.edrId,
      '',
      'External'
    );

    // Flags
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
          ],
        },
      },
    ]);
    if (pendingConsultation.length > 4) {
      await Flag.create({
        edrId: parsed.edrId,
        generatedFrom: 'External',
        card: '1st',
        generatedFor: ['ED Doctor', 'Medical Director'],
        reason: 'Patient Consultations Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'External',
        status: 'pending',
      });

      globalVariable.io.emit('externalPending', flags);
    }
  }
  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.updateConsultationNote = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  let note;
  for (let i = 0; i < edrNotes.consultationNote.length; i++) {
    if (edrNotes.consultationNote[i]._id == parsed.noteId) {
      note = i;
    }
  }
  const updateRecord = {
    updatedAt: Date.now(),
    reason: parsed.reason,
    updatedBy: parsed.addedBy,
  };

  await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'consultationNote._id': parsed.noteId },
    {
      $push: {
        'consultationNote.$.updateRecord': updateRecord,
      },
    },

    { new: true }
  );
  const updatedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`consultationNote.${note}.consultant`]: parsed.consultant,
        [`consultationNote.${note}.speciality`]: parsed.speciality,
        [`consultationNote.${note}.notes`]: parsed.notes,
        [`consultationNote.${note}.consultationType`]: parsed.subType,
        [`consultationNote.${note}.voiceNotes`]: req.file
          ? req.file.path
          : parsed.voiceNotes,
      },
    },
    { new: true }
  )
    .populate('consultationNote.consultant')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            populate: [
              {
                path: 'rooms.roomId',
                model: 'room',
              },
            ],
          },
        ],
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
      },
      {
        path: 'careStream.careStreamId',
        model: 'careStream',
      },
      {
        path: 'consultationNote.addedBy',
        model: 'staff',
      },
      {
        path: 'consultationNote.consultant',
        model: 'staff',
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'radRequest.serviceId',
        model: 'RadiologyService',
      },
      {
        path: 'radRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'labRequest.serviceId',
        model: 'LaboratoryService',
      },
      {
        path: 'labRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.item.itemId',
        model: 'Item',
      },
      {
        path: 'doctorNotes.addedBy',
        model: 'staff',
      },
      {
        path: 'edNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'eouNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'nurseTechnicianRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'anesthesiologistNote.addedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
      },
    ]);

  // FLags
  if (parsed.subType === 'External') {
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
          ],
        },
      },
    ]);

    if (consultantCompletedNotes.length > 4) {
      await Flag.create({
        edrId: parsed.edrId,
        generatedFrom: 'External',
        card: '2nd',
        generatedFor: ['ED Doctor', 'Medical Director'],
        reason: 'Patient Follow Ups Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'External',
        status: 'pending',
      });

      globalVariable.io.emit('externalPending', flags);
    }
  }

  // FLags
  if (parsed.subType === 'Internal') {
    const completedNotesInternal = await EDR.aggregate([
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
          ],
        },
      },
    ]);

    if (completedNotesInternal.length > 4) {
      await Flag.create({
        edrId: parsed.edrId,
        generatedFrom: 'Internal',
        card: '2nd',
        generatedFor: ['ED Doctor', 'Medical Director'],
        reason: 'Patient Follow Ups Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'Internal',
        status: 'pending',
      });

      globalVariable.io.emit('internalPending', flags);
    }
  }

  res.status(200).json({
    success: true,
    data: updatedNote,
  });
});

exports.completeConsultationNote = asyncHandler(async (req, res, next) => {
  let parsed;
  if (req.file) {
    // console.log(req.file);
    parsed = JSON.parse(req.body.data);
    // console.log(parsed);
  } else {
    // console.log(req.body);
    parsed = req.body;
  }

  const updatedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'consultationNote._id': parsed._id },
    {
      $set: {
        'consultationNote.$.status': parsed.status,
        'consultationNote.$.consultantNotes': parsed.consultantNotes,
        'consultationNote.$.completionDate': parsed.completionDate,
        'consultationNote.$.consultantVoiceNotes': req.file
          ? req.file.path
          : '',
      },
    },
    { new: true }
  ).populate('consultationNote.consultant');
  // await EDR.findOne({ _id: parsed.edrId }).populate();
  // console.log(updatedNote);
  res.status(200).json({
    success: updatedNote,
    data: { name: 'saad' },
  });
});

exports.getEDRwihtConsultationNote = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    consultationNote: { $ne: [] },
  }).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',

      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          // populate: [
          //   {
          //     path: 'rooms.roomId',
          //     model: 'room',
          //   },
          // ],
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
  ]);

  const responseArray = [];
  for (let outer = 0; outer < patients.length; outer++) {
    for (
      let inner = 0;
      inner < patients[outer].consultationNote.length;
      inner++
    ) {
      // console.log(
      //   'Length of consultation Notes',
      //   patients[outer].consultationNote.length
      // );
      // console.log('Index', inner);
      // console.log(
      //   'Consultant ID',
      //   patients[outer].consultationNote[inner].consultant._id
      // );
      // console.log('Request ID', req.params.id);

      if (
        patients[outer].consultationNote[inner].consultant != null &&
        patients[outer].consultationNote[inner].consultant._id == req.params.id
      ) {
        const object = {
          patientData: patients[outer],
          consultationNotes: patients[outer].consultationNote[inner],
        };
        responseArray.push(object);
      }
    }
  }
  res.status(200).json({ success: 'true', data: responseArray });
});

exports.addRadRequest = asyncHandler(async (req, res, next) => {
  const requestId = generateReqNo('RR');

  const radRequest = {
    requestId,
    name: req.body.name,
    serviceId: req.body.serviceId,
    type: req.body.type,
    price: req.body.price,
    status: req.body.status,
  };

  const newRad = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { radRequest } },
    { new: true }
  );

  const assignedRad = await EDR.findOneAndUpdate(
    {
      _id: req.body.edrId,
      'radRequest._id': newRad.radRequest[newRad.radRequest.length - 1]._id,
    },
    {
      $set: {
        'radRequest.$.priority': req.body.priority,
        'radRequest.$.requestedBy': req.body.staffId,
        'radRequest.$.requestedAt': Date.now(),
        'radRequest.$.imageTechnicianId': req.body.radTechnicianId,
        'radRequest.$.reason': req.body.reason,
        'radRequest.$.notes': req.body.notes,
      },
    },
    { new: true }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  // Finding Pending Rads for Flag
  const data = {
    taskName: 'Rad Test Delay',
    minutes: 31,
    collectionName: 'Radiology',
    staffId: req.body.radTechnicianId,
    patientId: req.body.edrId,
    onModel: 'EDR',
    generatedFrom: 'Imaging Technician',
    generatedFor: ['Sensei', 'Head Of Radiology Department'],
    card: '1st',
    reason: 'Too Many Rad Tests Pending',
    emittedFor: 'pendingRad',
    requestId: newRad.radRequest[newRad.radRequest.length - 1]._id,
  };

  addFlag(data);

  const data2 = {
    taskName: 'Rad Result Delay',
    minutes: 60,
    collectionName: 'Radiology',
    staffId: req.body.radTechnicianId,
    patientId: req.body.edrId,
    onModel: 'EDR',
    generatedFrom: 'Imaging Technician',
    generatedFor: ['Sensei', 'Head Of Radiology Department'],
    card: '2nd',
    reason: 'Too Many Rad Results Pending',
    emittedFor: 'pendingRad',
    requestId: newRad.radRequest[newRad.radRequest.length - 1]._id,
  };

  addFlag(data2);

  const rads = await EDR.aggregate([
    {
      $project: {
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $or: [
          { 'radRequest.status': 'pending' },
          { 'radRequest.status': 'active' },
          { 'radRequest.status': 'hold' },
        ],
      },
    },
  ]);

  // Rasing Flag
  if (rads.length > 6) {
    await Flag.create({
      edrId: req.body.edrId,
      generatedFrom: 'Imaging Technician',
      card: '1st',
      generatedFor: ['Sensei', 'Head Of Radiology Department'],
      reason: 'Too Many Rad Tests Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Imaging Technician',
      status: 'pending',
      // card: '1st',
    });

    globalVariable.io.emit('pendingRad', flags);
  }

  // Notification
  Notification(
    'Rad Test',
    'Imaging Test Requests',
    'Imaging Technician',
    'ED Doctor',
    '/dashboard/home/radiologyTasks',
    req.body.edrId,
    ''
  );

  Notification(
    'Rad Request',
    'Rad Request',
    'Admin',
    'Rad Request',
    '/dashboard/home/radiologyTasks',
    req.body.edrId,
    ''
  );

  res.status(200).json({
    success: true,
    data: assignedRad,
  });
});

exports.updateRad = asyncHandler(async (req, res, next) => {
  // console.log('req.body', req.body);
  const rad = await EDR.findOne({ _id: req.body.edrId });
  let note;
  for (let i = 0; i < rad.radRequest.length; i++) {
    if (rad.radRequest[i]._id == req.body.radId) {
      // console.log(i);
      note = i;
    }
  }
  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: req.body.addedBy,
    reason: req.body.reason,
  };

  await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $push: {
        [`radRequest.${note}.updateRecord`]: updateRecord,
      },
    },
    { new: true }
  );
  // console.log('note', note);
  const updatedrad = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`radRequest.${note}.notes`]: req.body.notes,
        [`radRequest.${note}.priority`]: req.body.priority,
      },
    },
    { new: true }
  )
    .populate('radRequest.serviceId')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            populate: [
              {
                path: 'rooms.roomId',
                model: 'room',
              },
            ],
          },
        ],
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
      },
      {
        path: 'careStream.careStreamId',
        model: 'careStream',
      },
      {
        path: 'consultationNote.addedBy',
        model: 'staff',
      },
      {
        path: 'consultationNote.consultant',
        model: 'staff',
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'radRequest.serviceId',
        model: 'RadiologyService',
      },
      {
        path: 'radRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'labRequest.serviceId',
        model: 'LaboratoryService',
      },
      {
        path: 'labRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.item.itemId',
        model: 'Item',
      },
      {
        path: 'doctorNotes.addedBy',
        model: 'staff',
      },
      {
        path: 'edNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'eouNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'nurseTechnicianRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'anesthesiologistNote.addedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
      },
    ]);

  res.status(200).json({
    success: true,
    data: updatedrad,
  });
});

exports.getEDRFromPatientForDischarge = asyncHandler(async (req, res) => {
  var array = [];
  var secondArray = [];

  const edr = await EDR.find({ status: { $ne: 'Discharged' } })
    .populate('patientId')
    .select({ patientId: 1 });
  for (let i = 0; i < edr.length; i++) {
    array.push(edr[i].patientId);
  }

  const unique = Array.from(new Set(array));
  for (let i = 0; i < unique.length; i++) {
    const fullName =
      unique[i].name[0].given[0] + ' ' + unique[i].name[0].family;
    if (
      (unique[i].name[0].given[0] &&
        unique[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (unique[i].name[0].family &&
        unique[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (unique[i].identifier[0].value &&
        unique[i].identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (unique[i].telecom[1].value &&
        unique[i].telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (unique[i].nationalID &&
        unique[i].nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      secondArray.push(unique[i]);
    }
  }
  var uniqueArray = (function (secondArray) {
    var m = {},
      uniqueArray = [];
    for (var i = 0; i < secondArray.length; i++) {
      var v = secondArray[i];
      if (!m[v]) {
        uniqueArray.push(v);
        m[v] = true;
      }
    }
    return uniqueArray;
  })(secondArray);
  let response = uniqueArray.slice(0, 50);
  res.status(200).json({ success: true, data: response });
});

exports.getDischargedEDRFromPatient = asyncHandler(async (req, res) => {
  var array = [];
  var secondArray = [];

  const edr = await EDR.find({ status: { $eq: 'Discharged' } })
    .populate('patientId')
    .select({ patientId: 1 });
  for (let i = 0; i < edr.length; i++) {
    array.push(edr[i].patientId);
  }

  const unique = Array.from(new Set(array));
  for (let i = 0; i < unique.length; i++) {
    const fullName =
      unique[i].name[0].given[0] + ' ' + unique[i].name[0].family;
    if (
      (unique[i].name[0].given[0] &&
        unique[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (unique[i].name[0].family &&
        unique[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (unique[i].identifier[0].value &&
        unique[i].identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (unique[i].telecom[1].value &&
        unique[i].telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (unique[i].nationalID &&
        unique[i].nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      secondArray.push(unique[i]);
    }
  }
  var uniqueArray = (function (secondArray) {
    var m = {},
      uniqueArray = [];
    for (var i = 0; i < secondArray.length; i++) {
      var v = secondArray[i];
      if (!m[v]) {
        uniqueArray.push(v);
        m[v] = true;
      }
    }
    return uniqueArray;
  })(secondArray);
  const response = uniqueArray.slice(0, 50);
  res.status(200).json({ success: true, data: response });
});

exports.getEDRFromPatientIdForDischarge = asyncHandler(async (req, res) => {
  const a = await EDR.findOne({ patientId: req.params._id });
  if (a !== null) {
    var edr = await EDR.findOne({ patientId: req.params._id })
      .populate('patientId')
      .populate('consultationNote.requester')
      .populate('consultationNote.specialist')
      .populate({
        path: 'pharmacyRequest',
        populate: [
          {
            path: 'item.itemId',
          },
        ],
      })
      .populate('pharmacyRequest.item.itemId')
      .populate('labRequest.requester')
      .populate('labRequest.serviceId')
      .populate('radRequest.serviceId')
      .populate('radRequest.requester')
      .populate('residentNotes.doctor')
      .populate('residentNotes.doctorRef')
      .populate('dischargeRequest.dischargeMedication.requester')
      .populate('dischargeRequest.dischargeMedication.medicine.itemId')
      .populate('triageAssessment.requester')
      .populate([
        {
          path: 'chiefComplaint.chiefComplaintId',
          model: 'chiefComplaint',
          select: 'chiefComplaintId',
          populate: [
            {
              path: 'productionArea.productionAreaId',
              model: 'productionArea',
              select: 'paName',
            },
          ],
        },
      ])
      .populate('newChiefComplaint.newChiefComplaintId')
      .sort({
        createdAt: 'desc',
      })
      .limit(100);
  }

  if (a) {
    res.status(200).json({ success: true, data: edr });
  } else {
    res.status(200).json({ success: false, data: 'User not found' });
  }
});

exports.updateEdr = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const { _id, requestType } = req.body;
  let edr = await EDR.findById(_id).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      select: 'chiefComplaintId',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          select: 'paName',
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);

  if (!edr) {
    return next(new ErrorResponse(`EDR not found with id of ${_id}`, 404));
  }

  // HouseKeeping Request
  const latestCC = edr.chiefComplaint.length - 1;
  const productionAreaId =
    edr.chiefComplaint[latestCC].chiefComplaintId.productionArea[0]
      .productionAreaId._id;
  const latestRoom = edr.room.length - 1;
  const roomId = edr.room[latestRoom].roomId._id;
  const currentStaff = await Staff.findById(req.body.staffId).select('shift');

  const houseKeepers = await Staff.find({
    disabled: false,
    staffType: 'House Keeping',
    shift: currentStaff.shift,
  });
  const random = Math.floor(Math.random() * (houseKeepers.length - 1));
  const houseKeeper = houseKeepers[random];

  await EDR.findOneAndUpdate(
    { _id: _id },
    { $set: { dischargeTimestamp: Date.now() } },
    {
      new: true,
    }
  );

  // Discharge Request
  edr = await EDR.findOneAndUpdate({ _id: _id }, req.body, {
    new: true,
  }).populate('patientId');

  // Generating Housekeeping Request Id

  const requestNo = generateReqNo('HKID');

  // Creating Housekeeping Request
  const HKRequest = await HK.create({
    requestNo,
    requestedBy: 'Sensei',
    houseKeeperId: houseKeeper._id,
    productionAreaId,
    roomId,
    // status,
    task: 'To Be Clean',
    assignedTime: Date.now(),
  });

  //   HouseKeeping Cron Flag
  const data = {
    taskName: 'To Be Clean',
    minutes: 6,
    collectionName: 'HouseKeeping',
    staffId: houseKeeper._id,
    patientId: _id,
    onModel: 'EDR',
    generatedFrom: 'House Keeping',
    card: '1st',
    generatedFor: [
      'Sensei',
      'Head of patient services',
      'House keeping supervisor',
    ],
    reason: 'Cells/Beds Cleaning Pending',
    emittedFor: 'hkPending',
    requestId: HKRequest._id,
  };

  addFlag(data);

  const roomPending = await HK.find({
    status: 'pending',
    task: 'To Be Clean',
  });

  if (roomPending.length > 9) {
    await Flag.create({
      edrId: _id,
      generatedFrom: 'House Keeping',
      card: '1st',
      generatedFor: [
        'Sensei',
        'Head of patient services',
        'House keeping supervisor',
      ],
      reason: 'Cells/Beds Cleaning Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'House Keeping',
      status: 'pending',
    });
    globalVariable.io.emit('hkPending', flags);
  }

  // HouseKeeping Notification
  Notification(
    'ADT_A03',
    'Clean ED Cell',
    'House Keeping',
    'Sensei',
    '/dashboard/home/housekeepingrequests',
    '',
    _id,
    '',
    ''
  );

  // Social Worker Notifications
  if (
    req.body.dischargeRequest.dischargeSummary.edrCompletionReason ===
    'admitted'
  ) {
    Notification(
      'ADT_A01',
      'Patient Admitted',
      'Social Worker',
      'Admitted',
      '/dashboard/home/taskslistforsocialworker',
      _id,
      ''
    );

    const dischargeTransfer = await CCRequest.find({
      requestedFor: 'Discharge',
      status: 'pending',
      dischargeStatus: 'admitted',
    });

    if (dischargeTransfer.length > 5) {
      await Flag.create({
        edrId: _id,
        generatedFrom: 'Customer Care',
        card: '4th',
        generatedFor: ['Customer Care Director'],
        reason: 'Patient Transfer from ED to IP Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'Customer Care',
        status: 'pending',
      });
      globalVariable.io.emit('ccPending', flags);
    }
  }

  if (
    req.body.dischargeRequest.dischargeSummary.edrCompletionReason ===
    'discharged'
  ) {
    Notification(
      'ADT_A03  ',
      'Patient Discharged',
      'Social Worker',
      'Discharged',
      '/dashboard/home/taskslistforsocialworker',
      edr._id,
      ''
    );
  }

  if (
    req.body.dischargeRequest.dischargeSummary.edrCompletionReason ===
    'transferred'
  ) {
    Notification(
      'ADT_A02',
      'Patient Transferred',
      'Social Worker',
      'Transferred',
      '/dashboard/home/taskslistforsocialworker',
      edr._id,
      ''
    );
  }

  if (
    req.body.dischargeRequest.dischargeSummary.edrCompletionReason ===
    'deceased'
  ) {
    Notification(
      'PID.30',
      'Patient Died',
      'Social Worker',
      'Deceased',
      '/dashboard/home/taskslistforsocialworker',
      edr._id,
      ''
    );
  }

  // Sensei Notifications

  if (
    req.body.dischargeRequest.dischargeSummary.edrCompletionRequirement ===
    'withoutCare'
  ) {
    Notification(
      'ADT_A03',
      'Patient has been discharged/disposition without customer care',
      'Sensei',
      'ED Doctor',
      '/dashboard/home/viewalldischargedpatients',
      _id,
      '',
      ''
    );
  }

  if (
    req.body.dischargeRequest.dischargeSummary.edrCompletionRequirement ===
    'withCare'
  ) {
    // Customer Care Request
    const CCRequestNo = generateReqNo('DDID');
    const customerCares = await Staff.find({
      staffType: 'Customer Care',
      disabled: false,
      shift: currentStaff.shift,
      // availability: true,
    }).select('identifier name shiftStartTime shiftEndTime');

    const randomCC = Math.floor(Math.random() * (customerCares.length - 1));
    const customerCare = customerCares[randomCC];

    const dischargeCC = await CCRequest.create({
      requestNo: CCRequestNo,
      edrId: _id,
      status: 'pending',
      dischargeStatus:
        req.body.dischargeRequest.dischargeSummary.edrCompletionReason,
      staffId: req.body.dischargeRequest.dischargeMedication.requester,
      requestedFor: 'Discharge',
      requestedAt: Date.now(),
      costomerCareId: customerCare._id,
    });
    if (
      req.body.dischargeRequest.dischargeSummary.edrCompletionReason ===
      'admitted'
    ) {
      //   Cron Flag for Customer Care
      const data3 = {
        taskName: 'Discharge To IP Pending',
        minutes: 61,
        collectionName: 'CustomerCare',
        staffId: customerCare._id,
        patientId: _id,
        onModel: 'EDR',
        generatedFrom: 'Customer Care',
        card: '4th',
        generatedFor: ['Customer Care Director'],
        reason: 'Patient Transfer from ED to IP Pending',
        emittedFor: 'ccPending',
        requestId: dischargeCC._id,
      };

      addFlag(data3);
    }
    //   Cron Flag for Customer Care
    const data2 = {
      taskName: 'Discharge Pending',
      minutes: 11,
      collectionName: 'CustomerCare',
      staffId: customerCare._id,
      patientId: _id,
      onModel: 'EDR',
      generatedFrom: 'Customer Care',
      card: '5th',
      generatedFor: ['Customer Care Director'],
      reason: 'Patient Discharge Transfer Pending',
      emittedFor: 'ccPending',
      requestId: dischargeCC._id,
    };

    addFlag(data2);
  }

  const transferRequest = await CCRequest.find({
    requestedFor: 'Discharge',
    status: 'pending',
  });

  if (transferRequest.length > 4) {
    await Flag.create({
      edrId: _id,
      generatedFrom: 'Customer Care',
      card: '5th',
      generatedFor: ['Customer Care Director'],
      reason: 'Patient Discharge Transfer Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Customer Care',
      status: 'pending',
    });
    globalVariable.io.emit('ccPending', flags);
  }

  Notification(
    'ADT_A03',
    'Patient has been discharged/disposition with customer care',
    'Sensei',
    'ED Doctor',
    '/dashboard/home/viewalldischargedpatients',
    _id,
    '',
    ''
  );

  // Notification(
  //   'ADT_A01',
  //   'Patient Admitted',
  //   'House Keeping',
  //   'Sensei',
  //   '/dashboard/home/patientlist',
  //   _id,
  //   ''
  // );

  Notification(
    'ADT_A03',
    'Carry the patient for disposition ',
    'Customer Care',
    'Discharge Request',
    '/dashboard/home/taskslistforcustomercare',
    _id,
    ''
  );

  Notification(
    'ADT_A03  ',
    'Patient has been Discharged',
    'Doctor',
    'Discharged',
    '/dashboard/home/notes',
    _id,
    '',
    'ED Doctor'
  );
  if (edr.currentLocation === 'ED') {
    Notification(
      'ADT_A03  ',
      'Patient has been Discharged',
      'Nurses',
      'ED Doctor',
      '/dashboard/home/notes',
      _id,
      '',
      'ED Nurse'
    );
  }

  if (edr.currentLocation === 'EOU') {
    Notification(
      'ADT_A03  ',
      'Patient has been Discharged',
      'Nurses',
      'ED Doctor',
      '/dashboard/home/notes',
      _id,
      '',
      'EOU Nurse'
    );
  }

  if (req.body.dischargeRequest.dischargeMedication.medicine !== []) {
    Notification(
      'ADT_A03  ',
      'Medication For Discharged',
      'Nurses',
      'Pharmacist',
      '/dashboard/home/viewalldischargedpatients',
      _id,
      '',
      'ED Nurse'
    );

    Notification(
      'ADT_A03  ',
      'Discharge Medication Request',
      'Clinical Pharmacist',
      'Pharmacist',
      '/dashboard/home/pharmanotes',
      _id,
      '',
      ''
    );
  }

  if (edr.paymentMethod === 'Insured') {
    Notification(
      'ADT_A03',
      'Patient Disposition/Discharged',
      'Insurance Claims Manager',
      'Patient Disposition OR Discharged',
      '/dashboard/home/patientmanagement/pendingpatients',
      _id,
      '',
      ''
    );
  }

  Notification(
    'ADT_A03',
    'Discharge Request',
    'Admin',
    'Discharge Requests',
    '/dashboard/home/viewalldischargedpatients',
    _id,
    '',
    ''
  );

  //   Ro Discharge Flag
  const dischargePending = await EDR.find({
    status: 'Discharged',
    socialWorkerStatus: 'pending',
  });

  if (dischargePending.length > 5) {
    await Flag.create({
      edrId: _id,
      generatedFrom: 'Registration Officer',
      card: '5th',
      generatedFor: ['Sensei', 'Cashier'],
      reason: 'Too Many Discharge Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Registration Officer',
      status: 'pending',
    });
    globalVariable.io.emit('pendingRO', flags);
  }

  res.status(200).json({ success: true, data: edr });
});

exports.getEDRorIPR = asyncHandler(async (req, res) => {
  // const rc = await RC.findOne(
  //   { patient: req.params._id },
  //   {},
  //   { sort: { createdAt: -1 } }
  // );
  const a = await EDR.findOne({ patientId: req.params._id });
  if (a !== null) {
    var edr = await EDR.findOne({ patientId: req.params._id })
      .populate('patientId')
      .populate('consultationNote.requester')
      .populate({
        path: 'pharmacyRequest',
        populate: [
          {
            path: 'item.itemId',
          },
        ],
      })
      .populate('doctorNotes.addedBy')

      .populate('pharmacyRequest.item.itemId')

      .populate('labRequest.requestedBy')
      .populate('labRequest.serviceId')

      .populate('radRequest.serviceId')
      .populate('radRequest.requestedBy')

      .populate('residentNotes.doctor')
      .populate('residentNotes.doctorRef')

      .populate('dischargeRequest.dischargeMedication.requester')
      .populate('dischargeRequest.dischargeMedication.medicine.itemId')

      .populate('triageAssessment.requester')
      .sort({
        createdAt: 'desc',
      });
  }

  if (a) {
    // const insurance = await IT.find({ providerId: edr.insurerId });
    // var insured = [];
    // for (let i = 0; i < edr.pharmacyRequest.length; i++) {
    //   for (let j = 0; j < edr.pharmacyRequest[i].item.length; j++) {
    //     for (let k = 0; k < insurance.length; k++) {
    //       if (
    //         JSON.parse(
    //           JSON.stringify(edr.pharmacyRequest[i].item[j].itemId._id)
    //         ) == insurance[k].itemId
    //       ) {
    //         insured.push(insurance[k]);
    //       }
    //     }
    //   }
    // }
    // for (let i = 0; i < edr.labRequest.length; i++) {
    //   for (let j = 0; j < insurance.length; j++) {
    //     if (
    //       JSON.parse(JSON.stringify(edr.labRequest[i].serviceId._id)) ==
    //       insurance[j].laboratoryServiceId
    //     ) {
    //       insured.push(insurance[j]);
    //     }
    //   }
    // }
    // for (let i = 0; i < edr.radiologyRequest.length; i++) {
    //   for (let j = 0; j < insurance.length; j++) {
    //     if (
    //       JSON.parse(JSON.stringify(edr.radiologyRequest[i].serviceId._id)) ==
    //       insurance[j].radiologyServiceId
    //     ) {
    //       insured.push(insurance[j]);
    //     }
    //   }
    // }
    // var uniqueArray = (function (insured) {
    //   var m = {},
    //     uniqueArray = [];
    //   for (var i = 0; i < insured.length; i++) {
    //     var v = insured[i];
    //     if (!m[v]) {
    //       uniqueArray.push(v);
    //       m[v] = true;
    //     }
    //   }
    //   return uniqueArray;
    // })(insured);
    // res
    //   .status(200)
    //   .json({ success: true, data: edr, rc: rc, insured: uniqueArray });

    res.status(200).json({ success: true, data: edr });
  } else {
    res.status(200).json({ success: false, data: 'User not found' });
  }
});

exports.addAnesthesiologistNote = asyncHandler(async (req, res, next) => {
  const anesthesiologistNo = generateReqNo('ANR');

  const parsed = JSON.parse(req.body.data);
  const anesthesiologistNote = {
    anesthesiologistNo,
    addedBy: parsed.addedBy,
    anesthesiologist: parsed.anesthesiologist,
    noteTime: Date.now(),
    notes: parsed.notes,
    voiceNotes: req.file ? req.file.path : null,
  };

  const addedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { anesthesiologistNote } },
    {
      new: true,
    }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

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
        'anesthesiologistNote.status': 'pending',
      },
    },
  ]);

  if (pending.length > 4) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'Anesthesiologist',
      card: '1st',
      generatedFor: ['ED Doctor', 'Head Of Anesthesia Doctor'],
      reason: 'Too many requests pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Anesthesiologist',
      status: 'pending',
    });
    globalVariable.io.emit('anesthesiaPending', flags);
  }

  // 2nd card flag
  const pendingED = await EDR.aggregate([
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
          { 'anesthesiologistNote.status': 'pending' },
          { currentLocation: 'ED' },
        ],
      },
    },
  ]);

  if (pendingED.length > 4) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'Anesthesiologist',
      card: '2nd',
      generatedFor: ['ED Doctor', 'Head Of Anesthesia Doctor'],
      reason: 'Too many requests pending in ED',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Anesthesiologist',
      status: 'pending',
    });
    globalVariable.io.emit('anesthesiaPending', flags);
  }

  Notification(
    'anesthesiologist request',
    'Ed Doctor has requested an anesthesiologist',
    'Sensei',
    'ED Doctor',
    '/dashboard/home/notes',
    parsed.edrId,
    '',
    ''
  );

  Notification(
    'anesthesiologist request',
    'Ed Doctor has requested an anesthesiologist',
    'Admin',
    'ED Doctor',
    '/dashboard/home/notes',
    parsed.edrId,
    '',
    ''
  );

  Notification(
    'anesthesiologist request',
    'Ed Doctor request for anesthesiologist',
    'Doctor',
    'ED Doctor',
    '/dashboard/home/anesthesiarequests',
    parsed.edrId,
    '',
    'Anesthesiologist'
  );
  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.updateAnesthesiologistNote = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  //   const parsed = req.body;
  const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  let note;
  for (let i = 0; i < edrNotes.anesthesiologistNote.length; i++) {
    if (edrNotes.anesthesiologistNote[i]._id == parsed.noteId) {
      note = i;
    }
  }
  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: req.body.addedBy,
    reason: req.body.reason,
  };

  await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $push: {
        [`anesthesiologistNote.${note}.updateRecord`]: updateRecord,
      },
    },
    { new: true }
  );
  const updatedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`anesthesiologistNote.${note}.anesthesiologist`]: parsed.anesthesiologist,
        [`anesthesiologistNote.${note}.notes`]: parsed.notes,
        [`anesthesiologistNote.${note}.voiceNotes`]: req.file
          ? req.file.path
          : parsed.voiceNotes,
      },
    },
    { new: true }
  )
    .populate('anesthesiologistNote.anesthesiologist')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            populate: [
              {
                path: 'rooms.roomId',
                model: 'room',
              },
            ],
          },
        ],
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
      },
      {
        path: 'careStream.careStreamId',
        model: 'careStream',
      },
      {
        path: 'consultationNote.addedBy',
        model: 'staff',
      },
      {
        path: 'consultationNote.consultant',
        model: 'staff',
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'radRequest.serviceId',
        model: 'RadiologyService',
      },
      {
        path: 'radRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'labRequest.serviceId',
        model: 'LaboratoryService',
      },
      {
        path: 'labRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.item.itemId',
        model: 'Item',
      },
      {
        path: 'doctorNotes.addedBy',
        model: 'staff',
      },
      {
        path: 'edNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'eouNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'nurseTechnicianRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'anesthesiologistNote.addedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
      },
    ]);

  // await Staff.findOneAndUpdate(
  //   { _id: parsed.anesthesiologist },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

  res.status(200).json({
    success: true,
    data: updatedNote,
  });
});

exports.addEDNurseRequest = asyncHandler(async (req, res, next) => {
  const requestNo = generateReqNo('EDNR');

  const parsed = JSON.parse(req.body.data);
  const edNurseRequest = {
    requestNo,
    addedBy: parsed.addedBy,
    edNurseId: parsed.edNurse,
    requestedAt: Date.now(),
    notes: parsed.notes,
    voiceNotes: req.file ? req.file.path : null,
    speciality: parsed.speciality,
  };
  const addedRequest = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { edNurseRequest } },
    {
      new: true,
    }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  const EDnurseTasksPending = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        edNurseRequest: 1,
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        'edNurseRequest.status': 'pending',
      },
    },
  ]);

  if (EDnurseTasksPending.length > 6) {
    await Flag.create({
      edrId: parsed.edrId,
      generatedFrom: 'ED Nurse',
      card: '3rd',
      generatedFor: ['Sensei'],
      reason: 'Task Pending From Nurse',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'ED Nurse',
      status: 'pending',
    });
    globalVariable.io.emit('edNursePending', flags);
  }

  res.status(200).json({
    success: true,
    data: addedRequest,
  });
});

exports.updateEDNurseRequest = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);

  const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  let note;
  for (let i = 0; i < edrNotes.edNurseRequest.length; i++) {
    if (edrNotes.edNurseRequest[i]._id == parsed.noteId) {
      note = i;
    }
  }

  const updateRecord = {
    updatedAt: Date.now(),
    reason: parsed.reason,
    updatedBy: parsed.addedBy,
  };

  await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'edNurseRequest._id': parsed.noteId },
    {
      $push: {
        'edNurseRequest.$.updateRecord': updateRecord,
      },
    },

    { new: true }
  );

  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`edNurseRequest.${note}.edNurseId`]: parsed.edNurse,
        [`edNurseRequest.${note}.speciality`]: parsed.speciality,
        [`edNurseRequest.${note}.notes`]: parsed.notes,
        [`edNurseRequest.${note}.status`]: parsed.status,
        [`edNurseRequest.${note}.voiceNotes`]: req.file
          ? req.file.path
          : parsed.voiceNotes,
      },
    },
    { new: true }
  )
    .populate('edNurseRequest.edrNurse')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            populate: [
              {
                path: 'rooms.roomId',
                model: 'room',
              },
            ],
          },
        ],
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
      },
      {
        path: 'careStream.careStreamId',
        model: 'careStream',
      },
      {
        path: 'consultationNote.addedBy',
        model: 'staff',
      },
      {
        path: 'consultationNote.consultant',
        model: 'staff',
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'radRequest.serviceId',
        model: 'RadiologyService',
      },
      {
        path: 'radRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'labRequest.serviceId',
        model: 'LaboratoryService',
      },
      {
        path: 'labRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.item.itemId',
        model: 'Item',
      },
      {
        path: 'doctorNotes.addedBy',
        model: 'staff',
      },
      {
        path: 'edNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'eouNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'nurseTechnicianRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'anesthesiologistNote.addedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
      },
    ]);

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.addEOUNurseRequest = asyncHandler(async (req, res, next) => {
  const requestNo = generateReqNo('EOUNR');

  const parsed = JSON.parse(req.body.data);
  const eouNurseRequest = {
    requestNo,
    addedBy: parsed.addedBy,
    eouNurseId: parsed.eouNurse,
    requestedAt: Date.now(),
    notes: parsed.notes,
    voiceNotes: req.file ? req.file.path : null,
    speciality: parsed.speciality,
  };
  const addedRequest = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { eouNurseRequest } },
    {
      new: true,
    }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  res.status(200).json({
    success: true,
    data: addedRequest,
  });
});

exports.updateEOUNurseRequest = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);

  const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  let note;
  for (let i = 0; i < edrNotes.eouNurseRequest.length; i++) {
    if (edrNotes.eouNurseRequest[i]._id == parsed.noteId) {
      note = i;
    }
  }

  const updateRecord = {
    updatedAt: Date.now(),
    reason: parsed.reason,
    updatedBy: parsed.addedBy,
  };

  await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'eouNurseRequest._id': parsed.noteId },
    {
      $push: {
        'eouNurseRequest.$.updateRecord': updateRecord,
      },
    },

    { new: true }
  );

  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`eouNurseRequest.${note}.eouNurseId`]: parsed.eouNurse,
        [`eouNurseRequest.${note}.speciality`]: parsed.speciality,
        [`eouNurseRequest.${note}.notes`]: parsed.notes,
        [`eouNurseRequest.${note}.status`]: parsed.status,
        [`eouNurseRequest.${note}.voiceNotes`]: req.file
          ? req.file.path
          : parsed.voiceNotes,
      },
    },
    { new: true }
  )
    .populate('eouNurseRequest.eouNurse')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            populate: [
              {
                path: 'rooms.roomId',
                model: 'room',
              },
            ],
          },
        ],
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
      },
      {
        path: 'careStream.careStreamId',
        model: 'careStream',
      },
      {
        path: 'consultationNote.addedBy',
        model: 'staff',
      },
      {
        path: 'consultationNote.consultant',
        model: 'staff',
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'radRequest.serviceId',
        model: 'RadiologyService',
      },
      {
        path: 'radRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'labRequest.serviceId',
        model: 'LaboratoryService',
      },
      {
        path: 'labRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.item.itemId',
        model: 'Item',
      },
      {
        path: 'doctorNotes.addedBy',
        model: 'staff',
      },
      {
        path: 'edNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'eouNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'nurseTechnicianRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'anesthesiologistNote.addedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
      },
    ]);

  Notification(
    'Required An Assistance',
    'Required An Assistance',
    'Nurses',
    'EOU Requests',
    '/dashboard/home/nurseTasks',
    parsed.edrId,
    '',
    'EOU Nurse'
  );

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.addNurseTechnicianRequest = asyncHandler(async (req, res, next) => {
  const requestNo = generateReqNo('NTR');
  const parsed = JSON.parse(req.body.data);

  const nurseTechnicianRequest = {
    requestNo,
    addedBy: parsed.addedBy,
    nurseTechnicianId: parsed.nurseTechnician,
    requestedAt: Date.now(),
    notes: parsed.notes,
    voiceNotes: req.file ? req.file.path : null,
    speciality: parsed.speciality,
  };
  const addedRequest = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { nurseTechnicianRequest } },
    {
      new: true,
    }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  Notification(
    'patient assigned',
    'New Patient Assigned',
    'Nurses',
    'ED Doctor',
    '/dashboard/home/nursetechnician',
    parsed.edrId,
    '',
    'Nurse Technician'
  );

  res.status(200).json({
    success: true,
    data: addedRequest,
  });
});

exports.updateNurseTechnicianRequest = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);

  const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  let note;
  for (let i = 0; i < edrNotes.nurseTechnicianRequest.length; i++) {
    if (edrNotes.nurseTechnicianRequest[i]._id == parsed.noteId) {
      note = i;
    }
  }

  const updateRecord = {
    updatedAt: Date.now(),
    reason: parsed.reason,
    updatedBy: parsed.addedBy,
  };

  await EDR.findOneAndUpdate(
    { _id: parsed.edrId, 'nurseTechnicianRequest._id': parsed.noteId },
    {
      $push: {
        'nurseTechnicianRequest.$.updateRecord': updateRecord,
      },
    },

    { new: true }
  );

  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`nurseTechnicianRequest.${note}.nurseTechnicianId`]: parsed.nurseTechnician,
        [`nurseTechnicianRequest.${note}.speciality`]: parsed.speciality,
        [`nurseTechnicianRequest.${note}.notes`]: parsed.notes,
        [`nurseTechnicianRequest.${note}.voiceNotes`]: req.file
          ? req.file.path
          : parsed.voiceNotes,
      },
    },
    { new: true }
  )
    .populate('nurseTechnicianRequest.nurseTechnicianId')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            populate: [
              {
                path: 'rooms.roomId',
                model: 'room',
              },
            ],
          },
        ],
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'patientId',
        model: 'patientfhir',
      },
      {
        path: 'careStream.careStreamId',
        model: 'careStream',
      },
      {
        path: 'consultationNote.addedBy',
        model: 'staff',
      },
      {
        path: 'consultationNote.consultant',
        model: 'staff',
      },
      {
        path: 'room.roomId',
        model: 'room',
      },
      {
        path: 'radRequest.serviceId',
        model: 'RadiologyService',
      },
      {
        path: 'radRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'labRequest.serviceId',
        model: 'LaboratoryService',
      },
      {
        path: 'labRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.requestedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.item.itemId',
        model: 'Item',
      },
      {
        path: 'doctorNotes.addedBy',
        model: 'staff',
      },
      {
        path: 'edNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'eouNurseRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'nurseTechnicianRequest.addedBy',
        model: 'staff',
      },
      {
        path: 'anesthesiologistNote.addedBy',
        model: 'staff',
      },
      {
        path: 'pharmacyRequest.reconciliationNotes.addedBy',
        model: 'staff',
      },
    ]);

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.getDischargedEDR = asyncHandler(async (req, res) => {
  const edr = await EDR.find({ status: 'Discharged' }).populate('patientId');
  res.status(200).json({ success: true, data: edr });
});

exports.searchDischargedEDR = asyncHandler(async (req, res) => {
  const patients = await EDR.find({ status: 'Discharged' }).populate(
    'patientId'
  );
  const arr = searchPatient(req, patients);
  res.status(200).json({
    success: true,
    data: arr,
  });
});

//* Alternate Search
// exports.searchDischargedEDR = asyncHandler(async (req, res, next) => {
//   const patients = await Patient.find({
//     $text: { $search: req.params.keyword, $caseSensitive: false },
//   });

//   const promises = patients.map(async (p) =>
//     EDR.find({ $and: [{ patientId: p._id }, { status: 'Discharged' }] })
//   );
//   let patient = await Promise.all(promises);
//   patient = patient.filter(String);
//   res.status(200).json({
//     success: true,
//     data: patient,
//   });
// });

exports.getCompletedEDR = asyncHandler(async (req, res) => {
  const edr = await EDR.find({ status: { $eq: 'Completed' } }).populate(
    'patientId'
  );
  res.status(200).json({ success: true, data: edr });
});

exports.getAllPendingLabRequests = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    status: { $eq: 'pending' },
  })
    .populate('patientId')
    .populate({
      path: 'labRequest',
      populate: {
        path: 'serviceId',
      },
    });

  let response = [];
  for (let i = 0; i < edr.length; i++) {
    for (let j = 0; j < edr[i].labRequest.length; j++) {
      if (edr[i].labRequest[j].status === 'pending') {
        let obj = JSON.parse(JSON.stringify(edr[i]));
        obj.labRequest = edr[i].labRequest[j];
        response.push(obj);
      }
    }
  }

  res.status(200).json({ success: true, data: response });
});

exports.getAllCompletedLabRequests = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    status: { $eq: 'pending' },
  })
    .populate('patientId')
    .populate({
      path: 'labRequest',
      populate: {
        path: 'serviceId',
      },
    });
  let response = [];

  for (let i = 0; i < edr.length; i++) {
    for (let j = 0; j < edr[i].labRequest.length; j++) {
      if (edr[i].labRequest[j].status === 'completed') {
        let obj = JSON.parse(JSON.stringify(edr[i]));
        obj.labRequest = edr[i].labRequest[j];
        response.push(obj);
      }
    }
  }
  res.status(200).json({ success: true, data: response });
});

exports.getAllPendingRadRequests = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    status: { $eq: 'pending' },
  })
    .populate('patientId')
    .populate({
      path: 'radRequest',
      populate: {
        path: 'serviceId',
      },
    });

  let response = [];
  for (let i = 0; i < edr.length; i++) {
    for (let j = 0; j < edr[i].radRequest.length; j++) {
      if (edr[i].radRequest[j].status === 'pending') {
        let obj = JSON.parse(JSON.stringify(edr[i]));
        obj.radRequest = edr[i].radRequest[j];
        response.push(obj);
      }
    }
  }

  res.status(200).json({ success: true, data: response });
});

exports.getAllCompletedRadRequests = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    status: { $eq: 'pending' },
  })
    .populate('patientId')
    .populate({
      path: 'radRequest',
      populate: {
        path: 'serviceId',
      },
    });

  let response = [];
  for (let i = 0; i < edr.length; i++) {
    for (let j = 0; j < edr[i].radRequest.length; j++) {
      if (edr[i].radRequest[j].status === 'completed') {
        let obj = JSON.parse(JSON.stringify(edr[i]));
        obj.radRequest = edr[i].radRequest[j];
        response.push(obj);
      }
    }
  }

  res.status(200).json({ success: true, data: response });
});

exports.addPharmacyRequest = asyncHandler(async (req, res, next) => {
  const pharmacyRequestNo = generateReqNo('PHR');
  const pharmacyObj = {
    ...req.body,
    pharmacyRequestNo,
    generatedFrom: 'Medication Request',
  };

  const addedNote = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { pharmacyRequest: pharmacyObj } },
    {
      new: true,
    }
  ).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
  ]);

  // Flags
  const pharmacyPending = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        'pharmacyRequest.status': { $ne: 'closed' },
      },
    },
  ]);
  if (pharmacyPending.length > 4) {
    await Flag.create({
      edrId: req.body.edrId,
      generatedFrom: 'ED Doctor',
      card: '7th',
      generatedFor: ['ED Doctor', 'Medical Director'],
      reason: 'Pharmacy Requests Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'ED Doctor',
      status: 'pending',
    });
    globalVariable.io.emit('pendingDoctor', flags);
  }

  //  Clinical Pharmacist Flag
  if (pharmacyPending.length > 5) {
    await Flag.create({
      edrId: req.body.edrId,
      generatedFrom: 'Clinical Pharmacist',
      card: '1st',
      generatedFor: 'Pharmacy Manager',
      reason: 'Pharmacy Requests Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Clinical Pharmacist',
      status: 'pending',
    });
    globalVariable.io.emit('cpPending', flags);
  }
  Notification(
    'Medication Request',
    'ED Doctor has requested Medication from Clinical Pharmacist for',
    //+ addedNote.patientId.name,
    'Sensei',
    'ED Doctor',
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    ''
  );
  Notification(
    'Medication Requests',
    'Medication Requests',
    'Admin',
    'Medication Requests',
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    ''
  );

  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.updatePharmcayRequest = asyncHandler(async (req, res, next) => {
  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: req.body.requestedBy,
    reason: req.body.reason,
  };

  await EDR.findOneAndUpdate(
    { _id: req.body.edrId, 'pharmacyRequest._id': req.body._id },
    {
      $push: {
        'pharmacyRequest.$.updateRecord': updateRecord,
      },
    },
    { new: true }
  );
  const addedNote = await EDR.findOneAndUpdate(
    { _id: req.body.edrId, 'pharmacyRequest._id': req.body._id },
    {
      $set: {
        'pharmacyRequest.$.item': req.body.item,
        'pharmacyRequest.$.status': req.body.status,
        'pharmacyRequest.$.secondStatus': req.body.secondStatus,
        'pharmacyRequest.$.reconciliationNotes': req.body.reconciliationNotes,
        'pharmacyRequest.$.updatedAt': new Date().toISOString(),
      },
    },
    {
      new: true,
    }
  );

  Notification(
    'Medication',
    'Medication updated',
    'Nurses',
    'ED Doctor',
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    'ED Nurse'
  );

  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.deliverPharmcayRequest = asyncHandler(async (req, res, next) => {
  const currentStaff = await Staff.findById(req.body.pharmacist).select(
    'shift'
  );

  const customerCares = await Staff.find({
    staffType: 'Customer Care',
    disabled: false,
    shift: currentStaff.shift,
    // availability: true,
  }).select('identifier name shiftStartTime shiftEndTime');
  const randomCC = Math.floor(Math.random() * (customerCares.length - 1));
  // console.log(randomCC);
  const customerCare = customerCares[randomCC];

  const addedNote = await EDR.findOne({
    _id: req.body.edrId,
    'pharmacyRequest._id': req.body._id,
  }).populate('pharmacyRequest.item.itemId');

  let singlePharmaRequest;
  for (let i = 0; i < addedNote.pharmacyRequest.length; i++) {
    if (addedNote.pharmacyRequest[i]._id == req.body._id) {
      singlePharmaRequest = addedNote.pharmacyRequest[i];
    }
  }

  for (let i = 0; i < singlePharmaRequest.item.length; i++) {
    singlePharmaRequest.item[i].price =
      singlePharmaRequest.item[i].itemId.issueUnitCost;
  }

  const response = await EDR.findOneAndUpdate(
    { _id: req.body.edrId, 'pharmacyRequest._id': req.body._id },
    {
      $set: {
        'pharmacyRequest.$.status': req.body.status,
        'pharmacyRequest.$.secondStatus': req.body.secondStatus,
        'pharmacyRequest.$.updatedAt': new Date().toISOString(),
        'pharmacyRequest.$.progressStartTime': req.body.progressStartTime,
        'pharmacyRequest.$.pharmacist': req.body.pharmacist,
        'pharmacyRequest.$.item': singlePharmaRequest.item,
        'pharmacyRequest.$.customerCareId': customerCare._id,
      },
    },
    {
      new: true,
    }
  );

  Notification(
    'Carry Medications',
    'Carry Medications from Pharmacist to ED Bed',
    'Customer Care',
    'Medications Request',
    '/dashboard/home/taskslistforcustomercare',
    req.body.edrId,
    ''
  );

  //   Cron Flag for Customer Care
  const data = {
    taskName: 'Medication Pending',
    minutes: 9,
    collectionName: 'CustomerCare',
    staffId: customerCare._id,
    patientId: req.body.edrId,
    onModel: 'EDR',
    generatedFrom: 'Customer Care',
    card: '3rd',
    generatedFor: ['Customer Care Director'],
    reason: 'Pharma Transfer to ED/EOU Pending',
    emittedFor: 'ccPending',
    requestId: req.body._id,
  };

  addFlag(data);

  const pharmacyRequest = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        'pharmacyRequest.status': 'in_progress',
      },
    },
  ]);

  if (pharmacyRequest.length > 6) {
    await Flag.create({
      edrId: req.body.edrId,
      generatedFrom: 'Customer Care',
      card: '3rd',
      generatedFor: ['Customer Care Director'],
      reason: 'Pharma Transfer to ED/EOU Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Customer Care',
      status: 'pending',
    });
    globalVariable.io.emit('ccPending', flags);
  }

  res.status(200).json({
    success: true,
    data: response,
  });
});

exports.getAllDeliverInProgessPharmaRequest = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    pharmacyRequest: { $gt: [] },
  })
    .populate('patientId')
    .populate('doctorNotes.addedBy')
    .populate('pharmacyRequest.item.itemId')
    .populate('pharmacyRequest.requestedBy')
    .populate('pharmacyRequest.reconciliationNotes.addedBy')
    .populate('chiefComplaint.chiefComplaintId')
    .populate({
      path: 'chiefComplaint.chiefComplaintId',
      populate: {
        path: 'productionArea.productionAreaId',
      },
    })
    .populate('room.roomId')
    .select({
      patientId: 1,
      pharmacyRequest: 1,
      chiefComplaint: 1,
      doctorNotes: 1,
    });

  let response = [];
  for (let i = 0; i < edr.length; i++) {
    for (let j = 0; j < edr[i].pharmacyRequest.length; j++) {
      if (
        (edr[i].pharmacyRequest[j].status === 'in_progress' ||
          edr[i].pharmacyRequest[j].status === 'complete') &&
        edr[i].pharmacyRequest[j].generatedFrom === req.params.requestType
      ) {
        let obj = JSON.parse(JSON.stringify(edr[i]));
        obj.pharmacyRequest = [edr[i].pharmacyRequest[j]];
        response.push(obj);
      }
    }
  }

  res.status(200).json({ success: true, data: response });
});

exports.getEDRsWithPharmacyRequest = asyncHandler(async (req, res) => {
  const edr = await EDR.find({
    status: { $eq: 'pending' },
    pharmacyRequest: { $gt: [] },
  })
    .populate('patientId')
    .populate('doctorNotes.addedBy')
    .populate('pharmacyRequest.item.itemId')
    .populate('pharmacyRequest.requestedBy')
    .populate('pharmacyRequest.reconciliationNotes.addedBy')
    .populate('chiefComplaint.chiefComplaintId')
    .populate({
      path: 'chiefComplaint.chiefComplaintId',
      populate: {
        path: 'productionArea.productionAreaId',
      },
    })
    .populate('room.roomId')
    .select({
      patientId: 1,
      pharmacyRequest: 1,
      chiefComplaint: 1,
      doctorNotes: 1,
    });

  let response = [];
  for (let i = 0; i < edr.length; i++) {
    for (let j = 0; j < edr[i].pharmacyRequest.length; j++) {
      if (
        edr[i].pharmacyRequest[j].status === 'pending' &&
        edr[i].pharmacyRequest[j].generatedFrom === req.params.requestType
      ) {
        let obj = JSON.parse(JSON.stringify(edr[i]));
        obj.pharmacyRequest = [edr[i].pharmacyRequest[j]];
        response.push(obj);
      }
    }
  }
  res.status(200).json({ success: true, data: response });
});
// Search edr where edr status is not completed
exports.getNurseEdrByKeyword = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({ status: { $ne: 'completed' } })
    .select('patientId')
    .populate('patientId', 'name identifier telecom nationalID gender age');

  const arr = searchPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getAllEDRByKeyword = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    $and: [{ status: { $ne: 'Completed' } }, { status: { $ne: 'completed' } }],
  })
    .select('patientId')
    .populate('patientId', 'name identifier telecom nationalID gender age');
  console.log(patients.length);

  const arr = searchPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

// Search All EDR
exports.searchAllEdrs = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find().populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
    {
      path: 'careStream.careStreamId',
      model: 'careStream',
    },
    {
      path: 'consultationNote.addedBy',
      model: 'staff',
    },
    {
      path: 'consultationNote.consultant',
      model: 'staff',
    },
    {
      path: 'room.roomId',
      model: 'room',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
    {
      path: 'radRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'labRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.requestedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
    {
      path: 'doctorNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'edNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'eouNurseRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'nurseTechnicianRequest.addedBy',
      model: 'staff',
    },
    {
      path: 'anesthesiologistNote.addedBy',
      model: 'staff',
    },
    {
      path: 'pharmacyRequest.reconciliationNotes.addedBy',
      model: 'staff',
    },
    {
      path: 'newChiefComplaint.newChiefComplaintId',
      model: 'NewChiefComplaint',
    },
  ]);

  const arr = searchPatient(req, patients);
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchEdr = asyncHandler(async (req, res, next) => {
  const edrId = await EDR.aggregate([
    {
      $match: {
        requestNo: { $regex: req.params.keyword, $options: 'i' },
      },
    },
  ]);
  const edr = await EDR.populate(edrId, [
    {
      path: 'patientId',
      select: 'name identifier',
    },
  ]);
  res.status(200).json({
    success: true,
    data: edr,
  });
});

exports.getEdrByRequestNo = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findOne({ requestNo: req.params.requestNo }).populate(
    'patientId',
    'name identifier'
  );

  res.status(200).json({
    success: true,
    data: edr,
  });
});
