const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');

// Different sample avatars for the original three staff members
// These will be more distinctive to replace the generic ones
const originalStaffPhotos = {
  'Andrew Barber': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzJENzJEOTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMxNTU5QkQ7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9InVybCgjZ3JhZDEpIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSIzNSIgcj0iMTgiIGZpbGw9IiNmZmYiLz48ZWxsaXBzZSBjeD0iNTAiIGN5PSI4MCIgcng9IjMwIiByeT0iMjUiIGZpbGw9IiNmZmYiLz48dGV4dCB4PSI1MCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5BQjwvdGV4dD48L3N2Zz4=',
  'Sarah Johnson': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMiIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0VDNDA3QTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNEOTI2NkU7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9InVybCgjZ3JhZDIpIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSIzNSIgcj0iMTgiIGZpbGw9IiNmZmYiLz48ZWxsaXBzZSBjeD0iNTAiIGN5PSI4MCIgcng9IjMwIiByeT0iMjUiIGZpbGw9IiNmZmYiLz48dGV4dCB4PSI1MCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TSjwvdGV4dD48L3N2Zz4=',
  'Michael Smith': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJncmFkMyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzEwQjk4MTtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwNTk2NjI7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNTAiIGZpbGw9InVybCgjZ3JhZDMpIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSIzNSIgcj0iMTgiIGZpbGw9IiNmZmYiLz48ZWxsaXBzZSBjeD0iNTAiIGN5PSI4MCIgcng9IjMwIiByeT0iMjUiIGZpbGw9IiNmZmYiLz48dGV4dCB4PSI1MCIgeT0iOTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSIjZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NUzwvdGV4dD48L3N2Zz4='
};

const restoreOriginalPhotos = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Update the original three staff members with distinctive photos
    for (const [name, photo] of Object.entries(originalStaffPhotos)) {
      const result = await User.findOneAndUpdate(
        { name: name },
        { $set: { photo: photo } },
        { new: true }
      );
      
      if (result) {
        console.log(`Updated photo for ${name}`);
      } else {
        console.log(`User ${name} not found`);
      }
    }
    
    console.log('\nOriginal staff photos have been restored with distinctive avatars.');
    console.log('Note: These are new distinctive avatars since the original photos were overwritten.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('Error restoring original photos:', error);
    process.exit(1);
  }
};

restoreOriginalPhotos();