const express = require('express');

const router = express.Router();

const {
  createBed,
  disableBed,
  enableBed,
  getAllBeds,
  getAvailableBeds,
} = require('../controllers/bed');

router.post('/createBed', createBed);
router.put('/disableBed', disableBed);
router.put('/enableBed', enableBed);
router.get('/getAllBeds', getAllBeds);
router.get('/getAvailableBeds', getAvailableBeds);

module.exports = router;
