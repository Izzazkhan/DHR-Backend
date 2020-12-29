const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Patient = require('../models/patient/patient');

exports.generateEDR = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  // Destructuring Data from Body
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
    paymentMethod,
    // dcdForm,
    // claimed,
  } = req.body;

  const patient = await Patient.findOne({ _id: req.body.patientId });

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
    claimed: false,
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
        [`doctorNotes.${note}.voiceNotes`]: parsed.voiceNotes,
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
