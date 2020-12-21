const express = require('express');
// const { protect } = require('../controllers/authController');
const {
getPharmacyRequests
} = require('../controllers/senseiController');

const router = express.Router();
router.post('/assignShifts',getPharmacyRequests);
module.exports = router;
