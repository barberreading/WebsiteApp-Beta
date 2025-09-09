import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axiosInstance';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  TextField,
  Typography,
  Snackbar,
  Alert
} from '@mui/material';
import { SketchPicker } from 'react-color';

const BrandingManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [branding, setBranding] = useState({
    companyName: '',
    logo: '',
    primaryColor: '#3f51b5',
    secondaryColor: '#f50057',
    emailHeader: '',
    emailFooter: '',
    emailSignature: ''
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColor, setActiveColor] = useState('primary');
  const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const res = await axiosInstance.get('/branding');
      setBranding(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching branding:', err);
      setAlert({
        open: true,
        message: 'Failed to load branding settings',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setBranding({
      ...branding,
      [e.target.name]: e.target.value
    });
  };

  const handleColorChange = (color) => {
    setBranding({
      ...branding,
      [activeColor === 'primary' ? 'primaryColor' : 'secondaryColor']: color.hex
    });
  };

  const handleColorPickerClick = (colorType) => {
    setActiveColor(colorType);
    setShowColorPicker(true);
  };

  const handleCloseColorPicker = () => {
    setShowColorPicker(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      setAlert({
        open: true,
        message: 'Please select an image file',
        severity: 'error'
      });
      return;
    }

    setLogoFile(file);
    
    // Preview the logo
    const reader = new FileReader();
    reader.onload = (e) => {
      setBranding({
        ...branding,
        logo: e.target.result
      });
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;
    
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const res = await axiosInstance.post('/branding/upload-logo', {
              logoData: e.target.result
            });
            resolve(res.data.logo);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(logoFile);
      });
    } catch (err) {
      console.error('Error uploading logo:', err);
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Upload logo if a new one was selected
      if (logoFile) {
        const logoUrl = await uploadLogo();
        if (logoUrl) {
          branding.logo = logoUrl;
        }
      }
      
      // Save branding settings
      await axiosInstance.put('/branding', branding);
      
      setAlert({
        open: true,
        message: 'Branding settings saved successfully',
        severity: 'success'
      });
      
      // Reset logo file state
      setLogoFile(null);
    } catch (err) {
      console.error('Error saving branding:', err);
      setAlert({
        open: true,
        message: 'Failed to save branding settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Branding Settings
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="companyName"
                    value={branding.companyName}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      Company Logo
                    </Typography>
                    
                    {branding.logo && (
                      <Box mb={2} display="flex" justifyContent="center">
                        <img 
                          src={branding.logo} 
                          alt="Company Logo" 
                          style={{ maxWidth: '100%', maxHeight: '100px' }} 
                        />
                      </Box>
                    )}
                    
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                    >
                      Upload Logo
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoChange}
                      />
                    </Button>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Primary Color
                  </Typography>
                  <Box 
                    display="flex" 
                    alignItems="center"
                    onClick={() => handleColorPickerClick('primary')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box
                      width={40}
                      height={40}
                      bgcolor={branding.primaryColor}
                      borderRadius={1}
                      mr={2}
                      border="1px solid #ccc"
                    />
                    <Typography>{branding.primaryColor}</Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Secondary Color
                  </Typography>
                  <Box 
                    display="flex" 
                    alignItems="center"
                    onClick={() => handleColorPickerClick('secondary')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box
                      width={40}
                      height={40}
                      bgcolor={branding.secondaryColor}
                      borderRadius={1}
                      mr={2}
                      border="1px solid #ccc"
                    />
                    <Typography>{branding.secondaryColor}</Typography>
                  </Box>
                </Grid>
                
                {showColorPicker && (
                  <Grid item xs={12}>
                    <Box position="relative" p={2} border="1px solid #ddd" borderRadius={1}>
                      <Box position="absolute" top={10} right={10} zIndex={1}>
                        <Button onClick={handleCloseColorPicker}>Close</Button>
                      </Box>
                      <Typography variant="subtitle1" gutterBottom>Select a color:</Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} mt={2}>
                        {['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#000000', '#FFFFFF'].map((color) => (
                          <Box 
                            key={color}
                            width={50}
                            height={50}
                            bgcolor={color}
                            border="1px solid #ccc"
                            borderRadius={1}
                            onClick={() => {
                              handleColorChange({ hex: color });
                              handleCloseColorPicker();
                            }}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { 
                                transform: 'scale(1.05)',
                                boxShadow: '0 0 5px rgba(0,0,0,0.2)'
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Header"
                    name="emailHeader"
                    value={branding.emailHeader}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={2}
                    placeholder="HTML content for email header"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Footer"
                    name="emailFooter"
                    value={branding.emailFooter}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={2}
                    placeholder="HTML content for email footer"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Signature"
                    name="emailSignature"
                    value={branding.emailSignature}
                    onChange={handleChange}
                    margin="normal"
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
              
              <Box mt={3} display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </form>
      </Box>
      
      <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BrandingManager;