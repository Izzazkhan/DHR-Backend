const express = require('express');

const router = express.Router();

const {
  addTriageAssessment,
  addDcdForm,
  addPatinetDetals,
} = require('../controllers/dcdFormController');

router.put('/addTriageAssessment', addTriageAssessment);
router.put('/addDcdForm', addDcdForm);
router.put('/addPatinetDetals', addPatinetDetals);

module.exports = router;
