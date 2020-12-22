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

  // checking for existing ERD
  const edrCheck = await EDR.find({ patientId: req.body.patientId });
  const requestNo = `EDR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;
  // const versionNo = patient.identifier[0].value + '-' + requestNo + '-' + '1';
  const dcdFormVersion = [
    {
      versionNo: patient.identifier[0].value + '-' + requestNo + '-' + '1',
    },
  ];
  let count = 0;
  for (let i = 0; i < edrCheck.length; i++) {
    if (edrCheck[i].status === 'pending') {
      count++;
    }
    if (count > 0) break;
  }
  if (count > 0) {
    return next(
      new ErrorResponse(
        'An EDR is already created for this patient,please discharge the patient to request new EDR',
        400
      )
    );
  }

  const newEDR = await EDR.create({
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
  res.status(201).json({
    success: true,
    data: newEDR,
  });
});

exports.getEDRById = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findById(req.params.id).populate('patientId');
  if (!edr) {
    return next(new ErrorResponse('No Edr found for this patient', 404));
  }
  res.status(200).json({
    success: true,
    data: edr,
  });
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
