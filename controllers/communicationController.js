const nodemailer = require('nodemailer');
const requestNoFormat = require('dateformat');
const Communication = require('../models/requests/communication');
const asyncHandler = require('../middleware/async');
const staff = require('../models/staffFhir/staff');
const Notification = require('../components/notification');

exports.addCommunicationRequest = asyncHandler(async (req, res, next) => {
  const { reason, others, generatedById } = req.body;

  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);

  const CRequestNo = `CR${day}${requestNoFormat(new Date(), 'yyHHMM')}`;

  const sender = await staff
    .findOne({ _id: generatedById })
    .select(
      'telecom staffType name identifier subType chiefComplaint.chiefComplaintId'
    )
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        select: 'chiefComplaint.chiefComplaintId',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
    ]);
  const receiver = await staff.find({ staffType: 'Admin' }).select('telecom ');

  const filteredEmails = [];
  for (let index = 0; index < receiver.length; index++) {
    filteredEmails.push(receiver[index].telecom[0].value);
  }

  // console.log('filteredEmails', filteredEmails);
  const senderEmail = sender.telecom[0].value;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pmdevteam0@gmail.com',
      pass: 'SysJunc#@!',
    },
  });

  const mailOptions = {
    from: senderEmail,
    to: filteredEmails,
    subject: reason,
    html: `<p>${others}<p>`,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

  const communication = await Communication.create({
    reason,
    others,
    generatedById,
    generatedBy: sender,
    requestId: CRequestNo,
  });

  if (sender.staffType === 'Sensei') {
    Notification(
      'Request from Sensei',
      CRequestNo + sender.chiefComplaint + sender.identifier + sender.name,
      'Admin',
      'Communication Request',
      '/dashboard/home/patientlist',
      req.body.edrId,
      '',
      'ED Nurse'
    );
  }

  if (sender.staffType === 'Doctor' && sender.subType === 'ED Doctor') {
    Notification(
      'Request from ED Doctor',
      CRequestNo + sender.identifier + sender.name,
      'Admin',
      'Communication Request',
      '/dashboard/home/patientlist',
      req.body.edrId,
      '',
      'ED Nurse'
    );
  }

  res.status(201).json({
    success: true,
    data: communication,
  });
});

exports.getAllCommunicationRequests = asyncHandler(async (req, res, next) => {
  const communication = await Communication.find();
  res.status(200).json({
    success: true,
    data: communication,
  });
});
