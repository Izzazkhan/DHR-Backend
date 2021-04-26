const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Notification = require('../models/notification/notification');

exports.notificationCount = asyncHandler(async (req, res, next) => {
  // console.log(req.params.id);
  const count = await Notification.aggregate([
    {
      $unwind: '$sendTo',
    },
    {
      $match: {
        $and: [
          { 'sendTo.userId': mongoose.Types.ObjectId(req.params.id) },
          { 'sendTo.read': false },
        ],
      },
    },
  ]);

  // globalVariable.io.emit('get_count', count);

  res.status(200).json({
    success: true,
    data: count.length,
  });
});

exports.readNotifications = asyncHandler(async (req, res, next) => {
  const unwind = await Notification.aggregate([
    {
      $unwind: '$sendTo',
    },
    {
      $match: {
        $and: [
          { 'sendTo.userId': mongoose.Types.ObjectId(req.params.id) },
          { 'sendTo.read': true },
          { sendFrom: req.params.sendFrom },
        ],
      },
    },
    {
      $sort: {
        natural: -1,
      },
    },
    // {
    //   $group: {
    //     _id: { patient: '$patient' },
    //     sendTo: { $push: '$sendTo' },
    //   },
    // },
    // {
    //   $project: {
    //     patient: '$_id',
    //     _id: 0,
    //     sendTo: 1,
    //   },
    // },
  ]);
  const read = await Notification.populate(unwind, [
    {
      path: 'patient',
      model: 'EDR',
      select:
        'chiefComplaint.chiefComplaintId patientId room.roomId careStream.name ',

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
    {
      path: 'sendTo.userId',
      model: 'staff',
      select: 'identifier name',
    },
  ]);
  res.status(200).json({
    success: true,
    data: read,
  });
});

exports.unReadNotifications = asyncHandler(async (req, res, next) => {
  const unwind = await Notification.aggregate([
    {
      $unwind: '$sendTo',
    },
    {
      $match: {
        $and: [
          { 'sendTo.userId': mongoose.Types.ObjectId(req.params.id) },
          { 'sendTo.read': false },
          { sendFrom: req.params.sendFrom },
        ],
      },
    },
    {
      $sort: {
        natural: -1,
      },
    },
  ]);
  const unRead = await Notification.populate(unwind, [
    {
      path: 'patient',
      model: 'EDR',
      select:
        'chiefComplaint.chiefComplaintId patientId room.roomId careStream.name ',

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
    {
      path: 'sendTo.userId',
      model: 'staff',
      select: 'identifier name',
    },
  ]);
  res.status(200).json({
    success: true,
    data: unRead,
  });
});

exports.getNotification = asyncHandler(async (req, res) => {
  const not = await Notification.find({ 'sendTo.userId': req.params.id })
    .populate('sendTo.userId')
    .populate([
      {
        path: 'patient',
        model: 'EDR',
        select:
          'chiefComplaint.chiefComplaintId patientId room.roomId careStream.name ',

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
  // console.log('responseeeeeeeeeeeeeeeeeeeeee');
  res.status(200).json({ success: true, data: not });
});
