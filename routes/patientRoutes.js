const express = require('express');

const router = express.Router();
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
router.route('/registerPatient').post(registerPatient).get(getAllPatients);
router.get('/searchPatient/:keyword', getPatientByKeyword);
// router.get('/getPatientByName/:name', getPatientByName);
router
  .route('/:patientId')
  // .delete(deletePatient)
  .get(getPatient);
// .patch(updatePatient);

module.exports = router;
