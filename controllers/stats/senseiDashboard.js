const moment = require('moment');
const Patient = require('../../models/patient/patient');
const Room = require('../../models/room');

const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const EDR = require('../../models/EDR/EDR');

exports.senseiDashboard = asyncHandler(async (req, res, next) => {
  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();

  let arr = [
    { label: lastHour, value: 0 },
    { label: fifthHour, value: 0 },
    { label: fourthHour, value: 0 },
    { label: thirdHour, value: 0 },
    { label: secondHour, value: 0 },
    { label: sixHour, value: 0 },
  ];

  function clearAllTime() {
    arr = [
      { label: lastHour, value: 0 },
      { label: fifthHour, value: 0 },
      { label: fourthHour, value: 0 },
      { label: thirdHour, value: 0 },
      { label: secondHour, value: 0 },
      { label: sixHour, value: 0 },
    ];
  }

  function compareDataForSixHours(dateTime) {
    if (dateTime > lastHour && dateTime < currentTime) {
      arr[0] = { label: arr[0].label, value: arr[0].value + 1 };
    } else if (dateTime > fifthHour && dateTime < lastHour) {
      arr[1] = { label: arr[1].label, value: arr[1].value + 1 };
    } else if (dateTime > fourthHour && dateTime < fifthHour) {
      arr[2] = { label: arr[2].label, value: arr[2].value + 1 };
    } else if (dateTime > thirdHour && dateTime < fourthHour) {
      arr[3] = { label: arr[3].label, value: arr[3].value + 1 };
    } else if (dateTime > secondHour && dateTime < thirdHour) {
      arr[4] = { label: arr[4].label, value: arr[4].value + 1 };
    } else if (dateTime > sixHour && dateTime < secondHour) {
      arr[5] = { label: arr[5].label, value: arr[5].value + 1 };
    }
  }

  const EdBeds = await Room.find({
    availability: true,
  }).countDocuments();

  const patientsPendingForProductionArea = await EDR.find({
    chiefComplaint: { $eq: [] },
    createdTimeStamp: { $gte: sixHour },
  });

  const patientsWithPA = await EDR.find({
    chiefComplaint: { $ne: [] },
    createdTimeStamp: { $gte: sixHour },
  });

  let timePatientsWithPA = 0;
  patientsWithPA.forEach((t) => {
    t.createdTimeStamp = new Date(t.createdTimeStamp);
    t.noteTime = new Date(t.chiefComplaint[0].assignedTime);
    t.time = Math.round(
      (t.noteTime.getTime() - t.createdTimeStamp.getTime()) / (1000 * 60)
    );
    timePatientsWithPA += t.time;
  });
  const TATForRegToPA =
    patientsWithPA.length > 0 ? timePatientsWithPA / patientsWithPA.length : 0;

  patientsPendingForProductionArea.map((p) => {
    compareDataForSixHours(p.createdTimeStamp);
  });

  let pendingPAPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  const patientTriagePending = await EDR.find({
    // status: 'pending',
    createdTimeStamp: { $gte: sixHour },
    'dcdForm.$.triageAssessment': { $eq: [] },
  });

  const patientWithTriageAndPA = await EDR.find({
    // status: 'pending',
    createdTimeStamp: { $gte: sixHour },
    'dcdForm.$.triageAssessment': { $ne: [] },
    chiefComplaint: { $ne: [] },
  });

  let totalTimeBetweenCCAndTriage = 0;
  patientWithTriageAndPA.forEach((t) => {
    t.createdTimeStamp = new Date(t.dcdForm[0].triageAssessment[0].triageTime);
    t.noteTime = new Date(t.chiefComplaint[0].assignedTime);
    t.time = Math.round(
      (t.createdTimeStamp.getTime() - t.noteTime.getTime()) / (1000 * 60)
    );
    totalTimeBetweenCCAndTriage += t.time;
  });
  const TATForCCToTriage =
    patientWithTriageAndPA.length > 0
      ? totalTimeBetweenCCAndTriage / patientWithTriageAndPA.length
      : 0;

  patientTriagePending.map((p) => {
    compareDataForSixHours(p.createdTimeStamp);
  });

  const perHourTriagePending = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //diagnose pending
  const diagnosePending = await EDR.find({
    status: 'pending',
    doctorNotes: { $eq: [] },
    createdTimeStamp: { $gte: sixHour },
  });

  const diagnosesPendingTAT = await EDR.find({
    // status: 'pending',
    createdTimeStamp: { $gte: sixHour },
    doctorNotes: { $ne: [] },
    dcdForm: {
      $elemMatch: { triageAssessment: { $ne: [] } },
    },
  });

  let totalTimeBetweenTriageAndNotes = 0;
  diagnosesPendingTAT.forEach((t) => {
    t.createdTimeStamp = new Date(t.doctorNotes[0].assignedTime);
    t.noteTime = new Date(t.dcdForm[0].triageAssessment[0].triageTime);
    t.time = Math.round(
      (t.createdTimeStamp.getTime() - t.noteTime.getTime()) / (1000 * 60)
    );
    totalTimeBetweenTriageAndNotes += t.time;
  });
  const TATForTriageToNotes =
    diagnosesPendingTAT.length > 0
      ? totalTimeBetweenTriageAndNotes / diagnosesPendingTAT.length
      : 0;

  diagnosePending.map((p) => {
    compareDataForSixHours(p.createdTimeStamp);
  });
  const perHourDiagnosePending = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // * 4rh Card
  const decisionPending = await EDR.aggregate([
    {
      $project: {
        status: 1,
        doctorNotes: 1,
        careStream: 1,
      },
    },
    {
      $match: {
        $and: [{ careStream: { $eq: [] } }, { doctorNotes: { $ne: [] } }],
      },
    },
    {
      $unwind: '$doctorNotes',
    },
    {
      $match: {
        'doctorNotes.assignedTime': { $gte: sixHour },
      },
    },
  ]);

  decisionPending.map((p) => {
    compareDataForSixHours(p.doctorNotes.assignedTime);
  });
  const decisionPendingPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  const decisionCompleted = await EDR.aggregate([
    {
      $project: {
        status: 1,
        doctorNotes: 1,
        careStream: 1,
      },
    },
    {
      $match: {
        $and: [{ careStream: { $ne: [] } }, { doctorNotes: { $ne: [] } }],
      },
    },
    {
      $unwind: '$careStream',
    },
    {
      $match: {
        'careStream.assignedTime': { $gte: sixHour },
      },
    },
  ]);

  let decisionTime = 0;
  decisionCompleted.map((t) => {
    t.noteTime = new Date(t.doctorNotes[0].assignedTime);
    t.careStreamTime = new Date(t.careStream.assignedTime);
    t.time = Math.round(
      (t.careStreamTime.getTime() - t.noteTime.getTime()) / (1000 * 60)
    );
    decisionTime += t.time;
  });

  const decisionTAT = decisionTime / decisionCompleted.length;

  // * 5th Card
  const labPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': { $ne: 'completed' } },
          { 'labRequest.requestedAt': { $gte: sixHour } },
        ],
      },
    },
  ]);

  labPending.map((l) => {
    compareDataForSixHours(l.labRequest.requestedAt);
  });
  const labPendingPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT
  const labCompleted = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.status': 'completed' },
          { 'labRequest.completeTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let labTime = 0;
  labCompleted.map((t) => {
    t.labStart = new Date(t.labRequest.requestedAt);
    t.labEnd = new Date(t.labRequest.completeTime);
    t.time = Math.round(
      (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
    );
    labTime += t.time;
  });

  const completedLabTAT = labTime / labCompleted.length;

  // * 6th Card
  const pendingRad = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { 'radRequest.status': 'pending approval' },
          { 'radRequest.pendingApprovalTime': { $gte: sixHour } },
          { 'radRequest.pendingApprovalTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  pendingRad.map((r) => {
    compareDataForSixHours(r.radRequest.pendingApprovalTime);
  });
  const radPendingPerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT
  const completedRad = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { 'radRequest.status': 'completed' },
          { 'radRequest.completeTime': { $gte: sixHour } },
          { 'radRequest.completeTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  let radTime = 0;
  completedRad.map((t) => {
    t.radStart = new Date(t.radRequest.requestedAt);
    t.radEnd = new Date(t.radRequest.completeTime);
    t.time = Math.round(
      (t.radEnd.getTime() - t.radStart.getTime()) / (1000 * 60)
    );
    radTime += t.time;
  });

  const completedRadTAT = radTime / completedRad.length;
  const cumulativePatient = await EDR.find().countDocuments();

  // * 3rd Card
  const dischargePending = await EDR.find({
    status: 'Discharged',
    socialWorkerStatus: 'pending',
    dischargeTimestamp: { $gte: sixHour },
  });

  dischargePending.map((d) => {
    compareDataForSixHours(d.dischargeTimestamp);
  });

  const dischargePerHour = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  const dischargeCompleted = await EDR.find({
    status: 'Discharged',
    socialWorkerStatus: 'completed',
    'survey.0.surveyTime': { $gte: sixHour },
  });

  let dischargeTime = 0;
  dischargeCompleted.map((t) => {
    t.dischargeStart = new Date(t.dischargeTimestamp);
    t.dischargeEnd = new Date(t.survey[0].surveyTime);
    t.time = Math.round(
      (t.dischargeEnd.getTime() - t.dischargeStart.getTime()) / (1000 * 60)
    );
    dischargeTime += t.time;
  });

  const dischargeTAT = dischargeTime / dischargeCompleted.length;

  //per hour assignment
  const totalEDRInLastSixHours = await EDR.find({
    createdTimeStamp: { $gte: sixHour },
  });

  const dischargedEdrWithInSixHours = await EDR.find({
    dischargeTimestamp: { $gte: sixHour },
    status: 'Discharged',
  });
  let timeFromCreationToDischarged = 0;
  dischargedEdrWithInSixHours.map((t) => {
    t.dischargeStart = new Date(t.dischargeTimestamp);
    t.dischargeEnd = new Date(t.createdTimeStamp);
    t.time = Math.round(
      (t.dischargeEnd.getTime() - t.dischargeStart.getTime()) / (1000 * 60)
    );
    dischargeTime += t.time;
  });

  const timeBetweenCreationAndDischargePerPatient =
    timeFromCreationToDischarged / dischargedEdrWithInSixHours.length;

  const edrPerHour = totalEDRInLastSixHours.length / 6;
  totalEDRInLastSixHours.map((d) => {
    compareDataForSixHours(d.createdTimeStamp);
  });

  const edrWithSixHours = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  //   //* 4th Card
  //   const consultantNotes = await EDR.aggregate([
  //     {
  //       $project: {
  //         consultationNote: 1,
  //         status: 1,
  //       },
  //     },
  //     {
  //       $unwind: '$consultationNote',
  //     },
  //     {
  //       $match: {
  //         $and: [
  //           { status: 'pending' },
  //           {
  //             'consultationNote.status': 'pending',
  //           },
  //           {
  //             'consultationNote.noteTime': { $gte: sixHour },
  //           },
  //           {
  //             'consultationNote.noteTime': { $lte: currentTime },
  //           },
  //         ],
  //       },
  //     },
  //   ]);

  //   const fourthCardArr = [];
  //   let sixthHourNote = 0;
  //   let fifthHourNote = 0;
  //   let fourthHourNote = 0;
  //   let thirdHourNote = 0;
  //   let secondHourNote = 0;
  //   let firstHourNote = 0;
  //   consultantNotes.map((n) => {
  //     if (
  //       n.consultationNote.noteTime > lastHour &&
  //       n.consultationNote.noteTime < currentTime
  //     ) {
  //       sixthHourNote++;
  //       // console.log('sixthHourNote', sixthHourNote);
  //     } else if (
  //       n.consultationNote.noteTime > fifthHour &&
  //       n.consultationNote.noteTime < lastHour
  //     ) {
  //       fifthHourNote++;
  //     } else if (
  //       n.consultationNote.noteTime > fourthHour &&
  //       n.consultationNote.noteTime < fifthHour
  //     ) {
  //       fourthHourNote++;
  //     } else if (
  //       n.consultationNote.noteTime > thirdHour &&
  //       n.consultationNote.noteTime < fourthHour
  //     ) {
  //       thirdHourNote++;
  //     } else if (
  //       n.consultationNote.noteTime > secondHour &&
  //       n.consultationNote.noteTime < thirdHour
  //     ) {
  //       secondHourNote++;
  //     } else if (
  //       n.consultationNote.noteTime > sixHour &&
  //       n.consultationNote.noteTime < secondHour
  //     ) {
  //       firstHourNote++;
  //     }
  //   });
  //   fourthCardArr.push({ label: lastHour, value: sixthHourNote });
  //   fourthCardArr.push({ label: fifthHour, value: fifthHourNote });
  //   fourthCardArr.push({ label: fourthHour, value: fourthHourNote });
  //   fourthCardArr.push({ label: thirdHour, value: thirdHourNote });
  //   fourthCardArr.push({ label: secondHour, value: secondHourNote });
  //   fourthCardArr.push({ label: sixHour, value: firstHourNote });

  //   // tat
  //   const consultantCompletedNotes = await EDR.aggregate([
  //     {
  //       $project: {
  //         consultationNote: 1,
  //         status: 1,
  //       },
  //     },
  //     {
  //       $unwind: '$consultationNote',
  //     },
  //     {
  //       $match: {
  //         $and: [
  //           { status: 'pending' },
  //           {
  //             'consultationNote.status': 'complete',
  //           },
  //           {
  //             'consultationNote.noteTime': { $gte: sixHour },
  //           },
  //           {
  //             'consultationNote.noteTime': { $lte: currentTime },
  //           },
  //         ],
  //       },
  //     },
  //   ]);

  //   let completed = 0;
  //   consultantCompletedNotes.map((t) => {
  //     t.noteStart = new Date(t.consultationNote.noteTime);

  //     t.noteEnd = new Date(t.consultationNote.completionDate);

  //     t.time = Math.round(
  //       (t.noteEnd.getTime() - t.noteStart.getTime()) / (1000 * 60)
  //     );
  //     completed += t.time;
  //   });

  //   const completedNoteTAT = completed / consultantCompletedNotes.length;

  //   // current no of patients per doctor
  //   const totalPatients = await EDR.find({
  //     doctorNotes: { $ne: [] },
  //     status: 'pending',
  //   });

  //   // //* Patients Diagnosed Per Hour
  //   const patientsDiagnosed = await EDR.find({
  //     doctorNotes: { $ne: [] },
  //     'doctorNotes.0.assignedTime': { $gte: sixHour },
  //   });

  //   const diagnosedPerHour = Math.round(patientsDiagnosed.length / 6);

  //   // * 7th Card
  //   const pharmacyPending = await EDR.aggregate([
  //     {
  //       $project: {
  //         pharmacyRequest: 1,
  //       },
  //     },
  //     {
  //       $unwind: '$pharmacyRequest',
  //     },
  //     {
  //       $match: {
  //         $and: [
  //           { 'pharmacyRequest.status': { $ne: 'closed' } },
  //           { 'pharmacyRequest.createdAt': { $gte: sixHour } },
  //           { 'pharmacyRequest.createdAt': { $lte: currentTime } },
  //         ],
  //       },
  //     },
  //   ]);

  //   // console.log(pharmacyPending);

  //   const pharmacyArr = [];
  //   let sixthHourPharmacy = 0;
  //   let fifthHourPharmacy = 0;
  //   let fourthHourPharmacy = 0;
  //   let thirdHourPharmacy = 0;
  //   let secondHourPharmacy = 0;
  //   let firstHourPharmacy = 0;
  //   pharmacyPending.map((p) => {
  //     if (
  //       p.pharmacyRequest.createdAt > lastHour &&
  //       p.pharmacyRequest.createdAt < currentTime
  //     ) {
  //       sixthHourPharmacy++;
  //       // console.log('sixthHourPharmacy', sixthHourPharmacy);
  //     } else if (
  //       p.pharmacyRequest.createdAt > fifthHour &&
  //       p.pharmacyRequest.createdAt < lastHour
  //     ) {
  //       fifthHourPharmacy++;
  //     } else if (
  //       p.pharmacyRequest.createdAt > fourthHour &&
  //       p.pharmacyRequest.createdAt < fifthHour
  //     ) {
  //       fourthHourPharmacy++;
  //     } else if (
  //       p.pharmacyRequest.createdAt > thirdHour &&
  //       p.pharmacyRequest.createdAt < fourthHour
  //     ) {
  //       thirdHourPharmacy++;
  //     } else if (
  //       p.pharmacyRequest.createdAt > secondHour &&
  //       p.pharmacyRequest.createdAt < thirdHour
  //     ) {
  //       secondHourPharmacy++;
  //     } else if (
  //       p.pharmacyRequest.createdAt > sixHour &&
  //       p.pharmacyRequest.createdAt < secondHour
  //     ) {
  //       firstHourPharmacy++;
  //     }
  //   });
  //   pharmacyArr.push({ label: lastHour, value: sixthHourPharmacy });
  //   pharmacyArr.push({ label: fifthHour, value: fifthHourPharmacy });
  //   pharmacyArr.push({ label: fourthHour, value: fourthHourPharmacy });
  //   pharmacyArr.push({ label: thirdHour, value: thirdHourPharmacy });
  //   pharmacyArr.push({ label: secondHour, value: secondHourPharmacy });
  //   pharmacyArr.push({ label: sixHour, value: firstHourPharmacy });

  //   // TAT
  //   const pharmacyCompleted = await EDR.aggregate([
  //     {
  //       $project: {
  //         pharmacyRequest: 1,
  //       },
  //     },
  //     {
  //       $unwind: '$pharmacyRequest',
  //     },
  //     {
  //       $match: {
  //         $and: [
  //           { 'pharmacyRequest.status': 'delivered' },
  //           { 'pharmacyRequest.deliveredTime': { $gte: sixHour } },
  //           { 'pharmacyRequest.deliveredTime': { $lte: currentTime } },
  //         ],
  //       },
  //     },
  //   ]);

  //   let pharmacyTime = 0;
  //   pharmacyCompleted.map((t) => {
  //     t.pharmStart = new Date(t.pharmacyRequest.createdAt);

  //     t.pharmEnd = new Date(t.pharmacyRequest.deliveredTime);

  //     t.time = Math.round(
  //       (t.pharmEnd.getTime() - t.pharmStart.getTime()) / (1000 * 60)
  //     );
  //     pharmacyTime += t.time;
  //   });

  //   const completedPharmTAT = pharmacyTime / pharmacyCompleted.length;

  //   // Current No of Patients Per Doctor
  //   // const pendingPatients = await EDR.find({
  //   //   status: 'pending',
  //   //   currentLocation: 'ED',
  //   // });

  res.status(200).json({
    success: true,

    EdBeds,
    firstCard: {
      totalPending: patientsPendingForProductionArea.length,
      TAT: TATForRegToPA,
      perHour: pendingPAPerHour,
    },

    secondCard: {
      TAT: TATForCCToTriage,
      totalPending: patientTriagePending.length,
      perHour: perHourTriagePending,
    },

    thirdCard: {
      TAT: TATForTriageToNotes,
      totalPending: diagnosePending.length,
      perHour: perHourDiagnosePending,
    },
    fourthCard: {
      TAT: decisionTAT,
      totalPending: decisionPending.length,
      perHour: decisionPendingPerHour,
    },
    fifthCard: {
      TAT: completedLabTAT,
      totalPending: labPending.length,
      perHour: labPendingPerHour,
    },
    sixthCard: {
      TAT: completedRadTAT,
      totalPending: pendingRad.length,
      perHour: radPendingPerHour,
    },
    // seventhCard: {
    //   TAT: completedPharmTAT,
    //   totalPending: pharmacyPending.length,
    //   perHour: pharmacyArr,
    // },
    // diagnosedPerHour,

    ninthCard: {
      TAT: dischargeTAT,
      totalPending: dischargePending.length,
      perHour: dischargePerHour,
    },

    tenthCard: {
      TAT: timeBetweenCreationAndDischargePerPatient,
      totalPending: edrPerHour,
      perHour: edrWithSixHours,
    },
    cumulativePatient,
  });
});
