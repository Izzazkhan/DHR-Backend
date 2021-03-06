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
  searchPendingRadRequest,
  searchComletedRadRequest,
  assignHouseKeeper,
  getPendingRadEdrForED,
  getCompletedRadEdrForED
} = require('../controllers/radRequest');

const router = express.Router();

router.get('/getPendingRadEdr', getPendingRadEdr);
router.get('/getCompletedRadEdr', getCompletedRadEdr);
router.get('/searchPendingRadRequest/:keyword', searchPendingRadRequest);
router.get('/searchComletedRadRequest/:keyword', searchComletedRadRequest);
router.put('/updateRadRequest', upload.any(), updateRadRequest);
router.post('/assignHouseKeeper', assignHouseKeeper);
router.get('/getPendingRadEdrForED', getPendingRadEdrForED);
router.get('/getCompletedRadEdrForED', getCompletedRadEdrForED);

module.exports = router;
