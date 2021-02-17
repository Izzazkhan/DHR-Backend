const express = require('express');

const router = express.Router();

const {
  roDashboard,
  hkDashboard,
  anesthesiologistDashboard,
  roSenseiPending,
  roTotalPending,
} = require('../controllers/reports');

// Registration Officer
router.get('/roDashboard', roDashboard);
router.get('/roSenseiPending', roSenseiPending);
router.get('/roTotalPending', roTotalPending);

router.get('/hkDashboard', hkDashboard);
router.get('/anesthesiologistDB', anesthesiologistDashboard);
module.exports = router;
