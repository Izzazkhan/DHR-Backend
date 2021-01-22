const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');

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
  ]);

  const labs = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name createdAt',
    },
    {
      path: 'labRequest.serviceId',
      model: 'LaboratoryService',
    },
  ]);
  res.status(200).json({
    success: true,
    data: labs,
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
  ]);

  const rad = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name createdAt',
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
