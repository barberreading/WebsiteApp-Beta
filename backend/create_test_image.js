const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Create a test timesheet image for OCR testing
 */
function createTestTimesheetImage() {
  logger.log('Creating test timesheet image...');
  
  // Create canvas
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 800, 600);
  
  // Black text
  ctx.fillStyle = 'black';
  ctx.font = '24px Arial';
  
  // Timesheet header
  ctx.fillText('EMPLOYEE TIMESHEET', 250, 50);
  
  // Employee info
  ctx.font = '18px Arial';
  ctx.fillText('Employee: John Smith', 50, 100);
  ctx.fillText('Employee ID: 12345', 50, 130);
  ctx.fillText('Week Ending: 12/15/2023', 50, 160);
  
  // Table headers
  ctx.font = '16px Arial';
  ctx.fillText('Date', 50, 220);
  ctx.fillText('Clock In', 150, 220);
  ctx.fillText('Clock Out', 250, 220);
  ctx.fillText('Break', 350, 220);
  ctx.fillText('Total Hours', 450, 220);
  
  // Sample timesheet data
  const timesheetData = [
    ['12/11/2023', '08:00 AM', '05:00 PM', '1.0', '8.0'],
    ['12/12/2023', '08:15 AM', '05:15 PM', '1.0', '8.0'],
    ['12/13/2023', '08:00 AM', '04:30 PM', '0.5', '8.0'],
    ['12/14/2023', '08:30 AM', '05:30 PM', '1.0', '8.0'],
    ['12/15/2023', '08:00 AM', '04:00 PM', '1.0', '7.0']
  ];
  
  ctx.font = '14px Arial';
  timesheetData.forEach((row, index) => {
    const y = 250 + (index * 30);
    ctx.fillText(row[0], 50, y);   // Date
    ctx.fillText(row[1], 150, y);  // Clock In
    ctx.fillText(row[2], 250, y);  // Clock Out
    ctx.fillText(row[3], 370, y);  // Break
    ctx.fillText(row[4], 470, y);  // Total Hours
  });
  
  // Total line
  ctx.font = '16px Arial';
  ctx.fillText('Total Hours: 39.0', 350, 420);
  
  // Signature line
  ctx.fillText('Employee Signature: ________________', 50, 480);
  ctx.fillText('Date: ________________', 50, 510);
  
  // Create test_images directory if it doesn't exist
  const testImagesDir = path.join(__dirname, 'test_images');
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
  }
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  const imagePath = path.join(testImagesDir, 'sample.png');
  fs.writeFileSync(imagePath, buffer);
  
  logger.log(`✓ Test timesheet image created: ${imagePath}`);
  return imagePath;
}

// Create the test image
try {
  const imagePath = createTestTimesheetImage();
  logger.log('Test image ready for OCR testing!');
} catch (error) {
  logger.error('Error creating test image:', error.message);
  logger.log('Note: canvas package may not be installed. Installing...');
  
  // Try to install canvas if not available
  const { execSync } = require('child_process');
  try {
    execSync('npm install canvas', { stdio: 'inherit' });
    logger.log('Canvas installed. Please run this script again.');
  } catch (installError) {
    logger.error('Failed to install canvas:', installError.message);
    logger.log('You can manually install it with: npm install canvas');
  }
}