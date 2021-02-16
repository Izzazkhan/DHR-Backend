const express = require('express');

const router = express.Router();

const {
  roDashboard,
  hkDashboard,
  swDashboard,
} = require('../controllers/reports');

router.get('/roDashboard', roDashboard);
router.get('/hkDashboard', hkDashboard);
router.get('/swDashboard', swDashboard);

module.exports = router;
