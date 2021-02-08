const express = require('express');
const {
  getPatientClearance,
  getPatientClearanceById,
  addPatientClearance,
  updatePatientClearance,
  getClearedPatients,
  searchClearedPatients
} = require('../controllers/patientClearance');

const router = express.Router();
router.get('/getpatientclearance', getPatientClearance);
router.get('/getClearedPatients', getClearedPatients);
router.get('/searchClearedPatients/:keyword', searchClearedPatients);
router.get('/getpatientclearance/:id', getPatientClearanceById);
router.post('/addpatientclearance', addPatientClearance);
router.put('/updatepatientclearance', updatePatientClearance);
module.exports = router;
