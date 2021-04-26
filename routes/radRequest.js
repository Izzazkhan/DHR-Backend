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
  searchCompletedRadRequest,
  assignHouseKeeper,
  getPendingRadEdrForED,
  getCompletedRadEdrForED,
  searchCompletedRadEdr,
} = require('../controllers/radRequest');

const router = express.Router();

router.get('/getPendingRadEdr/:radTechnicianId', getPendingRadEdr);
router.get('/getCompletedRadEdr/:radTechnicianId', getCompletedRadEdr);
router.get('/searchPendingRadRequest/:keyword', searchPendingRadRequest);
router.get('/searchComletedRadRequest/:keyword', searchCompletedRadRequest);
router.put('/updateRadRequest', upload.any(), updateRadRequest);
router.post('/assignHouseKeeper', assignHouseKeeper);
router.get('/getPendingRadEdrForED/:radTechnicianId', getPendingRadEdrForED);
router.get(
  '/getCompletedRadEdrForED/:radTechnicianId',
  getCompletedRadEdrForED
);
router.get('/searchCompletedRadEdr/:radId', searchCompletedRadEdr);

module.exports = router;
