const Room = require('../models/room');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const requestNoFormat = require('dateformat');

exports.getRooms = asyncHandler(async (req, res) => {
  const getRooms = await Room.find();
  res.status(200).json({ success: true, data: getRooms });
});

exports.getAvailableRooms = asyncHandler(async (req,res)=>{
	const available = await Room.find({disabled:false, availability:true}).select({roomId:1,noOfBeds:1})
	res.status(200).json({success:true, data:available})
})

exports.createRoom = asyncHandler(async(req,res)=>{
const now = new Date();
const start = new Date(now.getFullYear(), 0, 0);
const diff = now - start + (start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000;
const oneDay = 1000 * 60 * 60 * 24;
const day = Math.floor(diff / oneDay);
const {
    noOfBeds
} = req.body
const beds = []
for(let i=0; i<noOfBeds; i++)
{
	beds.push({
		bedId:'BD' + i + day + requestNoFormat(new Date(), 'yyHHMMss'),
		availability:true,
		status:"not_assigned"
	})
}
const createRoom = await Room.create({
	roomId : 'RM' + day + requestNoFormat(new Date(), 'yyHHMMss'),
    noOfBeds,
    beds: beds,
    availability: true,
    disabled: false,
    status: 'not_assigned',
  });
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
    let updateRecord = {
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
    let updateRecord = {
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
