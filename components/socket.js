const mongoose = require('mongoose');
const ChatModel = require('../models/chatRoom/chatRoom');
const Notification = require('../models/notification/notification');
const Flag = require('../models/flag/Flag');

module.exports = (io1) => {
  let connectedUsers = [];

  io1.origins('*:*');
  io1.on('connection', (socket) => {
    socket.on('connected', (userId) => {
      const arr = connectedUsers.filter((i) => i !== userId);
      arr.push(userId);
      connectedUsers = arr;
      // console.log('chat user connected', connectedUsers);
      io1.emit('getConnectedUsers', connectedUsers);
    });

    socket.on('disconnected', (userId) => {
      const arr = connectedUsers.filter((i) => i !== userId);
      connectedUsers = arr;
      // console.log('chat user disconnected', connectedUsers);
      io1.emit('getConnectedUsers', connectedUsers);
    });

    socket.on('chat_sent', function (msg) {
      ChatModel.findOneAndUpdate(
        { _id: msg.obj2.chatId },
        {
          $push: { chat: msg.obj1 },
        }
      ).then(() => {
        io1.emit('chat_receive', { message: msg.obj1 });
      });
    });

    socket.on('get_count', async (userId) => {
      const count = await Notification.aggregate([
        {
          $unwind: '$sendTo',
        },
        {
          $match: {
            $and: [
              { 'sendTo.userId': mongoose.Types.ObjectId(userId) },
              { 'sendTo.read': false },
            ],
          },
        },
      ]);

      io1.emit('count', { count: count.length, user: userId });
    });

    socket.on('rad_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Imaging Technician',
        status: 'pending',
      });
      io1.emit('pendingRad', flags);
    });

    socket.on('ro_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Registration Officer',
        status: 'pending',
      });
      io1.emit('pendingRO', flags);
    });

    socket.on('sensei_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Sensei',
        status: 'pending',
      });
      io1.emit('pendingSensei', flags);
    });

    socket.on('edDoctor_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'ED Doctor',
        status: 'pending',
      });
      io1.emit('pendingDoctor', flags);
    });

    socket.on('hk_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'House Keeping',
        status: 'pending',
      });
      io1.emit('hkPending', flags);
    });

    socket.on('cc_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Customer Care',
        status: 'pending',
      });
      io1.emit('ccPending', flags);
    });

    socket.on('edNurse_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'ED Nurse',
        status: 'pending',
      });
      io1.emit('edNursePending', flags);
    });

    socket.on('eouNurse_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'EOU Nurse',
        status: 'pending',
      });
      io1.emit('eouNursePending', flags);
    });

    socket.on('anesthesia_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Anesthesiologist',
        status: 'pending',
      });
      io1.emit('anesthesiaPending', flags);
    });

    socket.on('external_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'External',
        status: 'pending',
      });
      io1.emit('externalPending', flags);
    });

    socket.on('internal_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Internal',
        status: 'pending',
      });
      io1.emit('internalPending', flags);
    });

    socket.on('radDoctor_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Rad Doctor',
        status: 'pending',
      });
      io1.emit('radDoctorPending', flags);
    });

    socket.on('labTechnician_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Rad Doctor',
        status: 'pending',
      });
      io1.emit('ltPending', flags);
    });

    socket.on('clinicalPharm_flags', async () => {
      const flags = await Flag.find({
        generatedFrom: 'Clinical Pharmacist',
        status: 'pending',
      });
      io1.emit('cpPending', flags);
    });
  });
};
