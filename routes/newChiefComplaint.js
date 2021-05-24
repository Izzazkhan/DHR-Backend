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
  getAllChiefComplaints,
  disableChiefComplaint,
  enableChiefComplaint,
  assignCCtoPatient,
} = require('../controllers/newChiefComplaint');

router.post('/addChiefComplaint', addChiefComplaint);
router.get('/getAllChiefComplaints', getAllChiefComplaints);
router.put('/disableChiefComplaint/:id', disableChiefComplaint);
router.put('/enableChiefComplaint/:id', enableChiefComplaint);
router.put('/assignCCtoPatient', upload.single('file'), assignCCtoPatient);
module.exports = router;
