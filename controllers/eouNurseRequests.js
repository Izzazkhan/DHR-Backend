const moment = require('moment');
const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Room = require('../models/room');
const EouPatients = require('../models/EOUNurse');

// EOU Nurse Assigned Patients
exports.getEOUNursePatients = asyncHandler(async (req, res, next) => {
  const patients = await EouPatients.find({
    nurseId: req.params.nurseId,
  }).populate([
    {
      path: 'edrId',
      model: 'EDR',
      //   select: 'patientId chiefComplaint',s
      populate: [
        {
          path: 'patientId',
          model: 'patientfhir',
          select: 'identifier name',
        },
        {
          path: 'chiefComplaint.chiefComplaintId',
          model: 'chiefComplaint',
          select: 'productionArea.productionAreaId',
          populate: {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        },
        {
          path: 'newChiefComplaint.newChiefComplaintId',
          model: 'NewChiefComplaint',
        },
        {
          path: 'room.roomId',
          model: 'room',
        },
        {
          path: 'patientId',
          model: 'patientfhir',
        },
        {
          path: 'careStream.careStreamId',
          model: 'careStream',
        },
        {
          path: 'consultationNote.addedBy',
          model: 'staff',
        },
        {
          path: 'consultationNote.consultant',
          model: 'staff',
        },
        {
          path: 'room.roomId',
          model: 'room',
        },
        {
          path: 'radRequest.serviceId',
          model: 'RadiologyService',
        },
        {
          path: 'radRequest.requestedBy',
          model: 'staff',
        },
        {
          path: 'labRequest.serviceId',
          model: 'LaboratoryService',
        },
        {
          path: 'labRequest.requestedBy',
          model: 'staff',
        },
        {
          path: 'pharmacyRequest.requestedBy',
          model: 'staff',
        },
        {
          path: 'pharmacyRequest.item.itemId',
          model: 'Item',
        },
        {
          path: 'doctorNotes.addedBy',
          model: 'staff',
        },
        {
          path: 'edNurseRequest.addedBy',
          model: 'staff',
        },
        {
          path: 'eouNurseRequest.addedBy',
          model: 'staff',
        },
        {
          path: 'nurseTechnicianRequest.addedBy',
          model: 'staff',
        },
        {
          path: 'anesthesiologistNote.addedBy',
          model: 'staff',
        },
        {
          path: 'pharmacyRequest.reconciliationNotes.addedBy',
          model: 'staff',
        },
        {
          path: 'eouBed.bedId',
          model: 'Bed',
          select: 'bedId bedNo',
        },
      ],
    },
  ]);
  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.pendingEOUNurseEdrRequest = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        eouNurseRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$eouNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'eouNurseRequest.status': 'pending' },
          {
            'eouNurseRequest.eouNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
        ],
      },
    },
    // {
    //   $group: {
    //     _id: { patientId: '$patientId' },
    //     labRequest: { $push: '$labRequest' },
    //   },
    // },
    // {
    //   $project: {
    //     patientId: '$_id',
    //     _id: 0,
    //     labRequest: 1,
    //   },
    // },
  ]);

  const request = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    // {
    //   path: 'labRequest.serviceId',
    //   model: 'LaboratoryService',
    // },
  ]);
  res.status(200).json({
    success: true,
    data: request,
  });
});

exports.completeRequest = asyncHandler(async (req, res, next) => {
  const edrNotes = await EDR.findOne({ _id: req.body.edrId });

  let request;
  for (let i = 0; i < edrNotes.eouNurseRequest.length; i++) {
    if (edrNotes.eouNurseRequest[i]._id == req.body.requestId) {
      request = i;
    }
  }
  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`eouNurseRequest.${request}.status`]: 'completed',
        [`eouNurseRequest.${request}.completedAt`]: Date.now(),
      },
    },
    { new: true }
  )
    .select('patientId eouNurseRequest')
    .populate('patientId', 'Identifier');

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.completedEOUNurseEdrRequest = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        eouNurseRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$eouNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'eouNurseRequest.status': 'completed' },
          {
            'eouNurseRequest.eouNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
        ],
      },
    },
    // {
    //   $group: {
    //     _id: { patientId: '$patientId' },
    //     labRequest: { $push: '$labRequest' },
    //   },
    // },
    // {
    //   $project: {
    //     patientId: '$_id',
    //     _id: 0,
    //     labRequest: 1,
    //   },
    // },
  ]);

  const request = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    // {
    //   path: 'labRequest.serviceId',
    //   model: 'LaboratoryService',
    // },
  ]);
  res.status(200).json({
    success: true,
    data: request,
  });
});

exports.dashboardData = asyncHandler(async (req, res, next) => {
  // ***** Configuration *********
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
  // ***** Configuration *********

  // 1st Card (Patient Assessments / Triage Pending)
  const patientTriagePending = await EDR.find({
    currentLocation: 'EOU',
    createdTimeStamp: { $gte: sixHour },
    'dcdForm.$.triageAssessment': { $eq: [] },
  });

  patientTriagePending.map((p) => {
    compareDataForSixHours(p.createdTimeStamp);
  });

  const perHourTriagePending = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  const patientWithRegToTriage = await EDR.find({
    currentLocation: 'EOU',
    createdTimeStamp: { $gte: sixHour },
    'dcdForm.$.triageAssessment': { $ne: [] },
  });

  let totalTimeBetweenRegAndTriage = 0;
  patientWithRegToTriage.forEach((t) => {
    t.createdTimeStamp = new Date(t.createdTimeStamp);
    t.triageTime = new Date(
      t.dcdForm[t.dcdForm.length - 1].triageAssessment[
        t.dcdForm[t.dcdForm.length - 1].triageAssessment.length - 1
      ].triageTime
    );

    t.time = Math.round(
      (t.triageTime.getTime() - t.createdTimeStamp.getTime()) / (1000 * 60)
    );
    totalTimeBetweenRegAndTriage += t.time;
  });
  const TATForRegToTriage =
    patientWithRegToTriage.length > 0
      ? totalTimeBetweenRegAndTriage / patientWithRegToTriage.length
      : 0;

  // 2nd Card (Patient Treatment / Medications Pending)
  const patientTreatmentsPending = await EDR.aggregate([
    {
      $project: {
        currentLocation: 1,
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
          { 'pharmacyRequest.createdAt': { $gte: sixHour } },
          { 'pharmacyRequest.status': { $ne: 'closed' } },
        ],
      },
    },
  ]);

  patientTreatmentsPending.map((p) => {
    compareDataForSixHours(p.pharmacyRequest.createdAt);
  });

  const perHourTreatmentsPending = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  const patientWithDiagnosisToMedication = await EDR.aggregate([
    {
      $project: {
        currentLocation: 1,
        doctorNotes: 1,
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$doctorNotes',
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
          { 'pharmacyRequest.status': { $eq: 'closed' } },
          { 'doctorNotes.assignedTime': { $gte: sixHour } },
        ],
      },
    },
  ]);

  let totalTimeBetweenDiagnosisToMed = 0;
  patientWithDiagnosisToMedication.forEach((t) => {
    t.createdTimeStamp = new Date(t.doctorNotes.assignedTime);
    t.completedTime = new Date(t.pharmacyRequest.completedTime);
    t.time = Math.round(
      (t.completedTime.getTime() - t.createdTimeStamp.getTime()) / (1000 * 60)
    );
    totalTimeBetweenDiagnosisToMed += t.time;
  });
  const TATForDiagnosisToMed =
    patientWithDiagnosisToMedication.length > 0
      ? totalTimeBetweenDiagnosisToMed / patientWithDiagnosisToMedication.length
      : 0;

  // 3rd Card (Tasks Pending)
  const EOUnurseTasksPending = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        eouNurseRequest: 1,
      },
    },
    {
      $unwind: '$eouNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'eouNurseRequest.status': 'pending' },
          {
            'eouNurseRequest.eouNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
          { 'eouNurseRequest.requestedAt': { $gte: sixHour } },
          { 'eouNurseRequest.requestedAt': { $lte: currentTime } },
        ],
      },
    },
  ]);
  EOUnurseTasksPending.map((p) => {
    compareDataForSixHours(p.eouNurseRequest.requestedAt);
  });

  let eouNurseTaskArr = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT for EOU Nurse Tasks Pending
  const tasksCompleted = await EDR.aggregate([
    {
      $project: {
        eouNurseRequest: 1,
      },
    },
    {
      $unwind: '$eouNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'eouNurseRequest.status': 'completed' },
          {
            'eouNurseRequest.eouNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
          { 'eouNurseRequest.completedAt': { $gte: sixHour } },
          { 'eouNurseRequest.completedAt': { $lte: currentTime } },
        ],
      },
    },
  ]);

  let tasksTime = 0;
  tasksCompleted.map((t) => {
    t.taskStart = new Date(t.eouNurseRequest.requestedAt);
    t.taskEnd = new Date(t.eouNurseRequest.completedAt);

    t.time = Math.round(
      (t.taskEnd.getTime() - t.taskStart.getTime()) / (1000 * 60)
    );
    tasksTime += t.time;
  });
  const completedTasksTAT = tasksTime / tasksCompleted.length;

  // * 4th Card (Patient Rad Consultation Notes Pending)
  const pendingRad = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        status: 'pending',
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
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

  let radArr = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT For Rad notes pending
  const completedRad = await EDR.aggregate([
    {
      $project: {
        status: 1,
        radRequest: 1,
        currentLocation: 1,
      },
    },
    {
      $match: {
        status: 'pending',
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
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

  // * 5th Card (Orders Pending)
  const pharmacyPending = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
        currentLocation: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
          { 'pharmacyRequest.status': { $ne: 'closed' } },
          { 'pharmacyRequest.createdAt': { $gte: sixHour } },
          { 'pharmacyRequest.createdAt': { $lte: currentTime } },
        ],
      },
    },
  ]);
  pharmacyPending.map((p) => {
    compareDataForSixHours(p.pharmacyRequest.createdAt);
  });

  let pharmacyArr = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT for Orders Pending
  const pharmacyCompleted = await EDR.aggregate([
    {
      $project: {
        pharmacyRequest: 1,
        currentLocation: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
          { 'pharmacyRequest.status': 'delivered' },
          { 'pharmacyRequest.deliveredTime': { $gte: sixHour } },
          { 'pharmacyRequest.deliveredTime': { $lte: currentTime } },
        ],
      },
    },
  ]);

  let pharmacyTime = 0;
  pharmacyCompleted.map((t) => {
    t.pharmStart = new Date(t.pharmacyRequest.createdAt);
    t.pharmEnd = new Date(t.pharmacyRequest.deliveredTime);

    t.time = Math.round(
      (t.pharmEnd.getTime() - t.pharmStart.getTime()) / (1000 * 60)
    );
    pharmacyTime += t.time;
  });
  const completedPharmTAT = pharmacyTime / pharmacyCompleted.length;

  // * 6th Card ( Patient Lab Results Pending )
  const labPending = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
        currentLocation: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
          { 'labRequest.status': { $ne: 'completed' } },
          { 'labRequest.requestedAt': { $gte: sixHour } },
        ],
      },
    },
  ]);

  labPending.map((l) => {
    compareDataForSixHours(l.labRequest.requestedAt);
  });

  let fifthCardArr = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT For Lab Pending
  const labCompleted = await EDR.aggregate([
    {
      $project: {
        labRequest: 1,
        currentLocation: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { currentLocation: 'EOU' },
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

  // Cumulative Total Patients
  const cumulativePatients = await EDR.find({
    currentLocation: 'EOU',
  }).countDocuments();

  // Available ED Beds
  const EdBeds = await Room.find({
    availability: true,
  }).countDocuments();

  // Number Of Patients Per Hour
  const patientsPerHour = await EDR.find({
    eouNurseRequest: { $ne: [] },
    'eouNurseRequest.$.requestedAt': { $gte: sixHour },
    'eouNurseRequest.$.status': 'completed',
  });
  const PatientsPerHour = Math.round(patientsPerHour.length / 6);

  res.status(200).json({
    success: true,
    availableEdBeds: EdBeds,
    firstCard: {
      TAT: TATForRegToTriage,
      totalPending: patientTriagePending.length,
      perHour: perHourTriagePending,
    },
    secondCard: {
      TAT: TATForDiagnosisToMed,
      totalPending: patientTreatmentsPending.length,
      perHour: perHourTreatmentsPending,
    },
    thirdCard: {
      TAT: completedTasksTAT,
      totalPending: EOUnurseTasksPending.length,
      perHour: eouNurseTaskArr,
    },
    fourthCard: {
      TAT: completedRadTAT,
      totalPending: pendingRad.length,
      perHour: radArr,
    },
    fifthCard: {
      TAT: completedPharmTAT,
      totalPending: pharmacyPending.length,
      perHour: pharmacyArr,
    },
    sixthCard: {
      TAT: completedLabTAT,
      totalPending: labPending.length,
      perHour: fifthCardArr,
    },
    cumulativePatients,
    PatientsPerHour,
  });
});
