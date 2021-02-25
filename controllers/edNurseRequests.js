const moment = require('moment');
const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const EDN = require('../models/edNurseAssistanceRequest');
const Room = require('../models/room');
const CCRequests = require('../models/customerCareRequest');

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
    reason
  });

  res.status(200).json({
    success: true,
    data: request,
  });
});

exports.updateSubmitRequest = asyncHandler(async (req, res, next) => {

  const { requestId, remarks } = req.body;

const request = await EDN.findOneAndUpdate({_id:requestId},{
  $set:{
  status:"complete",
  remarks:remarks
  }
  },
  { new: true });

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

exports.getHouskeepingRequests = asyncHandler(async (req, res, next) => {
  const HKRequests = await EDN.find({ staffType: 'Housekeeping', staffId:req.params.staffId })
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

exports.getNurseTechnicianRequests = asyncHandler(async (req, res, next) => {
  const NTRequests = await EDN.find({ staffType: 'Nurse Technician' })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: NTRequests,
  });
});

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

  const currentTime = moment().utc().toDate();
  const lastHour = moment().subtract(1, 'hours').utc().toDate();
  const fifthHour = moment().subtract(2, 'hours').utc().toDate();
  const fourthHour = moment().subtract(3, 'hours').utc().toDate();
  const thirdHour = moment().subtract(4, 'hours').utc().toDate();
  const secondHour = moment().subtract(5, 'hours').utc().toDate();
  const sixHour = moment().subtract(6, 'hours').utc().toDate();

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

  const fifthCardArr = [];
  let sixthHourLab = 0;
  let fifthHourLab = 0;
  let fourthHourLab = 0;
  let thirdHourLab = 0;
  let secondHourLab = 0;
  let firstHourLab = 0;

  labPending.map((l) => {
    if (
      l.labRequest.requestedAt > lastHour &&
      l.labRequest.requestedAt < currentTime
    ) {
      sixthHourLab++;
    } else if (
      l.labRequest.requestedAt > fifthHour &&
      l.labRequest.requestedAt < lastHour
    ) {
      fifthHourLab++;
    } else if (
      l.labRequest.requestedAt > fourthHour &&
      l.labRequest.requestedAt < fifthHour
    ) {
      fourthHourLab++;
    } else if (
      l.labRequest.requestedAt > thirdHour &&
      l.labRequest.requestedAt < fourthHour
    ) {
      thirdHourLab++;
    } else if (
      l.labRequest.requestedAt > secondHour &&
      l.labRequest.requestedAt < thirdHour
    ) {
      secondHourLab++;
    } else if (
      l.labRequest.requestedAt > sixHour &&
      l.labRequest.requestedAt < secondHour
    ) {
      firstHourLab++;
    }
  });

  fifthCardArr.push({ label: lastHour, value: sixthHourLab });
  fifthCardArr.push({ label: fifthHour, value: fifthHourLab });
  fifthCardArr.push({ label: fourthHour, value: fourthHourLab });
  fifthCardArr.push({ label: thirdHour, value: thirdHourLab });
  fifthCardArr.push({ label: secondHour, value: secondHourLab });
  fifthCardArr.push({ label: sixHour, value: firstHourLab });

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

  const radArr = [];
  let sixthHourRad = 0;
  let fifthHourRad = 0;
  let fourthHourRad = 0;
  let thirdHourRad = 0;
  let secondHourRad = 0;
  let firstHourRad = 0;

  pendingRad.map((r) => {
    if (
      r.radRequest.pendingApprovalTime > lastHour &&
      r.radRequest.pendingApprovalTime < currentTime
    ) {
      sixthHourRad++;
    } else if (
      r.radRequest.pendingApprovalTime > fifthHour &&
      r.radRequest.pendingApprovalTime < lastHour
    ) {
      fifthHourRad++;
    } else if (
      r.radRequest.pendingApprovalTime > fourthHour &&
      r.radRequest.pendingApprovalTime < fifthHour
    ) {
      fourthHourRad++;
    } else if (
      r.radRequest.pendingApprovalTime > thirdHour &&
      r.radRequest.pendingApprovalTime < fourthHour
    ) {
      thirdHourRad++;
    } else if (
      r.radRequest.pendingApprovalTime > secondHour &&
      r.radRequest.pendingApprovalTime < thirdHour
    ) {
      secondHourRad++;
    } else if (
      r.radRequest.pendingApprovalTime > sixHour &&
      r.radRequest.pendingApprovalTime < secondHour
    ) {
      firstHourRad++;
    }
  });

  radArr.push({ label: lastHour, value: sixthHourRad });
  radArr.push({ label: fifthHour, value: fifthHourRad });
  radArr.push({ label: fourthHour, value: fourthHourRad });
  radArr.push({ label: thirdHour, value: thirdHourRad });
  radArr.push({ label: secondHour, value: secondHourRad });
  radArr.push({ label: sixHour, value: firstHourRad });

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

  const pharmacyArr = [];
  let sixthHourPharmacy = 0;
  let fifthHourPharmacy = 0;
  let fourthHourPharmacy = 0;
  let thirdHourPharmacy = 0;
  let secondHourPharmacy = 0;
  let firstHourPharmacy = 0;

  pharmacyPending.map((p) => {
    if (
      p.pharmacyRequest.createdAt > lastHour &&
      p.pharmacyRequest.createdAt < currentTime
    ) {
      sixthHourPharmacy++;
    } else if (
      p.pharmacyRequest.createdAt > fifthHour &&
      p.pharmacyRequest.createdAt < lastHour
    ) {
      fifthHourPharmacy++;
    } else if (
      p.pharmacyRequest.createdAt > fourthHour &&
      p.pharmacyRequest.createdAt < fifthHour
    ) {
      fourthHourPharmacy++;
    } else if (
      p.pharmacyRequest.createdAt > thirdHour &&
      p.pharmacyRequest.createdAt < fourthHour
    ) {
      thirdHourPharmacy++;
    } else if (
      p.pharmacyRequest.createdAt > secondHour &&
      p.pharmacyRequest.createdAt < thirdHour
    ) {
      secondHourPharmacy++;
    } else if (
      p.pharmacyRequest.createdAt > sixHour &&
      p.pharmacyRequest.createdAt < secondHour
    ) {
      firstHourPharmacy++;
    }
  });
  pharmacyArr.push({ label: lastHour, value: sixthHourPharmacy });
  pharmacyArr.push({ label: fifthHour, value: fifthHourPharmacy });
  pharmacyArr.push({ label: fourthHour, value: fourthHourPharmacy });
  pharmacyArr.push({ label: thirdHour, value: thirdHourPharmacy });
  pharmacyArr.push({ label: secondHour, value: secondHourPharmacy });
  pharmacyArr.push({ label: sixHour, value: firstHourPharmacy });

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

  // 3rd Card (Tasks Pending)
  const EDnurseTasksPending = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        edNurseRequest: 1
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'edNurseRequest.status': 'pending' },
          { 'edNurseRequest.edNurseId': mongoose.Types.ObjectId(req.params.nurseId) },
          { 'edNurseRequest.requestedAt': { $gte: sixHour } },
          { 'edNurseRequest.requestedAt': { $lte: currentTime } },
        ],
      },
    },
  ]);

  const edNurseTaskArr = [];
  let sixthHourTask = 0;
  let fifthHourTask = 0;
  let fourthHourTask = 0;
  let thirdHourTask = 0;
  let secondHourTask = 0;
  let firstHourTask = 0;

  EDnurseTasksPending.map((p) => {
    if (
      p.edNurseRequest.requestedAt > lastHour &&
      p.edNurseRequest.requestedAt < currentTime
    ) {
      sixthHourTask++;
    } else if (
      p.edNurseRequest.requestedAt > fifthHour &&
      p.edNurseRequest.requestedAt < lastHour
    ) {
      fifthHourTask++;
    } else if (
      p.edNurseRequest.requestedAt > fourthHour &&
      p.edNurseRequest.requestedAt < fifthHour
    ) {
      fourthHourTask++;
    } else if (
      p.edNurseRequest.requestedAt > thirdHour &&
      p.edNurseRequest.requestedAt < fourthHour
    ) {
      thirdHourTask++;
    } else if (
      p.edNurseRequest.requestedAt > secondHour &&
      p.edNurseRequest.requestedAt < thirdHour
    ) {
      secondHourTask++;
    } else if (
      p.edNurseRequest.requestedAt > sixHour &&
      p.pharmacyRequest.createdAt < secondHour
    ) {
      firstHourTask++;
    }
  });
  edNurseTaskArr.push({ label: lastHour, value: sixthHourTask });
  edNurseTaskArr.push({ label: fifthHour, value: fifthHourTask });
  edNurseTaskArr.push({ label: fourthHour, value: fourthHourTask });
  edNurseTaskArr.push({ label: thirdHour, value: thirdHourTask });
  edNurseTaskArr.push({ label: secondHour, value: secondHourTask });
  edNurseTaskArr.push({ label: sixHour, value: firstHourTask });

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
          { 'edNurseRequest.edNurseId': mongoose.Types.ObjectId(req.params.nurseId) },
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

  // Cumulative Total Patients
  const cumulativePatients = await EDR.find().countDocuments();

  // Available ED Beds
  const EdBeds = await Room.find({
    availability: true,
  }).countDocuments();

  res.status(200).json({
    success: true,
    availableEdBeds: EdBeds,
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
  });
});