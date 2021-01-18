// const Staff = require('../models/staffFhir/staff');
const HK = require('../models/houseKeepingRequest');
const asyncHandler = require('../middleware/async');

exports.houseKeeperRequests = asyncHandler(async (req, res, next) => {
  const HKRequests = await HK.find({ status: 'pending' }).populate([
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
