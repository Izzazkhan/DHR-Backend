const express = require('express');
const {
  patientsInDept,
  getTransferReqED,
  getTransferReqEOU,
  getTransferReqEDForCC,
  getTransferReqEOUForCC,
  getTransferReqEDForRequester,
  getTransferReqEOUForRequester,
  getAllTransferReqForRequester,
  assignCC,
} = require('../controllers/patientTransferEDEOUController');

const router = express.Router();

router.get('/getPatientsInDept/:currentdept', patientsInDept);
router.get('/transferRequestED', getTransferReqED);
router.get('/transferRequestEOU', getTransferReqEOU);
router.get('/transferRequestEDForCC/:staffId', getTransferReqEDForCC);
router.get('/transferRequestEOUForCC/:staffId', getTransferReqEOUForCC);
router.get(
  '/transferRequestEDForRequester/:staffId',
  getTransferReqEDForRequester
);

router.get(
  '/transferRequestEOUForRequester/:staffId',
  getTransferReqEOUForRequester
);

router.get(
  '/getAllTransferRequestsForRequester/:staffId',
  getAllTransferReqForRequester
);

router.put('/assigncustomercare', assignCC);

module.exports = router;
