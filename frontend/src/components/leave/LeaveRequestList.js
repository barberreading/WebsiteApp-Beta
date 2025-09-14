import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton,
  Snackbar
} from '@mui/material';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { faEye, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { handleApiError } from '../../utils/errorHandler';
import { formatDate } from '../../utils/dateUtils';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import RefreshIcon from '@mui/icons-material/Refresh';

const LeaveRequestList = () => {
  const { user, currentUser } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [denyDialog, setDenyDialog] = useState({ open: false, requestId: null });
  const [denialReason, setDenialReason] = useState('');
  
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/leave-requests');
      setRequests(response.data.data);
    } catch (err) {
      logger.error('Error fetching leave requests:', err);
      setError('Failed to load leave requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRequests();
  }, []);
  
  const handleApproveRequest = async (requestId) => {
    try {
      await axiosInstance.put(`/leave-requests/${requestId}/approve`);
      setSuccess('Leave request approved successfully!');
      fetchRequests(); // Refresh the list
    } catch (err) {
      logger.error('Error approving leave request:', err);
      setError(err.response?.data?.message || 'Failed to approve leave request');
    }
  };
  
  const handleOpenDenyDialog = (requestId) => {
    setDenyDialog({ open: true, requestId });
    setDenialReason('');
  };
  
  const handleDenyRequest = async () => {
    try {
      await axiosInstance.put(`/leave-requests/${denyDialog.requestId}/deny`, {
        reason: denialReason
      });
      setSuccess('Leave request denied.');
      setDenyDialog({ open: false, requestId: null });
      fetchRequests(); // Refresh the list
    } catch (err) {
      logger.error('Error denying leave request:', err);
      setError(err.response?.data?.message || 'Failed to deny leave request');
    }
  };
  
  const handleWithdrawRequest = async (requestId) => {
    try {
      await axiosInstance.put(`/leave-requests/${requestId}/withdraw`);
      setSuccess('Leave request withdrawn successfully!');
      fetchRequests(); // Refresh the list
    } catch (err) {
      logger.error('Error withdrawing leave request:', err);
      setError(err.response?.data?.message || 'Failed to withdraw leave request');
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccess('');
    setError('');
  };
  
  const getStatusChip = (status) => {
    switch (status) {
      case 'pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'denied':
        return <Chip label="Denied" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };
  
  const canManageRequests = currentUser && (currentUser.role === 'manager' || currentUser.role === 'superuser' || currentUser.role === 'admin');
  
  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">
            Leave Requests
          </Typography>
          <Box>
            <IconButton onClick={fetchRequests} title="Refresh">
              <RefreshIcon />
            </IconButton>
            {currentUser && currentUser.role === 'staff' && (
              <Button 
                component={Link}
                to="/leave-requests/new"
                variant="contained" 
                color="primary" 
                sx={{ ml: 1 }}
              >
                New Request
              </Button>
            )}
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
        ) : requests.length === 0 ? (
          <Alert severity="info">
            No leave requests found.
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>{request.staff?.name || 'Unknown'}</TableCell>
                    <TableCell>{format(new Date(request.startDate), 'PP')}</TableCell>
                    <TableCell>{format(new Date(request.endDate), 'PP')}</TableCell>
                    <TableCell>{request.reason}</TableCell>
                    <TableCell>{getStatusChip(request.status)}</TableCell>
                    <TableCell>{format(new Date(request.createdAt), 'PP')}</TableCell>
                    <TableCell>
                      {canManageRequests && request.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            color="success"
                            onClick={() => handleApproveRequest(request._id)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleOpenDenyDialog(request._id)}
                          >
                            Deny
                          </Button>
                        </>
                      )}
                      {currentUser && currentUser.role === 'staff' && 
                       request.staff?._id === currentUser.id && 
                       request.status === 'pending' && (
                        <Button
                          size="small"
                          color="warning"
                          onClick={() => handleWithdrawRequest(request._id)}
                        >
                          Withdraw
                        </Button>
                      )}
                      {request.status === 'denied' && request.denialReason && (
                        <Typography variant="caption" color="error">
                          Reason: {request.denialReason}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      
      {/* Denial Dialog */}
      <Dialog
        open={denyDialog.open}
        onClose={() => setDenyDialog({ open: false, requestId: null })}
      >
        <DialogTitle>Deny Leave Request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please provide a reason for denying this leave request.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            fullWidth
            multiline
            rows={3}
            value={denialReason}
            onChange={(e) => setDenialReason(e.target.value)}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDenyDialog({ open: false, requestId: null })} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDenyRequest} 
            color="primary" 
            variant="contained"
            disabled={!denialReason.trim()}
          >
            Deny Request
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

export default LeaveRequestList;