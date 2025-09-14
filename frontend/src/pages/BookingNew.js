import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert, Modal } from 'react-bootstrap';
import axiosInstance from '../utils/axiosInstance';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const BookingNew = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [services, setServices] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    service: '',
    client: '',
    staff: '',
    startTime: '',
    endTime: '',
    notes: '',
    status: 'scheduled'
  });

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
    
    try {
      await axiosInstance.post(
        `/bookings`,
        formData
      );
      setSuccess('Booking created successfully');
      
      // Dispatch custom event to trigger calendar refresh
      window.dispatchEvent(new CustomEvent('bookingCreated'));
      
      // Navigate back to calendar after short delay
      setTimeout(() => {
        navigate('/calendar');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to create booking');
      console.error(err);
    }
  };

  return (
    <Container className="mt-4">
      <Card>
        <Card.Header as="h5">New Booking</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          
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
            
            <div className="d-flex justify-content-between mt-4 flex-wrap">
              <Button variant="primary" type="submit" className="mb-2">
                Create Booking
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

export default BookingNew;