const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const staffDocumentsController = require('./staff-documents.controllers');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/staff-documents/');
  },
  filename: (req, file, cb) => {
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

router.post('/', auth.protect, upload.single('file'), staffDocumentsController.uploadStaffDocument);
router.get('/', auth.protect, staffDocumentsController.getStaffDocuments);
router.get('/:id', auth.protect, staffDocumentsController.getStaffDocumentById);
router.get('/:id/download', auth.protect, staffDocumentsController.downloadStaffDocument);
router.get('/:accessKey/public', staffDocumentsController.getPublicStaffDocument);
router.get('/:accessKey/public/download', staffDocumentsController.downloadPublicStaffDocument);
router.put('/:id', auth.protect, staffDocumentsController.updateStaffDocument);
router.delete('/:id', auth.protect, staffDocumentsController.deleteStaffDocument);

module.exports = router;