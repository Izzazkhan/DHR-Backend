const express = require('express');

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
  assignProductionArea,
  getCCandPAByKeyword,
  getAvailablePA,
  getAvailablePAwithCC,
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
router.put('/assignCCtoPA', assignProductionArea);
router.get('/searchCCandPA/:keyword', getCCandPAByKeyword);
router.get('/getAvailablePA', getAvailablePA);
router.get('getAvailablePAwithCC', getAvailablePAwithCC);

module.exports = router;
