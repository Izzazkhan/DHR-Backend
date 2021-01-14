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
  getPendingRadEdr,
  getCompletedRadEdr,
  updateRadRequest,
} = require('../controllers/radRequest');

const router = express.Router();

router.get('/getPendingRadEdr', getPendingRadEdr);
router.get('/getCompletedRadEdr', getCompletedRadEdr);
router.put('/updateRadRequest', upload.array('file'), updateRadRequest);

module.exports = router;
