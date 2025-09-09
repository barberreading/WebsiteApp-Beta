const fs = require('fs');
const path = require('path');

// Path to the logs directory
const logsDir = path.join(__dirname, 'logs');
const applicationErrorsLog = path.join(logsDir, 'application-errors.log');

// Clear the application-errors.log file
try {
  // Check if file exists
  if (fs.existsSync(applicationErrorsLog)) {
    // Empty the file by writing an empty string to it
    fs.writeFileSync(applicationErrorsLog, '');
    console.log('Successfully cleared application-errors.log');
  } else {
    console.log('Log file does not exist, nothing to clear');
  }
} catch (err) {
  console.error('Error clearing logs:', err);
}