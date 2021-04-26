const express = require('express');

const {
  pendingRadHouseKeeperRequests,
  comletedRadHouseKeeperRequests,
  pendingSenseiHouseKeeperRequests,
  comletedSenseiHouseKeeperRequests,
  updateSenseiStatus,
  updateStatus,
  pendingEDNurseHKRequests,
  updateEDNurseStatus,
  completedEDNurseHKRequests,
} = require('../controllers/houseKeeperRequest');

const router = express.Router();

router.get('/getPendingRadHKRequests', pendingRadHouseKeeperRequests);
router.get('/pendingSenseiHKRequests', pendingSenseiHouseKeeperRequests);
router.get('/completedSenseiHKRequests', comletedSenseiHouseKeeperRequests);
router.get('/getCompletedRadHKRequests', comletedRadHouseKeeperRequests);
router.put('/updateStatus', updateStatus);
router.put('/updateSenseiStatus', updateSenseiStatus);
router.put('/updateEDNurseStatus', updateEDNurseStatus);
router.get('/pendingEDNurseHKRequests', pendingEDNurseHKRequests);
router.get('/completedEDNurseHKRequests', completedEDNurseHKRequests);

module.exports = router;
