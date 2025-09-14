import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { handleApiError } from '../utils/errorHandler';
import { toast } from 'react-toastify';
import { Container, Row, Col, Card, Button, Alert, Form, Modal } from 'react-bootstrap';

const ClockInOut = () => {
  const [clockStatus, setClockStatus] = useState('loading');
  const [currentShift, setCurrentShift] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [clients, setClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [showTimeEditModal, setShowTimeEditModal] = useState(false);
  const [clockOutTime, setClockOutTime] = useState('');
  const [breaks, setBreaks] = useState([{ startTime: '', endTime: '', duration: 0 }]);
  
  useEffect(() => {
    initialize();
  }, []);
  
  const initialize = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Fetch current clock status
      const statusRes = await axiosInstance.get('/timesheets/current-status');
      logger.log('Status response:', statusRes.data);
      
      if (statusRes.data && statusRes.data.clockedIn) {
        setClockStatus('in');
        setCurrentShift(statusRes.data.currentShift);
      } else {
        setClockStatus('out');
        setCurrentShift(null);
      }
      
      // Fetch clients for the dropdown
      const clientsRes = await axiosInstance.get('/clients');
      setClients(clientsRes.data || []);
      
    } catch (err) {
      logger.error('Error initializing:', err.message || err);
      if (err.response) {
        logger.error('Response data:', err.response.data);
        logger.error('Response status:', err.response.status);
      }
      setClockStatus('error');
      setError('Failed to load data. Please refresh the page or check your login status.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async (clientId = null) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Always show client selection modal instead of automatic clock-in
      if (!clientId) {
        setShowClientModal(true);
        setLoading(false);
        return;
      }
      
      // Ensure clientId is a string, not an object
      let payload = {};
      if (clientId) {
        payload.clientId = typeof clientId === 'object' ? clientId._id : clientId;
      }
      
      // Simplify the payload to minimum required data
      const minimalPayload = { clientId: payload.clientId };
      const res = await axiosInstance.post('/timesheets/clock-in', minimalPayload);
      
      setClockStatus('in');
      setCurrentShift(res.data);
      setSuccess('You have successfully clocked in!');
      setShowClientModal(false);
    } catch (err) {
      logger.error('Error clocking in:', err);
      if (err.response?.data?.msg === 'No client found for today. Please select a client manually.') {
        // Show client selection modal if no client found
        setShowClientModal(true);
        setLoading(false);
      } else {
        setError(err.response?.data?.msg || 'Failed to clock in. Please try again.');
        setLoading(false);
      }
    }
  };
  
  const handleClientSelection = () => {
    if (!selectedClient) {
      setError('Please select a client');
      return;
    }
    // Make sure we're sending just the client ID, not the entire client object
    const clientId = selectedClient._id || selectedClient;
    handleClockIn(clientId);
  };

  const handleClockOut = () => {
    // Set default clock out time to now
    const now = new Date();
    setClockOutTime(now.toISOString().slice(0, 16)); // Format for datetime-local input
    setShowTimeEditModal(true);
  };
  
  const submitClockOut = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Filter out incomplete breaks
      const validBreaks = breaks.filter(b => b.startTime && b.endTime);
      
      // Calculate duration for each break
      const processedBreaks = validBreaks.map(b => {
        const startTime = new Date(b.startTime);
        const endTime = new Date(b.endTime);
        const durationMinutes = Math.round((endTime - startTime) / 60000);
        
        return {
          startTime: b.startTime,
          endTime: b.endTime,
          duration: durationMinutes
        };
      });
      
      // Simplify the payload to minimum required data
      const res = await axiosInstance.post('/timesheets/clock-out', {
        clockOutTime,
        breaks: processedBreaks.length > 0 ? processedBreaks : []
      });
      
      setClockStatus('out');
      setCurrentShift(null);
      setSuccess('You have successfully clocked out!');
      setShowTimeEditModal(false);
    } catch (err) {
      logger.error('Error clocking out:', err);
      setError(err.response?.data?.msg || 'Failed to clock out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-4">
      <h1 className="mb-4">Clock In/Out</h1>
      
      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" onClose={() => setSuccess('')} dismissible>
          {success}
        </Alert>
      )}
      
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="text-center p-5">
              <h2 className="mb-4">Current Status: {loading ? 'Loading...' : clockStatus === 'in' ? 'Clocked In' : 'Clocked Out'}</h2>
              
              {currentShift && (
                <div className="mb-4">
                  <p className="mb-1"><strong>Clocked in at:</strong> {new Date(currentShift.clockIn).toLocaleString()}</p>
                  {currentShift.client && (
                    <p className="mb-1"><strong>Client:</strong> {currentShift.client.name}</p>
                  )}
                  <p className="mb-0"><strong>Duration:</strong> {calculateDuration(currentShift.clockIn)}</p>
                </div>
              )}
              
              {clockStatus === 'out' ? (
                <Button 
                  variant="success" 
                  size="lg" 
                  className="px-5 py-3" 
                  onClick={handleClockIn}
                  disabled={loading}
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  Clock In
                </Button>
              ) : (
                <Button 
                  variant="danger" 
                  size="lg" 
                  className="px-5 py-3" 
                  onClick={handleClockOut}
                  disabled={loading}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Clock Out
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Client Selection Modal */}
      <Modal show={showClientModal} onHide={() => setShowClientModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Select Client</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>No client was found in your calendar for today. Please select a client manually:</p>
          <Form>
            <Form.Group>
              <Form.Label>Client</Form.Label>
              <Form.Control 
                as="select" 
                value={selectedClient || ""}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClientModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleClientSelection}>
            Clock In
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Time Editing Modal */}
      <Modal show={showTimeEditModal} onHide={() => setShowTimeEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit Clock Out Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Clock Out Time</Form.Label>
              <Form.Control 
                type="datetime-local" 
                value={clockOutTime}
                onChange={(e) => setClockOutTime(e.target.value)}
              />
            </Form.Group>
            
            <h5 className="mt-4 mb-3">Breaks</h5>
            {breaks.map((breakItem, index) => (
              <Row key={index} className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label>Start Time</Form.Label>
                    <Form.Control 
                      type="datetime-local" 
                      value={breakItem.startTime}
                      onChange={(e) => {
                        const newBreaks = [...breaks];
                        newBreaks[index].startTime = e.target.value;
                        setBreaks(newBreaks);
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label>End Time</Form.Label>
                    <Form.Control 
                      type="datetime-local" 
                      value={breakItem.endTime}
                      onChange={(e) => {
                        const newBreaks = [...breaks];
                        newBreaks[index].endTime = e.target.value;
                        setBreaks(newBreaks);
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col xs="auto" className="d-flex align-items-end mb-2">
                  <Button 
                    variant="danger" 
                    onClick={() => {
                      const newBreaks = breaks.filter((_, i) => i !== index);
                      setBreaks(newBreaks.length ? newBreaks : [{ startTime: '', endTime: '', duration: 0 }]);
                    }}
                  >
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}
            
            <Button 
              variant="secondary" 
              className="mt-2"
              onClick={() => setBreaks([...breaks, { startTime: '', endTime: '', duration: 0 }])}
            >
              Add Break
            </Button>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTimeEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submitClockOut}>
            Submit Clock Out
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

// Helper function to calculate duration
const calculateDuration = (startTime) => {
  const start = new Date(startTime);
  const now = new Date();
  const diffMs = now - start;
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
};

export default ClockInOut;