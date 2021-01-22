const requestNoFormat = require('dateformat');
// const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');

exports.getAdmittedEDRs = asyncHandler(async (req, res, next) => {
  const admittedEdrs = await EDR.find({
    socialWorkerStatus: 'pending',
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'admitted',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus survey'
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

exports.getCompletedAdmittedEDRs = asyncHandler(async (req, res, next) => {
  const admittedEdrs = await EDR.find({
    socialWorkerStatus: 'completed',
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'admitted',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus survey'
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
    socialWorkerStatus: 'pending',
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'discharged',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus survey'
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

exports.getCompletedDischargedEDRs = asyncHandler(async (req, res, next) => {
  const dischargedEdrs = await EDR.find({
    socialWorkerStatus: 'completed',
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'discharged',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus survey'
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
    socialWorkerStatus: 'pending',
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'transferred',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus survey'
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

exports.getCompletedTransferedEDRs = asyncHandler(async (req, res, next) => {
  const transferedEdrs = await EDR.find({
    socialWorkerStatus: 'completed',
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason':
      'transferred survey',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus survey'
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
    socialWorkerStatus: 'pending',
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'deceased',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus survey'
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

exports.getCompletedDeceasedEDRs = asyncHandler(async (req, res, next) => {
  const deceasedEdrs = await EDR.find({
    socialWorkerStatus: 'completed',
    status: 'Discharged',
    'dischargeRequest.dischargeSummary.edrCompletionReason': 'deceased',
  })
    .select(
      'patientId chiefComplaint requiredAssistance Room socialWorkerStatus survey'
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

exports.addSurvey = asyncHandler(async (req, res, next) => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const requestId = `CSID${day}${requestNoFormat(new Date(), 'yyHHMM')}`;
  const survey = {
    requestId,
    data: req.body.object,
    surveyTime: Date.now(),
  };

  const surveyEdr = await EDR.findByIdAndUpdate(
    { _id: req.body.edrId },
    { $push: { survey: survey } },
    { new: true }
  ).populate('patientId', 'identifier');

  await EDR.findByIdAndUpdate(
    { _id: req.body.edrId },
    { $set: { socialWorkerStatus: 'completed' } },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: surveyEdr,
  });
});

exports.getPsychiatrist = asyncHandler(async (req, res, next) => {
  const psychiatrists = [
    {
      name: 'M Ali',
      phone: '03471234567',
      email: 'ali@gmail.com',
    },
    {
      name: 'M Ahmad',
      phone: '03411234567',
      email: 'ahmad@gmail.com',
    },
    {
      name: 'Mushtaq',
      phone: '03211234567',
      email: 'mushtaq@gmail.com',
    },
  ];

  res.status(200).json({
    success: true,
    data: psychiatrists,
  });
});

exports.getMentalCare = asyncHandler(async (req, res, next) => {
  const mentalCare = [
    {
      name: 'M Ali',
      phone: '03471234567',
      email: 'ali@gmail.com',
    },
    {
      name: 'M Ahmad',
      phone: '03411234567',
      email: 'ahmad@gmail.com',
    },
    {
      name: 'Mushtaq',
      phone: '03211234567',
      email: 'mushtaq@gmail.com',
    },
  ];

  res.status(200).json({
    success: true,
    data: mentalCare,
  });
});

exports.getAdvocate = asyncHandler(async (req, res, next) => {
  const advocate = [
    {
      name: 'M Ali',
      phone: '03471234567',
      email: 'ali@gmail.com',
    },
    {
      name: 'M Ahmad',
      phone: '03411234567',
      email: 'ahmad@gmail.com',
    },
    {
      name: 'Mushtaq',
      phone: '03211234567',
      email: 'mushtaq@gmail.com',
    },
  ];

  res.status(200).json({
    success: true,
    data: advocate,
  });
});
