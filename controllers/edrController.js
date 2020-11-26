const requestNoFormat = require('dateformat');
const EDR = require('../models/visit/visit');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

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
    generatedBy,
    consultationNote,
    residentNotes,
    pharmacyRequest,
    labRequest,
    radiologyRequest,
    dischargeRequest,
    status,
    triageAssessment,
    verified,
    insurerId,
    paymentMethod,
    claimed,
  } = req.body;

  // checking for existing ERD
  const edrCheck = await EDR.find({ patientId: req.body.patientId });
  console.log(edrCheck);
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
    requestNo: `EDR${day}${requestNoFormat(new Date(), 'yyHHMM')}`,
    patientId,
    generatedBy,
    consultationNote,
    residentNotes,
    pharmacyRequest,
    labRequest,
    radiologyRequest,
    dischargeRequest,
    status,
    triageAssessment,
    verified,
    insurerId,
    paymentMethod,
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
    .populate('pharmacyRequest');
  res.status(201).json({
    success: true,
    data: Edrs,
  });
});
