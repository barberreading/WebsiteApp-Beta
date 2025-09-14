import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const BookingCategoriesManager = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [dialog, setDialog] = useState({
    open: false,
    type: '', // 'key' or 'area'
    mode: '', // 'add' or 'edit'
    item: null
  });
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Fetch booking keys
      const keysRes = await axiosInstance.get('/booking-categories/keys');
      setKeys(keysRes.data.data);
      
      // Fetch location areas
      const areasRes = await axiosInstance.get('/booking-categories/areas');
      setAreas(areasRes.data.data);
    } catch (err) {
      logger.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleOpenDialog = (type, mode, item = null) => {
    setDialog({ open: true, type, mode, item });
    
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name,
        description: item.description || ''
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
  };
  
  const handleCloseDialog = () => {
    setDialog({ open: false, type: '', mode: '', item: null });
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { type, mode, item } = dialog;
    const endpoint = type === 'key' ? '/booking-categories/keys' : '/booking-categories/areas';
    
    try {
      if (mode === 'add') {
        await axiosInstance.post(endpoint, formData);
        setSuccess(`${type === 'key' ? 'Booking key' : 'Location area'} created successfully!`);
      } else if (mode === 'edit' && item) {
        await axiosInstance.put(`${endpoint}/${item._id}`, formData);
        setSuccess(`${type === 'key' ? 'Booking key' : 'Location area'} updated successfully!`);
      }
      
      fetchCategories();
      handleCloseDialog();
    } catch (err) {
      logger.error('Error saving category:', err);
      setError(err.response?.data?.message || `Failed to ${mode} ${type}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type === 'key' ? 'booking key' : 'location area'}?`)) {
      return;
    }
    
    setLoading(true);
    const endpoint = type === 'key' ? '/booking-categories/keys' : '/booking-categories/areas';
    
    try {
      await axiosInstance.delete(`${endpoint}/${id}`);
      setSuccess(`${type === 'key' ? 'Booking key' : 'Location area'} deleted successfully!`);
      fetchCategories();
    } catch (err) {
      logger.error('Error deleting category:', err);
      setError(err.response?.data?.message || `Failed to delete ${type}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess('');
    setError('');
  };
  
  // Only admins, managers and superusers can manage booking categories
  if (user.role !== 'admin' && user.role !== 'manager' && user.role !== 'superuser') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You do not have permission to manage booking categories.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Manage Booking Categories
        </Typography>
        
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Booking Keys" />
          <Tab label="Location Areas" />
        </Tabs>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading && !dialog.open ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {tabValue === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Booking Keys</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('key', 'add')}
                  >
                    Add Key
                  </Button>
                </Box>
                
                {keys.length === 0 ? (
                  <Alert severity="info">No booking keys found. Create one to get started.</Alert>
                ) : (
                  <List>
                    {keys.map((key) => (
                      <ListItem key={key._id} divider>
                        <ListItemText
                          primary={key.name}
                          secondary={key.description || 'No description'}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleOpenDialog('key', 'edit', key)} sx={{ mr: 1 }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => handleDelete('key', key._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
            
            {tabValue === 1 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Location Areas</Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog('area', 'add')}
                  >
                    Add Area
                  </Button>
                </Box>
                
                {areas.length === 0 ? (
                  <Alert severity="info">No location areas found. Create one to get started.</Alert>
                ) : (
                  <List>
                    {areas.map((area) => (
                      <ListItem key={area._id} divider>
                        <ListItemText
                          primary={area.name}
                          secondary={area.description || 'No description'}
                        />
                        <ListItemSecondaryAction>
                          <IconButton edge="end" onClick={() => handleOpenDialog('area', 'edit', area)} sx={{ mr: 1 }}>
                            <EditIcon />
                          </IconButton>
                          <IconButton edge="end" onClick={() => handleDelete('area', area._id)}>
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>
      
      {/* Add/Edit Dialog */}
      <Dialog open={dialog.open} onClose={handleCloseDialog}>
        <DialogTitle>
          {dialog.mode === 'add' ? 'Add' : 'Edit'} {dialog.type === 'key' ? 'Booking Key' : 'Location Area'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!success || !!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={success ? "success" : "error"}
        >
          {success || error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookingCategoriesManager;