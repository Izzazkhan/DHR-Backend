const express = require('express');

const router = express.Router();

const { roDashboard } = require('../controllers/reports');

router.get('/roDashboard', roDashboard);

module.exports = router;
