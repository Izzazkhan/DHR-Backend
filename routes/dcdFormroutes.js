const express = require('express');

const router = express.Router();

const {
  addTriageAssessment,
  addDcdForm,
} = require('../controllers/dcdFormController');

router.put('/addTriageAssessment', addTriageAssessment);
router.put('/addDcdForm', addDcdForm);

module.exports = router;
