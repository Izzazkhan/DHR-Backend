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
    bloodPressureSys: req.body.data.bloodPressureSys,
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

exports.addPatientDetails = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestDetails = edr.dcdForm[latestForm].patientDetails.length - 1;
  const patientDetails = {
    version: latestDetails + 2,
    details: req.body.details,
    // reason: req.body.reason,
    // status: req.body.status,
    updatedBy: req.body.staffId,
    date: Date.now(),
  };
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $push: { [`dcdForm.${latestForm}.patientDetails`]: patientDetails },
    },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addPastHistory = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestHistory = edr.dcdForm[latestForm].pastMedicalHistory.length - 1;
  const pastMedicalHistory = {
    version: latestHistory + 2,
    // reason: req.body.reason,
    // status: req.body.status,
    details: req.body.details,
    updatedBy: req.body.staffId,
    date: Date.now(),
  };
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $push: {
        [`dcdForm.${latestForm}.pastMedicalHistory`]: pastMedicalHistory,
      },
    },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addROS = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestROS = edr.dcdForm[latestForm].ROS.length - 1;
  const ROS = {
    version: latestROS + 2,
    // reason: req.body.reason,
    // status: req.body.status,
    details: req.body.details,
    updatedBy: req.body.staffId,
    date: Date.now(),
  };
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $push: {
        [`dcdForm.${latestForm}.ROS`]: ROS,
      },
    },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addPhysicalExam = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const parsed = JSON.parse(req.body.data);
  console.log(parsed);
  console.log(req.files);
  const skin = [];

  const edr = await EDR.findOne({ _id: parsed.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestPhysicalExam = edr.dcdForm[latestForm].physicalExam.length - 1;

  if (req.files) {
    for (let i = 0; i < parsed.details.length; i++) {
      for (let j = 0; j < parsed.details[i].chips.length; j++) {
        if (
          parsed.details[i].chips[j] &&
          parsed.details[i].chips[j].name === 'Add Skin Report'
        ) {
          for (let k = 0; k < req.files.length; k++) {
            if (req.files[k].fieldname === 'SkinReport') {
              skin.push(req.files[k].path);
              parsed.details[i].chips[j].image = skin;
            }
          }
        }
      }
    }
  }
  const physicalExam = {
    version: latestPhysicalExam + 2,
    // reason: req.body.reason,
    // status: req.body.status,
    details: parsed.details,
    updatedBy: parsed.staffId,
    date: Date.now(),
  };
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $push: {
        [`dcdForm.${latestForm}.physicalExam`]: physicalExam,
      },
    },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addInvestigation = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  const edr = await EDR.findOne({ _id: parsed.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestInvestigation = edr.dcdForm[latestForm].investigation.length - 1;
  const ecg = [];
  const xray = [];

  if (req.files) {
    for (let i = 0; i < parsed.details.length; i++) {
      for (let j = 0; j < parsed.details[i].chips.length; j++) {
        if (
          parsed.details[i].chips[j] &&
          parsed.details[i].chips[j].name === 'Add ECG Report'
        ) {
          for (let k = 0; k < req.files.length; k++) {
            if (req.files[k].fieldname === 'ECG') {
              ecg.push(req.files[k].path);
              parsed.details[i].chips[j].image = ecg;
            }
          }
        } else if (
          parsed.details[i].chips[j] &&
          parsed.details[i].chips[j].name === 'Add CXR Report'
        ) {
          for (let l = 0; l < req.files.length; l++) {
            if (req.files[l].fieldname === 'XRAY') {
              xray.push(req.files[l].path);
              parsed.details[i].chips[j].image = xray;
            }
          }
        }
      }
    }
  }

  const investigation = {
    version: latestInvestigation + 2,
    // reason: req.body.reason,
    // status: req.body.status,
    details: parsed.details,
    updatedBy: parsed.staffId,
    date: Date.now(),
  };
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $push: {
        [`dcdForm.${latestForm}.investigation`]: investigation,
      },
    },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addActionPlan = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestActionPlan = edr.dcdForm[latestForm].actionPlan.length - 1;
  const actionPlan = {
    version: latestActionPlan + 2,
    reason: req.body.reason,
    // status: req.body.status,
    details: req.body.details,
    updatedBy: req.body.staffId,
    date: Date.now(),
  };
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $push: {
        [`dcdForm.${latestForm}.actionPlan`]: actionPlan,
      },
    },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addCourseOfVisit = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestCourseOfVisit = edr.dcdForm[latestForm].courseOfVisit.length - 1;
  const courseOfVisit = {
    version: latestCourseOfVisit + 2,
    // reason: req.body.reason,
    // status: req.body.status,
    details: req.body.details,
    updatedBy: req.body.staffId,
    date: Date.now(),
  };
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $push: {
        [`dcdForm.${latestForm}.courseOfVisit`]: courseOfVisit,
      },
    },
    { new: true }
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});
