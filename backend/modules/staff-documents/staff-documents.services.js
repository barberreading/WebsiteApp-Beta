const StaffDocument = require('../../models/StaffDocument');
const User = require('../../models/User.js');
const path = require('path');
const fs = require('fs');

const uploadStaffDocument = async (user, file, body) => {
  try {
    if (!user.role || !['manager', 'superuser', 'admin'].includes(user.role)) {
      return { success: false, statusCode: 403, message: 'Access denied. Manager role required.' };
    }

    const {
      staffId,
      documentType,
      title,
      issuedDate,
      expiryDate,
      reminderDate,
      isPublic,
      notes
    } = body;

    if (!staffId || !documentType || !title || !issuedDate) {
      return { success: false, statusCode: 400, message: 'Please provide all required fields' };
    }

    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return { success: false, statusCode: 404, message: 'Staff member not found' };
    }

    const newDocument = new StaffDocument({
      staff: staffId,
      documentType,
      title,
      filePath: file.path,
      fileType: file.mimetype,
      issuedDate,
      expiryDate: expiryDate || null,
      reminderDate: reminderDate || null,
      isPublic: isPublic === 'true',
      notes,
      uploadedBy: user.id
    });

    await newDocument.save();
    return { success: true, data: newDocument };
  } catch (err) {
    console.error(err);
    return { success: false, statusCode: 500, message: 'Server error', error: err.message };
  }
};

const getStaffDocuments = async (user, query) => {
  try {
    let dbQuery = {};

    if (user.role === 'staff') {
      dbQuery.staff = user.id;
    } 
    else if (['manager', 'superuser', 'admin'].includes(user.role) && query.staffId) {
      dbQuery.staff = query.staffId;
    }
    else if (['manager', 'superuser', 'admin'].includes(user.role)) {
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      const skip = (page - 1) * limit;

      const documents = await StaffDocument.find()
        .populate('staff', 'name email')
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await StaffDocument.countDocuments();

      return { 
        success: true, 
        data: {
          documents,
          pagination: {
            total,
            page,
            pages: Math.ceil(total / limit)
          }
        }
      };
    } else {
      return { success: false, statusCode: 403, message: 'Access denied' };
    }

    const documents = await StaffDocument.find(dbQuery)
      .populate('staff', 'name email')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    return { success: true, data: documents };
  } catch (err) {
    console.error(err);
    return { success: false, statusCode: 500, message: 'Server error', error: err.message };
  }
};

const getStaffDocumentById = async (user, documentId) => {
  try {
    const document = await StaffDocument.findById(documentId)
      .populate('staff', 'name email')
      .populate('uploadedBy', 'name');

    if (!document) {
      return { success: false, statusCode: 404, message: 'Document not found' };
    }

    if (
      user.role === 'staff' && 
      document.staff._id.toString() !== user.id &&
      !['manager', 'superuser', 'admin'].includes(user.role)
    ) {
      return { success: false, statusCode: 403, message: 'Access denied' };
    }

    return { success: true, data: document };
  } catch (err) {
    console.error(err);
    return { success: false, statusCode: 500, message: 'Server error', error: err.message };
  }
};

const downloadStaffDocument = async (user, documentId) => {
  try {
    const document = await StaffDocument.findById(documentId);

    if (!document) {
      return { success: false, statusCode: 404, message: 'Document not found' };
    }

    if (
      user.role === 'staff' && 
      document.staff.toString() !== user.id &&
      !['manager', 'superuser', 'admin'].includes(user.role)
    ) {
      return { success: false, statusCode: 403, message: 'Access denied' };
    }

    return { success: true, data: document };
  } catch (err) {
    console.error(err);
    return { success: false, statusCode: 500, message: 'Server error', error: err.message };
  }
};

const getPublicStaffDocument = async (accessKey) => {
  try {
    const document = await StaffDocument.findOne({ 
      accessKey: accessKey,
      isPublic: true
    }).populate('staff', 'name');

    if (!document) {
      return { success: false, statusCode: 404, message: 'Document not found or not public' };
    }

    return { 
      success: true, 
      data: {
        id: document._id,
        title: document.title,
        documentType: document.documentType,
        staffName: document.staff.name,
        issuedDate: document.issuedDate,
        expiryDate: document.expiryDate
      }
    };
  } catch (err) {
    console.error(err);
    return { success: false, statusCode: 500, message: 'Server error', error: err.message };
  }
};

const downloadPublicStaffDocument = async (accessKey) => {
  try {
    const document = await StaffDocument.findOne({ 
      accessKey: accessKey,
      isPublic: true
    });

    if (!document) {
      return { success: false, statusCode: 404, message: 'Document not found or not public' };
    }

    return { success: true, data: document };
  } catch (err) {
    console.error(err);
    return { success: false, statusCode: 500, message: 'Server error', error: err.message };
  }
};

const updateStaffDocument = async (user, documentId, body) => {
  try {
    if (!user.role || !['manager', 'superuser', 'admin'].includes(user.role)) {
      return { success: false, statusCode: 403, message: 'Access denied. Manager role required.' };
    }

    const {
      title,
      documentType,
      issuedDate,
      expiryDate,
      reminderDate,
      isPublic,
      notes
    } = body;

    const document = await StaffDocument.findById(documentId);
    if (!document) {
      return { success: false, statusCode: 404, message: 'Document not found' };
    }

    if (title) document.title = title;
    if (documentType) document.documentType = documentType;
    if (issuedDate) document.issuedDate = issuedDate;
    document.expiryDate = expiryDate || null;
    document.reminderDate = reminderDate || null;
    document.isPublic = isPublic === 'true' || isPublic === true;
    document.notes = notes || '';

    await document.save();
    return { success: true, data: document };
  } catch (err) {
    console.error(err);
    return { success: false, statusCode: 500, message: 'Server error', error: err.message };
  }
};

const deleteStaffDocument = async (user, documentId) => {
  try {
    if (!user.role || !['manager', 'superuser', 'admin'].includes(user.role)) {
      return { success: false, statusCode: 403, message: 'Access denied. Manager role required.' };
    }

    const document = await StaffDocument.findById(documentId);
    if (!document) {
      return { success: false, statusCode: 404, message: 'Document not found' };
    }

    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    await document.remove();
    return { success: true, data: { msg: 'Document deleted successfully' } };
  } catch (err) {
    console.error(err);
    return { success: false, statusCode: 500, message: 'Server error', error: err.message };
  }
};

module.exports = {
    uploadStaffDocument,
    getStaffDocuments,
    getStaffDocumentById,
    downloadStaffDocument,
    getPublicStaffDocument,
    downloadPublicStaffDocument,
    updateStaffDocument,
    deleteStaffDocument
};