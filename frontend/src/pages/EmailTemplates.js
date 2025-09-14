import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Button, Card, CardContent, Chip, CircularProgress, Container, Dialog, DialogActions, 
  DialogContent, DialogTitle, Divider, Grid, IconButton, List, ListItem, ListItemText, 
  Paper, Tab, Tabs, TextField, Typography, Snackbar, Alert 
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';
import { wrapEmailContent } from '../components/email/EmailBrandingTemplate';

// Template types with descriptions
const TEMPLATE_TYPES = [
  { value: 'booking_confirmation', label: 'Booking Confirmation', description: 'Sent when a booking is created' },
  { value: 'booking_reminder', label: 'Booking Reminder', description: 'Sent 24 hours before a booking' },
  { value: 'timesheet_notification', label: 'Timesheet Notification', description: 'Sent when a timesheet is submitted' },
  { value: 'timesheet_approval', label: 'Timesheet Approval Request', description: 'Sent to request timesheet approval' }
];

// Available variables for each template type
const TEMPLATE_VARIABLES = {
  booking_confirmation: [
    'clientName', 'serviceName', 'bookingDate', 'startTime', 'endTime', 
    'staffName', 'location', 'bookingTitle'
  ],
  booking_reminder: [
    'clientName', 'serviceName', 'bookingDate', 'startTime', 'endTime', 
    'staffName', 'location', 'bookingTitle'
  ],
  timesheet_notification: [
    'employeeName', 'managerName', 'periodStart', 'periodEnd', 'totalHours', 'submissionDate'
  ],
  timesheet_approval: [
    'clientName', 'staffName', 'timesheetDate', 'startTime', 'endTime', 
    'totalHours', 'breaks'
  ]
};

const EmailTemplates = () => {
  const { user } = useAuth();
  const { branding } = useBranding();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    body: '',
    type: 'booking_confirmation',
    variables: []
  });
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  const handlePreview = () => {
    setPreviewOpen(true);
  };
  
  const handleClosePreview = () => {
    setPreviewOpen(false);
  };

  // Check if user has permission (superuser or admin)
  const hasPermission = user && ['superuser', 'admin'].includes(user.role);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/email-templates');
      if (res.data.success) {
        setTemplates(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedTemplate(res.data.data[0]);
        }
      }
    } catch (error) {
      logger.error('Error loading templates:', error);
      setAlert({ open: true, message: 'Failed to load email templates', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasPermission) {
      fetchTemplates();
    }
  }, [hasPermission, fetchTemplates]);

  const handleOpenDialog = (template = null) => {
    if (template) {
      // Edit existing template
      setFormData({
        ...template,
        variables: template.variables || TEMPLATE_VARIABLES[template.type] || []
      });
      setIsEditing(true);
    } else {
      // Create new template
      setFormData({
        name: '',
        description: '',
        subject: '',
        body: '',
        type: 'booking_confirmation',
        variables: TEMPLATE_VARIABLES.booking_confirmation || []
      });
      setIsEditing(false);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      setFormData({
        ...formData,
        [name]: value,
        variables: TEMPLATE_VARIABLES[value] || []
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.subject || !formData.body || !formData.type) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      let res;
      if (isEditing) {
        res = await axiosInstance.put(`/email-templates/${formData._id}`, formData);
      } else {
        res = await axiosInstance.post('/email-templates', formData);
      }
      
      if (res.data.success) {
        showAlert(`Template ${isEditing ? 'updated' : 'created'} successfully`, 'success');
        handleCloseDialog();
        fetchTemplates();
      }
    } catch (error) {
      logger.error('Error saving template:', error);
      showAlert(error.response?.data?.message || 'Failed to save template', 'error');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      const res = await axiosInstance.delete(`/email-templates/${id}`);
      if (res.data.success) {
        showAlert('Template deleted successfully', 'success');
        fetchTemplates();
      }
    } catch (error) {
      logger.error('Error deleting template:', error);
      showAlert(error.response?.data?.message || 'Failed to delete template', 'error');
    }
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const insertVariable = (variable) => {
    const textField = document.getElementById(tabValue === 0 ? 'subject' : 'body');
    if (textField) {
      const start = textField.selectionStart;
      const end = textField.selectionEnd;
      const text = formData[tabValue === 0 ? 'subject' : 'body'];
      const before = text.substring(0, start);
      const after = text.substring(end);
      const variableText = `{{${variable}}}`;
      
      setFormData({
        ...formData,
        [tabValue === 0 ? 'subject' : 'body']: before + variableText + after
      });
      
      // Set focus back to the text field
      setTimeout(() => {
        textField.focus();
        textField.setSelectionRange(start + variableText.length, start + variableText.length);
      }, 100);
    }
  };

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  if (!hasPermission) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to access this page. Only superusers and admins can manage email templates.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Email Templates
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Template
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={2}>
              <List component="nav" aria-label="email templates">
                {templates.length === 0 ? (
                  <ListItem>
                    <ListItemText primary="No templates found" secondary="Click 'Create Template' to add one" />
                  </ListItem>
                ) : (
                  templates.map((template) => (
                    <React.Fragment key={template._id}>
                      <ListItem
                        button
                        selected={selectedTemplate && selectedTemplate._id === template._id}
                        onClick={() => handleSelectTemplate(template)}
                        secondaryAction={
                          <Box>
                            <IconButton edge="end" onClick={() => handleOpenDialog(template)}>
                              <EditIcon />
                            </IconButton>
                            <IconButton edge="end" onClick={() => handleDeleteTemplate(template._id)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={template.name}
                          secondary={
                            <>
                              <Typography component="span" variant="body2" color="textPrimary">
                                {TEMPLATE_TYPES.find(t => t.value === template.type)?.label || template.type}
                              </Typography>
                              <br />
                              {template.description}
                            </>
                          }
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                )}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            {selectedTemplate ? (
              <Card>
                <CardContent>
                  <Typography variant="h5" gutterBottom>
                    {selectedTemplate.name}
                  </Typography>
                  <Typography variant="subtitle1" color="textSecondary" gutterBottom>
                    {TEMPLATE_TYPES.find(t => t.value === selectedTemplate.type)?.label || selectedTemplate.type}
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedTemplate.description}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Subject
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                    <Typography>{selectedTemplate.subject}</Typography>
                  </Paper>
                  
                  <Typography variant="h6" gutterBottom>
                    Body
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                    <div dangerouslySetInnerHTML={{ __html: selectedTemplate.body }} />
                  </Paper>
                  
                  <Typography variant="h6" gutterBottom>
                    Available Variables
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {(selectedTemplate.variables || TEMPLATE_VARIABLES[selectedTemplate.type] || []).map((variable) => (
                      <Chip key={variable} label={`{{${variable}}}`} variant="outlined" />
                    ))}
                  </Box>
                  
                  <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleOpenDialog(selectedTemplate)}
                      startIcon={<EditIcon />}
                    >
                      Edit Template
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="textSecondary">
                  Select a template to view details or create a new one
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* Template Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit Email Template' : 'Create Email Template'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Template Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Template Type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                margin="normal"
                SelectProps={{
                  native: true
                }}
              >
                {TEMPLATE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                  <Tab label="Subject" />
                  <Tab label="Body" />
                </Tabs>
              </Box>
              
              {tabValue === 0 && (
                <TextField
                  fullWidth
                  id="subject"
                  label="Email Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              )}
              
              {tabValue === 1 && (
                <TextField
                  fullWidth
                  id="body"
                  label="Email Body (HTML)"
                  name="body"
                  value={formData.body}
                  onChange={handleChange}
                  required
                  margin="normal"
                  multiline
                  rows={12}
                />
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Available Variables
              </Typography>
              <Typography variant="body2" paragraph>
                Click a variable to insert it at the cursor position:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {formData.variables.map((variable) => (
                  <Button
                    key={variable}
                    variant="outlined"
                    size="small"
                    onClick={() => insertVariable(variable)}
                    sx={{ mb: 1 }}
                  >
                    {`{{${variable}}}`}
                  </Button>
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handlePreview} color="secondary" sx={{ mr: 1 }}>
            Preview with Branding
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {isEditing ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>Email Template Preview</DialogTitle>
        <DialogContent>
          <div dangerouslySetInnerHTML={{ 
            __html: wrapEmailContent(`
              <h2>${formData.subject}</h2>
              <div>${formData.body}</div>
            `, formData.subject, branding) 
          }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmailTemplates;