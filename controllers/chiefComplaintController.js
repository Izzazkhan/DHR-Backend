const requestNoFormat = require('dateformat');
const moment = require('moment');
const ChiefComplaint = require('../models/chiefComplaint/chiefComplaint');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const PA = require('../models/productionArea');
const EDR = require('../models/EDR/EDR');
const CC = require('../models/chiefComplaint/chiefComplaint');

exports.addChiefComplaint = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff =
    now -
    start +
    (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  const chiefComplaintId = 'CC' + day + requestNoFormat(new Date(), 'yyHHMMss');
  const chiefComplaint = await ChiefComplaint.create({
    name,
    chiefComplaintId,
  });

  res.status(201).json({
    success: true,
    data: chiefComplaint,
  });
});

exports.getAllchiefComplaints = asyncHandler(async (req, res, next) => {
  const chiefComplaits = await ChiefComplaint.paginate({}, { limit: 100 });
  res.status(200).json({
    success: true,
    data: chiefComplaits,
  });
});

exports.getChiefComplaintByKeyword = asyncHandler(async (req, res, next) => {
  const chiefComplaint = await ChiefComplaint.aggregate([
    {
      $match: {
        $or: [
          {
            name: { $regex: req.params.keyword, $options: 'i' },
          },
          {
            chiefComplaintId: { $regex: req.params.keyword, $options: 'i' },
          },
        ],
      },
    },
  ]).limit(50);

  res.status(200).json({
    success: true,
    data: chiefComplaint,
  });
});

exports.disaleChiefComplaint = asyncHandler(async (req, res) => {
  const chiefComplaint = await ChiefComplaint.findOne({ _id: req.params.id });
  if (chiefComplaint.availability === false) {
    res.status(200).json({
      success: false,
      data: 'ChiefComplaint not available for disabling',
    });
  } else if (chiefComplaint.disabled === true) {
    res
      .status(200)
      .json({ success: false, data: 'ChiefComplaint already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await ChiefComplaint.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord },
      }
    );
    res.status(200).json({
      success: true,
      data: 'ChiefComplaint status changed to disable',
    });
  }
});

exports.enableChiefComplaint = asyncHandler(async (req, res) => {
  const chiefComplaint = await ChiefComplaint.findOne({ _id: req.params.id });
  if (chiefComplaint.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await ChiefComplaint.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord },
      }
    );
    res
      .status(200)
      .json({ success: true, data: 'ChiefComplaint status changed to enable' });
  } else {
    res
      .status(200)
      .json({ success: false, data: 'ChiefComplaint already enabled' });
  }
});

exports.getDoctorsWithCC = asyncHandler(async (req, res, next) => {
  const doctors = await Staff.find({
    staffType: 'Doctor',
    chiefComplaint: { $ne: [] },
  }).populate('chiefComplaint.chiefComplaintId', 'name');

  res.status(200).json({
    success: true,
    data: doctors,
  });
});

exports.filterChiefCompaints = asyncHandler(async (req, res, next) => {
  // const doctor = await Staff.find({
  //   staffType: 'Doctor',
  //   'experience.experience': '2',
  // });
  // res.json(doctor);
  // const {
  //   startTime,
  //   endTime,
  //   year,
  //   specialty,
  //   availability,
  //   chiefComplaint,
  // } = req.body;
  // if (!startTime || !endTime) {
  //   const doctors = await Staff.find({
  //     // staffType: 'Doctor',
  //     $or: [
  //       { 'experience.experience': year },
  //       { availability: availability },
  //       { specialty: specialty },
  //       { 'chiefComplaint.chiefComplaintId': chiefComplaint },
  //     ],
  //   }).populate('chiefComplaint.chiefComplaintId');
  //   res.status(200).json({
  //     success: true,
  //     count: doctors.length,
  //     data: doctors,
  //   });
  // } else {
  //   const arr = [];
  //   const startHours = new Date(startTime);
  //   const endHours = new Date(endTime);
  //   startHours.setSeconds(0, 0);
  //   endHours.setSeconds(0, 0);
  //   const startUser = startHours.toISOString().split('T')[1];
  //   const endUser = endHours.toISOString().split('T')[1];
  //   const times = await Staff.find({ staffType: 'Doctor' }).select({
  //     shiftStartTime: 1,
  //     shiftEndTime: 1,
  //   });
  //   let startDb;
  //   let endDb;
  //   for (let i = 0; i < times.length; i++) {
  //     startDb = times[i].shiftStartTime.toISOString().split('T')[1];
  //     endDb = times[i].shiftEndTime.toISOString().split('T')[1];
  //     // console.log(startUser, ' startUser ', startDb, 'startDB');
  //     // console.log(endUser, ' endUser ', endDb, 'endDB');
  //     // if (startUser >= startDb) {
  //     //   console.log(startUser, startDb);
  //     //   console.log('1st', i);
  //     // }
  //     // if (startUser <= endDb) {
  //     //   console.log(startUser, endDb);
  //     //   console.log('2nd', i);
  //     // }
  //     // if (endUser >= startDb) {
  //     //   console.log(endUser, startDb);
  //     //   console.log('3rd', i);
  //     // }
  //     // if (endUser <= endDb) {
  //     //   console.log(endUser, endDb);
  //     //   console.log('4th', i);
  //     // }
  //     if (
  //       startUser >= startDb &&
  //       startUser <= endDb &&
  //       endUser >= startDb &&
  //       endUser <= endDb
  //     ) {
  //       arr.push(times[i]._id);
  //     }
  //   }
  //   const doctors = await Staff.find({
  //     'experience.experience': year,
  //     availability: availability,
  //     specialty: specialty,
  //     'chiefComplaint.chiefComplaintId': chiefComplaint,
  //   }).populate('chiefComplaint.chiefComplaintId');
  //   res.status(200).json({ success: true, data: doctors });
  // }
});

exports.assignCC = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const doctor = await Staff.findOne({ _id: req.body.staffId });
  if (!doctor || doctor.disabled === true) {
    return next(
      new ErrorResponse('Could not assign Chief Complaint to this doctor', 400)
    );
  }
  const chiefComplaint = {
    assignedBy: req.body.assignedBy,
    chiefComplaintId: req.body.chiefComplaintId,
    assignedTime: Date.now(),
  };
  const assignedCC = await Staff.findOneAndUpdate(
    { _id: doctor.id },
    { $push: { chiefComplaint }, $set: { availability: false } },
    {
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});

exports.getCCDoctorByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const doctorCC = await Staff.find({ staffType: 'Doctor' }).populate(
    'chiefComplaint.chiefComplaintId'
  );
  console.log(doctorCC[0].chiefComplaint[0].chiefComplaintId.name);

  for (let i = 0; i < doctorCC.length; i++) {
    if (
      (doctorCC[i].name[0].given[0] &&
        doctorCC[i].name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (doctorCC[i].name[0].family &&
        doctorCC[i].name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (doctorCC[i].chiefComplaint[0].chiefComplaintId.name &&
        doctorCC[i].chiefComplaint[0].chiefComplaintId.name
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(doctorCC[i]);
    }
  }
  // console.log(arr);
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.assignProductionAreaToCC = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const chiefComplaint = await ChiefComplaint.findOne({
    _id: req.body.chiefComplaintId,
  });
  // console.log(chiefComplaint);
  if (chiefComplaint.productionArea.length > 0) {
    return next(
      new ErrorResponse(
        'Production area has already been assigned to this chief complaint',
        400
      )
    );
  }
  if (!chiefComplaint || chiefComplaint.disabled === true) {
    return next(
      new ErrorResponse(
        'Could not assign production Area to this Chief Complaint',
        400
      )
    );
  }
  const productionArea = {
    assignedBy: req.body.staffId,
    productionAreaId: req.body.productionAreaId,
    assignedTime: Date.now(),
  };
  const assignedPA = await ChiefComplaint.findOneAndUpdate(
    { _id: req.body.chiefComplaintId },
    { $push: { productionArea } },
    {
      new: true,
    }
  );
  res.status(200).json({
    success: true,
    data: assignedPA,
  });
});

exports.getAvailablePA = asyncHandler(async (req, res, next) => {
  const prodAreas = await PA.find({ availability: true, disabled: false });
  res.status(200).json({
    success: true,
    data: prodAreas,
  });
});

exports.getCCandPAByKeyword = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const arr = [];
  const prodAreas = await CC.find({
    productionArea: { $ne: [] },
    disabled: false,
  }).populate('productionArea.productionAreaId');
  // console.log(prodAreas[0].chiefComplaint.length);
  console.log(prodAreas);

  for (let i = 0; i < prodAreas.length; i++) {
    // console.log(prodAreas[i].chiefComplaint);
    const index = prodAreas[i].productionArea.length - 1;
    console.log(index);
    if (
      (prodAreas[i].name &&
        prodAreas[i].name
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (prodAreas[i].productionArea[index].productionAreaId.paName &&
        prodAreas[i].productionArea[index].productionAreaId.paName
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(prodAreas[i]);
    }
  }
  // console.log(arr);
  res.status(200).json({
    success: true,
    data: arr,
  });
});

exports.getAvailablePAwithCC = asyncHandler(async (req, res, next) => {
  const prodAreas = await CC.find({
    productionArea: { $ne: [] },
    disabled: false,
  }).populate('productionArea.productionAreaId');
  // .select({
  //   paName: 1,
  //   chiefComplaintId: 1,
  //   updatedAt: 1,
  // });
  res.status(200).json({
    success: true,
    data: prodAreas,
  });
});

exports.assignCCtoPatient = asyncHandler(async (req, res, next) => {
  const parsed = JSON.parse(req.body.data);
  const chiefComplaint = {
    assignedBy: parsed.assignedBy,
    chiefComplaintId: parsed.chiefComplaint,
    assignedTime: Date.now(),
    reason: parsed.reason,
    voiceNotes: req.file ? req.file.path : null,
    comments: parsed.comments,
  };
  const assignedCC = await EDR.findOneAndUpdate(
    { _id: parsed.patientid },
    { $push: { chiefComplaint } },
    {
      new: true,
    }
  );

  console.log(assignedCC);
  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});

exports.getPAsByCCs = asyncHandler(async (req, res) => {
  const arr = [];
  const cc = await PA.find({
    'chiefComplaint.chiefComplaintId': req.params.id,
  }).populate('productionArea.productionAreaId');
  for (let i = 0; i < cc.length; i++) {
    if (
      cc[i].chiefComplaint[cc[i].chiefComplaint.length - 1].chiefComplaintId ===
      req.params.id
    ) {
      arr.push(cc[i]);
    }
  }
  res.status(200).json({ success: true, data: arr });
});
