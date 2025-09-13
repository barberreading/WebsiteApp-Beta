import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  OutlinedInput
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';

const BookingAlertTemplateManager = () => {
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [services, setServices] = useState([]);
  const [locationAreas, setLocationAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    title: '',
    alertDescription: '',
    service: '',
    location: {
      address: '',
      city: '',
      postcode: ''
    },
    locationArea: '',
    sendToAll: true,
    selectedLocationAreas: [],
    sendAsNotification: true,
    sendAsEmail: false
  });

  useEffect(() => {
    fetchTemplates();
    fetchFormData();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/booking-alert-templates');
      setTemplates(response.data.data);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      // Fetch services
      const servicesRes = await axiosInstance.get('/services?active=true');
      setServices(servicesRes.data);
      
      // Fetch location areas
      const areasRes = await axiosInstance.get('/booking-categories/areas');
      setLocationAreas(areasRes.data.data);
    } catch (err) {
      console.error('Error fetching form data:', err);
      setError('Failed to load form data');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      title: '',
      alertDescription: '',
      service: '',
      location: {
        address: '',
        city: '',
        postcode: ''
      },
      locationArea: '',
      sendToAll: true,
      selectedLocationAreas: [],
      sendAsNotification: true,
      sendAsEmail: false
    });
    setEditingTemplate(null);
  };

  const handleOpenDialog = (template = null) => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        title: template.title,
        alertDescription: template.alertDescription || '',
        service: template.service._id,
        location: template.location,
        locationArea: template.locationArea || '',
        sendToAll: template.sendToAll,
        selectedLocationAreas: template.selectedLocationAreas || [],
        sendAsNotification: template.sendAsNotification,
        sendAsEmail: template.sendAsEmail
      });
      setEditingTemplate(template);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.name || !formData.title || !formData.service || !formData.location.address) {
        throw new Error('Please fill in all required fields');
      }

      const url = editingTemplate 
        ? `/booking-alert-templates/${editingTemplate._id}`
        : '/booking-alert-templates';
      
      const method = editingTemplate ? 'put' : 'post';
      
      await axiosInstance[method](url, formData);
      
      setSuccess(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!');
      handleCloseDialog();
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.delete(`/booking-alert-templates/${templateId}`);
      setSuccess('Template deleted successfully!');
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Booking Alert Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Template
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template._id}>
                <TableCell>
                  <Typography variant="subtitle2">{template.name}</Typography>
                  {template.description && (
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{template.title}</TableCell>
                <TableCell>{template.service?.name}</TableCell>
                <TableCell>
                  {template.location.address}
                  {template.location.city && `, ${template.location.city}`}
                </TableCell>
                <TableCell>{template.createdBy?.name}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(template)}
                    title="Edit Template"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(template._id)}
                    title="Delete Template"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {templates.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    No templates found. Create your first template to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Template Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Template Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Template Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  helperText="A descriptive name for this template"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Template Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  helperText="Optional description of when to use this template"
                />
              </Grid>

              {/* Alert Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Alert Details
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alert Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Alert Description"
                  name="alertDescription"
                  value={formData.alertDescription}
                  onChange={handleChange}
                  multiline
                  rows={3}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Service</InputLabel>
                  <Select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    label="Service"
                  >
                    {services.map((service) => (
                      <MenuItem key={service._id} value={service._id}>
                        {service.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
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
                    {locationAreas.map((area) => (
                      <MenuItem key={area} value={area}>
                        {area}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Location Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Location Details
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="City"
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Postcode"
                  name="location.postcode"
                  value={formData.location.postcode}
                  onChange={handleChange}
                />
              </Grid>

              {/* Targeting Options */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Targeting Options
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendToAll}
                      onChange={handleChange}
                      name="sendToAll"
                    />
                  }
                  label="Send to all staff members"
                />
              </Grid>
              
              {!formData.sendToAll && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Select Location Areas</InputLabel>
                    <Select
                      multiple
                      value={formData.selectedLocationAreas}
                      onChange={handleLocationAreaChange}
                      input={<OutlinedInput label="Select Location Areas" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {locationAreas.map((area) => (
                        <MenuItem key={area} value={area}>
                          {area}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}

              {/* Notification Options */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Notification Options
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.sendAsNotification}
                        onChange={handleChange}
                        name="sendAsNotification"
                      />
                    }
                    label="Send as in-app notification"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.sendAsEmail}
                        onChange={handleChange}
                        name="sendAsEmail"
                      />
                    }
                    label="Send as email notification"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={20} /> : (editingTemplate ? 'Update' : 'Create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert onClose={() => setError('')} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookingAlertTemplateManager;