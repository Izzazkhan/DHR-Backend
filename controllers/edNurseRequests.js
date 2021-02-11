const mongoose = require('mongoose');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const EDN = require('../models/edNurseRequest');
const CCRequests = require('../models/customerCareRequest');

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

exports.getPharmacy = asyncHandler(async (req, res, next) => {
  const unwindEdr = await EDR.aggregate([
    {
      $project: {
        _id: 1,
        pharmacyRequest: 1,
        patientId: 1,
      },
    },
    {
      $unwind: '$pharmacyRequest',
    },
    // {
    //   $match: {
    //     'pharmacyRequest.status': 'pending',
    //   },
    // },
    {
      $group: {
        _id: '$_id',
        patientId: { $push: '$patientId' },
        pharmacyRequest: { $push: '$pharmacyRequest' },
      },
    },
    {
      $project: {
        patientId: 1,
        _id: 1,
        pharmacyRequest: 1,
      },
    },
  ]);
  // console.log(unwindEdr);

  const pharmacyRequest = await EDR.populate(unwindEdr, [
    {
      path: 'patientId',
      model: 'patientfhir',
      select: 'identifier name createdAt weight age gender',
    },
    {
      path: 'pharmacyRequest.item.itemId',
      model: 'Item',
    },
  ]);
  res.status(200).json({
    success: true,
    data: pharmacyRequest,
  });
});

exports.submitRequest = asyncHandler(async (req, res, next) => {
  const { patientId, staffId, assignedBy, staffType, reason } = req.body;
  let request;
  if (staffType === 'Customer Care') {
    request = await CCRequests.create({});
  }
  request = await EDN.create({
    patientId,
    staffId,
    assignedBy,
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
  const ccRequests = await EDN.find({ staffType: 'Customer Care' })
    .populate('patientId', 'name identifier')
    .populate('staffId', 'name identifier');
  res.status(200).json({
    success: true,
    data: ccRequests,
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

exports.updateMedicationStatus = asyncHandler(async (req, res, next) => {
  const edrMedication = await EDR.findOne({ _id: req.body.edrId });

  let request;
  for (let i = 0; i < edrMedication.pharmacyRequest.length; i++) {
    if (edrMedication.pharmacyRequest[i]._id == req.body.requestId) {
      request = i;
    }
  }

  // console.log(request);

  const updatedRequest = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    {
      $set: {
        [`pharmacyRequest.${request}.status`]: req.body.status,
      },
    },
    { new: true }
  )
    .select('patientId pharmacyRequest')
    .populate('patientId', 'Identifier');

  res.status(200).json({
    success: true,
    data: updatedRequest,
  });
});
