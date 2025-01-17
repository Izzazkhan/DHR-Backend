const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const Notification = require('../components/notification');
const Staff = require('../models/staffFhir/staff');
// const ErrorResponse = require('../utils/errorResponse');
const Flag = require('../models/flag/Flag');
const generateReqNo = require('../components/requestNoGenerator');
const CronFlag = require('../models/CronFlag');

exports.addTriageAssessment = asyncHandler(async (req, res, next) => {
  const triageRequestNo = generateReqNo('TA');

  const triage = {
    triageRequestNo,
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

  //   const edrCS = await EDR.findOne(
  //     { _id: req.body.data.edrId },
  //     { dcdForm: { $slice: -1 } }
  //   ).select('dcdForm');
  //   console.log(edrCS);
  //   MD Notifications
  const edrPA = await EDR.findById(req.body.data.edrId).select(
    'chiefComplaint'
  );
  const latestCC = edrPA.chiefComplaint.length - 1;
  const chiefComplaintId = edrPA.chiefComplaint[latestCC].chiefComplaintId._id;

  const nurseShift = await Staff.findById(req.body.data.staffId).select(
    'shift'
  );

  const doctors = await Staff.find({
    staffType: 'Doctor',
    subType: 'ED Doctor',
    shift: nurseShift.shift,
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  });

  //   Temperature Md Notifications
  const temp = parseFloat(req.body.data.temperature);

  if (temp < 35.5 || temp > 38) {
    doctors.forEach((doctor) => {
      Notification(
        'MD Notification',
        'MD Notification for Temperature',
        '',
        'MD Notifications',
        '/dashboard/home/notes',
        req.body.data.edrId,
        '',
        '',
        doctor._id
      );
    });
  }

  //   SBP Md Notifications
  const SBP = parseInt(req.body.data.bloodPressureSys, 10);

  if (SBP < 90 || SBP > 30) {
    doctors.forEach((doctor) => {
      Notification(
        'MD Notification',
        'MD Notification for SBP',
        '',
        'MD Notifications',
        '/dashboard/home/notes',
        req.body.data.edrId,
        '',
        '',
        doctor._id
      );
    });
  }

  // HR Md Notifications
  const hr = parseInt(req.body.data.heartRate, 10);

  if (hr < 60 || hr > 120) {
    doctors.forEach((doctor) => {
      Notification(
        'MD Notification',
        'MD Notification for Heart Rate',
        '',
        'MD Notifications',
        '/dashboard/home/notes',
        req.body.data.edrId,
        '',
        '',
        doctor._id
      );
    });
  }

  const edr = await EDR.findOne({ _id: req.body.data.edrId }).populate(
    'dcdForm'
  );
  const latestForm = edr.dcdForm.length - 1;
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.data.edrId },
    { $push: { [`dcdForm.${latestForm}.triageAssessment`]: triage } },
    { new: true }
  ).populate('patientId', 'identifier');

  await CronFlag.findOneAndUpdate(
    { requestId: req.body.data.edrId, taskName: 'Sensei Triage Pending' },
    { $set: { status: 'completed' } },
    { new: true }
  );

  const patientTriagePending = await EDR.find({
    'dcdForm.$.triageAssessment': { $eq: [] },
  });

  if (patientTriagePending.length > 5) {
    await Flag.create({
      edrId: req.body.data.edrId,
      generatedFrom: 'Sensei',
      card: '2nd',
      generatedFor: ['Sensei'],
      reason: 'Patients pending for TriageAssessment From Nurse',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Sensei',
      status: 'pending',
    });
    globalVariable.io.emit('pendingSensei', flags);
  }

  if (patientTriagePending.length > 6) {
    await Flag.create({
      edrId: req.body.data.edrId,
      generatedFrom: 'ED Nurse',
      card: '1st',
      generatedFor: ['Sensei'],
      reason: 'Patients pending for TriageAssessment From Nurse',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'ED Nurse',
      status: 'pending',
    });
    globalVariable.io.emit('edNursePending', flags);
  }

  if (patientTriagePending.length > 6) {
    await Flag.create({
      edrId: req.body.data.edrId,
      generatedFrom: 'EOU Nurse',
      card: '1st',
      generatedFor: 'Sensei',
      reason: 'Patients pending for TriageAssessment From Nurse',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'EOU Nurse',
      status: 'pending',
    });
    globalVariable.io.emit('eouNursePending', flags);
  }
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addDcdForm = asyncHandler(async (req, res, next) => {
  const edrCheck = await EDR.find({ _id: req.body.edrId }).populate(
    'patientId'
  );
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
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestDetails = edr.dcdForm[latestForm].patientDetails.length - 1;
  const patientDetailsNo = generateReqNo('PD');
  const patientDetails = {
    patientDetailsNo,
    version: latestDetails + 2,
    details: req.body.details,
    reason: req.body.reason,
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
  ).populate('patientId', 'identifier');

  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addPastHistory = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestHistory = edr.dcdForm[latestForm].pastMedicalHistory.length - 1;
  const pastHistoryNo = generateReqNo('PMH');
  const pastMedicalHistory = {
    pastHistoryNo,
    version: latestHistory + 2,
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
        [`dcdForm.${latestForm}.pastMedicalHistory`]: pastMedicalHistory,
      },
    },
    { new: true }
  ).populate('patientId', 'identifier');

  const staff = await Staff.findById(req.body.staffId).select('name');

  Notification(
    'DCD Form Completed',
    'Nurse' + staff.name[0].given[0] + 'has completed the DCD Form',
    'Doctor',
    'Nurse',
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    'ED Doctor'
  );
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addROS = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestROS = edr.dcdForm[latestForm].ROS.length - 1;
  const rosNo = generateReqNo('ROS');
  const ROS = {
    rosNo,
    version: latestROS + 2,
    reason: req.body.reason,
    // status: req.body.status,
    details: req.body.details,
    updatedBy: req.body.staffId,
    date: Date.now(),
  };

  // *  MD Notifications
  const { details } = req.body;
  const edrPA = await EDR.findById(req.body.edrId).select('chiefComplaint');
  const latestCC = edrPA.chiefComplaint.length - 1;
  const chiefComplaintId = edrPA.chiefComplaint[latestCC].chiefComplaintId._id;

  const nurseShift = await Staff.findById(req.body.staffId).select('shift');

  const doctors = await Staff.find({
    staffType: 'Doctor',
    subType: 'ED Doctor',
    shift: nurseShift.shift,
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  });

  for (let i = 0; i < details.length; i++) {
    //   Noitfication For Chest Pain
    if (details[i].name === 'CHEST/ CVS') {
      for (let j = 0; j < details[i].chips.length; j++) {
        if (details[i].chips[j].name === 'Chest Pain') {
          console.log(details[i].chips[j].name);
          doctors.forEach((doctor) => {
            Notification(
              'MD Notification',
              'MD Notification for Chest Pain',
              '',
              'MD Notifications',
              '/dashboard/home/notes',
              req.body.edrId,
              '',
              '',
              doctor._id
            );
          });
        }
      }
    }
    // Notification For Epigastric Pain
    if (details[i].name === 'GI') {
      for (let j = 0; j < details[i].chips.length; j++) {
        if (details[i].chips[j].name === 'Abdominal Pain') {
          if (
            details[i].chips[j].dropdownSelectedValue.name === 'Epigastric pain'
          ) {
            doctors.forEach((doctor) => {
              Notification(
                'MD Notification',
                'MD Notification for Epigastric Pain',
                '',
                'MD Notifications',
                '/dashboard/home/notes',
                req.body.edrId,
                '',
                '',
                doctor._id
              );
            });
          }
        }
      }
    }
    // Notification For Back Pain
    if (details[i].name === 'SKIN / Musculoskeletol') {
      for (let j = 0; j < details[i].chips.length; j++) {
        if (details[i].chips[j].name === 'Back Pain') {
          doctors.forEach((doctor) => {
            Notification(
              'MD Notification',
              'MD Notification for Back Pain',
              '',
              'MD Notifications',
              '/dashboard/home/notes',
              req.body.edrId,
              '',
              '',
              doctor._id
            );
          });
        }
      }
    }
  }
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $push: {
        [`dcdForm.${latestForm}.ROS`]: ROS,
      },
    },
    { new: true }
  ).populate('patientId', 'identifier');
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addPhysicalExam = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  const skin = [];

  const edr = await EDR.findOne({ _id: parsed.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestPhysicalExam = edr.dcdForm[latestForm].physicalExam.length - 1;
  const physicalExamNo = generateReqNo('PE');

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
    physicalExamNo,
    version: latestPhysicalExam + 2,
    reason: req.body.reason,
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
  ).populate('patientId', 'identifier');
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
  const InvestigationNo = generateReqNo('INV');
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
    InvestigationNo,
    version: latestInvestigation + 2,
    reason: req.body.reason,
    // status: req.body.status,
    details: parsed.details,
    updatedBy: parsed.staffId,
    date: Date.now(),
  };

  // *  MD Notifications
  const { details } = req.body;
  const edrPA = await EDR.findById(req.body.edrId).select('chiefComplaint');
  const latestCC = edrPA.chiefComplaint.length - 1;
  const chiefComplaintId = edrPA.chiefComplaint[latestCC].chiefComplaintId._id;

  const nurseShift = await Staff.findById(req.body.staffId).select('shift');

  const doctors = await Staff.find({
    staffType: 'Doctor',
    subType: 'ED Doctor',
    shift: nurseShift.shift,
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  });

  //   Notification For Lactate
  for (let i = 0; i < details.length; i++) {
    if (details[i].name === 'Chemistries') {
      for (let j = 0; j < details[i].Texts.length; j++) {
        if (details[i].Texts[j].name === 'Lactate') {
          doctors.forEach((doctor) => {
            Notification(
              'MD Notification',
              'MD Notification for Lactate',
              '',
              'MD Notifications',
              '/dashboard/home/notes',
              req.body.edrId,
              '',
              '',
              doctor._id
            );
          });
        }
      }
    }
  }
  const edrPatient = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $push: {
        [`dcdForm.${latestForm}.investigation`]: investigation,
      },
    },
    { new: true }
  ).populate('patientId', 'identifier');
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addActionPlan = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestActionPlan = edr.dcdForm[latestForm].actionPlan.length - 1;
  const actionPlanNo = generateReqNo('AP');
  const actionPlan = {
    actionPlanNo,
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
  ).populate('patientId', 'identifier');
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});

exports.addCourseOfVisit = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const latestForm = edr.dcdForm.length - 1;
  const latestCourseOfVisit = edr.dcdForm[latestForm].courseOfVisit.length - 1;
  const courseOfVisitNo = generateReqNo('COV');
  const courseOfVisit = {
    courseOfVisitNo,
    version: latestCourseOfVisit + 2,
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
        [`dcdForm.${latestForm}.courseOfVisit`]: courseOfVisit,
      },
    },
    { new: true }
  ).populate('patientId', 'identifier');
  res.status(200).json({
    success: true,
    data: edrPatient,
  });
});
