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
} = require('../controllers/labRequest');

const router = express.Router();

router.get('/getLabEdr', getPendingLabEdr);
router.get('/getCompletedLabEdr', getCompletedLabEdr);
router.put('/updateLabRequest', upload.array('file'), updateLabRequest);

module.exports = router;
