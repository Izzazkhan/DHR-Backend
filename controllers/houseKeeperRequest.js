// const Staff = require('../models/staffFhir/staff');
const HK = require('../models/houseKeepingRequest');
const asyncHandler = require('../middleware/async');
const Room = require('../models/room');
const CronFlag = require('../models/CronFlag');

// Imaging Technician Request
exports.pendingRadHouseKeeperRequests = asyncHandler(async (req, res, next) => {
  const HKRequests = await HK.find({
    status: 'pending',
    requestedBy: 'Imaging Technician',
  }).populate([
    {
      path: 'productionAreaId',
      model: 'productionArea',
      select: 'paName',
    },
    {
      path: 'assignedBy',
      model: 'staff',
      select: 'name',
    },
    {
      path: 'houseKeeperId',
      model: 'staff',
      select: 'name',
    },
    {
      path: 'roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);
  res.status(200).json({
    success: true,
    data: HKRequests,
  });
});

exports.comletedRadHouseKeeperRequests = asyncHandler(
  async (req, res, next) => {
    const HKRequests = await HK.find({
      status: 'completed',
      requestedBy: 'Imaging Technician',
    }).populate([
      {
        path: 'productionAreaId',
        model: 'productionArea',
        select: 'paName',
      },
      {
        path: 'assignedBy',
        model: 'staff',
        select: 'name',
      },
      {
        path: 'houseKeeperId',
        model: 'staff',
        select: 'name',
      },
      {
        path: 'roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);
    res.status(200).json({
      success: true,
      data: HKRequests,
    });
  }
);

exports.updateStatus = asyncHandler(async (req, res, next) => {
  const updatedStatus = await HK.findOneAndUpdate(
    { _id: req.body.requestId },
    {
      $set: {
        status: 'completed',
        task: req.body.task,
        completedAt: Date.now(),
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedStatus,
  });
});

// Sensei Requests
exports.updateSenseiStatus = asyncHandler(async (req, res, next) => {
  const updatedStatus = await HK.findOneAndUpdate(
    { _id: req.body.requestId },
    {
      $set: {
        status: 'completed',
        task: req.body.task,
        completedAt: Date.now(),
      },
    },
    { new: true }
  );

  await Room.findOneAndUpdate(
    { _id: req.body.roomId },
    { $set: { availability: true } },
    { $new: true }
  );

  // Preventing from raising flag if task is completed
  await CronFlag.findOneAndUpdate(
    { requestId: req.body.requestId, taskName: 'To Be Clean' },
    { $set: { status: 'completed' } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedStatus,
  });
});

exports.pendingSenseiHouseKeeperRequests = asyncHandler(
  async (req, res, next) => {
    const HKRequests = await HK.find({
      status: 'pending',
      requestedBy: 'Sensei',
    }).populate([
      {
        path: 'productionAreaId',
        model: 'productionArea',
        select: 'paName',
      },
      {
        path: 'assignedBy',
        model: 'staff',
        select: 'name',
      },
      {
        path: 'houseKeeperId',
        model: 'staff',
        select: 'name',
      },
      {
        path: 'roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);
    res.status(200).json({
      success: true,
      data: HKRequests,
    });
  }
);

exports.comletedSenseiHouseKeeperRequests = asyncHandler(
  async (req, res, next) => {
    const HKRequests = await HK.find({
      status: 'completed',
      requestedBy: 'Sensei',
    }).populate([
      {
        path: 'productionAreaId',
        model: 'productionArea',
        select: 'paName',
      },
      {
        path: 'assignedBy',
        model: 'staff',
        select: 'name',
      },
      {
        path: 'houseKeeperId',
        model: 'staff',
        select: 'name',
      },
      {
        path: 'roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);
    res.status(200).json({
      success: true,
      data: HKRequests,
    });
  }
);

// ED Nurse Requests
exports.pendingEDNurseHKRequests = asyncHandler(async (req, res, next) => {
  const HKRequests = await HK.find({
    status: 'pending',
    requestedBy: 'ED Nurse',
  }).populate([
    {
      path: 'productionAreaId',
      model: 'productionArea',
      select: 'paName',
    },
    {
      path: 'assignedBy',
      model: 'staff',
      select: 'name',
    },
    {
      path: 'houseKeeperId',
      model: 'staff',
      select: 'name',
    },
    {
      path: 'roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);
  res.status(200).json({
    success: true,
    data: HKRequests,
  });
});

exports.updateEDNurseStatus = asyncHandler(async (req, res, next) => {
  const updatedStatus = await HK.findOneAndUpdate(
    { _id: req.body.requestId },
    {
      $set: {
        status: 'completed',
        task: req.body.task,
        completedAt: Date.now(),
      },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedStatus,
  });
});

exports.completedEDNurseHKRequests = asyncHandler(async (req, res, next) => {
  const HKRequests = await HK.find({
    status: 'completed',
    requestedBy: 'ED Nurse',
  }).populate([
    {
      path: 'productionAreaId',
      model: 'productionArea',
      select: 'paName',
    },
    {
      path: 'assignedBy',
      model: 'staff',
      select: 'name',
    },
    {
      path: 'houseKeeperId',
      model: 'staff',
      select: 'name',
    },
    {
      path: 'roomId',
      model: 'room',
      select: 'roomNo',
    },
  ]);
  res.status(200).json({
    success: true,
    data: HKRequests,
  });
});
