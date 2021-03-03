const webpush = require('web-push');
const Subscription = require('../models/subscriber/subscriber');
const Notification = require('../models/notification/notification');
const Patient = require('../models/patient/patient');
const Staff = require('../models/staffFhir/staff');

const PUBLIC_VAPID_KEYS =
  'BP1BVnxpitLeUvjKLq3-POa76eUksEZymf09ECp9wxmRXdPQ4zatupyT91JAhK6xFDcdsoMXN17cp0d0rEWYpkg';
const PRIVATE_VAPID_KEYS = 'Lp4OiMe4L3NN10tNBiTT-rLFmdrAr1dP_nqy7L1kPf8';

webpush.setVapidDetails(
  'mailto:pmdevteam0@gmail.com',
  PUBLIC_VAPID_KEYS,
  PRIVATE_VAPID_KEYS
);
var notification = function (title, message, body, staffType, route, searchId) {
  const payload = JSON.stringify({
    title: title,
    message: message,
    body: body,
    route: route,
  });
  Staff.find({ staffType: staffType }).then((user, err) => {
    var array = [];
    for (var j = 0; j < user.length; j++) {
      array.push({
        userId: user[j]._id,
        read: false,
      });
    }
    //fix this yourself
    Patient.findOne({ _id: searchId })
      .select({
        identifier: 1,
        name: 1,
        chiefComplaint: 1,
        room: 1,
      })
      .then((patient) => {
        Notification.create({
          title: title,
          message: message,
          body: body,
          route: route,
          searchId: patient,
          sendTo: array,
        }).then(res => {
          // console.log("response of notification create : ", res)
        }).catch((err) => {
          console.log("Catch notify create err : ", err)
        })
      }).catch((e) => {
        console.log("patient find error : ", e)
      })

    for (let i = 0; i < user.length; i++) {
      Subscription.find({ user: user[i]._id }, (err, subscriptions) => {
        if (err) {
          console.log(`Error occurred while getting subscriptions`);
          res.status(500).json({
            error: 'Technical error occurred',
          });
        } else {
          let parallelSubscriptionCalls = subscriptions.map((subscription) => {
            return new Promise((resolve, reject) => {
              const pushSubscription = {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.keys.p256dh,
                  auth: subscription.keys.auth,
                },
              };
              const pushPayload = payload;
              webpush
                .sendNotification(pushSubscription, pushPayload)
                .then((value) => {
                  Notification.find({ 'sendTo.userId': user[i]._id })
                    .populate('sendTo.userId')
                    .limit(1)
                    .sort({ $natural: -1 })
                    .then((not, err) => {
                      globalVariable.io.emit('get_data', not);
                    }).catch((e) => {
                      console.log('Error in Notification find : ', e)
                    })
                  resolve({
                    status: true,
                    endpoint: subscription.endpoint,
                    data: value,
                  });
                })
                .catch((err) => {
                  console.log('Error in subscription : ', err)
                  reject({
                    status: false,
                    endpoint: subscription.endpoint,
                    data: err,
                  });
                });
            });
          });
        }
      });
    }
  });
};

module.exports = notification;

// const webpush = require('web-push');
// const StaffType = require('../models/staffType/staffType');
// const User = require('../models/user/user');
// const asyncHandler = require('../middleware/async');
// const ErrorResponse = require('../utils/errorResponse');
// const Notification = require('../models/notification/notification');

// webpush.setVapidDetails(
//   'mailto:pmdevteam0@gmail.com',
//   process.env.PUBLIC_VAPID_KEYS,
//   process.env.PRIVATE_VAPID_KEYS
// );

// const notification = asyncHandler(async (title, body, type, route) => {
//   const payload = JSON.stringify(title, body, route);
//   const staff = await StaffType.findOne({ type: type });
//   const users = await User.findById(staff._id);
//   const userArray = users.map((user) => ({
//     userId: user._id,
//     read: false,
//   }));
//   const newNotification = await Notification.create({
//     title,
//     body,
//     route,
//     sendTo: userArray,
//   });
// });
