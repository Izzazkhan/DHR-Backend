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
const {
  generateEDR,
  getEDRs,
  getEDRById,
  getEdrPatientByKeyword,
  getEdrsByPatient,
  addDoctorNotes,
  updateDoctorNotes,
} = require('../controllers/edrController');

const router = express.Router();

router.post('/generateEDR', generateEDR);
router.get('/getSingleEdr/:id', getEDRById);
router.get('/getEDRs', getEDRs);
router.get('/searchEdrPatient/:keyword', getEdrPatientByKeyword);
router.put('/addDoctorNotes', upload.single('file'), addDoctorNotes);
router.put('/updateDoctorNotes', upload.single('file'), updateDoctorNotes);
router.get('/getEdrsByPatient/:id', getEdrsByPatient);
module.exports = router;
