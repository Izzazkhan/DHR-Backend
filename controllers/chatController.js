const chatroom = require('../models/chatRoom/chatRoom');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

exports.getChatRoom = asyncHandler(async (req, res, next) => {
  const chatRoom = await chatroom.findById(req.params.chatId);
  res.status(200).json({
    success: true,
    data: chatRoom,
  });
});

exports.createChat = asyncHandler(async (req, res, next) => {
  const checkChat = await chatroom.findOne({
    participant1: { $in: [req.body.sender, req.body.receiver] },
    participant2: { $in: [req.body.sender, req.body.receiver] },
  });
  if (checkChat) {
  }
});
