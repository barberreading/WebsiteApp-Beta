import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  OutlinedInput
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import Placeholder from '../common/Placeholder';

const BookingAlertForm = () => {
  console.log('BookingAlertForm component rendered');
  const { currentUser } = useAuth();
  console.log('Current user in BookingAlertForm:', currentUser);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [bookingKeys, setBookingKeys] = useState([]);
  const [locationAreas, setLocationAreas] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const isSubmittingRef = useRef(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // 1 hour from now
    service: '',
    client: '',
    bookingKey: '',
    locationArea: '',
    // Multi-day support
    isMultiDay: false,
    bookingDays: [],
    // Targeting options
    sendToAll: false,
    selectedLocationAreas: [],
    // Notification options
    sendAsNotification: true,
    sendAsEmail: false
  });
  
  const steps = ['Basic Alert Details', 'Targeting & Notification Options'];
  
  useEffect(() => {
    let isMounted = true;
    console.log('BookingAlertForm useEffect running, currentUser:', currentUser);
    
    const fetchData = async () => {
      console.log('Starting data fetch...');
      
      try {
        // Fetch services
        const servicesRes = await axiosInstance.get('/services?active=true');
        console.log('Services response:', servicesRes.data);
        if (isMounted) setServices(servicesRes.data);
        
        // Fetch clients
        const clientsRes = await axiosInstance.get('/clients');
        console.log('Clients response:', clientsRes.data);
        if (isMounted) setClients(clientsRes.data);
        
        // Fetch booking keys
        const keysRes = await axiosInstance.get('/booking-categories/keys');
        console.log('Booking keys response:', keysRes.data);
        if (isMounted) setBookingKeys(keysRes.data.data || keysRes.data);
        
        // Fetch location areas
        const areasRes = await axiosInstance.get('/booking-categories/areas');
        console.log('Location areas response:', areasRes.data);
        if (isMounted) setLocationAreas(areasRes.data.data || areasRes.data);
        
        // Fetch templates
        const templatesRes = await axiosInstance.get('/booking-alert-templates');
        console.log('Templates response:', templatesRes.data);
        if (isMounted) setTemplates(templatesRes.data.data || templatesRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (isMounted) setError('Failed to load form data. Please try again.');
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
    } else if (name.includes('location.')) {
      const locationField = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleLocationAreaChange = (event) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      selectedLocationAreas: typeof value === 'string' ? value.split(',') : value
    });
  };
  
  const handleTemplateChange = (event) => {
    const templateId = event.target.value;
    setSelectedTemplate(templateId);
    
    if (templateId) {
      const template = templates.find(t => t._id === templateId);
      if (template) {
        setFormData({
          ...formData,
          title: template.title,
          description: template.alertDescription || '',
          service: template.service._id,
          locationArea: template.locationArea || '',
          sendToAll: template.sendToAll,
          selectedLocationAreas: template.selectedLocationAreas || [],
          sendAsNotification: template.sendAsNotification,
          sendAsEmail: template.sendAsEmail
        });
      }
    }
  };
  
  const handleNext = (e) => {
    e.preventDefault();
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = (e) => {
    e.preventDefault();
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const handleReset = () => {
    setActiveStep(0);
  };
  
  const handleDateChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const addBookingDay = () => {
    const newDay = {
      startTime: new Date(),
      endTime: new Date(new Date().getTime() + 60 * 60 * 1000) // 1 hour from now
    };
    setFormData({
      ...formData,
      bookingDays: [...formData.bookingDays, newDay]
    });
  };

  const removeBookingDay = (index) => {
    const updatedDays = formData.bookingDays.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      bookingDays: updatedDays
    });
  };

  const handleBookingDayChange = (index, field, value) => {
    const updatedDays = [...formData.bookingDays];
    updatedDays[index][field] = value;
    setFormData({
      ...formData,
      bookingDays: updatedDays
    });
  };

  const toggleMultiDay = (checked) => {
    setFormData({
      ...formData,
      isMultiDay: checked,
      bookingDays: checked ? [{
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000)
      }] : []
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current || loading) {
      console.log('Duplicate submission prevented');
      return;
    }
    
    console.log('Starting booking alert submission');
    isSubmittingRef.current = true;
    setLoading(true);
    setError('');
    setSuccess(false);
    
    // Preserve authentication state during submission
    const preservedAuthState = {
      token: localStorage.getItem('token'),
      user: currentUser,
      timestamp: Date.now()
    };
    
    console.log('🔒 Preserving auth state for booking alert submission:', {
      hasToken: !!preservedAuthState.token,
      hasUser: !!preservedAuthState.user,
      userRole: preservedAuthState.user?.role
    });
    
    try {
      // Validate required fields
      if (!formData.title) {
        throw new Error('Please enter a title');
      }
      if (!formData.service) {
        throw new Error('Please select a service');
      }
      if (!formData.client) {
        throw new Error('Please select a client');
      }
      
      // Validate based on booking type
      if (formData.isMultiDay) {
        if (!formData.bookingDays || formData.bookingDays.length === 0) {
          throw new Error('Please add at least one booking day');
        }
        
        // Validate each booking day
        for (let i = 0; i < formData.bookingDays.length; i++) {
          const day = formData.bookingDays[i];
          if (!day.startTime || !day.endTime) {
            throw new Error(`Please select start and end times for day ${i + 1}`);
          }
          
          const startTime = new Date(day.startTime);
          const endTime = new Date(day.endTime);
          
          if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            throw new Error(`Please select valid start and end times for day ${i + 1}`);
          }
          
          if (startTime >= endTime) {
            throw new Error(`End time must be after start time for day ${i + 1}`);
          }
        }
      } else {
        if (!formData.startTime) {
          throw new Error('Please select a start time');
        }
        if (!formData.endTime) {
          throw new Error('Please select an end time');
        }
      }
      
      // Find selected client to get their location data
      const selectedClient = clients.find(client => client._id === formData.client);
      
      // Create booking alert with client location data
      const bookingAlertData = {
        title: formData.title,
        description: formData.description,
        service: formData.service,
        client: formData.client,
        bookingKey: formData.bookingKey,
        locationArea: formData.locationArea,
        sendToAll: formData.sendToAll,
        selectedLocationAreas: formData.selectedLocationAreas,
        sendAsNotification: formData.sendAsNotification,
        sendAsEmail: formData.sendAsEmail,
        // Multi-day support
        isMultiDay: formData.isMultiDay,
        // Add manager field (required by backend)
        manager: currentUser.id,
        location: selectedClient ? {
          address: selectedClient.address.street,
          city: selectedClient.address.city,
          postcode: selectedClient.address.postcode,
          coordinates: selectedClient.address.coordinates || [0, 0]
        } : null
      };
      
      // Add date/time information based on booking type
      if (formData.isMultiDay) {
        // For multi-day bookings, include the bookingDays array
        bookingAlertData.bookingDays = formData.bookingDays.map(day => ({
          startTime: new Date(day.startTime).toISOString(),
          endTime: new Date(day.endTime).toISOString()
        }));
        // Set startTime and endTime to the first day for backward compatibility
        bookingAlertData.startTime = new Date(formData.bookingDays[0].startTime).toISOString();
        bookingAlertData.endTime = new Date(formData.bookingDays[0].endTime).toISOString();
      } else {
        // For single-day bookings, use the regular startTime and endTime
        const startTime = new Date(formData.startTime);
        const endTime = new Date(formData.endTime);
        
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          throw new Error('Please select valid start and end times');
        }
        
        if (startTime >= endTime) {
          throw new Error('End time must be after start time');
        }
        
        bookingAlertData.startTime = startTime.toISOString();
        bookingAlertData.endTime = endTime.toISOString();
      }
      
      // Remove any undefined or empty string fields
      Object.keys(bookingAlertData).forEach(key => {
        if (bookingAlertData[key] === '' || bookingAlertData[key] === undefined) {
          delete bookingAlertData[key];
        }
      });
      
      console.log('Final booking alert data being sent:', bookingAlertData);
      
      // Validate authentication state before making request
      const tokenBeforeRequest = localStorage.getItem('token');
      if (!tokenBeforeRequest || !currentUser) {
        setError('Authentication required. Please log in again.');
        return;
      }
      
      // Log authentication state before request
      console.log('\n=== FRONTEND: BEFORE POST REQUEST ===');
      console.log('Current user before request:', currentUser);
      console.log('Auth token exists:', !!tokenBeforeRequest);
      console.log('Timestamp:', new Date().toISOString());
      
      // Store original authentication state to compare after request
      const originalAuthState = {
        token: tokenBeforeRequest,
        userId: currentUser?.id || currentUser?._id,
        userEmail: currentUser?.email
      };
      
      const response = await axiosInstance.post('/booking-alerts', bookingAlertData);
      
      // Verify authentication state after request
      const tokenAfterRequest = localStorage.getItem('token');
      const authStateChanged = tokenAfterRequest !== originalAuthState.token;
      
      // Log authentication state after request
      console.log('\n=== FRONTEND: AFTER POST REQUEST ===');
      console.log('Response status:', response.status);
      console.log('Current user after request:', currentUser);
      console.log('Auth token still exists:', !!tokenAfterRequest);
      console.log('Auth state changed:', authStateChanged);
      console.log('Response from server:', response);
      
      // If authentication state changed unexpectedly, warn user but don't fail
      if (authStateChanged) {
        console.warn('⚠️ Authentication state changed during request!');
        console.warn('Original token:', originalAuthState.token?.substring(0, 20) + '...');
        console.warn('Current token:', tokenAfterRequest?.substring(0, 20) + '...');
      }
      
      if (response.status === 201) {
        setSuccess(true);
        // Reset form
        setFormData({
          title: '',
          description: '',
          startTime: new Date(),
          endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
          service: '',
          client: '',
          bookingKey: '',
          locationArea: '',
          // Multi-day fields
          isMultiDay: false,
          bookingDays: [],
          // Targeting options
          sendToAll: false,
          selectedLocationAreas: [],
          // Notification options
          sendAsNotification: true,
          sendAsEmail: false
        });
        // Reset stepper
        setActiveStep(0);
      }
    } catch (err) {
        console.log('\n=== FRONTEND: ERROR OCCURRED ===');
        console.error('Error creating booking alert:', err);
        console.log('Error status:', err.response?.status);
        console.log('Error data:', err.response?.data);
        console.log('Current user during error:', currentUser);
        console.log('Auth token during error:', !!localStorage.getItem('token'));
        console.log('Is this a 401 error?', err.response?.status === 401);
        
        // Handle authentication errors without triggering logout
        if (err.response?.status === 401) {
          console.log('🚨 401 ERROR DETECTED - Handling gracefully to prevent logout');
          console.log('Error message:', err.response?.data?.message || err.response?.data?.msg);
          
          // Check if token still exists after error
          const tokenAfterError = localStorage.getItem('token');
          if (!tokenAfterError) {
            setError('Your session has expired. Please refresh the page and try again.');
          } else {
            setError('Authentication error occurred. Please try again or refresh the page if the problem persists.');
          }
          return;
        }
        
        // Handle other errors
        if (err.response?.status === 403) {
          setError('You do not have permission to create booking alerts.');
        } else if (err.response?.status >= 500) {
          setError('Server error occurred. Please try again later.');
        } else {
          setError(err.response?.data?.message || err.response?.data?.msg || 'Failed to create booking alert');
        }
      } finally {
        // Check if authentication state was lost during submission
        const currentToken = localStorage.getItem('token');
        const authStateLost = !currentToken && preservedAuthState.token;
        
        if (authStateLost) {
          console.warn('🚨 Authentication state was lost during submission! Attempting recovery...');
          console.warn('Preserved token exists:', !!preservedAuthState.token);
          console.warn('Current token exists:', !!currentToken);
          
          // Attempt to restore the token if it was lost
          if (preservedAuthState.token) {
            localStorage.setItem('token', preservedAuthState.token);
            console.log('✅ Authentication token restored from preserved state');
            
            // Show warning to user about potential session issue
            setError('Session temporarily interrupted but recovered. Your booking alert submission may need to be retried.');
          }
        }
        
        setLoading(false);
        isSubmittingRef.current = false;
      }
    };
    
    const handleCloseSnackbar = () => {
      setSuccess(false);
    };
    
    const handleSaveAsTemplate = async () => {
      try {
        // Validate required fields for template
        if (!formData.title) {
          setError('Please enter a title before saving as template');
          return;
        }
        if (!formData.service) {
          setError('Please select a service before saving as template');
          return;
        }
        
        const templateName = prompt('Enter a name for this template:');
        if (!templateName) {
          return; // User cancelled
        }
        
        const templateData = {
          name: templateName,
          title: formData.title,
          alertDescription: formData.description,
          service: formData.service,
          locationArea: formData.locationArea,
          sendToAll: formData.sendToAll,
          selectedLocationAreas: formData.selectedLocationAreas,
          sendAsNotification: formData.sendAsNotification,
          sendAsEmail: formData.sendAsEmail
        };
        
        const response = await axiosInstance.post('/booking-alert-templates', templateData);
        
        if (response.status === 201) {
          // Refresh templates list
          const templatesResponse = await axiosInstance.get('/booking-alert-templates');
          setTemplates(templatesResponse.data.data || templatesResponse.data);
          
          // Show success message
          setError('');
          alert('Template saved successfully!');
        }
      } catch (err) {
        console.error('Error saving template:', err);
        setError(err.response?.data?.message || 'Failed to save template');
      }
    };
    
    // Only managers, admins and superusers can create booking alerts
    if (currentUser && currentUser.role !== 'manager' && currentUser.role !== 'admin' && currentUser.role !== 'superuser') {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            You do not have permission to create booking alerts.
          </Alert>
        </Box>
      );
    }
    
    const renderStepContent = (step) => {
      switch (step) {
        case 0:
          return (
            <Grid container spacing={2}>
              {/* Template Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Load from Template (Optional)</InputLabel>
                  <Select
                    value={selectedTemplate}
                    onChange={handleTemplateChange}
                    label="Load from Template (Optional)"
                  >
                    <MenuItem value="">
                      <em>Start from scratch</em>
                    </MenuItem>
                    {templates.map((template) => (
                      <MenuItem key={template._id} value={template._id}>
                        {template.name} - {template.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Service</InputLabel>
                  <Select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                    label="Service"
                  >
                    {services && services.map((service) => (
                      <MenuItem key={service._id} value={service._id}>
                        {service.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    label="Start Time"
                    value={formData.startTime}
                    onChange={(newValue) => handleDateChange('startTime', newValue)}
                    format="dd/MM/yyyy HH:mm"
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
                  <DateTimePicker
                    label="End Time"
                    value={formData.endTime}
                    onChange={(newValue) => handleDateChange('endTime', newValue)}
                    format="dd/MM/yyyy HH:mm"
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
              
              {/* Multi-day booking option */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.isMultiDay}
                      onChange={(e) => toggleMultiDay(e.target.checked)}
                      name="isMultiDay"
                    />
                  }
                  label="Multi-day booking (for bookings spanning multiple days)"
                />
              </Grid>
              
              {/* Multi-day booking days */}
              {formData.isMultiDay && (
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Booking Days
                  </Typography>
                  {formData.bookingDays.map((day, index) => (
                    <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                              label={`Day ${index + 2} - Start Time`}
                              value={day.startTime}
                              onChange={(newValue) => handleBookingDayChange(index, 'startTime', newValue)}
                              format="dd/MM/yyyy HH:mm"
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
                        <Grid item xs={12} sm={5}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <DateTimePicker
                              label={`Day ${index + 2} - End Time`}
                              value={day.endTime}
                              onChange={(newValue) => handleBookingDayChange(index, 'endTime', newValue)}
                              format="dd/MM/yyyy HH:mm"
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
                        <Grid item xs={12} sm={2}>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => removeBookingDay(index)}
                            disabled={formData.bookingDays.length === 1}
                            fullWidth
                          >
                            Remove
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                  <Button
                    variant="outlined"
                    onClick={addBookingDay}
                    sx={{ mt: 1 }}
                  >
                    Add Another Day
                  </Button>
                </Grid>
              )}
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Client Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Client</InputLabel>
                  <Select
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                    required
                    label="Client"
                  >
                    <MenuItem value="">
                      <em>Select a client</em>
                    </MenuItem>
                    {clients && clients.map((client) => (
                      <MenuItem key={client._id} value={client._id}>
                        {client.name} - {client.address?.city || 'No location'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Booking Key</InputLabel>
                  <Select
                    name="bookingKey"
                    value={formData.bookingKey}
                    onChange={handleChange}
                    label="Booking Key"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {bookingKeys && bookingKeys.map((key) => (
                      <MenuItem key={key._id} value={key.name}>
                        {key.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Location Area</InputLabel>
                  <Select
                    name="locationArea"
                    value={formData.locationArea}
                    onChange={handleChange}
                    label="Location Area"
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {locationAreas && locationAreas.map((area) => (
                      <MenuItem key={area._id} value={area.name}>
                        {area.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          );
        case 1:
          return (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Notification Options
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.sendAsNotification}
                        onChange={handleChange}
                        name="sendAsNotification"
                      />
                    }
                    label="Send as notification"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.sendAsEmail}
                        onChange={handleChange}
                        name="sendAsEmail"
                      />
                    }
                    label="Send as email"
                  />
                </FormGroup>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Targeting Options
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendToAll}
                      onChange={handleChange}
                      name="sendToAll"
                    />
                  }
                  label="Send to all staff"
                />
              </Grid>
              
              {!formData.sendToAll && (
                <Grid item xs={12}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Select Location Areas</InputLabel>
                    <Select
                      multiple
                      value={formData.selectedLocationAreas}
                      onChange={handleLocationAreaChange}
                      input={<OutlinedInput label="Select Location Areas" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      )}
                    >
                      {locationAreas && locationAreas.map((area) => (
                        <MenuItem key={area._id} value={area.name}>
                          {area.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Select multiple location areas to target specific staff members. Only staff who are free during the alert time and work in the selected areas will receive the alert.
                  </Typography>
                </Grid>
              )}
            </Grid>
          );
        default:
          return 'Unknown step';
      }
    };
    
    return (
      <Box sx={{ p: 3 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Create Booking Alert
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Create an alert for an available shift that staff members can claim.
          </Typography>
          
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                type="button"
                color="inherit"
                disabled={activeStep === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep === steps.length - 1 ? (
                <>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleSaveAsTemplate}
                    disabled={loading}
                    sx={{ mr: 1 }}
                  >
                    Save as Template
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Create Booking Alert'}
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={handleNext} variant="contained">
                  Next
                </Button>
              )}
            </Box>
            
            <Box sx={{ mt: 2 }}>
              <Button
                type="button"
                variant="outlined"
                color="secondary"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </Paper>
        
        <Snackbar
          open={success}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success">
            Booking alert created successfully!
          </Alert>
        </Snackbar>
      </Box>
    );
};

export default BookingAlertForm;