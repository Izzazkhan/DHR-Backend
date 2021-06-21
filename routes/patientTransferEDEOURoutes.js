const express = require('express');
const {
  patientsInDept,
  getPendingTransferReqED,
  getCompletedTransferReqED,
  getTransferReqEOU,
  getTransferReqEDForCC,
  getTransferReqEOUForCC,
  getTransferReqEDForRequester,
  getTransferReqEOUForRequester,
  getAllTransferReqForRequester,
  assignCC,
  addTransferRequest,
  getAllCustomerCares,
} = require('../controllers/patientTransferEDEOUController');

const router = express.Router();

router.get('/getPatientsInDept/:currentdept/:staffId', patientsInDept);
router.get('/getPendingTransferReqED', getPendingTransferReqED);
router.get('/getCompletedTransferReqED', getCompletedTransferReqED);
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
router.put('/addTransferRequest', addTransferRequest);
router.get('/getAllCustomerCares/:staffId', getAllCustomerCares);

module.exports = router;
