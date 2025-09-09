import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { addDays, isAfter, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const LeaveRequestForm = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const oneWeekFromNow = addDays(new Date(), 7);
  
  const [formData, setFormData] = useState({
    startDate: oneWeekFromNow,
    endDate: addDays(oneWeekFromNow, 1),
    reason: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleDateChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const validateDates = () => {
    // Check if start date is at least one week in the future
    if (isBefore(formData.startDate, oneWeekFromNow)) {
      setError('Start date must be at least one week from today');
      return false;
    }
    
    // Check if end date is after start date
    if (isBefore(formData.endDate, formData.startDate)) {
      setError('End date must be after start date');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDates()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Format dates properly for backend
      const submitData = {
        ...formData,
        startDate: formData.startDate ? formData.startDate.toISOString() : null,
        endDate: formData.endDate ? formData.endDate.toISOString() : null
      };
      
      await axiosInstance.post('/leave-requests', submitData);
      
      setSuccess(true);
      // Reset form
      setFormData({
        startDate: oneWeekFromNow,
        endDate: addDays(oneWeekFromNow, 1),
        reason: ''
      });
      
      // Navigate back to leave requests list after a short delay
      setTimeout(() => {
        navigate('/leave-requests');
      }, 2000);
    } catch (err) {
      console.error('Error submitting leave request:', err);
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(false);
  };
  
  // Only staff can submit leave requests
  if (!currentUser || currentUser.role !== 'staff') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          Leave requests can only be submitted by staff members.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Submit Leave Request
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Please submit leave requests at least one week in advance.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(newValue) => handleDateChange('startDate', newValue)}
                  minDate={oneWeekFromNow}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      required: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(newValue) => handleDateChange('endDate', newValue)}
                  minDate={formData.startDate}
                  format="dd/MM/yyyy"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: "normal",
                      required: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Leave"
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                multiline
                rows={4}
                margin="normal"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mr: 2 }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Submit Request'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => window.history.back()}
                >
                  Cancel
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          Leave request submitted successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveRequestForm;