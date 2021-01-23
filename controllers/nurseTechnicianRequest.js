const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');

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
        nurseTechnicianStatus: 'completed',
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
