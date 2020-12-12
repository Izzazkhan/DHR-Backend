const express = require('express');

const router = express.Router();

const {
  addChiefComplaint,
  getAllchiefComplaints,
  getChiefComplaintByKeyword,
  disaleChiefComplaint,
  enableChiefComplaint,
  getDoctorsWithCC,
} = require('../controllers/chiefComplaintController');

router.post('/addChiefComplaint', addChiefComplaint);
router.get('/getAllChiefComplaints', getAllchiefComplaints);
router.get('/getChiefComplaintByKeyword/:keyword', getChiefComplaintByKeyword);
router.put('/disableChiefComplaint/:id', disaleChiefComplaint);
router.put('/enableChiefComplaint/:id', enableChiefComplaint);
router.get('/getDoctorsWithCC', getDoctorsWithCC);

module.exports = router;
