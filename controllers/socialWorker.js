// const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');

exports.getAdmittedEDRs = asyncHandler(async (req, res, next) => {
  const admittedEdrs = await EDR.find({
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'admitted',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus'
    )
    .populate([
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
        select: 'identifier',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);

  res.status(200).json({
    success: true,
    data: admittedEdrs,
  });
});

exports.getDischargedEDRs = asyncHandler(async (req, res, next) => {
  const dischargedEdrs = await EDR.find({
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'discharged',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus'
    )
    .populate([
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
        select: 'identifier',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);

  res.status(200).json({
    success: true,
    data: dischargedEdrs,
  });
});

exports.getTransferedEDRs = asyncHandler(async (req, res, next) => {
  const transferedEdrs = await EDR.find({
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'transferred',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus'
    )
    .populate([
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
        select: 'identifier',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);

  res.status(200).json({
    success: true,
    data: transferedEdrs,
  });
});

exports.getDeceasedEDRs = asyncHandler(async (req, res, next) => {
  const deceasedEdrs = await EDR.find({
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'deceased',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus'
    )
    .populate([
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
        select: 'identifier',
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
    ]);

  res.status(200).json({
    success: true,
    data: deceasedEdrs,
  });
});
