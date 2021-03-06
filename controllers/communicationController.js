const requestNoFormat = require('dateformat');
const Communication = require('../models/requests/communication');
const asyncHandler = require('../middleware/async');
var nodemailer = require('nodemailer');
const staff = require('../models/staffFhir/staff');

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

  const sender = await staff.findOne({ _id: generatedById }).select('telecom');
  const receiver = await staff.find({ staffType: 'Admin' }).select('telecom');

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
