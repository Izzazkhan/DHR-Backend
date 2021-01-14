// const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');

exports.getPendingRadEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        radRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $match: {
        radRequest: { $ne: [] },
        'radRequest.status': 'pending',
      },
    },
    {
      $unwind: '$radRequest',
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
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
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

exports.getCompletedRadEdr = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        radRequest: 1,
        room: 1,
        patientId: 1,
        chiefComplaint: 1,
      },
    },
    {
      $match: {
        radRequest: { $ne: [] },
        'radRequest.status': 'completed',
      },
    },
    {
      $unwind: '$radRequest',
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
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
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

exports.updateRadRequest = asyncHandler(async (req, res, next) => {
  console.log(req.files);
  const parsed = JSON.parse(req.body.data);
  const rad = await EDR.findOne({ _id: parsed.edrId });
  let note;
  for (let i = 0; i < rad.radRequest.length; i++) {
    if (rad.radRequest[i]._id == parsed.radId) {
      // console.log(i);
      note = i;
    }
  }
  let voiceNotes;
  if (req.files) {
    const arr = [];
    for (let i = 0; i < req.files.length; i++) {
      if (req.files[i].mimetype.startsWith('image')) {
        arr.push(req.files[i].path);
      } else {
        voiceNotes = req.files[i].path;
      }
    }
  }

  const updateRecord = {
    updatedAt: Date.now(),
    updatedBy: parsed.staffId,
    reason: parsed.reason,
  };

  const updatedrab = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`radRequest.${note}.status`]: parsed.status,
        [`radRequest.${note}.delayedReason`]: parsed.delayedReason,
        [`radRequest.${note}.activeTime`]: parsed.activeTime,
        [`radRequest.${note}.completeTime`]: parsed.completeTime,
        [`radRequest.${note}.voiceNotes`]: voiceNotes,
      },
    },
    { $push: { updateRecord } },
    { new: true }
  ).populate('radRequest.serviceId');
  res.status(200).json({
    success: true,
    data: updatedrab,
  });
});
