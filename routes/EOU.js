const express = require('express');

const router = express.Router();

const {
  createEOU,
  assignBedToEOU,
  // disableBed,
  // enableBed,
  getAllBeds,
  getAvailableBeds,
} = require('../controllers/EOU');

router.post('/createEou', createEOU);
router.put('/assignBedToEOU', assignBedToEOU);
// router.put('/disableBed', disableBed);
// router.put('/enableBed', enableBed);
router.get('/getAllBeds', getAllBeds);
router.get('/getAvailableBeds', getAvailableBeds);

module.exports = router;
