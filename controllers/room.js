const Room = require('../models/room');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const requestNoFormat = require('dateformat');

exports.getRooms = asyncHandler(async(req,res)=>{
	const getRooms = await Room.find()
	res.status(200).json({success:true, data:getRooms})
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
	beds : beds,
	availability:true,
	status:"not_assigned"
})
res.status(200).json({success:true,data:createRoom})
});

