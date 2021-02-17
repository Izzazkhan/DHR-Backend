const express = require('express');

const router = express.Router();

const {
  roDashboard,
  hkDashboard,
  anesthesiologistDashboard,
} = require('../controllers/reports');

router.get('/roDashboard', roDashboard);
router.get('/hkDashboard', hkDashboard);
router.get('/anesthesiologistDB', anesthesiologistDashboard);

module.exports = router;
