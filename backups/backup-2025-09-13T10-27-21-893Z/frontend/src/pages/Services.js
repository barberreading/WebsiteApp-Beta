import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Modal, Form, Table, Badge, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';

const Services = () => {
  const { hasRole } = useAuth();
  const [services, setServices] = useState([]);
  const [bookingKeys, setBookingKeys] = useState([]);
  const [predefinedColors, setPredefinedColors] = useState([]);
  const [colorNames, setColorNames] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create' or 'edit'
  const [currentService, setCurrentService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bookingKey: '',
    color: '#FFE5E5' // Default to first pastel color
  });

  // Fetch services
  const fetchServices = async () => {
    try {
      const res = await axiosInstance.get('/services');
      setServices(res.data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to fetch services');
      console.error(err);
      setLoading(false);
    }
  };

  // Fetch booking keys
  const fetchBookingKeys = async () => {
    try {
      const res = await axiosInstance.get('/booking-categories/keys');
      setBookingKeys(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch booking keys:', err);
    }
  };

  // Fetch predefined colors
  const fetchPredefinedColors = async () => {
    try {
      const res = await axiosInstance.get('/services/colors/predefined');
      setPredefinedColors(res.data.colors || []);
      setColorNames(res.data.colorNames || []);
    } catch (err) {
      console.error('Failed to fetch predefined colors:', err);
      // Fallback to default pastel colors if API fails
      setPredefinedColors([
        '#FFE5E5', '#E5E5FF', '#E5FFE5', '#FFE5CC', '#F0E5FF', '#FFFFE5',
        '#E5FFFF', '#FFE5F0', '#F0FFE5', '#E5F0FF', '#FFE5E0', '#E5F5FF'
      ]);
      setColorNames([
        'Light Pink', 'Light Blue', 'Light Green', 'Light Orange', 'Light Purple', 'Light Yellow',
        'Light Cyan', 'Light Rose', 'Light Lime', 'Light Indigo', 'Light Coral', 'Light Sky Blue'
      ]);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchBookingKeys();
    fetchPredefinedColors();
  }, []);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalType === 'create') {
        await axiosInstance.post('/services', formData);
        toast.success('Service created successfully');
      } else {
        await axiosInstance.put(`/services/${currentService._id}`, formData);
        toast.success('Service updated successfully');
      }
      
      setShowModal(false);
      fetchServices();
      resetForm();
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Operation failed';
      toast.error(errorMsg);
      console.error(err);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      bookingKey: '',
      color: '#FFE5E5'
    });
    setCurrentService(null);
  };

  // Handle create new service
  const handleCreate = () => {
    resetForm();
    setModalType('create');
    setShowModal(true);
  };

  // Handle edit
  const handleEdit = (service) => {
    setCurrentService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      bookingKey: service.bookingKey || '',
      color: service.color || '#FFE5E5'
    });
    setModalType('edit');
    setShowModal(true);
  };

  // Handle delete service
  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await axiosInstance.delete(`/services/${serviceId}`);
        toast.success('Service deleted successfully');
        fetchServices();
      } catch (err) {
        const errorMsg = err.response?.data?.msg || 'Failed to delete service';
        toast.error(errorMsg);
        console.error(err);
      }
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (service) => {
    try {
      await axiosInstance.put(`/services/${service._id}`, {
        ...service,
        isActive: !service.isActive
      });
      toast.success(`Service ${service.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchServices();
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Failed to update service status';
      toast.error(errorMsg);
      console.error(err);
    }
  };

  if (!hasRole(['manager', 'superuser'])) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Access denied. Manager role required to manage services.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Services Management</h4>
              <Button variant="primary" onClick={handleCreate}>
                Add New Service
              </Button>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">Loading services...</div>
              ) : services.length === 0 ? (
                <div className="text-center text-muted">
                  No services found. Create your first service to get started.
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => (
                      <tr key={service._id}>
                        <td>
                          <strong>{service.name}</strong>
                          {service.description && (
                            <div className="text-muted small">{service.description}</div>
                          )}
                        </td>
                        <td>
                          <Badge bg={service.isActive ? 'success' : 'secondary'}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(service)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={service.isActive ? 'outline-warning' : 'outline-success'}
                            size="sm"
                            className="me-2"
                            onClick={() => handleToggleActive(service)}
                          >
                            {service.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(service._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Service Modal */}
      <Modal show={showModal} onHide={() => {}} backdrop="static" keyboard={false} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'create' ? 'Create New Service' : 'Edit Service'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Service Name *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter service name"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Enter service description"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Color</Form.Label>
                  <div className="color-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    {predefinedColors.map((color, index) => (
                      <div
                        key={color}
                        className={`color-option ${formData.color === color ? 'selected' : ''}`}
                        style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: color,
                          border: formData.color === color ? '3px solid #007bff' : '2px solid #dee2e6',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease',
                          boxShadow: formData.color === color ? '0 0 0 2px rgba(0,123,255,0.25)' : 'none'
                        }}
                        onClick={() => setFormData({ ...formData, color })}
                        title={colorNames[index] || color}
                      >
                        {formData.color === color && (
                          <span style={{ color: '#007bff', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <Form.Text>Select a pastel color to identify this service on the calendar</Form.Text>
                  <div className="mt-2">
                    <small className="text-muted">
                      Selected: {colorNames[predefinedColors.indexOf(formData.color)] || 'Custom'} ({formData.color})
                    </small>
                  </div>
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Booking Key</Form.Label>
                  <Form.Select
                    name="bookingKey"
                    value={formData.bookingKey}
                    onChange={handleChange}
                  >
                    <option value="">Select a booking key...</option>
                    {bookingKeys.map(key => (
                      <option key={key._id} value={key._id}>
                        {key.name}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Booking key for scheduling
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {modalType === 'create' ? 'Create Service' : 'Update Service'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Services;