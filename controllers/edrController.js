const requestNoFormat = require('dateformat');
// const moment = require('moment');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Patient = require('../models/patient/patient');
const HK = require('../models/houseKeepingRequest');
const Staff = require('../models/staffFhir/staff');
const CCRequest = require('../models/customerCareRequest');

exports.generateEDR = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
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

  const paymentMethod = patient.paymentMethod[0].payment;
  const {
    patientId,
    staffId,
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
    generatedBy: staffId,
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
    // paymentMethod,
    claimed,
    generatedFrom,
    patientInHospital,
  });

  await EDR.findOneAndUpdate(
    { _id: newEDR._id },
    {
      $set: {
        dcdForm: dcdFormVersion,
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
    .select('patientId dcdFormStatus status labRequest radiologyRequest');
  // res.status(201).json({
  //   success: true,
  //   count: Edrs.length,
  //   data: Edrs,
  // });

  let currentTime = new Date();
  // console.log(currentTime);
  currentTime = currentTime.toISOString().split('T')[1];
  // currentTime = currentTime.split('T')[1];
  console.log(currentTime);
  const nurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'Nurse Technician',
    // disabled: false,
    // availability: true,
  }).select('identifier name shiftStartTime shiftEndTime');
  // console.log(nurses);
  let startTime;
  let endTime;
  for (let i = 0; i < nurses.length; i++) {
    startTime = nurses[i].shiftStartTime.toISOString().split('T')[1];
    endTime = nurses[i].shiftEndTime.toISOString().split('T')[1];
  }
  // if(startTime > )
  console.log(startTime);
  console.log(endTime);
});
exports.getPendingEDRs = asyncHandler(async (req, res, next) => {
  const Edrs = await EDR.find({ status: 'pending', patientInHospital: true })
    .populate('patientId')
    .populate('chiefComplaint.chiefComplaintId', 'name')
    .select('patientId dcdFormStatus status labRequest radiologyRequest');
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
      'patientId dcdFormStatus status labRequest radiologyRequest generatedFrom patientInHospital'
    );
  res.status(201).json({
    success: true,
    count: Edrs.length,
    data: Edrs,
  });
});

exports.getEdrPatientByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find({ patientInHospital: true }).populate(
    'patientId'
  );

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

  const currentTime = Date.now();
  const nurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'Nurse Technician',
    disabled: false,
    availability: true,
    $and: [
      { shiftStartTime: { $lte: currentTime } },
      { shiftEndTime: { $gte: currentTime } },
    ],
  }).select('identifier name');

  const random = Math.floor(Math.random() * (nurses.length - 1));
  const nurseTechnician = nurses[random];
  const nurseTechnicianId = nurseTechnician._id;

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
    assignedTo: nurseTechnicianId,
    reason: req.body.reason,
    notes: req.body.notes,
  };
  const assignedLab = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { labRequest } },
    { new: true }
  ).populate('labRequest.serviceId');

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
    requestNo,
    addedBy: parsed.addedBy,
    consultant: parsed.consultant,
    noteTime: Date.now(),
    notes: parsed.notes,
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
  // console.log(addedNote);
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
  // const edrCheck = await EDR.find({ _id: req.body.edrId }).populate(
  //   'patientId labRequest.serviceId'
  // );
  // const latestEdr = edrCheck.length - 1;
  // const latestLabRequest = edrCheck[0].labRequest.length - 1;
  // const updatedRequest = latestLabRequest + 2;

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
  // console.log('updaterad', updatedrad);

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
      .populate('radiologyRequest.serviceId')
      .populate('radiologyRequest.requester')
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
  console.log(req.body);
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
  let houseKeeperId;
  houseKeeperId = await Staff.findOne({
    availability: true,
    disabled: false,
    staffType: 'House Keeping',
  });
  if (!houseKeeperId) {
    return next(new ErrorResponse('No House Keeper Available this Time'));
  }
  houseKeeperId = houseKeeperId._id;

  // Discharge Request
  edr = await EDR.findOneAndUpdate({ _id: _id }, req.body, {
    new: true,
  }).populate('patientId');

  // Generating Houskeeping Request Id
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
    houseKeeperId,
    productionAreaId,
    roomId,
    // status,
    task: 'To Be Clean',
    assignedTime: Date.now(),
  });

  // Customer Care Request
  if (
    req.body.dischargeRequest.dischargeSummary.edrCompletionRequirement ===
    'withCare'
  ) {
    const CCrequestNo = 'DDID' + day + requestNoFormat(new Date(), 'yyHHMMss');
    const customerCares = await Staff.find({
      staffType: 'Customer Care',
      disabled: false,
      // availability: true,
    }).select('identifier name');

    const random = Math.floor(Math.random() * (customerCares.length - 1));
    const customerCare = customerCares[random];

    const request = await CCRequest.create({
      requestNo: CCrequestNo,
      edrId: _id,
      status: 'pending',
      dischargeStatus:
        req.body.dischargeRequest.dischargeSummary.edrCompletionReason,
      staffId: req.body.dischargeRequest.dischargeMedication.requester,
      requestedFor: 'Discharge',
      requestedAt: Date.now(),
      costomerCareId: customerCare._id,
    });
    console.log(request);
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

exports.addPharmcayRequest = asyncHandler(async (req, res, next) => {
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
  };

  const addedNote = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { pharmacyRequest: pharmacyObj } },
    {
      new: true,
    }
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

  res.status(200).json({
    success: true,
    data: addedNote,
  });
});

exports.deliverPharmcayRequest = asyncHandler(async (req, res, next) => {
  const addedNote = await EDR.findOneAndUpdate(
    { _id: req.body.edrId, 'pharmacyRequest._id': req.body._id },
    {
      $set: {
        'pharmacyRequest.$.status': req.body.status,
        'pharmacyRequest.$.secondStatus': req.body.secondStatus,
        'pharmacyRequest.$.updatedAt': new Date().toISOString(),
        'pharmacyRequest.$.deliveryStartTime': req.body.deliveryStartTime,
        'pharmacyRequest.$.pharmacist': req.body.pharmacist,
      },
    },
    {
      new: true,
    }
  );

  res.status(200).json({
    success: true,
    data: addedNote,
  });
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
  res.status(200).json({ success: true, data: edr });
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
