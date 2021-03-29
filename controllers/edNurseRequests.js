const moment = require('moment');
const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const EDN = require('../models/edNurseAssistanceRequest');
const Room = require('../models/room');
const CCRequests = require('../models/customerCareRequest');
const Flag = require('../models/flag/Flag');

exports.getLab = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $or: [
          { 'labRequest.status': 'pending approval' },
          { 'labRequest.status': 'completed' },
        ],
      },
    },
    {
      $group: {
        _id: { patientId: '$patientId' },
        labRequest: { $push: '$labRequest' },
      },
    },
    {
      $project: {
        patientId: '$_id',
        _id: 0,
        labRequest: 1,
      },
    },
  ]);

  const lab = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name createdAt weight age gender',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
  ]);
  res.status(200).json({
    success: true,
    data: lab,
  });
});

exports.getRad = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        radRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $or: [
          { 'radRequest.status': 'pending approval' },
          { 'radRequest.status': 'completed' },
        ],
      },
    },
    {
      $group: {
        _id: { patientId: '$patientId' },
        radRequest: { $push: '$radRequest' },
      },
    },
    {
      $project: {
        patientId: '$_id',
        _id: 0,
        radRequest: 1,
      },
    },
  ]);

  const rad = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name createdAt weight age gender',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
  ]);
  res.status(200).json({
    success: true,
    data: rad,
  });
});

exports.getPharmacy = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        pharmacyRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    // {
    //   $match: {
    //     'pharmacyRequest.status': 'pending',
    //   },
    // },
    {
      $group: {
        _id: '$_id',
        patientId: { $push: '$patientId' },
        pharmacyRequest: { $push: '$pharmacyRequest' },
      },
    },
    {
      $project: {
        patientId: 1,
        _id: 1,
        pharmacyRequest: 1,
      },
    },
  ]);
  // console.log(unwindEdr);

  const pharmacyRequest = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name createdAt weight age gender',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
  ]);
  res.status(200).json({
    success: true,
    data: pharmacyRequest,
  });
});

exports.submitRequest = asyncHandler(async (req, res, next) => {
  const { patientId, staffId, assignedBy, staffType, reason } = req.body;
  let request;
  if (staffType === 'Customer Care') {
    request = await CCRequests.create({});
  }
  request = await EDN.create({
    patientId,
    staffId,
    assignedBy,
    staffType,
    reason,
  });

  res.status(200).json({
    success: true,
    data: request,
  });
});

exports.updateSubmitRequest = asyncHandler(async (req, res, next) => {
  const { requestId, remarks } = req.body;

  const request = await EDN.findOneAndUpdate(
    { _id: requestId },
    {
      $set: {
        status: 'complete',
        remarks: remarks,
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: request,
  });
});

exports.getHouskeepingRequests = asyncHandler(async (req, res, next) => {
  const HKRequests = await EDN.find({ staffType: 'Housekeeping' })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: HKRequests,
  });
});

exports.getHouskeepingRequestsById = asyncHandler(async (req, res, next) => {
  const HKRequests = await EDN.find({
    staffType: 'Housekeeping',
    staffId: req.params.staffId,
  })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: HKRequests,
  });
});

exports.getCustomerCareRequests = asyncHandler(async (req, res, next) => {
  const ccRequests = await EDN.find({ staffType: 'Customer Care' })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: ccRequests,
  });
});

exports.getCustomerCareRequestsById = asyncHandler(async (req, res, next) => {
  const HKRequests = await EDN.find({
    staffType: 'Customer Care',
    staffId: req.params.staffId,
  })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: HKRequests,
  });
});

exports.getNurseTechnicianRequests = asyncHandler(async (req, res, next) => {
  const NTRequests = await EDN.find({ staffType: 'Nurse Technician' })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: NTRequests,
  });
});

exports.getNurseTechnicianRequestsById = asyncHandler(
  async (req, res, next) => {
    const NTRequests = await EDN.find({
      staffType: 'Nurse Technician',
      staffId: req.params.staffId,
    })
      .populate('patientId', 'name identifier')
      .populate('staffId', 'name identifier');
    res.status(200).json({
      success: true,
      data: NTRequests,
    });
  }
);
exports.pendingEDNurseEdrRequest = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        edNurseRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'edNurseRequest.status': 'pending' },
          {
            'edNurseRequest.edNurseId': mongoose.Types.ObjectId(
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
  for (let i = 0; i < edrNotes.edNurseRequest.length; i++) {
    if (edrNotes.edNurseRequest[i]._id == req.body.requestId) {
      request = i;
    }
  }
  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`edNurseRequest.${request}.status`]: 'completed',
        [`edNurseRequest.${request}.completedAt`]: Date.now(),
      },
    },
    { new: true }
  )
    .select('patientId edNurseRequest')
    .populate('patientId', 'Identifier');

  const EDnurseTasksPending = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        edNurseRequest: 1,
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'edNurseRequest.status': 'pending' },
          {
            'edNurseRequest.edNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
        ],
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.completedEDNurseEdrRequest = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        edNurseRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'edNurseRequest.status': 'completed' },
          {
            'edNurseRequest.edNurseId': mongoose.Types.ObjectId(
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

exports.updateMedicationStatus = asyncHandler(async (req, res, next) => {
  const edrMedication = await EDR.findOne({ _id: req.body.edrId });

  let request;
  for (let i = 0; i < edrMedication.pharmacyRequest.length; i++) {
    if (edrMedication.pharmacyRequest[i]._id == req.body.requestId) {
      request = i;
    }
  }

  let updatedRequest;
  if (req.body.status === 'delivered') {
    updatedRequest = await EDR.findOneAndUpdate(
      { _id: req.body.edrId },
      {
        $set: {
          [`pharmacyRequest.${request}.status`]: req.body.status,
          [`pharmacyRequest.${request}.deliveredTime`]: Date.now(),
        },
      },
      { new: true }
    )
      .select('patientId pharmacyRequest')
      .populate('patientId', 'Identifier');

    const patientTreatmentsPending = await EDR.aggregate([
      {
        $project: {
          pharmacyRequest: 1,
        },
      },
      {
        $unwind: '$pharmacyRequest',
      },
      {
        $match: {
          'pharmacyRequest.status': { $ne: 'closed' },
        },
      },
    ]);

    if (patientTreatmentsPending.length > 6) {
      await Flag.create({
        edrId: req.body.edrId,
        generatedFrom: 'Sensei',
        card: '7th',
        generatedFor: 'Sensei',
        reason: 'Patients Medications By Nurse Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'Sensei',
        status: 'pending',
      });
      globalVariable.io.emit('pendingSensei', flags);
    }

    if (patientTreatmentsPending.length > 6) {
      await Flag.create({
        edrId: req.body.edrId,
        generatedFrom: 'ED Nurse',
        card: '2nd',
        generatedFor: 'Sensei',
        reason: 'Patients Medications By Nurse Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'ED Nurse',
        status: 'pending',
      });
      globalVariable.io.emit('edNursePending', flags);
    }

    if (patientTreatmentsPending.length > 4) {
      await Flag.create({
        edrId: req.body.edrId,
        generatedFrom: 'ED Doctor',
        card: '7th',
        generatedFor: 'ED Doctor',
        reason: 'Patients Medications By Nurse Pending',
        createdAt: Date.now(),
      });
      const flags = await Flag.find({
        generatedFrom: 'ED Doctor',
        status: 'pending',
      });
      globalVariable.io.emit('pendingDoctor', flags);
    }
  }

  if (req.body.status === 'closed') {
    updatedRequest = await EDR.findOneAndUpdate(
      { _id: req.body.edrId },
      {
        $set: {
          [`pharmacyRequest.${request}.status`]: req.body.status,
          [`pharmacyRequest.${request}.completedTime`]: Date.now(),
        },
      },
      { new: true }
    )
      .select('patientId pharmacyRequest')
      .populate('patientId', 'Identifier');
  }

  res.status(200).json({
    success: true,
    data: updatedRequest,
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
    createdTimeStamp: { $gte: sixHour },
    'dcdForm.$.triageAssessment': { $eq: [] },
  });

  patientTriagePending.map((p) => {
    compareDataForSixHours(p.createdTimeStamp);
  });

  const perHourTriagePending = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  const patientWithRegToTriage = await EDR.find({
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
        pharmacyRequest: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
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
  const EDnurseTasksPending = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        edNurseRequest: 1,
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'edNurseRequest.status': 'pending' },
          {
            'edNurseRequest.edNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
          { 'edNurseRequest.requestedAt': { $gte: sixHour } },
          { 'edNurseRequest.requestedAt': { $lte: currentTime } },
        ],
      },
    },
  ]);
  EDnurseTasksPending.map((p) => {
    compareDataForSixHours(p.edNurseRequest.requestedAt);
  });

  let edNurseTaskArr = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT for ED Nurse Tasks Pending
  const tasksCompleted = await EDR.aggregate([
    {
      $project: {
        edNurseRequest: 1,
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'edNurseRequest.status': 'completed' },
          {
            'edNurseRequest.edNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
          { 'edNurseRequest.completedAt': { $gte: sixHour } },
          { 'edNurseRequest.completedAt': { $lte: currentTime } },
        ],
      },
    },
  ]);

  let tasksTime = 0;
  tasksCompleted.map((t) => {
    t.taskStart = new Date(t.edNurseRequest.requestedAt);
    t.taskEnd = new Date(t.edNurseRequest.completedAt);

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
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
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
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    {
      $match: {
        $and: [
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

  let fifthCardArr = JSON.parse(JSON.stringify(arr));
  clearAllTime();

  // TAT For Lab Pending
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

  // Cumulative Total Patients
  const cumulativePatients = await EDR.find({
    currentLocation: 'ED',
  }).countDocuments();

  // Available ED Beds
  const EdBeds = await Room.find({
    availability: true,
  }).countDocuments();

  // Number Of Patients Per Hour
  const patientsPerHour = await EDR.find({
    edNurseRequest: { $ne: [] },
    'edNurseRequest.$.requestedAt': { $gte: sixHour },
    'edNurseRequest.$.status': 'completed',
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
      totalPending: EDnurseTasksPending.length,
      perHour: edNurseTaskArr,
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
