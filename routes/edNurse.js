const express = require('express');

const router = express.Router();

const { getLab, getRad } = require('../controllers/edNurseRequests');

router.get('/getLab', getLab);
router.get('/getRad', getRad);

module.exports = router;
