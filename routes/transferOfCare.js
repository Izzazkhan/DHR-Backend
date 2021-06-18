const express = require('express');

const router = express.Router();

const { getCurrentShiftDocs } = require('../controllers/transferOfCare');

router.get('/getCurrentShiftDocs/:staffId', getCurrentShiftDocs);

module.exports = router;
