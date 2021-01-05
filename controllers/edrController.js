const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Patient = require('../models/patient/patient');
// const Staff = require('../models/staffFhir/staff');

exports.generateEDR = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  const patient = await Patient.findOne({ _id: req.body.patientId });

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
  } = req.body;

  const requestNo = `EDR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;
  const dcdFormVersion = [
    {
      versionNo: patient.identifier[0].value + '-' + requestNo + '-' + '1',
    },
  ];
  // let count = 0;
  // for (let i = 0; i < edrCheck.length; i++) {
  //   if (edrCheck[i].status === 'pending') {
  //     count++;
  //   }
  //   if (count > 0) break;
  // }
  // if (count > 0) {
  //   return next(
  //     new ErrorResponse(
  //       'An EDR is already created for this patient,please discharge the patient to request new EDR',
  //       400
  //     )
  //   );
  // }

  let newEDR = await EDR.create({
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
    paymentMethod,
    dcdForm: dcdFormVersion,
    claimed,
  });

  newEDR = await EDR.findOne({ _id: newEDR.id }).populate('patientId');

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
  console.log(edr);
  res.status(200).json({
    success: true,
    data: edr,
  });
});

exports.getEdrsByPatient = asyncHandler(async (req, res, next) => {
  const edrs = await EDR.find({ patientId: req.params.id });
  console.log(edrs.length);
});

exports.getEDRs = asyncHandler(async (req, res, next) => {
  const Edrs = await EDR.find()
    .populate('patientId')
    .populate('chiefComplaint.chiefComplaintId', 'name')
    .select('patientId dcdFormStatus status labRequest radiologyRequest');
  res.status(201).json({
    success: true,
    count: Edrs.length,
    data: Edrs,
  });
});

exports.getEdrPatientByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const patients = await EDR.find().populate('patientId');

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
    voiceNotes: req.file ? req.file.path : null,
  };
  const addedNote = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { doctorNotes } },
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
  // const edrCheck = await EDR.find({ _id: req.body.edrId }).populate(
  //   'patientId labRequest.serviceId'
  // );
  // const latestEdr = edrCheck.length - 1;
  // const latestLabRequest = edrCheck[0].labRequest.length - 1;
  // const updatedRequest = latestLabRequest + 2;

  const requestId = `LR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

  const labRequest = {
    requestId,
    name: req.body.name,
    serviceId: req.body.serviceId,
    type: req.body.type,
    price: req.body.price,
    status: req.body.status,
    priority: req.body.priority,
    assignedBy: req.body.staffId,
    requestedAt: Date.now(),
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
  console.log(req.body);
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
    assignedBy: req.body.staffId,
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
  console.log('note', note);
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
  const { _id, requestType } = req.body;
  let edr = await EDR.findById(_id);
  if (!edr) {
    return next(new ErrorResponse(`EDR not found with id of ${_id}`, 404));
  }
  edr = await EDR.findOneAndUpdate({ _id: _id }, req.body, {
    new: true,
  }).populate('patientId');
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
          : null,
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
        [`edNurseRequest.${note}.voiceNotes`]: req.file ? req.file.path : null,
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
        [`eouNurseRequest.${note}.voiceNotes`]: req.file ? req.file.path : null,
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
          : null,
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
