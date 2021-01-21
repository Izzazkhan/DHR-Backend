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
  getAllPendingAnesthesiaRequests,
  getAllCompletedAnesthesiaRequests,

  addPharmcayRequest,
  updatePharmcayRequest,
  completeAnesthesiaRequest,
} = require('../controllers/anesthesiaRequestController');

const router = express.Router();

router.get(
  '/getAllPendingAnesthesiaRequests/:id',
  getAllPendingAnesthesiaRequests
);
router.get(
  '/getAllCompletedAnesthesiaRequests/:id',
  getAllCompletedAnesthesiaRequests
);
router.put('/completeAnesthesiaRequest', completeAnesthesiaRequest);

router.put('/addPharmacyRequest', addPharmcayRequest);
router.put('/updatePharmacyRequest', updatePharmcayRequest);

module.exports = router;
