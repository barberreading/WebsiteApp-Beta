import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert, Modal } from 'react-bootstrap';
import axiosInstance from '../utils/axiosInstance';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const BookingEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [isSeriesBooking, setIsSeriesBooking] = useState(false);
  const [editOption, setEditOption] = useState('single');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  
  const [formData, setFormData] = useState({
    service: '',
    client: '',
    staff: '',
    startTime: '',
    endTime: '',
    notes: '',
    seriesId: '',
    status: 'confirmed'
  });

  // Fetch booking data
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await axiosInstance.get(`/bookings/${id}`);
        
        setBooking(response.data);
        
        // Format dates for form inputs
        const startTime = parseISO(response.data.startTime);
        const endTime = parseISO(response.data.endTime);
        
        // Check if this is part of a series
        const isPartOfSeries = response.data.seriesId ? true : false;
        setIsSeriesBooking(isPartOfSeries);
        
        setFormData({
          service: response.data.service?._id || '',
          client: response.data.client?._id || '',
          staff: response.data.staff?._id || '',
          startTime: format(startTime, "yyyy-MM-dd'T'HH:mm"),
          endTime: format(endTime, "yyyy-MM-dd'T'HH:mm"),
          notes: response.data.notes || '',
          seriesId: response.data.seriesId || ''
        });
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load booking details');
        setLoading(false);
        console.error(err);
      }
    };

    fetchBooking();
  }, [id, token]);

  // Fetch services, clients, and staff
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, clientsRes, staffRes] = await Promise.all([
          axiosInstance.get(`/services`),
          axiosInstance.get(`/clients`),
          axiosInstance.get(`/users/staff`)
        ]);

        setServices(servicesRes.data);
        setClients(clientsRes.data);
        setStaff(staffRes.data);
      } catch (err) {
        setError('Failed to load form data');
        console.error(err);
      }
    };

    fetchData();
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // If this is a series booking, show the modal to ask user what to update
    if (isSeriesBooking && formData.seriesId) {
      // Reset edit option to ensure user makes a deliberate choice
      setEditOption('single');
      setShowSeriesModal(true);
      return;
    }
    
    // Otherwise, just update this single booking
    await updateBooking('single');
  };
  
  const updateBooking = async (updateType) => {
    try {
      // Add notification data if sending notifications
      const dataToSend = {
        ...formData,
        sendNotification: sendNotification
      };
      
      console.log('Update type:', updateType);
      console.log('Series ID:', formData.seriesId);
      
      if (updateType === 'series' && formData.seriesId) {
        // Update all bookings in the series
        const res = await axiosInstance.put(
          `/bookings/series/${formData.seriesId}`,
          dataToSend
        );
        console.log('Series update response:', res.data);
        setSuccess(`All bookings in series updated successfully (${res.data.count} bookings)`);
      } else {
        // Update just this booking
        await axiosInstance.put(
          `/bookings/${id}`,
          dataToSend
        );
        setSuccess('Booking updated successfully');
      }
      
      // Navigate back to calendar after short delay
      setTimeout(() => {
        navigate('/calendar');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update booking');
      console.error(err);
    }
  };
  
  // Handle booking cancellation
  const handleCancelBooking = () => {
    setShowCancelModal(true);
  };
  
  // Confirm booking cancellation
  const confirmCancelBooking = async (cancelType) => {
    setShowCancelModal(false);
    
    try {
      const dataToSend = {
        ...formData,
        status: 'cancelled',
        sendNotification: sendNotification
      };
      
      if (cancelType === 'series' && formData.seriesId) {
        // Cancel all bookings in the series
        const res = await axiosInstance.put(
          `/bookings/series/${formData.seriesId}`,
          dataToSend
        );
        setSuccess(`All bookings in series cancelled successfully (${res.data.count} bookings)`);
      } else {
        // Cancel just this booking
        await axiosInstance.put(
          `/bookings/${id}`,
          dataToSend
        );
        setSuccess('Booking cancelled successfully');
      }
      
      // Navigate back to calendar after short delay
      setTimeout(() => {
        navigate('/calendar');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error cancelling booking');
    }
  };
  
  // Convert booking to booking alert
  const convertToBookingAlert = async () => {
    try {
      // Get booking data to create alert
      const alertData = {
        title: `Booking Alert: ${booking.service?.name || 'Service'}`,
        description: `Need replacement for ${booking.staff?.name || 'staff member'} on ${format(parseISO(booking.startTime), 'MMM dd, yyyy HH:mm')}`,
        startTime: formData.startTime,
        endTime: formData.endTime,
        service: formData.service,
        client: formData.client,
        status: 'open',
        originalBookingId: id
      };
      
      // Create booking alert
      await axiosInstance.post(
        `/booking-alerts`,
        alertData
      );
      
      // Cancel the original booking
      const cancelData = {
        ...formData,
        status: 'cancelled',
        sendNotification: sendNotification,
        notes: formData.notes + ' (Converted to booking alert)'
      };
      
      await axiosInstance.put(
        `/bookings/${id}`,
        cancelData
      );
      
      setSuccess('Booking converted to alert successfully');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/booking-alerts');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error converting booking to alert');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await axiosInstance.delete(`/bookings/${id}`);
        
        setSuccess('Booking deleted successfully');
        
        // Navigate back to calendar after short delay
        setTimeout(() => {
          navigate('/calendar');
        }, 1500);
      } catch (err) {
        setError(err.response?.data?.msg || 'Failed to delete booking');
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <Card>
          <Card.Body className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading booking details...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      {/* Series Edit Modal */}
      <Modal show={showSeriesModal} onHide={() => setShowSeriesModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Series Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>This booking is part of a series. Would you like to:</p>
          <Form.Check
            type="radio"
            id="edit-single"
            label="Edit only this booking"
            name="editOption"
            value="single"
            checked={editOption === 'single'}
            onChange={() => setEditOption('single')}
            className="mb-2"
          />
          <Form.Check
            type="radio"
            id="edit-series"
            label="Edit all bookings in this series"
            name="editOption"
            value="series"
            checked={editOption === 'series'}
            onChange={() => setEditOption('series')}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSeriesModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowSeriesModal(false);
              // Ensure we're passing the correct option to updateBooking
              console.log('Applying changes with option:', editOption);
              updateBooking(editOption);
            }}
          >
            Apply Changes
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Cancel Booking Modal */}
      <Modal show={showCancelModal} onHide={() => setShowCancelModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to cancel this booking?</p>
          <Form.Group className="mb-3">
            <Form.Check 
              type="checkbox" 
              label="Send notification to client and staff" 
              checked={sendNotification} 
              onChange={(e) => setSendNotification(e.target.checked)} 
            />
          </Form.Group>
          
          {isSeriesBooking && (
            <div className="mt-3">
              <p>This booking is part of a series. Would you like to:</p>
              <Button 
                variant="danger" 
                className="me-2" 
                onClick={() => confirmCancelBooking('single')}
              >
                Cancel only this booking
              </Button>
              <Button 
                variant="warning" 
                onClick={() => confirmCancelBooking('series')}
              >
                Cancel all bookings in series
              </Button>
            </div>
          )}
          
          {!isSeriesBooking && (
            <div className="mt-3 d-flex justify-content-end">
              <Button 
                variant="secondary" 
                className="me-2" 
                onClick={() => setShowCancelModal(false)}
              >
                No, go back
              </Button>
              <Button 
                variant="danger" 
                onClick={() => confirmCancelBooking('single')}
              >
                Yes, cancel booking
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>
      
      <Card>
        <Card.Header as="h5">Edit Booking</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          {isSeriesBooking && (
            <Alert variant="info">
              This booking is part of a series. When you save changes, you'll have the option to update just this booking or all bookings in the series.
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Service</Form.Label>
                  <Form.Select 
                    name="service" 
                    value={formData.service} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a service</option>
                    {services.map(service => (
                      <option key={service._id} value={service._id}>
                        {service.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Client</Form.Label>
                  <Form.Select 
                    name="client" 
                    value={formData.client} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>
                        {client.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Staff</Form.Label>
                  <Form.Select 
                    name="staff" 
                    value={formData.staff} 
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select staff</option>
                    {staff.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time</Form.Label>
                  <Form.Control 
                    type="datetime-local" 
                    name="startTime" 
                    value={formData.startTime} 
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time</Form.Label>
                  <Form.Control 
                    type="datetime-local" 
                    name="endTime" 
                    value={formData.endTime} 
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Send notification to client and staff" 
                checked={sendNotification} 
                onChange={(e) => setSendNotification(e.target.checked)} 
              />
            </Form.Group>
            
            <div className="d-flex justify-content-between mt-4 flex-wrap">
              <Button variant="primary" type="submit" className="mb-2">
                Update Booking
              </Button>
              <Button variant="warning" onClick={handleCancelBooking} className="mb-2">
                Cancel Shift
              </Button>
              <Button variant="info" onClick={convertToBookingAlert} className="mb-2">
                Convert to Alert
              </Button>
              <Button variant="danger" onClick={handleDelete} className="mb-2">
                Delete Booking
              </Button>
              <Button variant="secondary" onClick={() => navigate('/calendar')} className="mb-2">
                Back
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BookingEdit;