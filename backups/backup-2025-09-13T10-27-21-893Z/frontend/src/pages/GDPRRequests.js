import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Alert, Table } from 'react-bootstrap';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';

const GDPRRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token, user } = useAuth();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/gdpr/requests');
      setRequests(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch GDPR requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleDataRequest = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/gdpr/data-request', {});
      setSuccess('Data request submitted successfully. You will be notified when your data is ready for download.');
      fetchRequests();
    } catch (err) {
      setError('Failed to submit data request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletionRequest = async () => {
    if (window.confirm('Are you sure you want to request account deletion? This action cannot be undone once processed.')) {
      try {
        setLoading(true);
        await axiosInstance.post('/gdpr/deletion-request', {});
        setSuccess('Deletion request submitted successfully. Your account will be processed for deletion within 30 days.');
        fetchRequests();
      } catch (err) {
        setError('Failed to submit deletion request');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleProcessRequest = async (id, action) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/gdpr/requests/${id}`, { status: action });
      setSuccess(`Request ${action === 'approved' ? 'approved' : 'rejected'} successfully`);
      fetchRequests();
    } catch (err) {
      setError(`Failed to ${action} request`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !requests.length) return <div className="loading-spinner">Loading...</div>;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">GDPR Data Requests</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      {user && (user.role === 'client' || user.role === 'staff') ? (
        <Card className="mb-4">
          <Card.Body>
            <h4>Your GDPR Rights</h4>
            <p>
              Under the General Data Protection Regulation (GDPR), you have the right to access, 
              modify, and request deletion of your personal data.
            </p>
            
            <div className="d-flex gap-2 mt-3">
              <Button variant="primary" onClick={handleDataRequest}>
                Request My Data
              </Button>
              <Button variant="danger" onClick={handleDeletionRequest}>
                Request Account Deletion
              </Button>
            </div>
          </Card.Body>
        </Card>
      ) : null}
      
      <h4>Your Requests</h4>
      {requests.length > 0 ? (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Request Type</th>
              <th>Date Requested</th>
              <th>Status</th>
              <th>Last Updated</th>
              {user && (user.role === 'manager' || user.role === 'superuser') ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <tr key={request._id}>
                <td>{request.type}</td>
                <td>{new Date(request.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                <td>
                  <span className={`badge bg-${
                    request.status === 'pending' ? 'warning' : 
                    request.status === 'approved' ? 'success' : 
                    request.status === 'rejected' ? 'danger' : 'secondary'
                  }`}>
                    {request.status}
                  </span>
                </td>
                <td>{new Date(request.updatedAt).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                {user && (user.role === 'manager' || user.role === 'superuser') && request.status === 'pending' ? (
                  <td>
                    <Button 
                      variant="success" 
                      size="sm" 
                      className="me-2"
                      onClick={() => handleProcessRequest(request._id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => handleProcessRequest(request._id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </td>
                ) : user && (user.role === 'manager' || user.role === 'superuser') ? (
                  <td>No actions available</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-muted">No GDPR requests found</p>
      )}
      
      {user && (user.role === 'manager' || user.role === 'superuser') ? (
        <div className="mt-4">
          <h4>GDPR Compliance Dashboard</h4>
          <Card>
            <Card.Body>
              <p>This dashboard would display GDPR compliance metrics and pending requests from all users.</p>
            </Card.Body>
          </Card>
        </div>
      ) : null}
    </Container>
  );
};

export default GDPRRequests;