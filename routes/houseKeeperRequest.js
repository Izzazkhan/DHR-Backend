const express = require('express');

const {
  pendingRadHouseKeeperRequests,
  comletedRadHouseKeeperRequests,
  updateStatus,
} = require('../controllers/houseKeeperRequest');

const router = express.Router();

router.get('/getPendingRadHKRequests', pendingRadHouseKeeperRequests);
router.get('/getCompletedRadHKRequests', comletedRadHouseKeeperRequests);
router.put('/updateStatus', updateStatus);

module.exports = router;
