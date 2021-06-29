const express = require('express');

const router = express.Router();

const {
  createEOU,
  assignBedToEOU,
  // disableBed,
  // enableBed,
  getAllBeds,
  getAvailableBeds,
  removeBedFromEOU,
  assignBedTONurse,
  pendingNurseAssign,
  completedNurseAssign,
  sendNotification,
} = require('../controllers/EOU');

router.post('/createEou', createEOU);
router.put('/assignBedToEOU', assignBedToEOU);
router.put('/removeBedFromEOU', removeBedFromEOU);
router.put('/assignBedTONurse', assignBedTONurse);
// router.put('/disableBed', disableBed);
// router.put('/enableBed', enableBed);
router.get('/getAllBeds', getAllBeds);
router.get('/getAvailableBeds', getAvailableBeds);
router.get('/pendingNurseAssign', pendingNurseAssign);
router.get('/completedNurseAssign', completedNurseAssign);
router.put('/sendNotification', sendNotification);

module.exports = router;
