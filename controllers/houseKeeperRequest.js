// const Staff = require('../models/staffFhir/staff');
const HK = require('../models/houseKeepingRequest');
const asyncHandler = require('../middleware/async');

exports.pendingRadHouseKeeperRequests = asyncHandler(async (req, res, next) => {
  const HKRequests = await HK.find({
    status: 'pending',
    requestedBy: 'Imaging Technician',
  }).populate([
    {
      path: 'productionAreaId',
      model: 'productionArea',
      select: 'paName',
      populate: [
        {
          path: 'roomId',
          model: 'room',
          select: 'roomNo',
        },
      ],
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
        populate: [
          {
            path: 'roomId',
            model: 'room',
            select: 'roomNo',
          },
        ],
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
      $set: { status: 'completed', task: req.body.task, updateAt: Date.now() },
    },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: updatedStatus,
  });
});
