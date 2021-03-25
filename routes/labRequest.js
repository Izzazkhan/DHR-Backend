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
  getPendingLabEdr,
  getCompletedLabEdr,
  updateLabRequest,
  searchPendingLabRequest,
  searchComletedLabRequest,
} = require('../controllers/labRequest');

const router = express.Router();

router.get('/getPendingLabEdr/:labTechnicianId', getPendingLabEdr);
router.get('/getCompletedLabEdr/:labTechnicianId', getCompletedLabEdr);
router.get('/searchPendingLabRequest/:keyword', searchPendingLabRequest);
router.get('/searchComletedLabRequest/:keyword', searchComletedLabRequest);
router.put('/updateLabRequest', upload.any(), updateLabRequest);

module.exports = router;
