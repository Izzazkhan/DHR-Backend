const requestNoFormat = require('dateformat');
const nodemailer = require('nodemailer');
// const requestNoFormat = require('dateformat');
const EDR = require('../models/EDR/EDR');
const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Notification = require('../components/notification');
const searchEdrPatient = require('../components/searchEdr');
const generateReqNo = require('../components/requestNoGenerator');

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
  const requestId = generateReqNo('CR');
  const survey = {
    requestId,
    data: req.body.object,
    surveyTime: Date.now(),
    surveyBy: req.body.staffId,
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
  const psychiatrists = await Staff.find({ staffType: 'Psychiatrist' }).select(
    'name telecom'
  );
  res.status(200).json({
    success: true,
    data: psychiatrists,
  });
});

exports.getMentalCare = asyncHandler(async (req, res, next) => {
  const mentalCare = await Staff.find({ staffType: 'Mental Care' }).select(
    'name telecom'
  );

  res.status(200).json({
    success: true,
    data: mentalCare,
  });
});

exports.getAdvocate = asyncHandler(async (req, res, next) => {
  const advocate = await Staff.find({ staffType: 'Advocate' }).select(
    'name telecom'
  );

  res.status(200).json({
    success: true,
    data: advocate,
  });
});

exports.getSWAssistance = asyncHandler(async (req, res, next) => {
  const assistances = await EDR.find({
    socialWorkerAssistance: { $exists: true, $ne: [] },
  })
    .select('patientId room chiefComplaint socialWorkerAssistance')
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
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
      {
        path: 'socialWorkerAssistance.requestedBy',
        model: 'staff',
        select: 'identifier name shift',
      },
      {
        path: 'socialWorkerAssistance.requestedTo',
        model: 'staff',
        select: 'staffType name telecom',
      },
    ]);

  res.status(200).json({
    success: true,
    data: assistances,
  });
});

exports.searchSWAssistance = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    socialWorkerAssistance: { $exists: true, $ne: [] },
  })
    .select('patientId room chiefComplaint socialWorkerAssistance')
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
      },
      {
        path: 'room.roomId',
        model: 'room',
        select: 'roomNo',
      },
      {
        path: 'socialWorkerAssistance.requestedBy',
        model: 'staff',
        select: 'identifier name shift',
      },
      {
        path: 'socialWorkerAssistance.requestedTo',
        model: 'staff',
        select: 'staffType name telecom',
      },
    ]);

  const arr = searchEdrPatient(req, patients);

  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.sendEmail = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const {
    sender,
    receiver,
    subject,
    body,
    requestedTo,
    requestedBy,
    edrId,
    requiredAssistance,
  } = req.body;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pmdevteam0@gmail.com',
      pass: 'Pic@$$o0909',
    },
  });
  const mailOptions = {
    from: sender,
    to: receiver,
    subject: subject,
    html: `<p>${body}<p>`,
  };
  const socialWorkerAssistance = {
    requestedTo,
    requestedBy,
    requiredAssistance,
    requestedAt: Date.now(),
  };

  transporter.sendMail(mailOptions, async (err, info) => {
    if (err) {
      console.log(err);
      res.status(500).json({
        success: false,
        data: 'Error In Sending Email,Please Try Again',
      });
    } else {
      console.log(`Emial Sent : ${info.response}`);
      await EDR.findOneAndUpdate(
        { _id: edrId },
        {
          $push: { socialWorkerAssistance },
        },
        {
          $new: true,
        }
      );

      Notification(
        'Social Worker',
        'Social Workers Assisting Patients',
        'Admin',
        'Social Workers Assisting Patients',
        '/dashboard/home/secondaryroles/socialworkers',
        edrId,
        '',
        ''
      );
      res.status(200).json({
        success: true,
        data: `Email Sent Successfully to ${receiver}`,
      });
    }
  });
});
