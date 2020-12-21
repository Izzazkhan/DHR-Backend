const express = require('express');

const router = express.Router();

const { addTriageAssessment } = require('../controllers/dcdFormController');

router.put('/addTriageAssessment', addTriageAssessment);

module.exports = router;
