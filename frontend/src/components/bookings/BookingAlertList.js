import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { useLocation } from 'react-router-dom';

const BookingAlertList = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, alertId: null });
  const [rejectDialog, setRejectDialog] = useState({ open: false, alertId: null });
  const [cancelDialog, setCancelDialog] = useState({ open: false, alertId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  
  // Check if we should filter for pending alerts
  const searchParams = new URLSearchParams(location.search);
  const showPendingOnly = searchParams.get('filter') === 'pending';

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/booking-alerts');
      
      if (response.data) {
        setAlerts(response.data.data || []);
      } else {
        setError('Failed to fetch booking alerts');
      }
    } catch (err) {
      setError('Error fetching booking alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const getStatusChip = (status) => {
    const statusConfig = {
      'open': { color: 'primary', label: 'Open' },
      'claimed': { color: 'warning', label: 'Claimed' },
      'pending_confirmation': { color: 'secondary', label: 'Pending Confirmation' },
      'confirmed': { color: 'success', label: 'Confirmed' },
      'rejected': { color: 'error', label: 'Rejected' },
      'cancelled': { color: 'default', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || { color: 'default', label: status };
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  const handleClaimAlert = (alertId) => {
    setConfirmDialog({ open: true, alertId });
  };

  const confirmClaim = async () => {
    const alertId = confirmDialog.alertId;
    // Optimistically update the UI
    let claimedByUser = null;
    if (currentUser) {
        const nameParts = currentUser.name ? currentUser.name.split(' ') : ['',''];
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');
        claimedByUser = { ...currentUser, firstName, lastName };
    }

    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert._id === alertId ? { ...alert, status: 'pending_confirmation', claimedBy: claimedByUser } : alert
      )
    );
    setConfirmDialog({ open: false, alertId: null });

    try {
      const response = await axiosInstance.put(`/booking-alerts/${alertId}/claim`);
      
      if (response.data) {
        setSuccess('Alert claimed successfully! A manager will review your request.');
        // Re-fetch to get the latest data from the server
        fetchAlerts();
      } else {
        // Revert the optimistic update on failure
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            alert._id === alertId ? { ...alert, status: 'open', claimedBy: null } : alert
          )
        );
        const errorData = response.data;
        setError(errorData.message || 'Failed to claim alert');
      }
    } catch (err) {
      // Revert the optimistic update on error
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert._id === alertId ? { ...alert, status: 'open', claimedBy: null } : alert
        )
      );
      setError('Error claiming alert');
    }
  };

  const handleRejectAlert = (alertId) => {
    setRejectDialog({ open: true, alertId });
    setRejectReason('');
  };

  const confirmReject = async () => {
    try {
      const response = await axiosInstance.put(`/booking-alerts/${rejectDialog.alertId}/reject`, { reason: rejectReason });
      
      if (response.data) {
        setSuccess('Alert rejected successfully.');
        setRejectDialog({ open: false, alertId: null });
        setRejectReason('');
        fetchAlerts();
      } else {
        const errorData = response.data;
        setError(errorData.message || 'Failed to reject alert');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('This alert no longer exists. The alert list has been refreshed.');
        setRejectDialog({ open: false, alertId: null });
        setRejectReason('');
        fetchAlerts();
      } else {
        setError('Error rejecting alert');
      }
    }
  };

  const handleConfirmAlert = async (alertId) => {
    try {
      const response = await axiosInstance.put(`/booking-alerts/${alertId}/confirm`);
      
      if (response.data) {
        setSuccess('Alert confirmed successfully! Booking has been created.');
        fetchAlerts();
      } else {
        const errorData = response.data;
        setError(errorData.message || 'Failed to confirm alert');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('This alert no longer exists. The alert list has been refreshed.');
        fetchAlerts();
      } else {
        setError('Error confirming alert');
      }
    }
  };

  const handleCancelAlert = (alertId) => {
    setCancelDialog({ open: true, alertId });
    setCancelReason('');
  };

  const confirmCancelAlert = async () => {
    try {
      const response = await axiosInstance.put(`/booking-alerts/${cancelDialog.alertId}/cancel-alert`, { reason: cancelReason });
      
      if (response.data) {
        setSuccess('Alert cancelled successfully.');
        setCancelDialog({ open: false, alertId: null });
        setCancelReason('');
        fetchAlerts();
      } else {
        const errorData = response.data;
        setError(errorData.message || 'Failed to cancel alert');
      }
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // Alert no longer exists, refresh the list and close dialog
        setError('This alert no longer exists. The alert list has been refreshed.');
        setCancelDialog({ open: false, alertId: null });
        setCancelReason('');
        fetchAlerts();
      } else {
        setError('Error cancelling alert');
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess('');
    setError('');
  };

  const canClaimAlert = (alert) => {
    return alert.status === 'open' && 
           currentUser && 
           currentUser.role === 'staff' &&
           (!alert.targetStaff || alert.targetStaff.length === 0 || 
            alert.targetStaff.some(staff => staff._id === currentUser._id));
  };

  const canConfirmAlert = (alert) => {
    return alert.status === 'pending_confirmation' && 
           currentUser && 
           ['manager', 'superuser', 'admin'].includes(currentUser.role);
  };

  const canRejectAlert = (alert) => {
    return alert.status === 'pending_confirmation' && 
           currentUser && 
           ['manager', 'superuser', 'admin'].includes(currentUser.role);
  };

  const canCancelAlert = (alert) => {
    return ['open', 'claimed'].includes(alert.status) && 
           currentUser && 
           ['manager', 'superuser', 'admin'].includes(currentUser.role);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            {showPendingOnly ? 'Pending Booking Alerts' : 'Booking Alerts'}
          </Typography>
          <Box>
            <IconButton onClick={fetchAlerts} title="Refresh">
              <RefreshIcon />
            </IconButton>
            {currentUser && (['manager', 'superuser', 'admin'].includes(currentUser.role)) ? (
              <Button 
                variant="contained" 
                color="primary" 
                component={Link}
                to="/booking-alerts/new"
                sx={{ ml: 1 }}
              >
                Create Alert
              </Button>
            ) : null}
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : alerts.filter(alert => showPendingOnly ? ['open', 'claimed', 'pending_confirmation'].includes(alert.status) : true).length === 0 ? (
          <Alert severity="info">
            {showPendingOnly ? 'No pending booking alerts at this time.' : 'No booking alerts available at this time.'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {alerts
              .filter(alert => showPendingOnly ? ['open', 'claimed', 'pending_confirmation'].includes(alert.status) : true)
              .map((alert) => (
              <Grid item xs={12} md={6} lg={4} key={alert._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                        {alert.title}
                      </Typography>
                      {getStatusChip(alert.status)}
                    </Box>
                    
                    {alert.bookingKey && (
                      <Chip 
                        label={alert.bookingKey} 
                        size="small" 
                        color="info" 
                        sx={{ mr: 1, mb: 1 }} 
                      />
                    )}
                    
                    {alert.locationArea && (
                      <Chip 
                        label={alert.locationArea} 
                        size="small" 
                        color="info" 
                        sx={{ mb: 1 }} 
                      />
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {alert.description}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                      <TimeIcon sx={{ mr: 1, fontSize: 16, mt: 0.2 }} />
                      <Box>
                        {alert.isMultiDay && alert.bookingDays && alert.bookingDays.length > 0 ? (
                          <>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              Multi-day booking ({alert.bookingDays.length} days)
                            </Typography>
                            {alert.bookingDays.map((day, index) => (
                              <Typography key={index} variant="body2" sx={{ fontSize: '0.85rem', mb: 0.3 }}>
                                Day {index + 1}: {new Date(day.startTime).toLocaleString()} - {new Date(day.endTime).toLocaleString()}
                              </Typography>
                            ))}
                          </>
                        ) : (
                          <Typography variant="body2">
                            {new Date(alert.startTime).toLocaleString()} - {new Date(alert.endTime).toLocaleString()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    {alert.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <LocationIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {typeof alert.location === 'object' 
                            ? `${alert.location.address || ''}, ${alert.location.city || ''}, ${alert.location.postcode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',') || 'Location not specified'
                            : alert.location
                          }
                        </Typography>
                      </Box>
                    )}
                    
                    {alert.claimedBy && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <PersonIcon sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          Claimed by: {alert.claimedBy.firstName} {alert.claimedBy.lastName}
                        </Typography>
                      </Box>
                    )}
                    
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(alert.createdAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    {canClaimAlert(alert) && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="primary"
                        onClick={() => handleClaimAlert(alert._id)}
                      >
                        Claim Shift
                      </Button>
                    )}
                    
                    {canConfirmAlert(alert) && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        color="success"
                        onClick={() => handleConfirmAlert(alert._id)}
                      >
                        Confirm Booking
                      </Button>
                    )}
                    
                    {canRejectAlert(alert) && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="warning"
                        onClick={() => handleRejectAlert(alert._id)}
                      >
                        Reject Claim
                      </Button>
                    )}
                    
                    {canCancelAlert(alert) && (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        color="error"
                        onClick={() => handleCancelAlert(alert._id)}
                      >
                        Cancel Alert
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, alertId: null })}
      >
        <DialogTitle>Confirm Shift Claim</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to claim this shift? Once claimed, a manager will need to confirm the booking.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, alertId: null })} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmClaim} color="primary" variant="contained">
            Confirm Claim
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, alertId: null })}
      >
        <DialogTitle>Reject Booking Claim</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for rejecting this booking claim. The alert will be sent back to other available staff.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="rejectReason"
            label="Rejection Reason"
            type="text"
            fullWidth
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, alertId: null })} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmReject} 
            color="warning" 
            variant="contained"
            disabled={!rejectReason.trim()}
          >
            Reject Booking
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Alert Dialog */}
      <Dialog
        open={cancelDialog.open}
        onClose={() => setCancelDialog({ open: false, alertId: null })}
      >
        <DialogTitle>Cancel Booking Alert</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this booking alert? Please provide a reason for cancellation.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="cancelReason"
            label="Cancellation Reason"
            type="text"
            fullWidth
            variant="outlined"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, alertId: null })} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmCancelAlert} 
            color="error" 
            variant="contained"
            disabled={!cancelReason.trim()}
          >
            Cancel Alert
          </Button>
        </DialogActions>
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

export default BookingAlertList;