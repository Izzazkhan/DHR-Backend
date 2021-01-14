// const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
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
      $match: {
        labRequest: { $ne: [] },
        'labRequest.status': 'pending',
      },
    },
    {
      $unwind: '$labRequest',
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
      $match: {
        labRequest: { $ne: [] },
        'labRequest.status': 'completed',
      },
    },
    {
      $unwind: '$labRequest',
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

exports.updateLabRequest = asyncHandler(async (req, res, next) => {
  console.log(req.files);
  const parsed = JSON.parse(req.body.data);
  const lab = await EDR.findOne({ _id: parsed.edrId });
  let note;
  for (let i = 0; i < lab.labRequest.length; i++) {
    if (lab.labRequest[i]._id == parsed.labId) {
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

  const updatedlab = await EDR.findOneAndUpdate(
    { _id: parsed.edrId },
    {
      $set: {
        [`labRequest.${note}.status`]: parsed.status,
        [`labRequest.${note}.delayedReason`]: parsed.delayedReason,
        [`labRequest.${note}.activeTime`]: parsed.activeTime,
        [`labRequest.${note}.completeTime`]: parsed.completeTime,
        [`labRequest.${note}.voiceNotes`]: voiceNotes,
      },
    },
    { $push: { updateRecord } },
    { new: true }
  ).populate('labRequest.serviceId');
  res.status(200).json({
    success: true,
    data: updatedlab,
  });
});
