const express = require('express');

const router = express.Router();

const {
  roDashboard,
  hkDashboard,
  anesthesiologistDashboard,
  roSenseiPending,
} = require('../controllers/reports');

router.get('/roDashboard', roDashboard);
router.get('/hkDashboard', hkDashboard);
router.get('/anesthesiologistDB', anesthesiologistDashboard);
router.get('/roSenseiPending', roSenseiPending);
module.exports = router;
