const express = require('express');

const {
  pendingRadHouseKeeperRequests,
  comletedRadHouseKeeperRequests,
  pendingSenseiHouseKeeperRequests,
  comletedSenseiHouseKeeperRequests,
  updateSenseiStatus,
  updateStatus,
} = require('../controllers/houseKeeperRequest');

const router = express.Router();

router.get('/getPendingRadHKRequests', pendingRadHouseKeeperRequests);
router.get('/pendingSenseiHKRequests', pendingSenseiHouseKeeperRequests);
router.get('/completedSenseiHKRequests', comletedSenseiHouseKeeperRequests);
router.get('/getCompletedRadHKRequests', comletedRadHouseKeeperRequests);
router.put('/updateStatus', updateStatus);
router.put('/updateSenseiStatus', updateSenseiStatus);

module.exports = router;
