const fs = require('fs');
const path = require('path');

// Path to the user guide HTML file
const userGuidePath = path.join(__dirname, '../../../frontend/public/user_guide.html');

// Get user guide content
exports.getUserGuide = async () => {
  try {
    // Read the user guide file
    const content = fs.readFileSync(userGuidePath, 'utf8');
    return content;
  } catch (err) {
    logger.error(err.message);
    throw new Error('Server Error');
  }
};

// Update user guide content
exports.updateUserGuide = async (content) => {
  try {
    // Create a backup of the current file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupPath = path.join(
      __dirname, 
      `../../../frontend/public/user_guide_backup_${timestamp}.html`
    );
    
    // Read current content and create backup
    const currentContent = fs.readFileSync(userGuidePath, 'utf8');
    fs.writeFileSync(backupPath, currentContent);

    // Write the new content
    fs.writeFileSync(userGuidePath, content);
  } catch (err) {
    logger.error(err.message);
    throw new Error('Server Error');
  }
};