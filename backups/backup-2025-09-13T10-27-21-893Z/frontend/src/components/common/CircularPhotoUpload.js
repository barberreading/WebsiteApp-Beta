import React, { useState, useRef } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { Button, Box, Avatar, Typography, CircularProgress } from '@mui/material';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';

const CircularPhotoUpload = ({ currentPhoto, onPhotoUpdate, size = 150 }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match('image.*')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const photoData = reader.result;
        
        // Send to server
        const response = await axiosInstance.post('/users/upload-photo', { photoData });
        
        // Update parent component
        onPhotoUpdate(response.data.photo);
        setLoading(false);
      };
      reader.onerror = () => {
        setError('Error reading file');
        setLoading(false);
      };
    } catch (err) {
      console.error('Upload error:', err);
      setError('Error uploading photo');
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #f0f0f0',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.9,
            '& .upload-icon': {
              opacity: 1
            }
          }
        }}
        onClick={handleClick}
      >
        <Avatar
          src={currentPhoto || '/static/default-avatar.png'}
          alt="Profile Photo"
          sx={{ width: '100%', height: '100%' }}
        />
        <Box
          className="upload-icon"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: 0,
            transition: 'opacity 0.3s'
          }}
        >
          <AddAPhotoIcon sx={{ color: 'white', fontSize: 40 }} />
        </Box>
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.7)'
            }}
          >
            <CircularProgress />
          </Box>
        )}
      </Box>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <Button 
        variant="outlined" 
        onClick={handleClick}
        disabled={loading}
      >
        {currentPhoto ? 'Change Photo' : 'Upload Photo'}
      </Button>
      
      {error && (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default CircularPhotoUpload;