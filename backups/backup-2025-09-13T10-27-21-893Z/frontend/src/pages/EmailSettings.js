import React, { useState, useEffect } from 'react';
import { Box, Button, Card, CardContent, CircularProgress, Container, FormControlLabel, Grid, Switch, TextField, Typography, Snackbar, Alert } from '@mui/material';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';

const EmailSettings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    host: '',
    port: '',
    secure: false,
    auth: {
      user: '',
      pass: ''
    },
    from: {
      name: '',
      email: ''
    },
    enabled: false
  });
  const [testEmail, setTestEmail] = useState('');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

  // Check if user has permission
  const hasPermission = currentUser && ['manager', 'superuser', 'admin'].includes(currentUser.role);

  useEffect(() => {
    if (hasPermission) {
      fetchSettings();
    }
  }, [hasPermission]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/email-settings');
      if (res.data.success && res.data.data) {
        setSettings({
          ...res.data.data,
          auth: {
            ...res.data.data.auth,
            pass: '' // Password is not returned from API for security
          }
        });
      }
    } catch (error) {
      console.error('Error fetching email settings:', error);
      showAlert('Failed to load email settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings({
        ...settings,
        [parent]: {
          ...settings[parent],
          [child]: value
        }
      });
    } else {
      setSettings({
        ...settings,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setSettings({
      ...settings,
      [name]: checked
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!settings.host || !settings.port || !settings.auth.user || 
        (settings.auth.pass === '' && !settings.id) || // Only require password for new settings
        !settings.from.name || !settings.from.email) {
      showAlert('Please fill in all required fields', 'error');
      return;
    }
    
    try {
      setSaving(true);
      const res = await axiosInstance.post('/email-settings', settings);
      if (res.data.success) {
        showAlert('Email settings saved successfully', 'success');
        // Refresh settings
        fetchSettings();
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      showAlert(error.response?.data?.message || 'Failed to save email settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      showAlert('Please enter a test email address', 'error');
      return;
    }
    
    try {
      setTesting(true);
      const res = await axiosInstance.post('/email-settings/test', { testEmail });
      if (res.data.success) {
        showAlert('Test email sent successfully! Please check your inbox.', 'success');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      showAlert(error.response?.data?.message || 'Failed to send test email', 'error');
    } finally {
      setTesting(false);
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
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to access this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Email Settings
      </Typography>
      <Typography variant="body1" paragraph>
        Configure the email server settings used for sending automated emails to clients and staff.
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    SMTP Server Configuration
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    label="SMTP Host"
                    name="host"
                    value={settings.host}
                    onChange={handleChange}
                    required
                    helperText="e.g., smtp.gmail.com"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="SMTP Port"
                    name="port"
                    type="number"
                    value={settings.port}
                    onChange={handleChange}
                    required
                    helperText="e.g., 587 or 465"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.secure}
                        onChange={handleSwitchChange}
                        name="secure"
                        color="primary"
                      />
                    }
                    label="Use Secure Connection (SSL/TLS)"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Authentication
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="auth.user"
                    value={settings.auth.user}
                    onChange={handleChange}
                    required
                    helperText="Usually your email address"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    name="auth.pass"
                    type="password"
                    value={settings.auth.pass}
                    onChange={handleChange}
                    required={!settings.id}
                    helperText={settings.id ? "Leave blank to keep current password" : "Required"}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Sender Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sender Name"
                    name="from.name"
                    value={settings.from.name}
                    onChange={handleChange}
                    required
                    helperText="e.g., Company Name"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sender Email"
                    name="from.email"
                    type="email"
                    value={settings.from.email}
                    onChange={handleChange}
                    required
                    helperText="e.g., noreply@company.com"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enabled}
                        onChange={handleSwitchChange}
                        name="enabled"
                        color="primary"
                      />
                    }
                    label="Enable Email Sending"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Box display="flex" justifyContent="space-between">
                    <Button
                      variant="contained"
                      color="primary"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? <CircularProgress size={24} /> : 'Save Settings'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Email Configuration
          </Typography>
          <Typography variant="body2" paragraph>
            Send a test email to verify your settings are working correctly.
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Test Email Address"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                type="email"
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleTestEmail}
                disabled={testing || loading || !settings._id}
                fullWidth
              >
                {testing ? <CircularProgress size={24} /> : 'Send Test Email'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default EmailSettings;