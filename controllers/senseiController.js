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
    patientInHospital: true,
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

  const newArray = [];
  for (let i = 0; i < patients.length; i++) {
    let count = 1;

    const obj = JSON.parse(JSON.stringify(patients[i]));
    const x =
      patients[i].chiefComplaint[patients[i].chiefComplaint.length - 1]
        .chiefComplaintId._id;
    for (let j = 0; j < patients.length; j++) {
      const y =
        patients[j].chiefComplaint[patients[j].chiefComplaint.length - 1]
          .chiefComplaintId._id;
      if (x === y && patients[i]._id !== patients[j]._id) {
        count++;
      }
    }

    obj.count = count;
    newArray.push(obj);
    // console.log('count', patients[i]);
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

  // console.log(patients);

  res.status(200).json({
    success: true,
    data: newArray,
  });
});

exports.searchCCPatients = asyncHandler(async (req, res, next) => {
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

  const arr = [];
  for (let i = 0; i < patients.length; i++) {
    const fullName =
      patients[i].patientId.name[0].given[0] +
      ' ' +
      patients[i].patientId.name[0].family;
    if (
      (patients[i].patientId.name[0].given[0] &&
        patients[i].patientId.name[0].given[0]
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.name[0].family &&
        patients[i].patientId.name[0].family
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.identifier[0].value &&
        patients[i].patientId.identifier[0].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      fullName.toLowerCase().startsWith(req.params.keyword.toLowerCase()) ||
      (patients[i].patientId.telecom[1].value &&
        patients[i].patientId.telecom[1].value
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase())) ||
      (patients[i].patientId.nationalID &&
        patients[i].patientId.nationalID
          .toLowerCase()
          .startsWith(req.params.keyword.toLowerCase()))
    ) {
      arr.push(patients[i]);
    }
  }
  res.status(200).json({
    success: true,
    data: arr,
  });
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
    data: arr,
  });
});

exports.getPatientByRoom = asyncHandler(async (req, res, next) => {
  // console.log(req.params);
  const rooms = await EDR.findOne({
    'room.roomId': req.params.roomId,
    room: { $ne: [] },
  }).select('room');
  // console.log(rooms.room.length);
  const latestRoom = rooms.room.length - 1;
  // console.log(latestRoom);
  const patient = await EDR.findOne({
    [`room.${latestRoom}.roomId`]: req.params.roomId,
  })
    .populate('patientId', 'identifier name')
    .select('patientId');
  // console.log(patient);
  res.status(200).json({
    success: true,
    data: patient,
  });
});

exports.patientsByCC = asyncHandler(async (req, res, next) => {
  const chiefComplaint = await CC.find({ productionArea: { $ne: [] } }).select(
    'name chiefComplaintId'
  );
  const edrCC = await EDR.find({
    chiefComplaint: { $ne: [] },
    status: 'pending',
  }).select('chiefComplaint.chiefComplaintId');
  let count = 0;
  const newArray = [];

  for (let i = 0; i < chiefComplaint.length; i++) {
    const obj = JSON.parse(JSON.stringify(chiefComplaint[i]));
    count = 0;
    for (let j = 0; j < edrCC.length; j++) {
      const latestCC =
        edrCC[j].chiefComplaint[edrCC[j].chiefComplaint.length - 1];
      // console.log(latestCC);
      if (
        chiefComplaint[i]._id.toString() ===
        latestCC.chiefComplaintId.toString()
      ) {
        count++;
      }
    }
    obj.count = count;
    newArray.push(obj);
  }
  // console.log(newArray);

  res.status(200).json({
    success: true,
    data: newArray,
  });
});
