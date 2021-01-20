const express = require('express');

const router = express.Router();
const { getDischargedEDRs } = require('../controllers/socialWorker');

router.get('/getDischargedEDRs', getDischargedEDRs);

module.exports = router;
