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
  addLabRequest,
  updateLab,
  addConsultationNote,
  updateConsultationNote,
  getEDRwihtConsultationNote,
  addRadRequest,
  updateRad,
  getEDRFromPatientForDischarge,
  getEDRFromPatientIdForDischarge,
  updateEdr,
  getDischargedEDRFromPatient,
  getEDRorIPR,
  addAnesthesiologistNote,
  updateAnesthesiologistNote,
  addEDNurseRequest,
  updateEDNurseRequest,
  addEOUNurseRequest,
  updateEOUNurseRequest,
  addNurseTechnicianRequest,
  updateNurseTechnicianRequest,
} = require('../controllers/edrController');

const router = express.Router();

router.post('/generateEDR', generateEDR);
router.get('/getSingleEdr/:id', getEDRById);
router.get('/getEDRs', getEDRs);
router.get('/searchEdrPatient/:keyword', getEdrPatientByKeyword);
router.put('/addDoctorNotes', upload.single('file'), addDoctorNotes);
router.put('/updateDoctorNotes', upload.single('file'), updateDoctorNotes);
router.put('/addConsultationNote', upload.single('file'), addConsultationNote);
router.put(
  '/updateConsultationNote',
  upload.single('file'),
  updateConsultationNote
);
router.put(
  '/addAnesthesiologistNote',
  upload.single('file'),
  addAnesthesiologistNote
);
router.put(
  '/updateAnesthesiologistNote',
  upload.single('file'),
  updateAnesthesiologistNote
);
router.put('/addEDNurseRequest', upload.single('file'), addEDNurseRequest);
router.put(
  '/updateEDNurseRequest',
  upload.single('file'),
  updateEDNurseRequest
);
router.put('/addEOUNurseRequest', upload.single('file'), addEOUNurseRequest);
router.put(
  '/updateEOUNurseRequest',
  upload.single('file'),
  updateEOUNurseRequest
);
router.put(
  '/addNurseTechnicianRequest',
  upload.single('file'),
  addNurseTechnicianRequest
);
router.put(
  '/updateNurseTechnicianRequest',
  upload.single('file'),
  updateNurseTechnicianRequest
);
router.get('/getEdrsByPatient/:id', getEdrsByPatient);
router.get('/getEDRWihtConsultationNote/:id', getEDRwihtConsultationNote);
router.put('/addLabRequest', addLabRequest);
router.put('/addRadRequest', addRadRequest);
router.put('/updateLab', updateLab);
router.put('/updateRad', updateRad);
router.put('/updateEdr', updateEdr);
router.get(
  '/getEDRFromPatientForDischarge/:keyword',
  getEDRFromPatientForDischarge
);

router.get(
  '/getDischargedEDRFromPatient/:keyword',
  getDischargedEDRFromPatient
);

router.get('/getEDRFromPatientIdForDischarge/:_id', getEDRFromPatientIdForDischarge);
router.get('/getedripr/:_id', getEDRorIPR);


module.exports = router;
