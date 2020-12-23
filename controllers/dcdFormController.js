const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');

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
  const edr = await EDR.findOne({ _id: req.body.data.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.data.edrId },
    { $push: { [`dcdForm.${latestForm}.triageAssessment`]: triage } },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addDcdForm = asyncHandler(async (req, res, next) => {
  const edrCheck = await EDR.find({ _id: req.body.edrId }).populate(
    'patientId'
  );
  // const latestEdr = edrCheck.length - 1;
  const latestDcd = edrCheck[0].dcdForm.length - 1;
  const updatedVersion = latestDcd + 2;
  const dcdFormVersion = [
    {
      versionNo:
        edrCheck[0].patientId.identifier[0].value +
        '-' +
        edrCheck[0].requestNo +
        '-' +
        updatedVersion,
    },
  ];
  const newDcd = await EDR.findOneAndUpdate(
    { _id: edrCheck[0].id },
    { $push: { dcdForm: dcdFormVersion } },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: newDcd,
  });
});

exports.addPatinetDetals = asyncHandler(async (req, res, next) => {
  console.log(req.body);

  const patientDetails = {
    timeSeen: req.body.timeSeen,
    historian: req.body.historian,
    historyLimitedBy: req.body.historyLimitedBy,
    timing: req.body.timing,
    severity: req.body.severity,
    modifyingFactors: req.body.modifyingFactors,
    similarSymptomsPrev: req.body.similarSymptomsPrev,
    recentlyTreated: req.body.recentlyTreated,
  };
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  console.log(latestForm);
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: { [`dcdForm.${latestForm}.patientDetails`]: patientDetails },
    },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});
