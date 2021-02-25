const moment = require('moment');
const Patient = require('../../models/patient/patient');
const Room = require('../../models/room');

const asyncHandler = require('../../middleware/async');
const ErrorResponse = require('../../utils/errorResponse');
const EDR = require('../../models/EDR/EDR');

const currentTime = moment().utc().toDate();
const lastHour = moment().subtract(1, 'hours').utc().toDate();
const fifthHour = moment().subtract(2, 'hours').utc().toDate();
const fourthHour = moment().subtract(3, 'hours').utc().toDate();
const thirdHour = moment().subtract(4, 'hours').utc().toDate();
const secondHour = moment().subtract(5, 'hours').utc().toDate();
const sixHour = moment().subtract(6, 'hours').utc().toDate();

exports.senseiDashboard = asyncHandler(async (req, res, next) => {
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

  //   const diagnosesPending = await EDR.find({
  //     status: 'pending',
  //     doctorNotes: { $eq: [] },
  //     dcdForm: {
  //       $elemMatch: { 'triageAssessment.triageTime': { $gte: sixHour } },
  //     },
  //   });

  //   const completedArr = [];
  //   let sixthHourPatient = 0;
  //   let fifthHourPatient = 0;
  //   let fourthHourPatient = 0;
  //   let thirdHourPatient = 0;
  //   let secondHourPatient = 0;
  //   let firstHourPatient = 0;
  //   diagnosesPending.map((p) => {
  //     if (
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
  //         lastHour &&
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime <
  //         currentTime
  //     ) {
  //       sixthHourPatient++;
  //       // console.log('sixthHourPatient', sixthHourPatient);
  //     } else if (
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
  //         fifthHour &&
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime < lastHour
  //     ) {
  //       fifthHourPatient++;
  //     } else if (
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
  //         fourthHour &&
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime < fifthHour
  //     ) {
  //       fourthHourPatient++;
  //     } else if (
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
  //         thirdHour &&
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime <
  //         fourthHour
  //     ) {
  //       thirdHourPatient++;
  //     } else if (
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
  //         secondHour &&
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime < thirdHour
  //     ) {
  //       secondHourPatient++;
  //     } else if (
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime >
  //         sixHour &&
  //       p.dcdForm[p.dcdForm.length - 1].triageAssessment[0].triageTime <
  //         secondHour
  //     ) {
  //       firstHourPatient++;
  //     }
  //   });
  //   completedArr.push({ label: lastHour, value: sixthHourPatient });
  //   completedArr.push({ label: fifthHour, value: fifthHourPatient });
  //   completedArr.push({ label: fourthHour, value: fourthHourPatient });
  //   completedArr.push({ label: thirdHour, value: thirdHourPatient });
  //   completedArr.push({ label: secondHour, value: secondHourPatient });
  //   completedArr.push({ label: sixHour, value: firstHourPatient });

  //   const triageTAT = await EDR.find({
  //     status: 'pending',
  //     doctorNotes: { $ne: [] },
  //     dcdForm: { $elemMatch: { triageAssessment: { $ne: [] } } },
  //     'doctorNotes.assignedTime': { $gte: sixHour },
  //     // $and: [

  //     //   { 'doctorNotes.assignedTime': { $lte: currentTime } },
  //     // ],
  //   });

  //   let time = 0;
  //   triageTAT.map((t) => {
  //     t.triageTime = new Date(
  //       t.dcdForm[t.dcdForm.length - 1].triageAssessment[0].triageTime
  //     );

  //     t.noteTime = new Date(t.doctorNotes[0].assignedTime);

  //     t.time = Math.round(
  //       (t.noteTime.getTime() - t.triageTime.getTime()) / (1000 * 60)
  //     );
  //     time += t.time;
  //   });

  //   const TAT = time / triageTAT.length;

  //   // * 2nd Card
  //   const decisionPending = await EDR.aggregate([
  //     {
  //       $project: {
  //         status: 1,
  //         doctorNotes: 1,
  //         careStream: 1,
  //       },
  //     },
  //     {
  //       $match: {
  //         $and: [{ careStream: { $eq: [] } }, { doctorNotes: { $ne: [] } }],
  //       },
  //     },
  //     {
  //       $unwind: '$doctorNotes',
  //     },
  //     {
  //       $match: {
  //         'doctorNotes.assignedTime': { $gte: sixHour },
  //       },
  //     },
  //   ]);

  //   const decisionArr = [];
  //   let sixthHourDecision = 0;
  //   let fifthHourDecision = 0;
  //   let fourthHourDecision = 0;
  //   let thirdHourDecision = 0;
  //   let secondHourDecision = 0;
  //   let firstHourDecision = 0;
  //   decisionPending.map((p) => {
  //     if (
  //       p.doctorNotes.assignedTime > lastHour &&
  //       p.doctorNotes.assignedTime < currentTime
  //     ) {
  //       sixthHourDecision++;
  //       // console.log('sixthHourDecision', sixthHourDecision);
  //     } else if (
  //       p.doctorNotes.assignedTime > fifthHour &&
  //       p.doctorNotes.assignedTime < lastHour
  //     ) {
  //       fifthHourDecision++;
  //     } else if (
  //       p.doctorNotes.assignedTime > fourthHour &&
  //       p.doctorNotes.assignedTime < fifthHour
  //     ) {
  //       fourthHourDecision++;
  //     } else if (
  //       p.doctorNotes.assignedTime > thirdHour &&
  //       p.doctorNotes.assignedTime < fourthHour
  //     ) {
  //       thirdHourDecision++;
  //     } else if (
  //       p.doctorNotes.assignedTime > secondHour &&
  //       p.doctorNotes.assignedTime < thirdHour
  //     ) {
  //       secondHourDecision++;
  //     } else if (
  //       p.doctorNotes.assignedTime > sixHour &&
  //       p.doctorNotes.assignedTime < secondHour
  //     ) {
  //       firstHourDecision++;
  //     }
  //   });
  //   decisionArr.push({ label: lastHour, value: sixthHourDecision });
  //   decisionArr.push({ label: fifthHour, value: fifthHourDecision });
  //   decisionArr.push({ label: fourthHour, value: fourthHourDecision });
  //   decisionArr.push({ label: thirdHour, value: thirdHourDecision });
  //   decisionArr.push({ label: secondHour, value: secondHourDecision });
  //   decisionArr.push({ label: sixHour, value: firstHourDecision });

  //   const decisionCompleted = await EDR.aggregate([
  //     {
  //       $project: {
  //         status: 1,
  //         doctorNotes: 1,
  //         careStream: 1,
  //       },
  //     },
  //     {
  //       $match: {
  //         $and: [{ careStream: { $ne: [] } }, { doctorNotes: { $ne: [] } }],
  //       },
  //     },
  //     {
  //       $unwind: '$careStream',
  //     },
  //     {
  //       $match: {
  //         'careStream.assignedTime': { $gte: sixHour },
  //       },
  //     },
  //   ]);

  //   let decisionTime = 0;
  //   decisionCompleted.map((t) => {
  //     t.noteTime = new Date(t.doctorNotes[0].assignedTime);

  //     t.careStreamTime = new Date(t.careStream.assignedTime);

  //     t.time = Math.round(
  //       (t.careStreamTime.getTime() - t.noteTime.getTime()) / (1000 * 60)
  //     );
  //     decisionTime += t.time;
  //   });

  //   const decisionTAT = decisionTime / decisionCompleted.length;

  //   // * 3rd Card
  //   const dischargePending = await EDR.find({
  //     status: 'Discharged',
  //     socialWorkerStatus: 'pending',
  //     dischargeTimestamp: { $gte: sixHour },
  //   });

  //   const DischargeArr = [];
  //   let sixthHourDischarge = 0;
  //   let fifthHourDischarge = 0;
  //   let fourthHourDischarge = 0;
  //   let thirdHourDischarge = 0;
  //   let secondHourDischarge = 0;
  //   let firstHourDischarge = 0;
  //   dischargePending.map((d) => {
  //     if (d.dischargeTimestamp > lastHour && d.dischargeTimestamp < currentTime) {
  //       sixthHourDischarge++;
  //     } else if (
  //       d.dischargeTimestamp > fifthHour &&
  //       d.dischargeTimestamp < lastHour
  //     ) {
  //       fifthHourDischarge++;
  //     } else if (
  //       d.dischargeTimestamp > fourthHour &&
  //       d.dischargeTimestamp < fifthHour
  //     ) {
  //       fourthHourDischarge++;
  //     } else if (
  //       d.dischargeTimestamp > thirdHour &&
  //       d.dischargeTimestamp < fourthHour
  //     ) {
  //       thirdHourDischarge++;
  //     } else if (
  //       d.dischargeTimestamp > secondHour &&
  //       d.dischargeTimestamp < thirdHour
  //     ) {
  //       secondHourDischarge++;
  //     } else if (
  //       d.dischargeTimestamp > sixHour &&
  //       d.dischargeTimestamp < secondHour
  //     ) {
  //       firstHourDischarge++;
  //     }
  //   });
  //   DischargeArr.push({ label: lastHour, value: sixthHourDischarge });
  //   DischargeArr.push({ label: fifthHour, value: fifthHourDischarge });
  //   DischargeArr.push({ label: fourthHour, value: fourthHourDischarge });
  //   DischargeArr.push({ label: thirdHour, value: thirdHourDischarge });
  //   DischargeArr.push({ label: secondHour, value: secondHourDischarge });
  //   DischargeArr.push({ label: sixHour, value: firstHourDischarge });

  //   const dischargeCompleted = await EDR.find({
  //     status: 'Discharged',
  //     socialWorkerStatus: 'completed',
  //     'survey.0.surveyTime': { $gte: sixHour },
  //   });

  //   let dischargeTime = 0;
  //   dischargeCompleted.map((t) => {
  //     t.dischargeStart = new Date(t.dischargeTimestamp);

  //     t.dischargeEnd = new Date(t.survey[0].surveyTime);

  //     t.time = Math.round(
  //       (t.dischargeEnd.getTime() - t.dischargeStart.getTime()) / (1000 * 60)
  //     );
  //     dischargeTime += t.time;
  //   });

  //   const dischargeTAT = dischargeTime / dischargeCompleted.length;

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

  //   // * 5th Card
  //   const labPending = await EDR.aggregate([
  //     {
  //       $project: {
  //         labRequest: 1,
  //       },
  //     },
  //     {
  //       $unwind: '$labRequest',
  //     },
  //     {
  //       $match: {
  //         $and: [
  //           { 'labRequest.status': { $ne: 'completed' } },
  //           { 'labRequest.requestedAt': { $gte: sixHour } },
  //         ],
  //       },
  //     },
  //   ]);

  //   // console.log(labPending);

  //   const fifthCardArr = [];
  //   let sixthHourLab = 0;
  //   let fifthHourLab = 0;
  //   let fourthHourLab = 0;
  //   let thirdHourLab = 0;
  //   let secondHourLab = 0;
  //   let firstHourLab = 0;
  //   labPending.map((l) => {
  //     if (
  //       l.labRequest.requestedAt > lastHour &&
  //       l.labRequest.requestedAt < currentTime
  //     ) {
  //       sixthHourLab++;
  //       // console.log('sixthHourLab', sixthHourLab);
  //     } else if (
  //       l.labRequest.requestedAt > fifthHour &&
  //       l.labRequest.requestedAt < lastHour
  //     ) {
  //       fifthHourLab++;
  //     } else if (
  //       l.labRequest.requestedAt > fourthHour &&
  //       l.labRequest.requestedAt < fifthHour
  //     ) {
  //       fourthHourLab++;
  //     } else if (
  //       l.labRequest.requestedAt > thirdHour &&
  //       l.labRequest.requestedAt < fourthHour
  //     ) {
  //       thirdHourLab++;
  //     } else if (
  //       l.labRequest.requestedAt > secondHour &&
  //       l.labRequest.requestedAt < thirdHour
  //     ) {
  //       secondHourLab++;
  //     } else if (
  //       l.labRequest.requestedAt > sixHour &&
  //       l.labRequest.requestedAt < secondHour
  //     ) {
  //       firstHourLab++;
  //     }
  //   });
  //   fifthCardArr.push({ label: lastHour, value: sixthHourLab });
  //   fifthCardArr.push({ label: fifthHour, value: fifthHourLab });
  //   fifthCardArr.push({ label: fourthHour, value: fourthHourLab });
  //   fifthCardArr.push({ label: thirdHour, value: thirdHourLab });
  //   fifthCardArr.push({ label: secondHour, value: secondHourLab });
  //   fifthCardArr.push({ label: sixHour, value: firstHourLab });

  //   // TAT
  //   const labCompleted = await EDR.aggregate([
  //     {
  //       $project: {
  //         labRequest: 1,
  //       },
  //     },
  //     {
  //       $unwind: '$labRequest',
  //     },
  //     {
  //       $match: {
  //         $and: [
  //           { 'labRequest.status': 'completed' },
  //           { 'labRequest.completeTime': { $gte: sixHour } },
  //         ],
  //       },
  //     },
  //   ]);

  //   let labTime = 0;
  //   labCompleted.map((t) => {
  //     t.labStart = new Date(t.labRequest.requestedAt);

  //     t.labEnd = new Date(t.labRequest.completeTime);

  //     t.time = Math.round(
  //       (t.labEnd.getTime() - t.labStart.getTime()) / (1000 * 60)
  //     );
  //     labTime += t.time;
  //   });

  //   const completedLabTAT = labTime / labCompleted.length;

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

  //   // * 6th Card
  //   const pendingRad = await EDR.aggregate([
  //     {
  //       $project: {
  //         status: 1,
  //         radRequest: 1,
  //       },
  //     },
  //     {
  //       $match: {
  //         status: 'pending',
  //       },
  //     },
  //     {
  //       $unwind: '$radRequest',
  //     },
  //     {
  //       $match: {
  //         $and: [
  //           { 'radRequest.status': 'pending approval' },
  //           { 'radRequest.pendingApprovalTime': { $gte: sixHour } },
  //           { 'radRequest.pendingApprovalTime': { $lte: currentTime } },
  //         ],
  //       },
  //     },
  //   ]);

  //   const radArr = [];
  //   let sixthHourRad = 0;
  //   let fifthHourRad = 0;
  //   let fourthHourRad = 0;
  //   let thirdHourRad = 0;
  //   let secondHourRad = 0;
  //   let firstHourRad = 0;
  //   pendingRad.map((r) => {
  //     if (
  //       r.radRequest.pendingApprovalTime > lastHour &&
  //       r.radRequest.pendingApprovalTime < currentTime
  //     ) {
  //       sixthHourRad++;
  //       // console.log('sixthHourRad', sixthHourRad);
  //     } else if (
  //       r.radRequest.pendingApprovalTime > fifthHour &&
  //       r.radRequest.pendingApprovalTime < lastHour
  //     ) {
  //       fifthHourRad++;
  //     } else if (
  //       r.radRequest.pendingApprovalTime > fourthHour &&
  //       r.radRequest.pendingApprovalTime < fifthHour
  //     ) {
  //       fourthHourRad++;
  //     } else if (
  //       r.radRequest.pendingApprovalTime > thirdHour &&
  //       r.radRequest.pendingApprovalTime < fourthHour
  //     ) {
  //       thirdHourRad++;
  //     } else if (
  //       r.radRequest.pendingApprovalTime > secondHour &&
  //       r.radRequest.pendingApprovalTime < thirdHour
  //     ) {
  //       secondHourRad++;
  //     } else if (
  //       r.radRequest.pendingApprovalTime > sixHour &&
  //       r.radRequest.pendingApprovalTime < secondHour
  //     ) {
  //       firstHourRad++;
  //     }
  //   });
  //   radArr.push({ label: lastHour, value: sixthHourRad });
  //   radArr.push({ label: fifthHour, value: fifthHourRad });
  //   radArr.push({ label: fourthHour, value: fourthHourRad });
  //   radArr.push({ label: thirdHour, value: thirdHourRad });
  //   radArr.push({ label: secondHour, value: secondHourRad });
  //   radArr.push({ label: sixHour, value: firstHourRad });

  //   // TAT
  //   const completedRad = await EDR.aggregate([
  //     {
  //       $project: {
  //         status: 1,
  //         radRequest: 1,
  //       },
  //     },
  //     {
  //       $match: {
  //         status: 'pending',
  //       },
  //     },
  //     {
  //       $unwind: '$radRequest',
  //     },
  //     {
  //       $match: {
  //         $and: [
  //           { 'radRequest.status': 'completed' },
  //           { 'radRequest.completeTime': { $gte: sixHour } },
  //           { 'radRequest.completeTime': { $lte: currentTime } },
  //         ],
  //       },
  //     },
  //   ]);

  //   let radTime = 0;
  //   completedRad.map((t) => {
  //     t.radStart = new Date(t.radRequest.requestedAt);

  //     t.radEnd = new Date(t.radRequest.completeTime);

  //     t.time = Math.round(
  //       (t.radEnd.getTime() - t.radStart.getTime()) / (1000 * 60)
  //     );
  //     radTime += t.time;
  //   });

  //   const completedRadTAT = radTime / completedRad.length;

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

  //   const cumulativePatient = await EDR.find().countDocuments();

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

    // thirdCard: {
    //   TAT: dischargeTAT,
    //   totalPending: dischargePending.length,
    //   perHour: DischargeArr,
    // },
    // fourthCard: {
    //   TAT: completedNoteTAT,
    //   totalPending: consultantNotes.length,
    //   perHour: fourthCardArr,
    // },
    // fifthCard: {
    //   TAT: completedLabTAT,
    //   totalPending: labPending.length,
    //   perHour: fifthCardArr,
    // },
    // sixthCard: {
    //   TAT: completedRadTAT,
    //   totalPending: pendingRad.length,
    //   perHour: radArr,
    // },
    // seventhCard: {
    //   TAT: completedPharmTAT,
    //   totalPending: pharmacyPending.length,
    //   perHour: pharmacyArr,
    // },
    // diagnosedPerHour,
    // cumulativePatient,
  });
});
