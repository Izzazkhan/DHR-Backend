const requestNoFormat = require('dateformat');
const moment = require('moment');
const ChiefComplaint = require('../models/chiefComplaint/chiefComplaint');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Staff = require('../models/staffFhir/staff');
const PA = require('../models/productionArea');

exports.addChiefComplaint = asyncHandler(async (req, res, next) => {
  console.log(req.body);
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
  console.log(req.body);
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

// exports.filterChiefCompaints = asyncHandler(async (req, res, next) => {
//   const startHours = new Date(startTime);
//   const endHours = new Date(endTime);
//   startHours.setSeconds(0, 0);
//   endHours.setSeconds(0, 0);
//   const startHoursISO = startHours.toISOString().split('T')[1];
//   const endHoursISO = endHours.toISOString().split('T')[1];
//   // console.log(startHoursISO, endHoursISO);
//   const times = await Staff.find({ staffType: 'Doctor' }).select({
//     shiftStartTime: 1,
//     shiftEndTime: 1,
//   });
//   const arr = [];
//   for (let i = 0; i < times.length; i++) {
//     if (
//       testS < moment(times[i].shiftEndTime).format('LT') ||
//       testE > moment(times[i].shiftStartTime).format('LT')
//     ) {
//       console.log(times[i]._id);
//     }
//     // console.log(
//     //   times[i].shiftStartTime.toISOString().split('T')[1],
//     //   times[i].shiftEndTime.toISOString().split('T')[1]
//     // );

//     // console.log(startHoursISO);
//     // console.log(times[i].shiftEndTime.toISOString().split('T')[1]);
//     // if (
//     //   startHoursISO < times[i].shiftEndTime.toISOString().split('T')[1] ||
//     //   endHoursISO > times[i].shiftStartTime.toISOString().split('T')[1]
//     // ) {
//     //   // console.log(times[i]._id);
//     // }
//     else {
//       // console.log('not found');
//     }
//     // {
//     //   // console.log('hello');
//     //   console.log(times[i]._id);
//     // }
//     // } else {
//     //   console.log('hi');
//     // }

//     // arr.push(times[i]);
//   }
//   // console.log('array', arr);
//   // if (!startTime || !endTime) {
//   //   const doctors = await Staff.find({
//   //     'experience.experience': year,
//   //     availability: availability,
//   //     specialty: specialty,
//   //     chiefComplaint: chiefComplaint,
//   //   });
//   //   res.status(200).json({
//   //     success: true,
//   //     data: doctors,
//   //   });
//   // } else {
//   //   const startHours = new Date(startTime);
//   //   const endHours = new Date(endTime);
//   //   // console.log(time);
//   //   const shiftStartTime =
//   //     startHours.getHours() +
//   //     ':' +
//   //     startHours.getMinutes() +
//   //     ':' +
//   //     startHours.getSeconds();

//   //   const shiftEndTime =
//   //     endHours.getHours() +
//   //     ':' +
//   //     endHours.getMinutes() +
//   //     ':' +
//   //     endHours.getSeconds();
//   //   console.log(shiftStartTime);
//   //   console.log(shiftEndTime);
//   //   const times = await Staff.find({ staffType: 'Doctor' }).select({
//   //     shiftStartTime: 1,
//   //     shiftEndTime: 1,
//   //   });
//   //   console.log(times);
//   //   const arr = [];
//   //   for (let i = 0; i < times.length; i++) {
//   //     const dbStartHours = new Date(times[i].shiftStartTime);
//   //     const dbEndHours = new Date(times[i].shiftEndTime);
//   //     // console.log(time);
//   //     const dbStartTime =
//   //       dbStartHours.getHours() +
//   //       ':' +
//   //       dbStartHours.getMinutes() +
//   //       ':' +
//   //       dbStartHours.getSeconds();

//   //     const dbEndTime =
//   //       dbEndHours.getHours() +
//   //       ':' +
//   //       dbEndHours.getMinutes() +
//   //       ':' +
//   //       dbEndHours.getSeconds();
//   //     console.log(dbStartTime);
//   //     console.log(dbEndTime);
//   //     if (shiftStartTime >= dbStartTime && shiftEndTime <= dbEndTime) {
//   //       console.log(times[i]);
//   //       arr.push(times._id[i]);
//   //     }
//   //   }

//   //   const doctors = await Staff.find({
//   //     'experience.experience': year,
//   //     availability: availability,
//   //     $and: [
//   //       { shiftStartTime: { $gte: shiftStartTime } },
//   //       { shiftEndTime: { $lte: shiftEndTime } },
//   //     ],
//   //     specialty: specialty,
//   //     chiefComplaint: chiefComplaint,
//   //   });
//   //   res.status(200).json({
//   //     success: true,
//   //     data: doctors,
//   //   });
// });

exports.filterChiefCompaints = asyncHandler(async (req, res, next) => {
  let arr = [];
  const {
    startTime,
    endTime
  } = req.body;
const startHours = new Date(startTime);
const endHours = new Date(endTime);
startHours.setSeconds(0, 0);
endHours.setSeconds(0, 0);
const startHoursISO = startHours.toISOString().split('T')[1];
const endHoursISO = endHours.toISOString().split('T')[1];
const times = await Staff.find({ staffType: 'Doctor' }).select({
    shiftStartTime: 1,
    shiftEndTime: 1,
  });
for (let i = 0; i < times.length; i++) {
  if(
    (startHoursISO>=times[i].shiftStartTime.toISOString().split('T')[1])&&(endHoursISO<=times[i].shiftEndTime.toISOString().split('T')[1])
  )
{
  arr.push(times[i]._id)
}
}
  res.json({arr})
})

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
    { $push: { chiefComplaint } },
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

exports.assignProductionArea = asyncHandler(async (req, res, next) => {
  console.log(req.body);
  const prodArea = await PA.findOne({ _id: req.body.productionAreaId });
  console.log(prodArea);
  if (!prodArea || prodArea.disabled === true) {
    return next(
      new ErrorResponse(
        'Could not assign Chief Complaint to this Production Area',
        400
      )
    );
  }
  const chiefComplaint = {
    assignedBy: req.body.staffId,
    chiefComplaintId: req.body.chiefComplaintId,
    assignedTime: Date.now(),
  };
  const assignedPA = await PA.findOneAndUpdate(
    { _id: prodArea.id },
    { $push: { chiefComplaint } },
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
  const prodAreas = await PA.find({ availability: true });
  res.status(200).json({
    success: true,
    data: prodAreas,
  });
});

exports.getCCandPAByKeyword = asyncHandler(async (req, res, next) => {
  const arr = [];
  const prodAreas = await PA.find({ chiefComplaint: { $ne: [] } }).populate(
    'chiefComplaint.chiefComplaintId'
  );
  console.log(prodAreas[0].chiefComplaint[0].chiefComplaintId.name);

  for (let i = 0; i < prodAreas.length; i++) {
    if (
      (prodAreas[i].paName &&
        prodAreas[i].paName
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (prodAreas[i].chiefComplaint[0].chiefComplaintId.name &&
        prodAreas[i].chiefComplaint[0].chiefComplaintId.name
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
  const prodAreas = await PA.find({ chiefComplaint: { $ne: [] } })
    .populate('chiefComplaint.chiefComplaintId', 'name')
    .select({
      paName: 1,
      chiefComplaintId: 1,
    });
  res.status(200).json({
    success: true,
    data: prodAreas,
  });
});
