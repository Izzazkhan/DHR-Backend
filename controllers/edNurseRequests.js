const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const EDN = require('../models/edNurseRequest');

exports.getLab = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        labRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$labRequest',
    },
    {
      $match: {
        $or: [
          { 'labRequest.status': 'pending approval' },
          { 'labRequest.status': 'completed' },
        ],
      },
    },
    {
      $group: {
        _id: { patientId: '$patientId' },
        labRequest: { $push: '$labRequest' },
      },
    },
    {
      $project: {
        patientId: '$_id',
        _id: 0,
        labRequest: 1,
      },
    },
  ]);

  const lab = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name createdAt weight age gender',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
  ]);
  res.status(200).json({
    success: true,
    data: lab,
  });
});

exports.getRad = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        radRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$radRequest',
    },
    {
      $match: {
        $or: [
          { 'radRequest.status': 'pending approval' },
          { 'radRequest.status': 'completed' },
        ],
      },
    },
    {
      $group: {
        _id: { patientId: '$patientId' },
        radRequest: { $push: '$radRequest' },
      },
    },
    {
      $project: {
        patientId: '$_id',
        _id: 0,
        radRequest: 1,
      },
    },
  ]);

  const rad = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name createdAt weight age gender',
    },
    {
      path: 'radRequest.serviceId',
      model: 'RadiologyService',
    },
  ]);
  res.status(200).json({
    success: true,
    data: rad,
  });
});

exports.submitRequest = asyncHandler(async (req, res, next) => {
  const { patientId, staffId, asignedBy, staffType, reason } = req.body;
  const request = await EDN.create({
    patientId,
    staffId,
    asignedBy,
    staffType,
    reason,
  });

  res.status(200).json({
    success: true,
    data: request,
  });
});

exports.getHouskeepingRequests = asyncHandler(async (req, res, next) => {
  const HKRequests = await EDN.find({ staffType: 'Housekeeping' })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: HKRequests,
  });
});

exports.getCustomerCareRequests = asyncHandler(async (req, res, next) => {
  const CCRequests = await EDN.find({ staffType: 'Customer Care' })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: CCRequests,
  });
});

exports.getNurseTechnicianRequests = asyncHandler(async (req, res, next) => {
  const NTRequests = await EDN.find({ staffType: 'Nurse Technician' })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: NTRequests,
  });
});

exports.pendingEDNurseEdrRequest = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        edNurseRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'edNurseRequest.status': 'pending' },
          {
            'edNurseRequest.edNurseId': mongoose.Types.ObjectId(
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
  for (let i = 0; i < edrNotes.edNurseRequest.length; i++) {
    if (edrNotes.edNurseRequest[i]._id == req.body.requestId) {
      request = i;
    }
  }
  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`edNurseRequest.${request}.status`]: 'completed',
        [`edNurseRequest.${request}.completedAt`]: Date.now(),
      },
    },
    { new: true }
  )
    .select('patientId edNurseRequest')
    .populate('patientId', 'Identifier');

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});

exports.completedEDNurseEdrRequest = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        edNurseRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$edNurseRequest',
    },
    {
      $match: {
        $and: [
          { 'edNurseRequest.status': 'completed' },
          {
            'edNurseRequest.edNurseId': mongoose.Types.ObjectId(
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
