const Staff = require('../models/staffFhir/staff');
const asyncHandler = require('../middleware/async');
const EDR = require('../models/EDR/EDR');
const PA = require('../models/productionArea');
const CC = require('../models/chiefComplaint/chiefComplaint');
// const ErrorResponse = require('../utils/errorResponse');

exports.updateStaffShift = asyncHandler(async (req, res, next) => {
  const staff = await Staff.findOne({ _id: req.body.staffId });
  if (staff.availability === false) {
    res
      .status(200)
      .json({ success: false, data: 'Staff already assigned to Visit' });
  } else if (staff.disabled === true) {
    res.status(200).json({ success: false, data: 'Staff disabled' });
  } else {
    // console.log(req.body);
    const chiefComplaint = {
      assignedBy: req.body.assignedBy,
      chiefComplaintId: req.body.chiefComplaint,
      assignedTime: Date.now(),
    };

    const updatedStaff = await Staff.findOneAndUpdate(
      { _id: staff.id },
      { $push: { chiefComplaint } },
      {
        new: true,
      }
    );
    const productionArea = {
      assignedBy: req.body.assignedBy,
      productionAreaId: req.body.productionAreaName,
      assignedTime: Date.now(),
    };
    await Staff.findOneAndUpdate(
      { _id: staff.id },
      { $push: { productionArea } },
      {
        new: true,
      }
    );
    await Staff.findOneAndUpdate(
      { _id: staff.id },
      {
        $set: {
          shift: req.body.shift,
          shiftStartTime: req.body.shiftStartTime,
          shiftEndTime: req.body.shiftEndTime,
        },
      },
      {
        new: true,
      }
    );
    const updateRecord = {
      updatetAt: Date.now(),
      updatedBy: req.body.assignedBy,
      reason: req.body.reason,
    };

    await Staff.findOneAndUpdate(
      { _id: staff.id },
      {
        $push: { updateRecord },
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      data: updatedStaff,
    });
  }
});

exports.getCCPatients = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    status: 'pending',
    chiefComplaint: { $ne: [] },
  }).populate([
    {
      path: 'chiefComplaint.chiefComplaintId',
      model: 'chiefComplaint',
      populate: [
        {
          path: 'productionArea.productionAreaId',
          model: 'productionArea',
          populate: [
            {
              path: 'rooms.roomId',
              model: 'room',
            },
          ],
        },
      ],
    },
    {
      path: 'patientId',
      model: 'patientfhir',
    },
  ]);

  for (let i = 0; i < patients.length; i++) {
    let count = 1;
    let x =
      patients[i].chiefComplaint[patients[i].chiefComplaint.length - 1]
        .chiefComplaintId._id;
    for (let j = 0; j < patients.length; j++) {
      let y =
        patients[j].chiefComplaint[patients[j].chiefComplaint.length - 1]
          .chiefComplaintId._id;
      if (x === y && patients[i]._id !== patients[j]._id) {
        count++;
      }
    }
    console.log(count);
  }

  // console.log(patients[0].chiefComplaint.length);

  // const arr = [];
  // for (let i = 0; i < patients.length; i++) {
  //   const latestCC = patients[i].chiefComplaint.length - 1;
  //   const rooms =
  //     patients[i].chiefComplaint[latestCC].chiefComplaintId.productionArea[0]
  //       .productionAreaId.rooms;
  //   for (let j = 0; j < rooms.length; j++) {
  //     if (rooms[j].roomId.availability === false) {
  //       arr.push(rooms[j].roomId._id);
  //     }
  //   }
  // }
  // console.log(arr);

  res.status(200).json({
    success: true,
    data: patients,
  });
});

exports.getNoOfPatientsByCC = asyncHandler(async (req, res, next) => {
  const patients = await EDR.find({
    'chiefComplaint.chiefComplaintId': req.params.id,
  });
  console.log(patients.length);
});

exports.getPatientsByPA = asyncHandler(async (req, res, next) => {
  const patients = await PA.findOne({
    _id: req.params.productionAreaId,
  }).populate('rooms.roomId');

  // console.log(patients.rooms[1].roomId.availability);
  const arr = [];
  for (let i = 0; i < patients.rooms.length; i++) {
    if (patients.rooms[i].roomId.availability === false) {
      arr.push(patients.rooms[i].roomId._id);
    }
  }
  console.log(arr);
  res.status(200).json({
    success: true,
    data: arr.length,
  });
});

exports.patientsByCC = asyncHandler(async (req, res, next) => {
  const patients = await CC.find({ productionArea: { $ne: [] } })
    .populate([
      {
        path: 'productionArea.productionAreaId',
        model: 'productionArea',
        populate: [
          {
            path: 'rooms.roomId',
            model: 'room',
          },
        ],
      },
    ])
    .select('name chiefComplaintId');
  // const arr = [];
  // for (let i = 0; i < patients.length; i++) {
  //   const rooms = patients[i].productionArea[0].productionAreaId.rooms;
  //   for (let j = 0; j < rooms.length; j++) {
  //     if (rooms[j].roomId.availability === false) {
  //       arr.push(rooms[j].roomId._id);
  //     }
  //   }
  // }
  // console.log(arr);
  // patients = arr.length;
  res.status(200).json({
    success: true,
    data: {
      patients,
      noOfPatients: arr.length,
    },
  });
});
