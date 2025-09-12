import React, { useState, useEffect, useCallback } from 'react';
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
  Card,
  CardContent
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { handleApiError, validateToken } from '../../utils/errorHandler';
import { validateForm, sanitizeText } from '../../utils/validation';

const BookingForm = () => {
  // eslint-disable-next-line no-unused-vars
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  // Step management
  const [activeStep, setActiveStep] = useState(0);
  const steps = ['Basic Information', 'Service Details', 'Schedule Options', 'Categories'];
  
  // Form state
  const [formData, setFormData] = useState({
    description: '',
    service: '',
    client: '',
    staff: '',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // Default to 1 hour later
    status: 'scheduled',
    location: {
      address: '',
      city: '',
      postcode: ''
    },
    bookingKey: '',
    locationArea: '',
    // Recurring booking fields
    isRecurring: false,
    recurrencePattern: 'daily',
    recurrenceEndDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default to 30 days
    recurrenceDays: ['Monday', 'Wednesday', 'Friday'],
    weeklyInterval: 1, // New field for weekly interval (every X weeks)
    // Multi-day booking fields
    isMultiDay: false,
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)), // Default to next day
    selectedDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], // Default to weekdays
    skipWeekends: false, // Option to skip weekends
    sameTimeEachDay: true, // Option to use same time each day
    // Categories
    categories: []
  });
  
  // Navigation functions
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [availableStaff, setAvailableStaff] = useState([]);
  const [bookingKeys, setBookingKeys] = useState([]);
  const [locationAreas, setLocationAreas] = useState([]);
  const [bookingCategories, setBookingCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  
  // Fetch booking categories and keys
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        // Fetch booking keys
        const keysResponse = await axiosInstance.get('/booking-categories/keys');
        if (keysResponse.data && keysResponse.data.data) {
          setBookingKeys(keysResponse.data.data);
          setBookingCategories(keysResponse.data.data);
        }
        
        // Fetch location areas
        const areasResponse = await axiosInstance.get('/booking-categories/areas');
        if (areasResponse.data && areasResponse.data.data) {
          setLocationAreas(areasResponse.data.data);
        }
      } catch (err) {
        console.error('Error fetching booking data:', err);
        setBookingKeys([]);
        setBookingCategories([]);
        setLocationAreas([]);
      }
    };

    fetchBookingData();
  }, []);
  
  // Fetch initial data (services, clients, staff, etc.)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser) return;

      setInitialLoading(true);
      try {
        if (!validateToken()) {
          console.log('Authentication validation failed');
          setError('Authentication failed. Please log in again.');
          setInitialLoading(false);
          return;
        }

        const [clientsRes, servicesRes, staffRes] = await Promise.all([
          axiosInstance.get('/clients'),
          axiosInstance.get('/services'),
          axiosInstance.get('/users/staff'),
        ]);

        setClients(clientsRes.data.data || []);
        setServices(servicesRes.data || []);
        setStaff(staffRes.data || []);

        if (isEditMode) {
          const bookingResponse = await axiosInstance.get(`/bookings/${id}`);
          const booking = bookingResponse.data;
          setFormData(prev => ({
            ...prev,
            title: booking.title || '',
            description: booking.description || '',
            service: booking.service?._id || '',
            client: booking.client?._id || '',
            staff: booking.staff?._id || '',
            startTime: new Date(booking.startTime),
            endTime: new Date(booking.endTime),
            status: booking.status || 'scheduled',
            location: booking.location || { address: '', city: '', postcode: '' },
            bookingKey: booking.bookingKey || '',
            locationArea: booking.locationArea || '',
            isRecurring: booking.isRecurring || false,
            recurrencePattern: booking.recurrencePattern || 'daily',
            recurrenceEndDate: booking.recurrenceEndDate ? new Date(booking.recurrenceEndDate) : new Date(new Date().setDate(new Date().getDate() + 30)),
            recurrenceDays: booking.recurrenceDays || ['Monday', 'Wednesday', 'Friday'],
            isMultiDay: booking.isMultiDay || false,
            endDate: booking.endDate ? new Date(booking.endDate) : new Date(new Date().setDate(new Date().getDate() + 1)),
            categories: booking.categories || [],
          }));
        } else {
          setFormData(prev => ({ ...prev, staff: currentUser._id }));
        }
      } catch (err) {
        const errorMessage = handleApiError(err, 'Error fetching initial data');
        setError(`Failed to load data: ${errorMessage}. Please refresh the page.`);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditMode, currentUser]);

  const fetchAvailableStaff = useCallback(async () => {
    if (formData.startTime && formData.endTime) {
      const startDate = new Date(formData.startTime);
      const endDate = new Date(formData.endTime);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setAvailableStaff([]);
        return;
      }

      try {
        const response = await axiosInstance.get(`/available-staff`, {
          params: {
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString()
          }
        });
        console.log('Raw response from /available-staff:', response);
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          console.log('Setting available staff:', response.data.data);
          setAvailableStaff(response.data.data);
        } else {
          console.log('No available staff found or invalid response format. Response:', response.data);
          setAvailableStaff([]);
        }
      } catch (err) {
        console.error('Error fetching available staff:', err);
        setAvailableStaff([]);
        // Handle error appropriately, maybe show a message to the user
      }
    } else {
      setAvailableStaff([]);
    }
  }, [formData.startTime, formData.endTime]);

  useEffect(() => {
    console.log('useEffect for available staff triggered. Start:', formData.startTime, 'End:', formData.endTime);
    fetchAvailableStaff();
  }, [fetchAvailableStaff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('location.')) {
      const locationField = name.split('.')[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: value
        }
      });
    } else if (name === 'client' && value) {
      // Auto-fill client address when a client is selected
      const selectedClient = clients.find(client => client._id === value);
      if (selectedClient && selectedClient.address) {
        setFormData({
          ...formData,
          [name]: value,
          location: {
            address: selectedClient.address || '',
            city: selectedClient.city || '',
            postcode: selectedClient.postcode || ''
          }
        });
      } else {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleDateChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value, staff: '' }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});
    
    try {
      // Sanitize text inputs
      const sanitizedData = {
        ...formData,
        title: sanitizeText(formData.title || ''),
        description: sanitizeText(formData.description || ''),
        location: {
          ...formData.location,
          address: sanitizeText(formData.location?.address || ''),
          city: sanitizeText(formData.location?.city || ''),
          postcode: sanitizeText(formData.location?.postcode || '')
        }
      };
      
      // Define validation rules
      const validationRules = {
        client: { required: true },
        staff: { required: true },
        service: { required: true },
        startTime: { required: true, type: 'date' },
        endTime: { required: true, type: 'date' },
        description: { maxLength: 1000 },
        title: { maxLength: 200 }
      };
      
      // Validate form data
      const validation = validateForm(sanitizedData, validationRules);
      
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        throw new Error('Please fix the validation errors before submitting.');
      }
      
      // Additional business logic validations
      if (new Date(sanitizedData.startTime) >= new Date(sanitizedData.endTime)) {
        throw new Error('End time must be after start time');
      }
      
      if (new Date(sanitizedData.startTime) < new Date()) {
        throw new Error('Start time cannot be in the past');
      }
      
      // Update form data with sanitized values
      setFormData(sanitizedData);
      
      // Create a copy of form data for submission
      const bookingData = { ...formData };
      
      // Ensure dates are properly formatted
      if (bookingData.startTime) {
        bookingData.startTime = new Date(bookingData.startTime);
      }
      if (bookingData.endTime) {
        bookingData.endTime = new Date(bookingData.endTime);
      }
      
      // Always set manager field (required by backend)
      bookingData.manager = bookingData.staff;
      
      // Format location address as string if it's an object
      if (bookingData.location && typeof bookingData.location.address === 'object') {
        const addressObj = bookingData.location.address;
        bookingData.location.address = `${addressObj.street || ''}, ${addressObj.city || ''}, ${addressObj.postcode || ''}, ${addressObj.country || ''}`;
      }
      
      // Always set the manager field to the staff ID
      bookingData.manager = bookingData.staff;
      
      // Add title if not present
      if (!bookingData.title) {
        // Generate a title based on service and client
        const selectedService = services.find(s => s._id === bookingData.service);
        const selectedClient = clients.find(c => c._id === bookingData.client);
        bookingData.title = `${selectedService ? selectedService.name : 'Service'} - ${selectedClient ? selectedClient.name || `${selectedClient.firstName || ''} ${selectedClient.lastName || ''}` : 'Client'}`;
      }
      
      console.log('Submitting booking data:', bookingData);
      
      // Handle multi-day booking
      if (formData.isMultiDay && formData.endDate) {
        // Create a series of bookings from start date to end date
        const startDate = new Date(formData.startTime);
        const endDate = new Date(formData.endDate);
        const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Create bookings for each day
        for (let i = 0; i < dayDiff; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(currentDate.getDate() + i);
          
          const currentEndTime = new Date(formData.endTime);
          currentEndTime.setDate(currentEndTime.getDate() + i);
          
          const dailyBooking = {
            ...bookingData,
            startTime: currentDate.toISOString(),
            endTime: currentEndTime.toISOString(),
            isMultiDay: true,
            multiDayMaster: i === 0, // First booking is the master
            multiDayIndex: i,
            multiDayTotal: dayDiff
          };
          
          try {
            if (isEditMode) {
              // Only update the master booking in edit mode
              if (i === 0) {
                const response = await axiosInstance.put(`/bookings/${id}`, dailyBooking);
                console.log('Updated booking response:', response.data);
              } else {
                // Create additional bookings if they don't exist
                const response = await axiosInstance.post('/bookings', dailyBooking);
                console.log('Created additional booking response:', response.data);
              }
            } else {
              const response = await axiosInstance.post('/bookings', dailyBooking);
              console.log('Created booking response:', response.data);
            }
          } catch (bookingError) {
            console.error(`Error saving booking day ${i}:`, bookingError);
            throw new Error(`Failed to save booking for day ${i+1}: ${bookingError.response?.data?.message || bookingError.message}`);
          }
        }
      } 
      // Handle recurring booking
      else if (formData.isRecurring) {
        const startDate = new Date(formData.startTime);
        const endDate = new Date(formData.recurrenceEndDate);
        const pattern = formData.recurrencePattern;
        
        let currentDate = new Date(startDate);
        const bookings = [];
        
        // Generate dates based on recurrence pattern
        while (currentDate <= endDate) {
          // For weekly recurrence, check if the day is selected
          if (pattern === 'weekly') {
            const dayName = currentDate.toLocaleString('en-US', { weekday: 'long' });
            if (!formData.recurrenceDays.includes(dayName)) {
              // Skip this day if not selected for weekly recurrence
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }
          }
          
          const bookingStartTime = new Date(currentDate);
          const bookingEndTime = new Date(currentDate);
          bookingEndTime.setHours(formData.endTime.getHours());
          bookingEndTime.setMinutes(formData.endTime.getMinutes());
          
          const recurringBooking = {
            ...bookingData,
            startTime: bookingStartTime.toISOString(),
            endTime: bookingEndTime.toISOString(),
            isRecurring: true,
            recurrencePattern: pattern,
            recurrenceMaster: bookings.length === 0, // First booking is the master
            recurrenceIndex: bookings.length
          };
          
          bookings.push(recurringBooking);
          
          // Increment date based on pattern
          if (pattern === 'daily') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (pattern === 'weekly') {
            currentDate.setDate(currentDate.getDate() + 1);
          } else if (pattern === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          }
        }
        
        // Save all generated bookings
        for (let i = 0; i < bookings.length; i++) {
          const booking = bookings[i];
          try {
            if (isEditMode && booking.recurrenceMaster) {
              const response = await axiosInstance.put(`/bookings/${id}`, booking);
              console.log('Updated recurring booking response:', response.data);
            } else {
              const response = await axiosInstance.post('/bookings', booking);
              console.log('Created recurring booking response:', response.data);
            }
          } catch (bookingError) {
            console.error(`Error saving recurring booking ${i}:`, bookingError);
            throw new Error(`Failed to save recurring booking ${i+1}: ${bookingError.response?.data?.message || bookingError.message}`);
          }
        }
      } 
      // Handle regular booking
      else {
        try {
        // Validate all required fields are present
        if (!bookingData.service || !bookingData.staff || !bookingData.client || !bookingData.startTime || !bookingData.endTime) {
          throw new Error('Missing required fields. Please fill in all required information.');
        }
        
        // Ensure dates are properly formatted
        bookingData.startTime = new Date(bookingData.startTime).toISOString();
        bookingData.endTime = new Date(bookingData.endTime).toISOString();
        
        console.log('Final booking data being sent:', bookingData);
        
        if (isEditMode) {
          const response = await axiosInstance.put(`/bookings/${id}`, bookingData);
          console.log('Updated regular booking response:', response.data);
        } else {
          const response = await axiosInstance.post('/bookings', bookingData);
          console.log('Created regular booking response:', response.data);
        }
      } catch (bookingError) {
        console.error('Error saving regular booking:', bookingError);
        const errorMessage = bookingError.response?.data?.msg || bookingError.response?.data?.message || bookingError.message;
        throw new Error(`Failed to save booking: ${errorMessage}`);
      }
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (err) {
      console.error('Error in booking submission:', err);
      setError(err.response?.data?.message || err.message || 'Error saving booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  // Render form page based on active step
  const renderFormPage = () => {
    switch (activeStep) {
      case 0:
        return (
          // Basic Information
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Client</InputLabel>
                <Select
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  label="Client"
                  required
                >
                  <MenuItem value="">Select Client</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>
                      {client.firstName} {client.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={(newValue) => handleDateChange('startTime', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  minutesStep={5}
                  timeSteps={{ minutes: 5 }}
                  inputFormat="dd/MM/yyyy HH:mm"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={(newValue) => handleDateChange('endTime', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  minutesStep={5}
                  timeSteps={{ minutes: 5 }}
                  inputFormat="dd/MM/yyyy HH:mm"
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button onClick={fetchAvailableStaff} variant="contained" fullWidth>Refresh Staff</Button>
              <FormControl fullWidth margin="normal" sx={{ mt: 1 }}>
                <InputLabel>Staff</InputLabel>
                <Select
                  name="staff"
                  value={formData.staff}
                  onChange={handleChange}
                  label="Staff"
                  required
                >
                  <MenuItem value="">Select Staff</MenuItem>
                  {availableStaff.map((staffMember) => (
                    <MenuItem key={staffMember._id} value={staffMember._id}>
                      {staffMember.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Booking Categories removed from this section as it's already in section 4 */}
          </Grid>
        );
      case 1:
        return (
          // Service Details
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Service</InputLabel>
                <Select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  label="Service"
                  required
                >
                  <MenuItem value="">Select Service</MenuItem>
                  {services.map((service) => (
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
                rows={4}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
      case 2:
        return (
          // Schedule Options
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl component="fieldset" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Booking Type
                </Typography>
                <Grid container spacing={2}>
                  <Grid item>
                    <Button 
                      variant={!formData.isRecurring && !formData.isMultiDay ? "contained" : "outlined"} 
                      onClick={() => setFormData({...formData, isRecurring: false, isMultiDay: false})}
                    >
                      Single Booking
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button 
                      variant={formData.isRecurring ? "contained" : "outlined"} 
                      onClick={() => setFormData({...formData, isRecurring: true, isMultiDay: false})}
                    >
                      Recurring Booking
                    </Button>
                  </Grid>
                  <Grid item>
                    <Button 
                      variant={formData.isMultiDay ? "contained" : "outlined"} 
                      onClick={() => setFormData({...formData, isMultiDay: true, isRecurring: false})}
                    >
                      Multi-Day Booking
                    </Button>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
            
            {formData.isRecurring && (
              <>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Recurrence Pattern</InputLabel>
                    <Select
                      name="recurrencePattern"
                      value={formData.recurrencePattern}
                      onChange={handleChange}
                      label="Recurrence Pattern"
                    >
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="biweekly">Bi-Weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="Recurrence End Date"
                      value={formData.recurrenceEndDate}
                      onChange={(newValue) => handleDateChange('recurrenceEndDate', newValue)}
                      views={['year', 'month', 'day']}
                      renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                      inputFormat="dd/MM/yyyy"
                    />
                  </LocalizationProvider>
                </Grid>
                
                {(formData.recurrencePattern === 'weekly' || formData.recurrencePattern === 'biweekly') && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Repeat on these days:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <Button
                          key={day}
                          variant={formData.recurrenceDays.includes(day) ? "contained" : "outlined"}
                          size="small"
                          onClick={() => {
                            const updatedDays = formData.recurrenceDays.includes(day)
                              ? formData.recurrenceDays.filter(d => d !== day)
                              : [...formData.recurrenceDays, day];
                            setFormData({...formData, recurrenceDays: updatedDays});
                          }}
                        >
                          {day.substring(0, 3)}
                        </Button>
                      ))}
                    </Box>
                  </Grid>
                )}
                
                {formData.recurrencePattern === 'weekly' && (
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Repeat Every</InputLabel>
                      <Select
                        name="weeklyInterval"
                        value={formData.weeklyInterval || 1}
                        onChange={(e) => setFormData({...formData, weeklyInterval: e.target.value})}
                        label="Repeat Every"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                          <MenuItem key={num} value={num}>
                            {num} {num === 1 ? 'Week' : 'Weeks'}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </>
            )}
            
            {formData.isMultiDay && (
              <>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DateTimePicker
                      label="End Date"
                      value={formData.endDate}
                      onChange={(newValue) => handleDateChange('endDate', newValue)}
                      views={['year', 'month', 'day']}
                      renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                      inputFormat="dd/MM/yyyy"
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Select specific days:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <Button
                        key={day}
                        variant={(formData.selectedDays || []).includes(day) ? "contained" : "outlined"}
                        size="small"
                        type="button"
                        onClick={() => {
                          const currentDays = formData.selectedDays || [];
                          const updatedDays = currentDays.includes(day)
                            ? currentDays.filter(d => d !== day)
                            : [...currentDays, day];
                          setFormData({...formData, selectedDays: updatedDays});
                        }}
                      >
                        {day.substring(0, 3)}
                      </Button>
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <FormControl component="fieldset">
                    <Typography variant="subtitle2" gutterBottom>
                      Additional Options:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item>
                        <Button 
                          variant={(formData.skipWeekends || false) ? "contained" : "outlined"} 
                          size="small"
                          type="button"
                          onClick={() => setFormData({...formData, skipWeekends: !formData.skipWeekends})}
                        >
                          Skip Weekends
                        </Button>
                      </Grid>
                      <Grid item>
                        <Button 
                          variant={(formData.sameTimeEachDay || false) ? "contained" : "outlined"} 
                          size="small"
                          type="button"
                          onClick={() => setFormData({...formData, sameTimeEachDay: !formData.sameTimeEachDay})}
                        >
                          Same Time Each Day
                        </Button>
                      </Grid>
                    </Grid>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        );
      case 3:
        return (
          // Categories
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Booking Key</InputLabel>
                <Select
                  name="bookingKey"
                  value={formData.bookingKey}
                  onChange={handleChange}
                  label="Booking Key"
                >
                  <MenuItem value="">Select Booking Key</MenuItem>
                  {Array.isArray(bookingKeys) && bookingKeys.map((key) => (
                    <MenuItem key={key._id || key} value={key._id || key}>
                      {key.name || key}
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
                  <MenuItem value="">Select Location Area</MenuItem>
                  {Array.isArray(locationAreas) && locationAreas.map((area) => (
                    <MenuItem key={area._id || area} value={area._id || area}>
                      {area.name || area}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Booking Categories
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {bookingCategories.map((category) => (
                  <Button
                    key={category._id || category}
                    variant={formData.categories.includes(category._id || category) ? "contained" : "outlined"}
                    size="small"
                    type="button"
                    onClick={() => {
                      console.log('Category button clicked:', category.name || category);
                      const categoryId = category._id || category;
                      const updatedCategories = formData.categories.includes(categoryId)
                        ? formData.categories.filter(c => c !== categoryId)
                        : [...formData.categories, categoryId];
                      setFormData({...formData, categories: updatedCategories});
                    }}
                  >
                    {category.name || category}
                  </Button>
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Location
              </Typography>
              {/* Address fields removed as they are automatically filled from client selection */}
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          {isEditMode ? 'Edit Booking' : 'Create Booking'}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            mb: 4,
            display: { xs: 'none', sm: 'flex' } // Hide on mobile
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Mobile stepper alternative */}
        <Box sx={{ 
          display: { xs: 'flex', sm: 'none' },
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="body1" fontWeight="medium">
            Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
          </Typography>
        </Box>
        
        <form onSubmit={handleSubmit}>
          <Card variant="outlined" sx={{ mb: 3, minHeight: { xs: '250px', sm: '300px' } }}>
            <CardContent>
              {renderFormPage()}
            </CardContent>
          </Card>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            gap: { xs: 2, sm: 0 },
            mt: 2 
          }}>
            <Button
              variant="outlined"
              color="secondary"
              type="button"
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
              fullWidth={window.innerWidth < 600}
            >
              Back
            </Button>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                variant="outlined"
                color="secondary"
                type="button"
                onClick={() => navigate('/bookings')}
                disabled={loading}
                sx={{ mr: { sm: 1 } }}
                fullWidth={window.innerWidth < 600}
              >
                Cancel
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth={window.innerWidth < 600}
                >
                  {loading ? <CircularProgress size={24} /> : isEditMode ? 'Update Booking' : 'Create Booking'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  type="button"
                  onClick={handleNext}
                  disabled={loading}
                  fullWidth={window.innerWidth < 600}
                >
                  Next
                </Button>
              )}
            </Box>
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
          Booking {isEditMode ? 'updated' : 'created'} successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookingForm;