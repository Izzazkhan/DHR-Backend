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

exports.generateEDR = asyncHandler(async (req, res, next) => {
  console.log('request body', req.body);
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  let newEDR;
  const patient = await Patient.findOne({ _id: req.body.patientId });
  const requestNo = `EDR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;
  const dcdFormVersion = [
    {
      versionNo: patient.identifier[0].value + '-' + requestNo + '-' + '1',
    },
  ];
  // console.log(patient);
  // console.log(patient.paymentMethod[0].payment);
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
    createdTimeStamp: Date.now(),
  });

  await EDR.findOneAndUpdate(
    { _id: newEDR._id },
    {
      $set: {
        dcdForm: dcdFormVersion,
        generatedFrom: generatedFrom,
        patientInHospital: patientInHospital,
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
  console.log('edr created', newEDR);
  newEDR = await EDR.findOne({ _id: newEDR._id }).populate('patientId');
  // * Sending Notifications

  // Notification from Paramedics
  // if (newEDR.generatedFrom === 'Paramedics') {
  //   Notification(
  //     'ADT_A04',
  //     'Details from Paramedics',
  //     'Registration Officer',
  //     'Paramedics',
  //     '/dashboard/home/pendingregistration',
  //     newEDR._id,
  //     '',
  //     ''
  //   );
  // }

  // if (newEDR.generatedFrom === 'Sensei') {
  //   Notification(
  //     'ADT_A04',
  //     'Details from Sensei',
  //     'Registration Officer',
  //     'Sensei',
  //     '/dashboard/home/pendingregistration',
  //     newEDR._id,
  //     '',
  //     ''
  //   );
  // }

  // Notification(
  //   'ADT_A01',
  //   'New Patient Arrived',
  //   'Doctor',
  //   'Paramedics',
  //   '/dashboard/home/patientmanagement/careStreamPatients',
  //   newEDR._id,
  //   '',
  //   'ED Doctor'
  // );

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
  // const latestForm = edr.dcdForm.length - 1;
  // console.log(edr);
  res.status(200).json({
    success: true,
    data: edr,
  });
});

exports.getEdrsByPatient = asyncHandler(async (req, res, next) => {
  const edrs = await EDR.find({ patientId: req.params.id });
  // console.log(edrs.length);
});

exports.getEDRs = asyncHandler(async (req, res, next) => {
  const Edrs = await EDR.find({ patientInHospital: true })
    .populate('patientId')
    .populate('chiefComplaint.chiefComplaintId', 'name')
    .populate('room.roomId')
    .select(
      'patientId dcdFormStatus status labRequest careStream room requestNo radRequest'
    );
  res.status(201).json({
    success: true,
    count: Edrs.length,
    data: Edrs,
  });
});

exports.getPendingEDRs = asyncHandler(async (req, res, next) => {
  const Edrs = await EDR.find({ status: 'pending', patientInHospital: true })
    .select(
      'patientId dcdFormStatus status labRequest radRequest patientInHospital'
    )
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
        // select: 'identifier name',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);
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
  const arr = [];
  const patients = await EDR.find({ patientInHospital: true })
    .populate('patientId')
    .populate('chiefComplaint.chiefComplaintId')
    .populate('room.roomId');

  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getPendingEdrByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    status: 'pending',
    patientInHospital: true,
  }).populate('patientId');

  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getSenseiPendingEdrByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    status: 'pending',
    generatedFrom: 'Sensei',
    patientInHospital: true,
  }).populate('patientId');

  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
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
  );

  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.updateDoctorNotes = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  // const parsed = req.body;
  const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  let note;
  for (let i = 0; i < edrNotes.doctorNotes.length; i++) {
    if (edrNotes.doctorNotes[i]._id == parsed.noteId) {
      // console.log(i);
      note = i;
    }
  }
  const updatedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`doctorNotes.${note}.notes`]: parsed.notes,
        [`doctorNotes.${note}.code`]: parsed.code,
        [`doctorNotes.${note}.section`]: parsed.section,
        [`doctorNotes.${note}.voiceNotes`]: req.file
          ? req.file.path
          : parsed.voiceNotes,
      },
    },
    { new: true }
  );
  // console.log(updatedNote);
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
  // console.log(req.body);
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  // Sample Collection Task
  const currentStaff = await Staff.findById(req.body.staffId).select('shift');

  const nurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'Nurse Technician',
    disabled: false,
    shift: currentStaff.shift,
    // availability: true,
  }).select('identifier name shiftStartTime shiftEndTime');

  const random = Math.floor(Math.random() * (nurses.length - 1));
  const nurseTechnician = nurses[random];

  const requestId = `LR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

  const labRequest = {
    requestId,
    name: req.body.name,
    serviceId: req.body.serviceId,
    type: req.body.type,
    price: req.body.price,
    status: req.body.status,
    priority: req.body.priority,
    requestedBy: req.body.staffId,
    requestedAt: Date.now(),
    assignedTo: nurseTechnician._id,
    reason: req.body.reason,
    notes: req.body.notes,
  };
  const assignedLab = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { labRequest } },
    { new: true }
  ).populate('labRequest.serviceId');

  Notification(
    'Lab Test',
    'Lab Test Request',
    'Lab Technician',
    'ED Doctor',
    '/dashboard/taskslist',
    req.body.edrId,
    ''
  );

  res.status(200).json({
    success: true,
    data: assignedLab,
  });
});

exports.updateLab = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const lab = await EDR.findOne({ _id: req.body.edrId });
  let note;
  for (let i = 0; i < lab.labRequest.length; i++) {
    if (lab.labRequest[i]._id == req.body.labId) {
      // console.log(i);
      note = i;
    }
  }
  const updatedLab = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`labRequest.${note}.notes`]: req.body.notes,
        [`labRequest.${note}.priority`]: req.body.priority,
      },
    },
    { new: true }
  ).populate('labRequest.serviceId');

  res.status(200).json({
    success: true,
    data: updatedLab,
  });
});

exports.addConsultationNote = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const requestNo = `CN${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

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
  );
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
  }
  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.updateConsultationNote = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  // const parsed = req.body;
  // console.log(parsed);
  const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  let note;
  for (let i = 0; i < edrNotes.consultationNote.length; i++) {
    if (edrNotes.consultationNote[i]._id == parsed.noteId) {
      // console.log(i);
      note = i;
    }
  }
  // console.log(note);
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
  ).populate('consultationNote.consultant');
  // await EDR.findOne({ _id: parsed.edrId }).populate(
  //
  // );
  // console.log(updatedNote);
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

  // const parsed = req.body;
  // console.log(parsed);
  // const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  // let note;
  // for (let i = 0; i < edrNotes.consultationNote.length; i++) {
  //   if (edrNotes.consultationNote[i]._id == parsed.noteId) {
  //     // console.log(i);
  //     note = i;
  //   }
  // }
  // // console.log(note);
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
  // console.log(req.body);
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  const requestId = `RR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

  const radRequest = {
    requestId,
    name: req.body.name,
    serviceId: req.body.serviceId,
    type: req.body.type,
    price: req.body.price,
    status: req.body.status,
    priority: req.body.priority,
    requestedBy: req.body.staffId,
    requestedAt: Date.now(),
    reason: req.body.reason,
    notes: req.body.notes,
  };
  const assignedRad = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { radRequest } },
    { new: true }
  ).populate('radRequest.serviceId');

  // Finding Pending Rads for Flag
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
      generatedFrom: 'Rad Technician',
      card: '1st',
      generatedFor: 'Sensei',
      reason: 'Too Many Rad Tests Pending',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Rad Technician',
      card: '1st',
    }).countDocuments();
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
  ).populate('radRequest.serviceId');

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
  let response = uniqueArray.slice(0, 50);
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

  // Discharge Request
  edr = await EDR.findOneAndUpdate({ _id: _id }, req.body, {
    new: true,
  }).populate('patientId');

  // Generating Housekeeping Request Id
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const requestNo = 'HKID' + day + requestNoFormat(new Date(), 'yyHHMMss');

  // Creating Housekeeping Request
  await HK.create({
    requestNo,
    requestedBy: 'Sensei',
    houseKeeperId: houseKeeper._id,
    productionAreaId,
    roomId,
    // status,
    task: 'To Be Clean',
    assignedTime: Date.now(),
  });

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
      '/dashboard/home/patientlist',
      '',
      ''
    );
  }

  if (
    req.body.dischargeRequest.dischargeSummary.edrCompletionRequirement ===
    'withCare'
  ) {
    // Customer Care Request
    const CCRequestNo = 'DDID' + day + requestNoFormat(new Date(), 'yyHHMMss');
    const customerCares = await Staff.find({
      staffType: 'Customer Care',
      disabled: false,
      shift: currentStaff.shift,
      // availability: true,
    }).select('identifier name shiftStartTime shiftEndTime');

    const randomCC = Math.floor(Math.random() * (customerCares.length - 1));
    const customerCare = customerCares[randomCC];

    await CCRequest.create({
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
  }

  Notification(
    'ADT_A03',
    'Patient has been discharged/disposition with customer care',
    'Sensei',
    'ED Doctor',
    '/dashboard/home/patientlist',
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

  if (req.body.dischargeRequest.dischargeMedication.medicine !== []) {
    Notification(
      'ADT_A03  ',
      'Medication For Discharged',
      'Nurses',
      'Pharmacist',
      '/dashboard/home/notes',
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

  Notification(
    'ADT_A03',
    'Patient Disposition/Discharged',
    'Insurance Claim Manager',
    'Patient Disposition OR Discharged',
    '/dashboard/home/patientmanagement/pendingpatients',
    '',
    _id,
    ''
  );
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
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const anesthesiologistNo = `ANR${day}${requestNoFormat(
    new Date(),
    'yyHHMM'
  )}`;

  const parsed = JSON.parse(req.body.data);
  // console.log(parsed);
  // console.log(parsed.anesthesiologist);
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
  );

  // await Staff.findOneAndUpdate(
  //   { _id: parsed.anesthesiologist },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

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
    'Ed Doctor request for anesthesiologist',
    'Doctor',
    'ED Doctor',
    '/dashboard/home/notes',
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
  const edrNotes = await EDR.findOne({ _id: parsed.edrId });

  let note;
  for (let i = 0; i < edrNotes.anesthesiologistNote.length; i++) {
    if (edrNotes.anesthesiologistNote[i]._id == parsed.noteId) {
      note = i;
    }
  }
  // console.log(note);
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
  ).populate('anesthesiologistNote.anesthesiologist');

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
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const requestNo = `EDNR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

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
  );

  // await Staff.findOneAndUpdate(
  //   { _id: parsed.edNurse },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

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
  ).populate('edNurseRequest.edrNurse');

  // await Staff.findOneAndUpdate(
  //   { _id: parsed.edNurse },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.addEOUNurseRequest = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const requestNo = `EOUNR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

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
  );

  // await Staff.findOneAndUpdate(
  //   { _id: parsed.edNurse },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

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
  ).populate('eouNurseRequest.eouNurse');

  // await Staff.findOneAndUpdate(
  //   { _id: parsed.edNurse },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.addNurseTechnicianRequest = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const requestNo = `NTR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

  const parsed = JSON.parse(req.body.data);
  // console.log(parsed);
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
  );

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
  // await Staff.findOneAndUpdate(
  //   { _id: parsed.edNurse },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

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
  ).populate('nurseTechnicianRequest.nurseTechnicianId');

  // await Staff.findOneAndUpdate(
  //   { _id: parsed.edNurse },
  //   { $set: { availability: false } },
  //   { new: true }
  // );

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.getDischargedEDR = asyncHandler(async (req, res) => {
  const edr = await EDR.find({ status: { $eq: 'Discharged' } }).populate(
    'patientId'
  );
  res.status(200).json({ success: true, data: edr });
});

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
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const pharmacyRequestNo = `PHR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

  // console.log(req.body);
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
  ).populate('patientId');

  Notification(
    'Medication Request',
    'ED Doctor has requested Medication from Clinical Pharmacist for' +
      addedNote.patientId.name,
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
  const arr = [];
  const patients = await EDR.find({ status: { $ne: 'completed' } })
    .select('patientId')
    .populate('patientId', 'name identifier telecom nationalID gender age');

  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
      break;
    }
  }
  // const patientArr = [];
  // for (let i = 0; i < patients.length; i++) {
  //   if (patients[i]._id == arr[arr.length - 1]._id) {
  //     patientArr.push(patients[i]);
  //     break;
  //   }
  // }
  // console.log(patientArr);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getAllEDRByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({
    $and: [{ status: { $ne: 'Completed' } }, { status: { $ne: 'completed' } }],
  })
    .select('patientId')
    .populate('patientId', 'name identifier telecom nationalID gender age');
  console.log(patients.length);

  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  // const patientArr = [];
  // for (let i = 0; i < patients.length; i++) {
  //   if (patients[i]._id == arr[arr.length - 1]._id) {
  //     patientArr.push(patients[i]);
  //     break;
  //   }
  // }
  // console.log(patientArr);

  res.status(200).json({
    success: true,
    data: arr,
  });
});
