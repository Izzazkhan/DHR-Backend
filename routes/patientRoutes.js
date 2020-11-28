const express = require('express');
const multer = require('multer');
const router = express.Router();
const PATH = './uploads';
var storage = multer.diskStorage({
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
const {
  registerPatient,
  getPatient,
  getAllPatients,
  getPendingRegistration,
  getApprovedRegistration,
  getPatientByKeyword,
} = require('../controllers/patientController');

router.get('/pendingRegistration', getPendingRegistration);
router.get('/approvedRegistration', getApprovedRegistration);
router.post('/registerPatient', upload.single('file'), registerPatient);
// get(getAllPatients);
router.get('/searchPatient/:keyword', getPatientByKeyword);
// router.get('/getPatientByName/:name', getPatientByName);
router
  .route('/:patientId')
  // .delete(deletePatient)
  .get(getPatient);
// .patch(updatePatient);

module.exports = router;
