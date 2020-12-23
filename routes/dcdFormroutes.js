const express = require('express');

const router = express.Router();

const {
  addTriageAssessment,
  addDcdForm,
  addPatinetDetals,
  addPastHistory,
} = require('../controllers/dcdFormController');

router.put('/addTriageAssessment', addTriageAssessment);
router.put('/addDcdForm', addDcdForm);
router.put('/addPatientDetails', addPatinetDetals);
router.put('/addPastHistory', addPastHistory);

module.exports = router;
