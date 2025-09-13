const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { protect, authorize } = require('../../middleware/auth');
const { validateObjectId } = require('../../middleware/validation');
const { getTemplates, uploadClients, uploadUsers } = require('./bulk-import.controllers');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB limit
  }
});

router.route('/templates/:type').get(protect, validateObjectId('type'), getTemplates);
router.route('/clients').post(protect, authorize(['manager', 'superuser']), upload.single('file'), uploadClients);
router.route('/users').post(protect, authorize(['superuser']), upload.single('file'), uploadUsers);

module.exports = router;