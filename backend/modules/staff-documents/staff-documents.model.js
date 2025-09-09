const mongoose = require('mongoose');

const staffDocumentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    fileName: {
        type: String,
        required: true,
    },
    filePath: {
        type: String,
        required: true,
    },
    fileType: {
        type: String,
        required: true,
    },
    fileSize: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
    },
    isPublic: {
        type: Boolean,
        default: false,
    },
    uploadDate: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.models.StaffDocument || mongoose.model('StaffDocument', staffDocumentSchema);