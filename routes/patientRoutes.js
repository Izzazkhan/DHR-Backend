const express = require('express');
const PATH = './uploads';
const multer = require('multer');
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

const router = express.Router();
router.get('/getPatient/:patientId', getPatient);
router.get('/pendingRegistration', getPendingRegistration);
router.get('/approvedRegistration', getApprovedRegistration);
router.post('/registerPatient', upload.single('file'), registerPatient);
// get(getAllPatients);
router.get('/searchPatient/:keyword', getPatientByKeyword);
// .delete(deletePatient)
// .patch(updatePatient);

module.exports = router;
