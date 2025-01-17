const Room = require('../models/room');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const EDR = require('../models/EDR/EDR');
const ProductionArea = require('../models/productionArea');
const Notification = require('../components/notification');
const Flag = require('../models/flag/Flag');
const generateReqNo = require('../components/requestNoGenerator');
const Bed = require('../models/Bed');
const Staff = require('../models/staffFhir/staff');
const addFlag = require('../components/addFlag.js');

exports.getRooms = asyncHandler(async (req, res) => {
  const getRooms = await Room.find();
  res.status(200).json({ success: true, data: getRooms });
});

exports.getAvailableRooms = asyncHandler(async (req, res) => {
  const available = await Room.find({
    disabled: false,
    availability: true,
    assingedToPA: false,
  }).select({ roomId: 1, noOfBeds: 1, roomNo: 1 });
  res.status(200).json({ success: true, data: available });
});

exports.getAvailableRoomsAganistPA = asyncHandler(async (req, res) => {
  const paWithRooms = await ProductionArea.findById({
    _id: req.params.paId,
    disabled: false,
    availability: true,
  })
    .select('rooms')
    .populate({
      path: 'rooms.roomId',
      match: { availability: true, disabled: false },
    });

  res.status(200).json({ success: true, data: paWithRooms });
});

exports.createRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.find().countDocuments();
  if (room > 14) {
    return next(
      new ErrorResponse('You can not create more than 14 ED Beds', 400)
    );
  }
  const bed = await Bed.findById(req.body.bedId);

  if (!bed || bed.availability === false || bed.disabled === true) {
    return next(new ErrorResponse('Can not assign this bed to the room'));
  }

  const beds = {
    bedIdDB: bed._id,
    bedId: bed.bedId,
    availability: true,
    bedNo: bed.bedNo,
  };

  const roomId = generateReqNo('RM');
  const createRoom = await Room.create({
    roomId,
    roomNo: room + 1,
    beds: beds,
    availability: true,
    disabled: false,
    status: 'not_assigned',
    createdBy: req.body.staffId,
  });

  await Bed.findOneAndUpdate(
    { _id: req.body.bedId },
    { $set: { availability: false, bedType: 'ED' } },
    { new: true }
  );

  res.status(200).json({ success: true, data: createRoom });
});

exports.disableRoom = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ _id: req.params.id });
  if (room.availability === false) {
    res
      .status(200)
      .json({ success: false, data: 'Room not available for disabling' });
  } else if (room.disabled === true) {
    res.status(200).json({ success: false, data: 'Room already disabled' });
  } else {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Room.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: true },
        $push: { updateRecord: updateRecord },
      }
    );
    res.status(200).json({ success: true, data: 'Room status changed' });
  }
});

exports.enableRoom = asyncHandler(async (req, res) => {
  const room = await Room.findOne({ _id: req.params.id });
  if (room.disabled === true) {
    const updateRecord = {
      updatedAt: Date.now(),
      updatedBy: req.body.staffId,
      reason: req.body.reason,
    };
    await Room.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { disabled: false },
        $push: { updateRecord: updateRecord },
      }
    );
    res.status(200).json({ success: true, data: 'Room status changed' });
  } else {
    res.status(200).json({ success: false, data: 'Room already enabled' });
  }
});

exports.assignRoom = asyncHandler(async (req, res, next) => {
  let bedId = await Room.findById(req.body.roomId).select('beds');
  bedId = bedId.beds[0].bedIdDB;
  const bed = await Bed.findOne({ _id: bedId });

  if (bed.disabled === true) {
    return next(
      new ErrorResponse(
        'Bed in this room is disabled,you cannot assign it',
        400
      )
    );
  }
  const room = {
    roomId: req.body.roomId,
    bedId: bed._id,
    edrId: req.body.edrId,
    assignedBy: req.body.staffId,
    assignedTime: Date.now(),
    reason: req.body.reason,
  };

  const checkRoom = await Room.findOne({ _id: req.body.roomId });
  if (checkRoom.availability === false) {
    return next(new ErrorResponse('Room is already assigned', 400));
  }
  if (checkRoom.disabled === true) {
    return next(
      new ErrorResponse('Room is disabled,you cannot assign it', 400)
    );
  }
  const patient = await EDR.findOneAndUpdate(
    { _id: req.body.edrId },
    { $push: { room } },
    { new: true }
  )
    .select('patientId')
    .populate('patientId', 'identifier');

  if (!patient) {
    return next(new ErrorResponse('patient not found with this id', 400));
  }
  await Room.findOneAndUpdate(
    { _id: req.body.roomId },
    { $set: { 'beds.0.availability': false } },
    { new: true }
  );

  const assignedRoom = await Room.findOneAndUpdate(
    { _id: req.body.roomId },
    { $set: { availability: false } },
    { new: true }
  );

  //   Cron Flag for Sensei 2nd Card
  const data = {
    taskName: 'Sensei Triage Pending',
    minutes: 5,
    collectionName: 'CC',
    staffId: null,
    patientId: req.body.edrId,
    onModel: 'EDR',
    generatedFrom: 'Sensei',
    card: '2nd',
    generatedFor: ['Sensei'],
    reason: 'Patients pending for TriageAssessment From Nurse',
    emittedFor: 'pendingSensei',
    requestId: req.body.edrId,
  };

  addFlag(data);

  //   Cron Flag for Sensei 3rd Card
  const data2 = {
    taskName: 'Sensei Diagnoses Pending',
    minutes: 46,
    collectionName: 'CC',
    staffId: null,
    patientId: req.body.edrId,
    onModel: 'EDR',
    generatedFrom: 'Sensei',
    card: '3rd',
    generatedFor: ['Sensei', 'Medical Director'],
    reason: 'Patients diagnoses pending from Doctor',
    emittedFor: 'pendingSensei',
    requestId: req.body.edrId,
  };

  addFlag(data2);

  // Room Flag
  const rooms = await Room.find({
    availability: true,
  }).countDocuments();

  // Rasing Flag
  if (rooms < 8) {
    await Flag.create({
      edrId: req.body.edrId,
      generatedFrom: 'Registration Officer',
      card: 'beds',
      generatedFor: ['Sensei', 'Shift Nursing Supervisor'],
      reason: 'Need more ED Beds',
      createdAt: Date.now(),
    });
    const flags = await Flag.find({
      generatedFrom: 'Registration Officer',
      $or: [{ status: 'pending' }, { status: 'in_progress' }],
    });
    globalVariable.io.emit('pendingRO', flags);
  }

  // Notification From Sensei
  Notification(
    'Details from Sensei',
    'Details from Sensei',
    'Registration Officer',
    'Sensei',
    '/dashboard/home/patientregistration',
    req.body.edrId,
    '',
    ''
  );

  Notification(
    'ADT_A04',
    'Patient Registration and Bed Allocation from Sensei',
    'Admin',
    'New Patient Entry and Allocation',
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    ''
  );

  //   Sending Notification TO ED Nurse
  const patientPA = await EDR.findById(req.body.edrId)
    .select('chiefComplaint.chiefComplaintId')
    .populate([
      {
        path: 'chiefComplaint.chiefComplaintId',
        model: 'chiefComplaint',
        populate: [
          {
            path: 'productionArea.productionAreaId',
            model: 'productionArea',
            select: 'paName',
          },
        ],
      },
    ]);
  const latestCC = patientPA.chiefComplaint.length - 1;

  const chiefComplaintId =
    patientPA.chiefComplaint[latestCC].chiefComplaintId._id;

  // Current Staff Shift
  const currentStaff = await Staff.findById(req.body.staffId).select('shift');

  const EDNurses = await Staff.find({
    staffType: 'Nurses',
    subType: 'ED Nurse',
    shift: currentStaff.shift,
    'chiefComplaint.chiefComplaintId': chiefComplaintId,
  });

  EDNurses.forEach((nurse) => {
    Notification(
      'ADT_A04',
      'Patient Registration and Bed Allocation from Sensei',
      '',
      'Bed Allocation for New Patient',
      '/dashboard/home/notes',
      req.body.edrId,
      '',
      '',
      nurse._id
    );
  });

  Notification(
    'ADT_A04',
    'Patient Registration and Bed Allocation from Sensei',
    '',
    'New Patient Entry and Allocation',
    '/dashboard/home/notes',
    req.body.edrId,
    '',
    ''
  );
  // const checkBed = await Room.findOne({ 'beds._id': req.body.bedId }).select(
  //   'beds'
  // );

  // const arr = [];
  // for (let i = 0; i < checkBed.beds.length; i++) {
  //   if (req.body.bedId == checkBed.beds[i]._id) {
  //     arr.push(i);
  //   }
  // }
  // // console.log(checkBed.beds[arr[0]].availability);
  // if (checkBed.beds[arr[0]].availability === false) {
  //   return next(new ErrorResponse('Bed is already assigned', 400));
  // }
  // if (checkBed.beds[arr[0]].disabled === true) {
  //   return next(new ErrorResponse('Bed is disabled,you cannot assign it', 400));
  // }
  // const patient = await EDR.findOneAndUpdate(
  //   { _id: req.body.edrId },
  //   { $push: { room } },
  //   { new: true }
  // );

  // await Room.findOneAndUpdate(
  //   {
  //     'beds._id': req.body.bedId,
  //   },
  //   { $set: { [`beds.${arr[0]}.availability`]: false } },
  //   { new: true }
  // );
  // // // console.log(availBed);
  // const beds = await Room.find({
  //   _id: req.body.roomId,
  //   'beds.availability': true,
  // });
  // // console.log(beds.length);

  // if (beds.length < 1) {
  //   await Room.findOneAndUpdate(
  //     {
  //       _id: req.body.roomId,
  //     },
  //     { $set: { availability: false } },
  //     { new: true }
  //   );
  // }
  res.status(200).json({
    success: true,
    data: {
      assignedRoom,
      patient,
    },
  });
});

// exports.updateRoom = asyncHandler(async(req,res)=>{
// 	const now = new Date();
// 	const start = new Date(now.getFullYear(), 0, 0);
// 	const diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
// 	const oneDay = 1000 * 60 * 60 * 24;
// 	const day = Math.floor(diff / oneDay);
// 	const { _id } = req.body;
// 	let room = await Room.findById(_id);
// 	if(!room) {
//         return next(
//           new ErrorResponse(`Room not found with id of ${_id}`, 404)
//         );
//       }
//     room = await Room.updateOne({_id: _id}, req.body);
// 	const {
// 		noOfBeds
// 	} = req.body
// 	const beds = []
// 	for(let i=0; i<noOfBeds; i++)
// 	{
// 		beds.push({
// 			bedId:'BD' + i + day + requestNoFormat(new Date(), 'yyHHMMss'),
// 			availability:true,
// 			status:"not_assigned"
// 		})
// 	}
// 	const createRoom = await Room.create({
// 		roomId : 'RM' + day + requestNoFormat(new Date(), 'yyHHMMss'),
// 		noOfBeds,
// 		beds : beds,
// 		availability:true,
// 		status:"not_assigned"
// 	})
// 	res.status(200).json({success:true,data:createRoom})
// 	});
