const express = require('express');

const router = express.Router();

const {
  addTriageAssessment,
  addDcdForm,
  addPatientDetails,
  addPastHistory,
  addROS,
  addPhysicalExam,
  addInvestigation,
  addActionPlan,
  addCourseOfVisit,
} = require('../controllers/dcdFormController');

router.put('/addTriageAssessment', addTriageAssessment);
router.put('/addDcdForm', addDcdForm);
router.put('/addPatientDetails', addPatientDetails);
router.put('/addPastHistory', addPastHistory);
router.put('/addRos', addROS);
router.put('/addPhysicalExam', addPhysicalExam);
router.put('/addInvestigation', addInvestigation);
router.put('/addActionPlan', addActionPlan);
router.put('/addCourseOfVisit', addCourseOfVisit);

module.exports = router;
