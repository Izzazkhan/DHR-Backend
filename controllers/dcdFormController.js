const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.addTriageAssessment = asyncHandler(async (req, res, next) => {
  const triage = {
    triageRequestNo: req.body.data.TAARequestNo,
    requester: req.body.data.staffId,
    triageLevel: req.body.data.triageLevel,
    generalAppearance: req.body.data.generalAppearance,
    headNeck: req.body.data.headNeck,
    respiratory: req.body.data.respiratory,
    cardiac: req.body.data.cardiac,
    abdomen: req.body.data.abdomen,
    neurological: req.body.data.neurological,
    heartRate: req.body.data.heartRate,
    bloodPressureDia: req.body.data.bloodPressureDia,
    respiratoryRate: req.body.data.respiratoryRate,
    temperature: req.body.data.temperature,
    FSBS: req.body.data.FSBS,
    painScale: req.body.data.painScale,
    pulseOX: req.body.data.pulseOX,
    patientId: req.body.data.patientId,
    triageTime: Date.now(),
  };
  const edr = await EDR.findOne({ _id: req.body.data.edrId }).populate(
    'dcdForm'
  );
  console.log('EDR', edr);
  // const latestForm = edr.dcdForm.length - 1;
  // const edrPatient = await EDR.findOneAndUpdate(
  //   { _id: req.body.data.edrId },
  //   { $push: { [`dcdForm.${latestForm}.triageAssessment`]: triage } },
  //   { new: true }
  // );
  // res.status(200).json({
  //   success: true,
  //   data: edrPatient,
  // });
});
