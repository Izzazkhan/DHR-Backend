const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const EDN = require('../models/edNurseAssistanceRequest');

exports.pendingEOUNurseEdrRequest = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        eouNurseRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$eouNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'eouNurseRequest.status': 'pending' },
          {
            'eouNurseRequest.eouNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
        ],
      },
    },
    // {
    //   $group: {
    //     _id: { patientId: '$patientId' },
    //     labRequest: { $push: '$labRequest' },
    //   },
    // },
    // {
    //   $project: {
    //     patientId: '$_id',
    //     _id: 0,
    //     labRequest: 1,
    //   },
    // },
  ]);

  const request = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    // {
    //   path: 'labRequest.serviceId',
    //   model: 'LaboratoryService',
    // },
  ]);
  res.status(200).json({
    success: true,
    data: request,
  });
});

exports.completeRequest = asyncHandler(async (req, res, next) => {
  const edrNotes = await EDR.findOne({ _id: req.body.edrId });

  let request;
  for (let i = 0; i < edrNotes.eouNurseRequest.length; i++) {
    if (edrNotes.eouNurseRequest[i]._id == req.body.requestId) {
      request = i;
    }
  }
  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`eouNurseRequest.${request}.status`]: 'completed',
        [`eouNurseRequest.${request}.completedAt`]: Date.now(),
      },
    },
    { new: true }
  )
    .select('patientId eouNurseRequest')
    .populate('patientId', 'Identifier');

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.completedEOUNurseEdrRequest = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        eouNurseRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$eouNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'eouNurseRequest.status': 'completed' },
          {
            'eouNurseRequest.eouNurseId': mongoose.Types.ObjectId(
              req.params.nurseId
            ),
          },
        ],
      },
    },
    // {
    //   $group: {
    //     _id: { patientId: '$patientId' },
    //     labRequest: { $push: '$labRequest' },
    //   },
    // },
    // {
    //   $project: {
    //     patientId: '$_id',
    //     _id: 0,
    //     labRequest: 1,
    //   },
    // },
  ]);

  const request = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name',
    },
    // {
    //   path: 'labRequest.serviceId',
    //   model: 'LaboratoryService',
    // },
  ]);
  res.status(200).json({
    success: true,
    data: request,
  });
});
