// const requestNoFormat = require('dateformat');
const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const Notification = require('../components/notification');
const searchEdrPatient = require('../components/searchEdr');
const CronFlag = require('../models/CronFlag');
// const ErrorResponse = require('../utils/errorResponse');

exports.getPendingLabEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          {
            'labRequest.labTechnicianId': mongoose.Types.ObjectId(
              req.params.labTechnicianId
            ),
          },
          {
            $or: [
              { 'labRequest.status': 'pending' },
              { 'labRequest.status': 'active' },
              { 'labRequest.status': 'hold' },
            ],
          },
        ],
      },
    },
  ]);

  const edrs = await EDR.populate(unwindEdr, [
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      select: 'chiefComplaintId',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          select: 'paName',
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
      //   select: 'identifier name',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);
  res.status(200).json({
    success: true,
    data: edrs,
  });
});

exports.getCompletedLabEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          {
            'labRequest.labTechnicianId': mongoose.Types.ObjectId(
              req.params.labTechnicianId
            ),
          },
          {
            'labRequest.status': 'completed',
          },
        ],
      },
    },
  ]);

  const edrs = await EDR.populate(unwindEdr, [
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      select: 'chiefComplaintId',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          select: 'paName',
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
      //   select: 'identifier name',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);
  res.status(200).json({
    success: true,
    data: edrs,
  });
});

// Search Completed Lab Edr
exports.searchCompletedLabEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          {
            'labRequest._id': mongoose.Types.ObjectId(req.params.labId),
          },
          {
            'labRequest.status': 'completed',
          },
        ],
      },
    },
  ]);

  // console.log(unwindEdr);

  const patients = await EDR.populate(unwindEdr, [
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      select: 'chiefComplaintId',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          select: 'paName',
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
      //   select: 'identifier name',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);
  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.updateLabRequest = asyncHandler(async (req, res, next) => {
  console.log(req.files);
  const parsed = JSON.parse(req.body.data);
  const lab = await EDR.findOne({ _id: parsed.edrId });
  let note;
  for (let i = 0; i < lab.labRequest.length; i++) {
    if (lab.labRequest[i]._id == parsed.labId) {
      note = i;
    }
  }
  const arr = [];
  if (req.files) {
    for (let i = 0; i < req.files.length; i++) {
      arr.push(req.files[i].path);
    }
  }

  // console.log(arr);

  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: parsed.staffId,
    reason: parsed.reason,
  };
  await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    { $push: { [`labRequest.${note}.updateRecord`]: updateRecord } },
    { new: true }
  );

  const updatedlab = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`labRequest.${note}.status`]: parsed.status,
        [`labRequest.${note}.delayedReason`]: parsed.delayedReason,
        [`labRequest.${note}.completedBy`]: parsed.staffId,
        [`labRequest.${note}.activeTime`]: parsed.activeTime,
        [`labRequest.${note}.completeTime`]: parsed.completeTime,
        [`labRequest.${note}.holdTime`]: parsed.holdTime,
        [`labRequest.${note}.image`]: arr,
      },
    },
    { new: true }
  ).populate('labRequest.serviceId');

  if (parsed.status === 'hold') {
    Notification(
      'Delayed Report',
      'Delay in Report Delivery',
      'Lab Technician',
      '',
      '/home/rcm/patientAssessment',
      parsed.edrId,
      ''
    );
  }

  if (parsed.status === 'completed') {
    await CronFlag.findOneAndUpdate(
      { requestId: parsed.labId, taskName: 'Sensei Lab Pending' },
      { $set: { status: 'completed' } },
      { new: true }
    );

    await CronFlag.findOneAndUpdate(
      { requestId: parsed.labId, taskName: 'Lab Results Pending' },
      { $set: { status: 'completed' } },
      { new: true }
    );

    await CronFlag.findOneAndUpdate(
      { requestId: parsed.labId, taskName: 'Lab Blood Results Pending' },
      { $set: { status: 'completed' } },
      { new: true }
    );

    const test = await EDR.aggregate([
      {
        $project: {
          _id: 1,
          labRequest: 1,
        },
      },
      {
        $unwind: '$labRequest',
      },
      {
        $match: {
          $and: [
            { _id: mongoose.Types.ObjectId(parsed.edrId) },
            { 'labRequest._id': mongoose.Types.ObjectId(parsed.labId) },
          ],
        },
      },
    ]);
    if (test[0].labRequest.reqFromCareStream === true) {
      await EDR.findOneAndUpdate(
        {
          _id: parsed.edrId,
          'careStream.investigations.data._id': test[0].labRequest.labTestId,
        },
        { $set: { 'careStream.investigations.data.$.completed': true } }
      );
    }
    Notification(
      'Report Uploaded' + parsed.labId,
      'Lab Test Report Generated',
      'Doctor',
      'Lab Technicians',
      '/dashboard/taskslist',
      parsed.edrId,
      '',
      'ED Doctor'
    );

    Notification(
      'Results' + parsed.labId,
      'Lab Test Results',
      'Nurses',
      'Lab Technicians',
      '/dashboard/home/patientmanagement/viewrequests/lab/viewlab',
      parsed.edrId,
      '',
      'ED Nurse'
    );
  }

  res.status(200).json({
    success: true,
    data: updatedlab,
  });
});

exports.searchPendingLabRequest = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    labRequest: { $ne: [] },
    'labRequest.status': 'pending',
  }).populate('patientId');

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.searchComletedLabRequest = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    labRequest: { $ne: [] },
    'labRequest.status': 'completed',
  }).populate('patientId');

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});
