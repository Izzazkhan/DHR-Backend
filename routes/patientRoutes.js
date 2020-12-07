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
const cpUpload = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 },
  { name: 'insuranceCard', maxCount: 1 },
]);
const {
  registerPatient,
  updatePatient,
  getPatient,
  getAllPatients,
  getPendingRegistration,
  getApprovedRegistration,
  getPatientByKeyword,
  getApprovedPatientByKeyword,
  averageRegistrationTAT,
} = require('../controllers/patientController');

const router = express.Router();
router.get('/getPatient/:patientId', getPatient);
router.get('/pendingRegistration', getPendingRegistration);
router.get('/approvedRegistration', getApprovedRegistration);
router.post('/registerPatient', cpUpload, registerPatient);
router.get('getAllPatients', getAllPatients);
router.get('/searchPatient/:keyword', getPatientByKeyword);
router.get('/approvedPatient/:keyword', getApprovedPatientByKeyword);
router.put('/updatePatient', cpUpload, updatePatient);
router.get('/averageRegistrationTAT', averageRegistrationTAT);
module.exports = router;
