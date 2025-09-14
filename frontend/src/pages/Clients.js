import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Table, Button, Modal, Form, Badge, Card, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import CircularPhotoUpload from '../components/common/CircularPhotoUpload';
import axiosInstance from '../utils/axiosInstance';

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'Not provided';
  try {
    return new Date(dateString).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'});
  } catch (error) {
    logger.error('Error formatting date:', error);
    return dateString;
  }
};

const Clients = () => {
  const { hasRole } = useAuth();
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("create"); // 'create' or 'edit'
  const [currentClient, setCurrentClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      postcode: '',
      country: 'UK'
    },
    dateOfBirth: '',
    notes: '',
    photo: '',
    consultant: {
      name: '',
      email: ''
    },
    categoryKey: '',
    policyDocuments: []
  });
  
  // eslint-disable-next-line no-unused-vars
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/clients');
      setClients(res.data);
      setLoading(false);
    } catch (err) {
      toast.error('Failed to fetch clients: ' + (err.response?.data?.msg || err.message));
      logger.error('Error fetching clients:', err);
      setLoading(false);
    }
  }, []);

  const handleEdit = useCallback((client) => {
    setCurrentClient(client);

    // Ensure dateOfBirth is in YYYY-MM-DD format for the input field
    const formattedDateOfBirth = client.dateOfBirth 
      ? new Date(client.dateOfBirth).toISOString().split('T')[0] 
      : '';

    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      address: {
        street: client.address?.street || '',
        city: client.address?.city || '',
        postcode: client.address?.postcode || '',
        country: client.address?.country || 'UK'
      },
      dateOfBirth: formattedDateOfBirth,
      notes: client.notes || '',
      consultant: {
        name: client.consultant?.name || '',
        email: client.consultant?.email || ''
      },
      categoryKey: client.categoryKey || ''
    });
    setModalType('edit');
    setShowModal(true);
  }, []);

  useEffect(() => {
    // Direct client creation function moved inside useEffect to handle dependencies
    const createClientDirectly = async () => {
      try {
        
        // Create a timestamp for unique values
        const timestamp = new Date().getTime();
        
        // Create client data with minimal required fields for simplicity
        const clientData = {
          name: "New Client " + timestamp,
          email: "client" + timestamp + "@example.com",
          phone: "07700 900000",
          notes: "New client - please edit",
          address: {
            street: "123 Main Street",
            city: "London",
            postcode: "SW1A 1AA",
            country: "UK"
          }
        };
        
        logger.log('Submitting client data:', clientData);
        
        // Submit the client data directly to the API
        const response = await axiosInstance.post('/clients', clientData);
        
        logger.log('Client creation response:', response.data);
        
        // Show success message
        toast.success('Customer added successfully');
        
        // Refresh the client list
        await fetchClients();
        
        // Open the edit modal for the newly created client
        handleEdit(response.data);
        
      } catch (err) {
        logger.error('Error creating client:', err);
        // Log detailed error information
        if (err.response) {
          logger.error('Error response:', err.response.data);
          logger.error('Error status:', err.response.status);
        } else if (err.request) {
          logger.error('Error request:', err.request);
        }
        
        const errorMsg = err.response?.data?.msg || 'Error adding customer: ' + (err.message || 'Unknown error');
        toast.error(errorMsg);
      } finally {
      }
    };

    fetchClients();
    
    // Check for URL parameter to trigger direct client creation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'createDirect') {
      // Remove the parameter from URL to prevent repeated creation on refresh
      window.history.replaceState({}, document.title, '/clients');
      // Call the direct creation function
      createClientDirectly();
    }
  }, [fetchClients, handleEdit]);

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prevData => {
        const newData = {
          ...prevData,
          [parent]: {
            ...(prevData[parent] || {}),
            [child]: value
          }
        };
        logger.log('Updated nested field:', name, 'New formData:', newData);
        return newData;
      });
    } else {
      setFormData(prevData => {
        const newData = {
          ...prevData,
          [name]: value
        };
        logger.log('Updated field:', name, 'Value:', value, 'New formData:', newData);
        return newData;
      });
    }
  };



  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        postcode: '',
        country: 'UK'
      },
      dateOfBirth: '',
      notes: '',
      consultant: {
        name: '',
        email: ''
      },
      categoryKey: ''
    });
    setCurrentClient(null);
  };

  // Handle client creation
  const handleCreate = () => {
    // Show the modal with pre-filled data
    const prefilledData = {
      name: 'New Client ' + new Date().toLocaleTimeString(),
      email: 'client' + new Date().getTime() + '@example.com',
      phone: '07700 900000',
      address: {
        street: '123 Main Street',
        city: 'London',
        postcode: 'SW1A 1AA',
        country: 'UK'
      },
      dateOfBirth: '',
      notes: 'Sample client - please edit',
      consultant: {
        name: 'Default Consultant',
        email: 'consultant@example.com'
      }
    };
    
    // Set the form data with prefilled values
    setFormData(prefilledData);
    setModalType('create');
    setShowModal(true);
  };

  // Helper function already defined below

  // Handle view client details
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleViewDetails = (client) => {
    logger.log("Viewing client details:", client);
    // Create a deep copy to avoid reference issues
    const clientCopy = JSON.parse(JSON.stringify(client));
    setSelectedClient(clientCopy);
    setShowDetailsModal(true);
  };



  // Handle delete client
  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        logger.log('Deleting client with ID:', clientId);
        await axiosInstance.delete(`/clients/${clientId}`);
        toast.success('Client deleted successfully');
        // Close any open modals
        setShowDetailsModal(false);
        setShowModal(false);
        // Refresh the client list
        fetchClients();
      } catch (err) {
        const errorMsg = err.response?.data?.msg || 'Failed to delete client';
        toast.error(errorMsg);
        logger.error('Error deleting client:', err);
      }
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (client) => {
    try {
      await axiosInstance.put(`/clients/${client._id}`, {
        ...client,
        isActive: !client.isActive
      });
      toast.success(`Client ${client.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchClients();
    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'Failed to update client status';
      toast.error(errorMsg);
      logger.error('Error toggling client status:', err);
    }
  };

  // Format date for display
// Using the imported formatDate function from dateUtils

  if (!hasRole(['manager', 'superuser'])) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          Access denied. Manager role required to manage clients.
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
              <h4 className="mb-0">Clients Management</h4>
              <div>
                <Button variant="primary" onClick={handleCreate}>
                  Add Client
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">Loading clients...</div>
              ) : clients.length === 0 ? (
                <div className="text-center text-muted">
                  No clients found. Create your first client to get started.
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client._id} onClick={() => handleViewDetails(client)} style={{ cursor: 'pointer' }}>
                        <td>
                          <img 
                            src={client.photo || '/static/default-avatar.png'} 
                            alt={client.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #f0f0f0'
                            }}
                          />
                        </td>
                        <td>
                          <strong>{client.name}</strong>
                          {client.notes && (
                            <div className="text-muted small">{client.notes}</div>
                          )}
                        </td>
                        <td>{client.email}</td>
                        <td>{client.phone || '-'}</td>
                        <td>
                          {client.address?.city && client.address?.postcode ? (
                            `${client.address.city}, ${client.address.postcode}`
                          ) : '-'}
                        </td>
                        <td>
                          <Badge bg={client.isActive ? 'success' : 'secondary'}>
                            {client.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={client.isActive ? 'outline-warning' : 'outline-success'}
                            size="sm"
                            className="me-2"
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(client); }}
                          >
                            {client.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); handleDelete(client._id); }}
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

      {/* Create/Edit Client Modal */}
      <Modal show={showModal} onHide={() => {}} backdrop="static" keyboard={false} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'create' ? 'Create New Client' : 'Edit Client'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form id="clientForm">
            <Row className="mb-4">
                <Col className="text-center">
                  <CircularPhotoUpload 
                    currentPhoto={formData.photo} 
                    onPhotoUpdate={(photoUrl) => {
                      setFormData({...formData, photo: photoUrl});
                    }}
                    size={150}
                  />
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    id="client-name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    required
                    placeholder="Enter client name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email*</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    id="client-email"
                    value={formData.email || ''}
                    onChange={handleChange}
                    required
                    placeholder="Enter email address"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />
                </Form.Group>
              </Col>

            </Row>

            <h6 className="mb-3">Address</h6>
            <Form.Group className="mb-3">
              <Form.Label>Street Address</Form.Label>
              <Form.Control
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                placeholder="Enter street address"
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Postcode</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.postcode"
                    value={formData.address.postcode}
                    onChange={handleChange}
                    placeholder="Enter postcode"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    placeholder="Enter country"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Client Logo/Photo</Form.Label>
                  <div className="mb-3 d-flex flex-column align-items-center">
                    <div className="client-photo-container mb-2">
                      <img 
                        src={formData.photo || '/static/default-avatar.png'} 
                        alt="Client Logo" 
                        className="client-photo-preview"
                        style={{
                          width: '150px',
                          height: '150px',
                          objectFit: 'cover',
                          border: '2px solid #ddd',
                          borderRadius: '5px'
                        }}
                      />
                    </div>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({
                              ...formData,
                              photo: reader.result
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <Form.Text className="text-muted">
                      Upload a logo or photo for this client
                    </Form.Text>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Enter any additional notes about the client"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Policy Documents</Form.Label>
              <Form.Control
                type="file"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  const filePromises = files.map(file => {
                    return new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        resolve({
                          name: file.name,
                          type: file.type,
                          size: file.size,
                          data: reader.result
                        });
                      };
                      reader.readAsDataURL(file);
                    });
                  });
                  
                  Promise.all(filePromises).then(documents => {
                    setFormData({
                      ...formData,
                      policyDocuments: [...formData.policyDocuments, ...documents]
                    });
                  });
                }}
              />
              <Form.Text className="text-muted">
                Upload policy documents that staff need to read before shifts
              </Form.Text>
              
              {formData.policyDocuments.length > 0 && (
                <div className="mt-2">
                  <h6>Attached Documents:</h6>
                  <ul className="list-group">
                    {formData.policyDocuments.map((doc, index) => (
                      <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                        <span>{doc.name}</span>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => {
                            const updatedDocs = [...formData.policyDocuments];
                            updatedDocs.splice(index, 1);
                            setFormData({
                              ...formData,
                              policyDocuments: updatedDocs
                            });
                          }}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Form.Group>

            <h6 className="mb-3">Consultant Information</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Consultant Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="consultant.name"
                    value={formData.consultant?.name || ''}
                    onChange={handleChange}
                    placeholder="Enter consultant name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Consultant Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="consultant.email"
                    value={formData.consultant?.email || ''}
                    onChange={handleChange}
                    placeholder="Enter consultant email"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Category Key</Form.Label>
              <Form.Control
                type="text"
                name="categoryKey"
                value={formData.categoryKey || ''}
                onChange={handleChange}
                placeholder="Enter category key to link data"
              />
              <Form.Text className="text-muted">
                This key helps link client data with booking categories
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="button"
                onClick={() => {
                  // Use the form data for client creation
                  if (modalType === 'create') {
                    // Get form values
                    const nameInput = document.getElementById('client-name');
                    const emailInput = document.getElementById('client-email');
                    
                    // Extract values
                    const name = nameInput ? nameInput.value : '';
                    const email = emailInput ? emailInput.value : '';
                    
                    // Validate required fields
                    if (!name || !email) {
                      toast.error('Name and email are required fields');
                      return;
                    }
                    
                    // Create client data from form values
                    const clientData = {
                      name: name.trim(),
                      email: email.trim(),
                      phone: formData.phone || '',
                      notes: formData.notes || '',
                      address: {
                        street: formData.address?.street || '',
                        city: formData.address?.city || '',
                        postcode: formData.address?.postcode || '',
                        country: formData.address?.country || 'UK'
                      }
                    };
                    
                    logger.log('Creating client with form data:', clientData);
                    
                    // Use axios instance for consistent headers
                    axiosInstance.post('/clients', clientData)
                    .then(response => {
                      logger.log('Client created successfully:', response.data);
                      toast.success('Client added successfully!');
                      setShowModal(false);
                      fetchClients();
                      resetForm();
                    })
                    .catch(error => {
                      logger.error('Error creating client:', error);
                      const errorMsg = error.response?.data?.msg || error.message || 'Unknown error';
                      toast.error(`Error adding client: ${errorMsg}`);
                    });

                  } else {
                    // For update, use the current client data
                    const updateData = {
                      name: currentClient.name,
                      email: currentClient.email,
                      phone: currentClient.phone || '',
                      notes: currentClient.notes || '',
                      dateOfBirth: currentClient.dateOfBirth || '',
                      address: {
                        street: currentClient.address?.street || '',
                        city: currentClient.address?.city || '',
                        postcode: currentClient.address?.postcode || '',
                        country: currentClient.address?.country || 'UK'
                      }
                    };
                    
                    axiosInstance.put(`/clients/${currentClient._id}`, updateData)
                      .then(response => {
                        toast.success('Client updated successfully!');
                        setShowModal(false);
                        fetchClients();
                      })
                      .catch(error => {
                        logger.error('Error updating client:', error);
                        toast.error(`Error updating client: ${error.response?.data?.message || error.message}`);
                      });
                  }
                }}
              >
                {modalType === 'create' ? 'Add Client' : 'Update Client'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Client Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Client Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <div className="client-details">
              <Row className="mb-4">
                <Col md={4} className="text-center">
                  <img 
                    src={selectedClient.photo || '/images/default-avatar.png'} 
                    alt={selectedClient.name} 
                    style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ddd' }}
                    className="mb-3"
                  />
                  <h4>{selectedClient.name}</h4>
                  <Badge bg={selectedClient.isActive ? 'success' : 'secondary'} className="mb-2">
                    {selectedClient.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <p className="text-muted">Client since: {formatDate(selectedClient.createdAt)}</p>
                </Col>
                <Col md={8}>
                  <h5>Contact Information</h5>
                  <Table striped bordered hover>
                    <tbody>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{selectedClient.email}</td>
                      </tr>
                      <tr>
                        <td><strong>Phone:</strong></td>
                        <td>{selectedClient.phone || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>Address:</strong></td>
                        <td>
                          {selectedClient.address ? (
                            <>
                              {selectedClient.address.street && <div>{selectedClient.address.street}</div>}
                              {selectedClient.address.city && <div>{selectedClient.address.city}</div>}
                              {selectedClient.address.postcode && <div>{selectedClient.address.postcode}</div>}
                              {selectedClient.address.country && <div>{selectedClient.address.country}</div>}
                            </>
                          ) : 'Not provided'}
                        </td>
                      </tr>
                    </tbody>
                  </Table>

                  <h5>Additional Information</h5>
                  <Table striped bordered hover>
                    <tbody>
                      <tr>
                        <td><strong>Notes:</strong></td>
                        <td>{selectedClient.notes || 'No notes available'}</td>
                      </tr>
                      {selectedClient.consultant && (selectedClient.consultant.name || selectedClient.consultant.email) && (
                        <tr>
                          <td><strong>Consultant:</strong></td>
                          <td>
                            {selectedClient.consultant.name && <div>{selectedClient.consultant.name}</div>}
                            {selectedClient.consultant.email && <div>{selectedClient.consultant.email}</div>}
                          </td>
                        </tr>
                      )}
                      {selectedClient.categoryKey && (
                        <tr>
                          <td><strong>Category Key:</strong></td>
                          <td>{selectedClient.categoryKey}</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Col>
              </Row>

              <Row className="mt-4">
                <Col>
                  <Card className="mb-4">
                    <Card.Header>
                      <h5 className="mb-0">Create Booking</h5>
                    </Card.Header>
                    <Card.Body>
                      <p>Schedule a new appointment for this client.</p>
                      <Button 
                        variant="primary" 
                        onClick={() => {
                          logger.log('Create booking button clicked for client:', selectedClient._id);
                          // Navigate directly to booking page with client ID
                          window.location.href = `/bookings/new?clientId=${selectedClient._id}&clientName=${encodeURIComponent(selectedClient.name)}`;
                        }}
                        className="w-100"
                      >
                        <i className="fas fa-calendar-plus me-2"></i>
                        Create New Booking
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
                <Col>
                  <Card>
                    <Card.Header>
                      <h5 className="mb-0">Contact Client</h5>
                    </Card.Header>
                    <Card.Body>
                      <p>Send an email to this client.</p>
                      <Button 
                        variant="info" 
                        onClick={() => {
                          logger.log('Send email button clicked for client:', selectedClient.name);
                          // Create and open email directly
                          const subject = `Regarding your appointment`;
                          const body = `Hello ${selectedClient.name},\n\nI hope this email finds you well.\n\nBest regards,\nYour Team`;
                          const mailtoLink = `mailto:${encodeURIComponent(selectedClient.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                          window.location.href = mailtoLink;
                          
                          // Copy email to clipboard as backup
                          try {
                            navigator.clipboard.writeText(selectedClient.email);
                            toast.success('Email address copied to clipboard');
                          } catch (error) {
                            logger.error('Could not copy to clipboard:', error);
                          }
                        }}
                        className="w-100"
                      >
                        <i className="fas fa-envelope me-2"></i>
                        Send Email
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="danger" 
            onClick={() => {
              logger.log('Delete button clicked, client ID:', selectedClient._id);
              if (window.confirm('Are you sure you want to delete this client?')) {
                try {
                  axiosInstance.delete(`/clients/${selectedClient._id}`)
                    .then(() => {
                      toast.success('Client deleted successfully');
                      setShowDetailsModal(false);
                      fetchClients();
                    })
                    .catch(err => {
                      const errorMsg = err.response?.data?.msg || 'Failed to delete client';
                      toast.error(errorMsg);
                      logger.error('Error deleting client:', err);
                    });
                } catch (err) {
                  toast.error('Error deleting client');
                  logger.error('Error deleting client:', err);
                }
              }
            }} 
            className="me-auto"
          >
            Delete Client
          </Button>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            logger.log('Edit button clicked for client:', selectedClient.name);
            setCurrentClient(selectedClient);
            setFormData({
              name: selectedClient.name,
              email: selectedClient.email,
              phone: selectedClient.phone || '',
              address: {
                street: selectedClient.address?.street || '',
                city: selectedClient.address?.city || '',
                postcode: selectedClient.address?.postcode || '',
                country: selectedClient.address?.country || 'UK'
              },
              dateOfBirth: selectedClient.dateOfBirth ? selectedClient.dateOfBirth.split('T')[0] : '',
              notes: selectedClient.notes || '',
              consultant: {
                name: selectedClient.consultant?.name || '',
                email: selectedClient.consultant?.email || ''
              },
              categoryKey: selectedClient.categoryKey || ''
            });
            setModalType('edit');
            setShowDetailsModal(false);
            setShowModal(true);
          }}>
            Edit Client
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Clients;