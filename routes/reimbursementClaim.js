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
  getClaims,
  getClaimsKeyword,
  getPatient,
  getPatientInsurance,
  getPatientDischarged,
  getEDRorIPR,
  addClaims,
  updateClaims,
  getPatientHistoryAll,
} = require('../controllers/reimbursementClaim');

const router = express.Router();
router.get('/getclaim', getClaims);
router.get('/getclaim/:keyword', getClaimsKeyword);
router.get('/getpatient/:keyword', getPatient);
router.get('/getpatientinsurance/:keyword', getPatientInsurance);
router.get('/getpatientdischarge/:keyword', getPatientDischarged);
router.get('/getpatienthistory/:keyword', getPatientHistoryAll);
router.get('/getedripr/:_id', getEDRorIPR);
router.post('/addclaim', upload.array('file'), addClaims);
router.put('/updateclaim', upload.array('file'), updateClaims);

module.exports = router;
