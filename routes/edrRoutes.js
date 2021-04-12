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
  getPendingEDRs,
  getEdrPatientByKeyword,
  getPendingEdrByKeyword,
  getEdrsByPatient,
  addDoctorNotes,
  updateDoctorNotes,
  addLabRequest,
  updateLab,
  addConsultationNote,
  updateConsultationNote,
  completeConsultationNote,
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
  getDischargedEDR,
  getCompletedEDR,
  getSenseiPendingEDRs,

  getAllPendingLabRequests,
  getAllPendingRadRequests,
  getAllCompletedLabRequests,
  getAllCompletedRadRequests,

  addPharmacyRequest,
  updatePharmcayRequest,
  deliverPharmcayRequest,

  getEDRsWithPharmacyRequest,
  getSenseiPendingEdrByKeyword,
  getNurseEdrByKeyword,
  getAllEDRByKeyword,
  getAllDeliverInProgessPharmaRequest,

  pendingDoctorNotes,
  inprogressDoctorNotes,
  completedDoctorNotes,

  getPendingDcd,
  updatedDcdFormStatus,

  searchAllEdrs,
} = require('../controllers/edrController');

const router = express.Router();

router.post('/generateEDR', generateEDR);
router.get('/getPendingDcd', getPendingDcd);
router.put('/updatedDcdFormStatus', updatedDcdFormStatus);
router.get('/getSingleEdr/:id', getEDRById);
router.get('/getEDRs', getEDRs);
router.get('/getPendingEDRs', getPendingEDRs);
router.get('/getSenseiPendingEDRs', getSenseiPendingEDRs);
router.get('/searchEdrPatient/:keyword', getEdrPatientByKeyword);
router.get('/searchAllEdrs/:keyword', searchAllEdrs);
router.get('/searchPendingSenseiEdr/:keyword', getSenseiPendingEdrByKeyword);
router.get('/searchPendingEdr/:keyword', getPendingEdrByKeyword);
router.put('/addDoctorNotes', upload.single('file'), addDoctorNotes);
router.put('/updateDoctorNotes', upload.single('file'), updateDoctorNotes);
router.put('/addConsultationNote', upload.single('file'), addConsultationNote);
router.put(
  '/updateConsultationNote',
  upload.single('file'),
  updateConsultationNote
);

router.put(
  '/completeConsultationNote',
  upload.single('file'),
  completeConsultationNote
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

router.get('/getNurseEdrByKeyword/:keyword', getNurseEdrByKeyword);
router.get('/getAllEDRByKeyword/:keyword', getAllEDRByKeyword);

router.get(
  '/getEDRFromPatientIdForDischarge/:_id',
  getEDRFromPatientIdForDischarge
);
router.get('/getDischargedEDR', getDischargedEDR);
router.get('/getCompletedEDR', getCompletedEDR);
router.get('/getedripr/:_id', getEDRorIPR);

router.get('/getAllPendingRadRequests', getAllPendingRadRequests);
router.get('/getAllCompletedRadRequests', getAllCompletedRadRequests);

router.get('/getAllPendingLabRequests', getAllPendingLabRequests);
router.get('/getAllCompletedLabRequests', getAllCompletedLabRequests);

router.put('/addPharmacyRequest', addPharmacyRequest);
router.put('/updatePharmacyRequest', updatePharmcayRequest);
router.put('/deliverPharmcayRequest', deliverPharmcayRequest);
router.get(
  '/getAllDeliverInProgessPharmaRequest/:requestType',
  getAllDeliverInProgessPharmaRequest
);

router.get(
  '/getEDRsWithPharmacyRequest/:requestType',
  getEDRsWithPharmacyRequest
);

router.get('/pendingDoctorNotes', pendingDoctorNotes);
router.get('/inprogressDoctorNotes', inprogressDoctorNotes);
router.get('/completedDoctorNotes', completedDoctorNotes);

module.exports = router;
