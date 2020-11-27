const express = require('express');

const router = express.Router();
const {
  registerPatient,
  deletePatient,
  getPatient,
  updatePatient,
  getAllPatients,
  getPendingRegistration,
  getApprovedRegistration,
} = require('../controllers/patientController');

router.get('/pendingRegistration', getPendingRegistration);
router.get('/approvedRegistration', getApprovedRegistration);
router.route('/registerPatient').post(registerPatient).get(getAllPatients);
router
  .route('/:patientId')
  // .delete(deletePatient)
  .get(getPatient);
// .patch(updatePatient);

module.exports = router;
