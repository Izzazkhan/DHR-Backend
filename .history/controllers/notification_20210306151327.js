const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Notification = require('../models/notification/notification');

exports.getNotification = asyncHandler(async (req, res) => {
  const not = await Notification.find({ 'sendTo.userId': req.params.id })
    .populate('sendTo.userId')
    .populate([
      {
        path: 'patient',
        model: 'EDR',
        select: 'chiefComplaint.chiefComplaintId patientId room careStream ',

        populate: [
          {
            path: 'chiefComplaint.chiefComplaintId',
            model: 'chiefComplaint',
            select: 'chiefComplaint.chiefComplaintId',
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
            select: 'identifier name',
          },
          {
            path: 'room.roomId',
            model: 'room',
            select: 'roomNo',
          },
        ],
      },
      {
        path: 'roPatient',
        model: 'patientfhir',
        select: 'identifier name insuranceNumber',
      },
    ])
    .sort({ $natural: -1 });
  res.status(200).json({ success: true, data: not });
});

exports.updateNotification = asyncHandler(async (req, res) => {
  const not = await Notification.findOneAndUpdate(
    { _id: req.params.id, 'sendTo.userId': req.params.userId },
    { $set: { 'sendTo.$.read': true } },
    { new: true }
  );
  res.status(200).json({ success: true, data: not });
});
