const express = require('express');
const multer = require('multer');

const PATH = './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PATH);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname
    );
  },
});

const upload = multer({ storage: storage });

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
router.put('/addInvestigation', upload.array('file'), addInvestigation);
router.put('/addActionPlan', addActionPlan);
router.put('/addCourseOfVisit', addCourseOfVisit);

module.exports = router;
