const express = require('express');

const {
  getNotification,
  updateNotification,
  // notificationCount,
  readNotifications,
  unReadNotifications,
} = require('../controllers/notification');

const router = express.Router();

router.get('/getnotifications/:id', getNotification);
// router.get('/notificationCount/:id', notificationCount);
router.get('/updatenotifications/:id/:userId', updateNotification);
router.get('/readNotifications/:id/:sendFrom', readNotifications);
router.get('/unReadNotifications/:id/:sendFrom', unReadNotifications);
module.exports = router;
