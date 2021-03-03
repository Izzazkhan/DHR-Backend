const webpush = require('web-push');
const Subscription = require('../models/subscriber/subscriber');
const Notification = require('../models/notification/notification');
const Patient = require('../models/patient/patient');
const Staff = require('../models/staffFhir/staff');

const privateVapidKey = 'Lp4OiMe4L3NN10tNBiTT-rLFmdrAr1dP_nqy7L1kPf8';
const publicVapidKey =
  'BP1BVnxpitLeUvjKLq3-POa76eUksEZymf09ECp9wxmRXdPQ4zatupyT91JAhK6xFDcdsoMXN17cp0d0rEWYpkg';
webpush.setVapidDetails(
  'mailto:pmdevteam0@gmail.com',
  publicVapidKey,
  privateVapidKey
);
var notification = function (title, message, staffType, route, searchId) {
  const payload = JSON.stringify({
    title: title,
    message: message,
    route: route,
  });
  Staff.findOne({ staffType: staffType }).then((user, err) => {
    var array = [];
    for (var j = 0; j < user.length; j++) {
      array.push({
        userId: user[j]._id,
        read: false,
      });
    }
    Patient.findOne({ _id: searchId })
      .select({
        identifier: 1,
        name: 1,
      })
      .then((patient, err) => {
        Notification.create({
          title: title,
          message: message,
          route: route,
          searchId: patient,
          sendTo: array,
        }).then((test, err) => {});
      });

    for (let i = 0; i < user.length; i++) {
      Subscription.find({ user: user[i]._id }, (err, subscriptions) => {
        if (err) {
          console.error(`Error occurred while getting subscriptions`);
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
                    });
                  resolve({
                    status: true,
                    endpoint: subscription.endpoint,
                    data: value,
                  });
                })
                .catch((err) => {
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
