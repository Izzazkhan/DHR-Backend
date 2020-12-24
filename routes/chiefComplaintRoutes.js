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
  addChiefComplaint,
  getAllchiefComplaints,
  getChiefComplaintByKeyword,
  disaleChiefComplaint,
  enableChiefComplaint,
  getDoctorsWithCC,
  filterChiefCompaints,
  assignCC,
  getCCDoctorByKeyword,
  assignProductionAreaToCC,
  getCCandPAByKeyword,
  getAvailablePA,
  getAvailablePAwithCC,
  assignCCtoPatient,
  getPAsByCCs,
} = require('../controllers/chiefComplaintController');

router.post('/addChiefComplaint', addChiefComplaint);
router.get('/getAllChiefComplaints', getAllchiefComplaints);
router.get('/getChiefComplaintByKeyword/:keyword', getChiefComplaintByKeyword);
router.put('/disableChiefComplaint/:id', disaleChiefComplaint);
router.put('/enableChiefComplaint/:id', enableChiefComplaint);
router.get('/getDoctorsWithCC', getDoctorsWithCC);
router.post('/filterChiefComplaints', filterChiefCompaints);
router.put('/assignCC', assignCC);
router.get('/getCCDoctorByKeyword/:keyword', getCCDoctorByKeyword);
router.put('/assignPAtoCC', assignProductionAreaToCC);
router.get('/searchCCandPA/:keyword', getCCandPAByKeyword);
router.get('/getAvailablePA', getAvailablePA);
router.get('/getAvailablePAwithCC', getAvailablePAwithCC);
router.put('/assignCCtoPatient', upload.single('file'), assignCCtoPatient);
router.get('/getPAsByCCs/:id', getPAsByCCs);
module.exports = router;
