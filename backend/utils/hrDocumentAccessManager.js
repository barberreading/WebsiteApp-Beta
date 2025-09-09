const HRDocumentAccess = require('../models/HRDocumentAccess');
const GlobalPermissions = require('../models/GlobalPermissions');

/**
 * Create HR document access for a booking
 * @param {Object} booking - The booking object
 * @returns {Promise<Object>} - The created HR document access or null
 */
const createHRDocumentAccess = async (booking) => {
  try {
    // Get global HR document access settings
    const globalPermissions = await GlobalPermissions.findOne();
    const hrSettings = globalPermissions?.hrDocumentAccess;
    
    // Check if temporary access is enabled
    if (!hrSettings?.enableTemporaryAccess) {
      return null;
    }
    
    // Calculate access window
    const accessWindowHours = hrSettings.accessWindowHours || 48;
    const accessDurationHours = hrSettings.accessDurationHours || 48;
    
    const shiftStartTime = new Date(booking.startTime);
    const shiftEndTime = new Date(booking.endTime);
    
    // Access starts X hours before shift
    const accessStartTime = new Date(shiftStartTime.getTime() - (accessWindowHours * 60 * 60 * 1000));
    
    // Access ends X hours after shift
    const accessEndTime = new Date(shiftEndTime.getTime() + (accessDurationHours * 60 * 60 * 1000));
    
    // Check if overlapping access is allowed and if there are existing access records
    if (hrSettings.allowOverlappingAccess !== false) {
      const existingAccess = await HRDocumentAccess.findActiveAccessForClient(booking.client);
      
      if (existingAccess) {
        // Extend existing access window if needed
        const updatedStartTime = new Date(Math.min(existingAccess.accessStartTime.getTime(), accessStartTime.getTime()));
        const updatedEndTime = new Date(Math.max(existingAccess.accessEndTime.getTime(), accessEndTime.getTime()));
        
        existingAccess.accessStartTime = updatedStartTime;
        existingAccess.accessEndTime = updatedEndTime;
        existingAccess.shiftEndTime = new Date(Math.max(existingAccess.shiftEndTime.getTime(), shiftEndTime.getTime()));
        
        // Add this booking's documents to accessible documents if not already included
        const documentTypes = hrSettings.documentTypes || ['contract', 'handbook', 'policies', 'procedures', 'training', 'safety'];
        const uniqueDocuments = [...new Set([...existingAccess.accessibleDocuments, ...documentTypes])];
        existingAccess.accessibleDocuments = uniqueDocuments;
        
        await existingAccess.save();
        return existingAccess;
      }
    }
    
    // Create new HR document access
    const documentTypes = hrSettings.documentTypes || ['contract', 'handbook', 'policies', 'procedures', 'training', 'safety'];
    
    const hrDocumentAccess = new HRDocumentAccess({
      clientId: booking.client,
      bookingId: booking._id,
      staffId: booking.staff,
      accessStartTime,
      accessEndTime,
      shiftStartTime,
      shiftEndTime,
      accessibleDocuments: documentTypes,
      isActive: true,
      createdBy: booking.createdBy
    });
    
    await hrDocumentAccess.save();
    return hrDocumentAccess;
    
  } catch (error) {
    console.error('Error creating HR document access:', error);
    throw error;
  }
};

/**
 * Update HR document access when a booking is modified
 * @param {Object} booking - The updated booking object
 * @param {Object} originalBooking - The original booking object
 * @returns {Promise<Object>} - The updated HR document access or null
 */
const updateHRDocumentAccess = async (booking, originalBooking) => {
  try {
    // Find existing HR document access for this booking
    const existingAccess = await HRDocumentAccess.findOne({ bookingId: booking._id });
    
    if (!existingAccess) {
      // If no existing access, create new one
      return await createHRDocumentAccess(booking);
    }
    
    // Get global HR document access settings
    const globalPermissions = await GlobalPermissions.findOne();
    const hrSettings = globalPermissions?.hrDocumentAccess;
    
    if (!hrSettings?.enableTemporaryAccess) {
      // If temporary access is disabled, deactivate existing access
      existingAccess.isActive = false;
      await existingAccess.save();
      return existingAccess;
    }
    
    // Recalculate access window
    const accessWindowHours = hrSettings.accessWindowHours || 48;
    const accessDurationHours = hrSettings.accessDurationHours || 48;
    
    const shiftStartTime = new Date(booking.startTime);
    const shiftEndTime = new Date(booking.endTime);
    
    const accessStartTime = new Date(shiftStartTime.getTime() - (accessWindowHours * 60 * 60 * 1000));
    const accessEndTime = new Date(shiftEndTime.getTime() + (accessDurationHours * 60 * 60 * 1000));
    
    // Update existing access
    existingAccess.accessStartTime = accessStartTime;
    existingAccess.accessEndTime = accessEndTime;
    existingAccess.shiftStartTime = shiftStartTime;
    existingAccess.shiftEndTime = shiftEndTime;
    existingAccess.staffId = booking.staff;
    
    // Update document types
    const documentTypes = hrSettings.documentTypes || ['contract', 'handbook', 'policies', 'procedures', 'training', 'safety'];
    existingAccess.accessibleDocuments = documentTypes;
    
    await existingAccess.save();
    return existingAccess;
    
  } catch (error) {
    console.error('Error updating HR document access:', error);
    throw error;
  }
};

/**
 * Revoke HR document access when a booking is cancelled
 * @param {String} bookingId - The booking ID
 * @returns {Promise<Boolean>} - Success status
 */
const revokeHRDocumentAccess = async (bookingId) => {
  try {
    const hrDocumentAccess = await HRDocumentAccess.findOne({ bookingId });
    
    if (hrDocumentAccess) {
      hrDocumentAccess.isActive = false;
      await hrDocumentAccess.save();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error revoking HR document access:', error);
    throw error;
  }
};

/**
 * Clean up expired HR document access records
 * @returns {Promise<Number>} - Number of cleaned up records
 */
const cleanupExpiredAccess = async () => {
  try {
    const now = new Date();
    
    const result = await HRDocumentAccess.updateMany(
      {
        accessEndTime: { $lt: now },
        isActive: true
      },
      {
        isActive: false
      }
    );
    
    return result.modifiedCount;
  } catch (error) {
    console.error('Error cleaning up expired HR document access:', error);
    throw error;
  }
};

module.exports = {
  createHRDocumentAccess,
  updateHRDocumentAccess,
  revokeHRDocumentAccess,
  cleanupExpiredAccess
};