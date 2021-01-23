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
