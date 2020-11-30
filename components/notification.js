const webpush = require('web-push');
const StaffType = require('../models/staffType/staffType');
const User = require('../models/user/user');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Notification = require('../models/notification/notification');

webpush.setVapidDetails(
  'mailto:pmdevteam0@gmail.com',
  process.env.PUBLIC_VAPID_KEYS,
  process.env.PRIVATE_VAPID_KEYS
);

const notification = asyncHandler(async (title, body, type, route) => {
  const payload = JSON.stringify(title, body, route);
  const staff = await StaffType.findOne({ type: type });
  const users = await User.findById(staff._id);
  const userArray = users.map((user) => ({
    userId: user._id,
    read: false,
  }));
  const newNotification = await Notification.create({
    title,
    body,
    route,
    sendTo: userArray,
  });
});
