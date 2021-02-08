const requestNoFormat = require('dateformat');
const moment = require('moment');
// const ChiefComplaint = require('../models/chiefComplaint/chiefComplaint');
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
  const chiefComplaint = await CC.create({
    name,
    chiefComplaintId,
  });

  res.status(201).json({
    success: true,
    data: chiefComplaint,
  });
});

exports.getAllchiefComplaints = asyncHandler(async (req, res, next) => {
  const chiefComplaits = await CC.paginate({ disabled: false });
  res.status(200).json({
    success: true,
    data: chiefComplaits,
  });
});

exports.getChiefComplaintByKeyword = asyncHandler(async (req, res, next) => {
  const chiefComplaint = await CC.aggregate([
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

exports.disableChiefComplaint = asyncHandler(async (req, res) => {
  const chiefComplaint = await CC.findOne({ _id: req.params.id });
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
    await CC.findOneAndUpdate(
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
  const chiefComplaint = await CC.findOne({ _id: req.params.id });
  if (chiefComplaint.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await CC.findOneAndUpdate(
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
  }).populate([
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

  res.status(200).json({
    success: true,
    data: doctors,
  });
});

exports.getNursesWithCC = asyncHandler(async (req, res, next) => {
  const nurses = await Staff.find({
    staffType: 'Nurses',
    chiefComplaint: { $ne: [] },
  }).populate([
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

  res.status(200).json({
    success: true,
    data: nurses,
  });
});

exports.assignCC = asyncHandler(async (req, res, next) => {
  // console.log(req.body);
  const staff = await Staff.findOne({ _id: req.body.staffId });
  if (!staff || staff.disabled === true) {
    return next(
      new ErrorResponse('Could not assign Chief Complaint to this staff', 400)
    );
  }
  const chiefComplaintId = await CC.findOne({
    'productionArea.productionAreaId': req.body.productionAreaId,
  });
  // console.log(chiefComplaintId._id);
  const chiefComplaint = {
    assignedBy: req.body.assignedBy,
    chiefComplaintId: chiefComplaintId._id,
    assignedTime: Date.now(),
  };
  const assignedCC = await Staff.findOneAndUpdate(
    { _id: staff.id },
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
  // console.log(doctorCC[0].chiefComplaint[0].chiefComplaintId.name);

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
  const chiefComplaint = await CC.findOne({
    _id: req.body.chiefComplaintId,
  });
  // console.log(chiefComplaint);
  if (
    chiefComplaint.productionArea &&
    chiefComplaint.productionArea.length > 0
  ) {
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
  const assignedPA = await CC.findOneAndUpdate(
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
  // console.log(prodAreas);

  for (let i = 0; i < prodAreas.length; i++) {
    // console.log(prodAreas[i].chiefComplaint);
    const index = prodAreas[i].productionArea.length - 1;
    // console.log(index);
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

  // console.log(assignedCC);
  res.status(200).json({
    success: true,
    data: assignedCC,
  });
});

exports.getPAsByCCs = asyncHandler(async (req, res) => {
  const cc = await CC.find({
    _id: req.params.id,
  })
    .populate('productionArea.productionAreaId', 'paName')
    .select('productionArea.productionAreaId.paName');

  res.status(200).json({ success: true, data: cc });
});
