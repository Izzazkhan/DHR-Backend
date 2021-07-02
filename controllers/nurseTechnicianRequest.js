const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const Notification = require('../components/notification');
const CronFlag = require('../models/CronFlag');
const addFlag = require('../components/addFlag.js');

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
  const labTask = await EDR.findOneAndUpdate(
    { _id: req.body.edrId, 'labRequest._id': req.body.labId },
    {
      $set: {
        'labRequest.$.nurseTechnicianStatus': 'Collected',
        'labRequest.$.collectedTime': Date.now(),
      },
    },
    { new: true }
  )
    .populate('patientId', 'identifier')
    .select('patientId labRequest');

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
          { _id: mongoose.Types.ObjectId(req.body.edrId) },
          { 'labRequest._id': mongoose.Types.ObjectId(req.body.labId) },
        ],
      },
    },
  ]);

  const lab = test[0].labRequest;
  // Preventing from raising flag if task is completed
  if (lab.type !== 'Blood') {
    await CronFlag.findOneAndUpdate(
      { requestId: req.body.labId, taskName: 'Sample Pending' },
      { $set: { status: 'completed' } },
      { new: true }
    );
    // Cron Flag for Lab Technician 2nd Card
    const data = {
      taskName: 'Lab Results Pending',
      minutes: 11,
      collectionName: 'EDR',
      staffId: lab.labTechnicianId,
      patientId: req.body.edrId,
      onModel: 'EDR',
      generatedFrom: 'Lab Technician',
      card: '2nd',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Too Many Lab Results Pending',
      emittedFor: 'pendingSensei',
      requestId: req.body.labId,
    };

    addFlag(data);
  }

  if (lab.type === 'Blood') {
    await CronFlag.findOneAndUpdate(
      { requestId: req.body.labId, taskName: 'Blood Sample Pending' },
      { $set: { status: 'completed' } },
      { new: true }
    );
    const data = {
      taskName: 'Lab Blood Results Pending',
      minutes: 36,
      collectionName: 'EDR',
      staffId: lab.labTechnicianId,
      patientId: req.body.edrId,
      onModel: 'EDR',
      generatedFrom: 'Lab Technician',
      card: '4th',
      generatedFor: ['Sensei', 'Lab Supervisor'],
      reason: 'Too Many Lab Results Pending',
      emittedFor: 'pendingSensei',
      requestId: req.body.labId,
    };

    addFlag(data);
  }

  Notification(
    'Sample Collected',
    'Sample Collection request',
    'Lab Technician',
    'Nurse Technician',
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
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    'ED Nurse'
  );

  res.status(200).json({
    success: true,
    data: labTask,
  });
});
