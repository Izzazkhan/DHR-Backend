const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const Notification = require('../components/notification');

exports.getPendingTransfers = asyncHandler(async (req, res, next) => {
  // console.log(req.params.staffId);
  const transferEdrs = await EDR.find({
    nurseTechnicianStatus: 'pending',
    'transferOfCare.nurseTechnicianId': req.params.staffId,
  })
    .populate('patientId', 'identifier name')
    .populate('room.roomId', 'roomNo')
    .select('room patientId transferOfCare');
  res.status(200).json({
    success: true,
    data: transferEdrs,
  });
});

exports.addReport = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findOne({ _id: req.body.edrId });
  const arr = [];
  for (let i = 0; i < edr.transferOfCare.length; i++) {
    if (edr.transferOfCare[i].nurseTechnicianId == req.body.staffId) {
      arr.push(i);
    }
  }
  const latestTransfer = arr.length - 1;
  // console.log(latestTransfer);
  const addedReport = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`transferOfCare.${latestTransfer}.diseaseName`]: req.body.diseaseName,
        [`transferOfCare.${latestTransfer}.fever`]: req.body.fever,
        [`transferOfCare.${latestTransfer}.sugarLevel`]: req.body.sugarLevel,
        [`transferOfCare.${latestTransfer}.bloodPressure`]: req.body
          .bloodPressure,
        [`transferOfCare.${latestTransfer}.cbcLevel`]: req.body.cbcLevel,
        [`transferOfCare.${latestTransfer}.status`]: 'Observed',
        [`transferOfCare.${latestTransfer}.observedTime`]: Date.now(),
      },
    },
    {
      new: true,
    }
  );

  res.status(200).json({
    success: true,
    data: addedReport,
  });
});

exports.getCompletedTransfers = asyncHandler(async (req, res, next) => {
  const transferEdrs = await EDR.find({
    nurseTechnicianStatus: 'completed',
    'transferOfCare.nurseTechnicianId': req.params.staffId,
  })
    .populate('patientId', 'identifier name')
    .populate('room.roomId', 'roomNo')
    .select('room patientId transferOfCare nurseTechnicianStatus');
  res.status(200).json({
    success: true,
    data: transferEdrs,
  });
});

exports.getpendingLabs = asyncHandler(async (req, res, next) => {
  // console.log(req.params.staffId);
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        patientId: 1,
        room: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $and: [
          { 'labRequest.nurseTechnicianStatus': 'Not Collected' },
          {
            'labRequest.assignedTo': mongoose.Types.ObjectId(
              req.params.staffId
            ),
          },
        ],
      },
    },
  ]);

  const lab = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);

  res.status(200).json({
    success: true,
    data: lab,
  });
});

exports.getCompletedLabs = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        patientId: 1,
        room: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        'labRequest.nurseTechnicianStatus': 'Collected',
        'labRequest.assignedTo': mongoose.Types.ObjectId(req.params.staffId),
      },
    },
  ]);

  const lab = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    {
      path: 'room.roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);

  res.status(200).json({
    success: true,
    data: lab,
  });
});

exports.completeLab = asyncHandler(async (req, res, next) => {
  const edr = await EDR.findOne({ _id: req.body.edrId });
  let labId;
  for (let i = 0; i < edr.labRequest.length; i++) {
    if (
      edr.labRequest[i].assignedTo == req.body.staffId &&
      edr.labRequest[i].nurseTechnicianStatus === 'Not Collected'
    ) {
      labId = i;
    }
  }

  // console.log(labId);
  const labTask = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`labRequest.${labId}.nurseTechnicianStatus`]: 'Collected',
        [`labRequest.${labId}.collectedTime`]: Date.now(),
      },
    },
    { new: true }
  )
    .populate('patientId', 'identifier')
    .select('patientId labRequest');

  Notification(
    'Sample Collected',
    'Sample Collection request',
    'Lab Technician',
    '',
    '/dashboard/taskslist',
    req.body.edrId,
    '',
    ''
  );

  Notification(
    'Sample Collected',
    'Lab Test Sample Received',
    'Nurses',
    'Lab Technicians',
    '/dashboard/taskslist',
    req.body.edrId,
    '',
    'ED Nurse'
  );

  res.status(200).json({
    success: true,
    data: labTask,
  });
});
