const express = require('express');

const router = express.Router();

const {
  addTriageAssessment,
  addDcdForm,
  addPatientDetails,
  addPastHistory,
  addROS,
} = require('../controllers/dcdFormController');

router.put('/addTriageAssessment', addTriageAssessment);
router.put('/addDcdForm', addDcdForm);
router.put('/addPatientDetails', addPatientDetails);
router.put('/addPastHistory', addPastHistory);
router.put('/addRos', addROS);

module.exports = router;
