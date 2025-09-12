import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, InputGroup, FormControl, Modal, Badge, Tabs, Tab, ButtonGroup } from 'react-bootstrap';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';

const ClientManagement = () => {
  useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [activeTab, setActiveTab] = useState('clients');
  const [locationAreas, setLocationAreas] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');

  // New client form state
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
    notes: '',
    consultantName: '',
    consultantEmail: '',
    locationAreas: [],
    photo: '',
  });
  
  // Track if we're adding or editing a client
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [currentClientId, setCurrentClientId] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = statusFilter === 'all' ? '/clients' : `/clients?status=${statusFilter}`;
      const response = await axiosInstance.get(url);
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Failed to load clients. Please try again later.');
      toast.error('Error loading clients');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const fetchLocationAreas = async () => {
    try {
      const response = await axiosInstance.get('/booking-categories/areas');
      setLocationAreas(response.data.data || response.data);
    } catch (err) {
      console.error('Error fetching location areas:', err);
    }
  };

  useEffect(() => {
    fetchLocationAreas();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient({
      ...newClient,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const clientData = {...newClient};
      
      const formattedData = {
        ...clientData,
        name: `${clientData.firstName} ${clientData.lastName}`.trim(),
        address: {
          street: clientData.address || '',
          city: clientData.city || '',
          postcode: clientData.postalCode || '',
          country: clientData.country || 'UK'
        },
        consultant: {
          name: clientData.consultantName || '',
          email: clientData.consultantEmail || ''
        },
        locationAreas: Array.isArray(clientData.locationAreas) 
          ? clientData.locationAreas.map(area => typeof area === 'object' ? area._id : area)
          : []
      };
      
      if (modalType === 'edit' && currentClientId) {
        if (typeof formattedData.photo === 'string' && !formattedData.photo.startsWith('data:image')) {
          delete formattedData.photo;
        }
        
        await axiosInstance.put(`/clients/${currentClientId}`, formattedData);
        toast.success('Client updated successfully');
      } else {
        await axiosInstance.post('/clients', formattedData);
        toast.success('Client added successfully');
      }
      
      setNewClient({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        notes: '',
        consultantName: '',
        consultantEmail: '',
        locationAreas: [],
        photo: ''
      });
      
      setModalType('add');
      setCurrentClientId(null);
      setShowAddModal(false);
      fetchClients();
      
    } catch (err) {
      console.error(`Error ${modalType === 'edit' ? 'updating' : 'adding'} client:`, err);
      toast.error(`Failed to ${modalType === 'edit' ? 'update' : 'add'} client`);
    }
  };



  const handleViewClient = (client) => {
    setSelectedClient(client);
    setShowClientDetails(true);
  };

  const filteredClients = clients.filter(client => {
    const fullName = `${client.firstName || ''} ${client.lastName || ''}`.toLowerCase();
    const email = (client.email || '').toLowerCase();
    const phone = (client.phone || '').toLowerCase();
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    return fullName.includes(lowercasedSearchTerm) || 
           email.includes(lowercasedSearchTerm) || 
           phone.includes(lowercasedSearchTerm);
  });

  return (
    <Container fluid className="py-4">
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3 client-tabs"
      >
        <Tab eventKey="clients" title="Clients">
          <Card className="client-management-card">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h4 className="mb-0">Client Management</h4>
                </Col>
                <Col xs="auto">
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setModalType('add');
                      setCurrentClientId(null);
                      setNewClient({
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        address: '',
                        city: '',
                        postalCode: '',
                        country: '',
                        notes: '',
                        consultantName: '',
                        consultantEmail: '',
                        locationAreas: [],
                        photo: ''
                      });
                      setShowAddModal(true);
                    }}
                    className="me-2"
                  >
                    <i className="fas fa-plus"></i> Add Client
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={6}>
                  <InputGroup>
                    <FormControl
                      placeholder="Search clients..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline-secondary">
                      <i className="fas fa-search"></i>
                    </Button>
                  </InputGroup>
                </Col>
                <Col md={6} className="d-flex justify-content-end align-items-center">
                  <ButtonGroup className="me-3">
                    <Button 
                      variant={statusFilter === 'all' ? 'primary' : 'outline-secondary'}
                      onClick={() => setStatusFilter('all')}
                    >
                      All
                    </Button>
                    <Button 
                      variant={statusFilter === 'active' ? 'success' : 'outline-secondary'}
                      onClick={() => setStatusFilter('active')}
                    >
                      Active
                    </Button>
                    <Button 
                      variant={statusFilter === 'pending' ? 'warning' : 'outline-secondary'}
                      onClick={() => setStatusFilter('pending')}
                    >
                      Pending
                    </Button>
                    <Button 
                      variant={statusFilter === 'inactive' ? 'danger' : 'outline-secondary'}
                      onClick={() => setStatusFilter('inactive')}
                    >
                      Inactive
                    </Button>
                  </ButtonGroup>
                  <span className="me-2 text-muted">{filteredClients.length} {statusFilter} clients</span>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={fetchClients}
                  >
                    <i className="fas fa-sync-alt"></i>
                  </Button>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center p-5">
                  <p>Loading clients...</p>
                </div>
              ) : error ? (
                <div className="text-center text-danger p-5">
                  <p>{error}</p>
                </div>
              ) : clients.length === 0 ? (
                <div className="text-center p-5">
                  <h5>No clients found</h5>
                  <p>Add your first client to get started.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => setShowAddModal(true)}
                  >
                    <i className="fas fa-plus"></i> Add Client
                  </Button>
                </div>
              ) : (
                <Table hover responsive className="client-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Last Visit</th>
                      <th>Bookings</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client._id} onClick={() => handleViewClient(client)}>
                        <td>
                          <div className="d-flex align-items-center">
                            {client.photo ? (
                              <img 
                                src={client.photo}
                                alt={`${client.firstName || ''} ${client.lastName || ''}`}
                                className="client-avatar-img me-2"
                              />
                            ) : (
                              <div className="client-avatar me-2">
                                {`${(client.firstName?.charAt(0) || '')}${(client.lastName?.charAt(0) || '')}`}
                              </div>
                            )}
                            {client.firstName && client.lastName ? 
                              `${client.firstName} ${client.lastName}` : 
                              client.name || 'Unnamed Client'}
                          </div>
                        </td>
                        <td>{client.email}</td>
                        <td>{client.phone}</td>
                        <td>
                          {client.lastVisit ? format(new Date(client.lastVisit), 'dd/MM/yyyy') : 'Never'}
                        </td>
                        <td>
                          <Badge bg="info">{client.totalBookings || 0}</Badge>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleViewClient(client)}
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={() => {
                              window.location.href = `/bookings/new?clientId=${client._id}&clientName=${encodeURIComponent(client.firstName + ' ' + client.lastName)}`;
                            }}
                          >
                            <i className="fas fa-calendar-plus"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="groups" title="Client Groups">
          <Card className="client-management-card">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h4 className="mb-0">Client Groups</h4>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <div className="text-center p-5">
                <h5>Coming Soon</h5>
                <p className="text-muted">
                  Create groups to organize your clients and apply special settings or discounts.
                </p>
                <Button variant="outline-primary" disabled>
                  <i className="fas fa-plus"></i> Create Group
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Add Client Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modalType === 'edit' ? 'Edit Client' : 'Add New Client'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-4">
              <Col className="text-center">
                <div className="mb-3">
                  <div className="position-relative d-inline-block">
                    {newClient.photo ? (
                      <img
                        src={newClient.photo instanceof File ? URL.createObjectURL(newClient.photo) : newClient.photo}
                        alt="Client preview"
                        style={{
                          width: '150px',
                          height: '150px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '3px solid #f0f0f0'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        backgroundColor: '#f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        color: '#aaa'
                      }}>
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                    <div className="mt-2">
                      <Form.Control
                        type="file"
                        name="photo"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            console.log('Photo file selected:', e.target.files[0].name);
                            // Convert to base64 immediately to ensure it's saved
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setNewClient({
                                ...newClient,
                                photo: event.target.result
                              });
                              console.log('Photo converted to base64 immediately');
                            };
                            reader.readAsDataURL(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={newClient.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name*</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={newClient.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email*</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={newClient.email}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Phone</Form.Label>
                  <Form.Control
                    type="tel"
                    name="phone"
                    value={newClient.phone}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <h5 className="mt-3 mb-3">Address</h5>
            <Form.Group className="mb-3">
              <Form.Label>Street Address</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={newClient.address}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>City</Form.Label>
                  <Form.Control
                    type="text"
                    name="city"
                    value={newClient.city}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Postal Code</Form.Label>
                  <Form.Control
                    type="text"
                    name="postalCode"
                    value={newClient.postalCode}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Country</Form.Label>
                  <Form.Control
                    type="text"
                    name="country"
                    value={newClient.country}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <h5 className="mt-3 mb-3">Location Areas</h5>
            <Form.Group className="mb-3">
              <div className="d-flex flex-wrap">
                {locationAreas.map((area) => {
                  const areaValue = area._id || area.name;
                  // Debug log to check what's in the location areas
                  console.log(`Area: ${area.name}, Value: ${areaValue}`);
                  console.log(`Current locationAreas:`, newClient.locationAreas);
                  
                  return (
                    <Form.Check
                      key={areaValue}
                      type="checkbox"
                      id={`area-${areaValue}`}
                      label={area.name}
                      className="me-3 mb-2"
                      checked={Array.isArray(newClient.locationAreas) && 
                              newClient.locationAreas.includes(area._id)
                              }
                      onChange={(e) => {
                        console.log(`Checkbox ${area.name} changed to ${e.target.checked}`);
                        // Always use the area ID for consistency
                        const updatedAreas = e.target.checked
                          ? [...(newClient.locationAreas || []), area._id]
                          : (newClient.locationAreas || []).filter(a => a !== area._id);
                        console.log('Updated areas:', updatedAreas);
                        setNewClient({
                          ...newClient,
                          locationAreas: updatedAreas
                        });
                      }}
                    />
                  );
                })}
              </div>
            </Form.Group>
            <h5 className="mt-3 mb-3">Consultant Information</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Consultant Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="consultantName"
                    value={newClient.consultantName || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Consultant Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="consultantEmail"
                    value={newClient.consultantEmail || ''}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={newClient.notes}
                onChange={handleInputChange}
              />
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" onClick={handleSubmit}>
                Save Client
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Client Details Modal */}
      <Modal
        show={showClientDetails}
        onHide={() => setShowClientDetails(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Client Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedClient && (
            <div>
              <Row className="mb-4">
                <Col md={3} className="text-center">
                  {selectedClient.photo ? (
                    <img
                      src={selectedClient.photo}
                      alt={`${selectedClient.firstName} ${selectedClient.lastName}`}
                      className="client-photo me-3"
                    />
                  ) : (
                    <div
                      className="client-avatar-large me-3"
                      style={{ display: selectedClient.photo ? 'none' : 'flex' }}
                    >
                      {selectedClient.firstName?.charAt(0)}{selectedClient.lastName?.charAt(0)}
                    </div>
                  )}
                  <h4>{selectedClient.firstName} {selectedClient.lastName}</h4>
                  <p className="text-muted small">
                    Client since: {selectedClient.createdAt ? format(new Date(selectedClient.createdAt), 'dd/MM/yyyy') : 'Unknown'}
                  </p>
                </Col>
                <Col md={9}>
                  <Tabs defaultActiveKey="info" id="client-details-tabs">
                    <Tab eventKey="info" title="Client Info">
                      <div className="p-3">
                        <Row>
                          <Col md={6}>
                            <p>
                              <strong>Email:</strong> {selectedClient.email || 'Not provided'}
                            </p>
                            <p>
                              <strong>Phone:</strong> {selectedClient.phone || 'Not provided'}
                            </p>
                            <p>
                              <strong>Address:</strong> {typeof selectedClient.address === 'object' ? (
                                <span>
                                  {selectedClient.address?.street || ''}, {selectedClient.address?.city || ''} {selectedClient.address?.postcode || ''}, {selectedClient.address?.country || ''}
                                </span>
                              ) : selectedClient.address ? (
                                <span>
                                  {String(selectedClient.address)}, {selectedClient.city} {selectedClient.postalCode}, {selectedClient.country}
                                </span>
                              ) : 'Not provided'}
                            </p>
                            <p>
                              <strong>Location Areas:</strong> {selectedClient.locationAreas && selectedClient.locationAreas.length > 0 ? 
                                selectedClient.locationAreas.map(areaId => {
                                  // Find the area name from the locationAreas state
                                  const areaObj = locationAreas.find(a => a._id === areaId || 
                                    (typeof areaId === 'object' && a._id === areaId._id));
                                  return areaObj ? areaObj.name : (typeof areaId === 'object' ? areaId.name : areaId);
                                }).join(', ') : 
                                'None specified'}
                            </p>
                          </Col>
                          <Col md={6}>
                            <p>
                              <strong>Consultant Name:</strong> {selectedClient.consultant?.name || selectedClient.consultantName || 'Not assigned'}
                            </p>
                            <p>
                              <strong>Consultant Email:</strong> {selectedClient.consultant?.email || selectedClient.consultantEmail || 'Not provided'}
                            </p>
                            <p>
                              <strong>Client Since:</strong> {selectedClient.createdAt ? format(new Date(selectedClient.createdAt), 'dd/MM/yyyy') : 'Unknown'}
                            </p>
                            <p>
                              <strong>Last Updated:</strong> {selectedClient.updatedAt ? format(new Date(selectedClient.updatedAt), 'dd/MM/yyyy') : 'Unknown'}
                            </p>
                          </Col>
                        </Row>
                        <Row className="mt-3">
                          <Col>
                            <h6>Notes:</h6>
                            <div className="p-2 border rounded bg-light">
                              {selectedClient.notes || 'No notes available for this client.'}
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Tab>
                    <Tab eventKey="bookings" title="Booking History">
                      <div className="p-3">
                        <p className="text-center text-muted">
                          This client has no booking history yet.
                        </p>
                      </div>
                    </Tab>
                    <Tab eventKey="payments" title="Payments">
                      <div className="p-3">
                        <p className="text-center text-muted">
                          No payment records found for this client.
                        </p>
                      </div>
                    </Tab>
                  </Tabs>
                </Col>
              </Row>
              <div className="d-flex justify-content-between">
                <Button 
                  variant="warning" 
                  onClick={() => {
                    const newStatus = selectedClient.status === 'active' ? 'inactive' : 'active';
                    axiosInstance.put(`/clients/${selectedClient._id}`, { status: newStatus })
                      .then(() => {
                        toast.success(`Client ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
                        setShowClientDetails(false);
                        fetchClients();
                      })
                      .catch(err => {
                        toast.error(err.response?.data?.message || `Error updating client status`);
                        console.error('Error updating client status:', err);
                      });
                  }}
                >
                  <i className={`fas ${selectedClient.status === 'active' ? 'fa-user-slash' : 'fa-user-check'}`}></i> 
                  {selectedClient.status === 'active' ? 'Deactivate Client' : 'Activate Client'}
                </Button>

                <Button 
                  variant="danger" 
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${selectedClient.firstName} ${selectedClient.lastName}?`)) {
                      axiosInstance.delete(`/clients/${selectedClient._id}`)
                        .then(() => {
                          toast.success('Client deleted successfully');
                          setShowClientDetails(false);
                          fetchClients();
                        })
                        .catch(err => {
                          toast.error(err.response?.data?.message || 'Error deleting client');
                          console.error('Error deleting client:', err);
                        });
                    }
                  }}
                >
                  <i className="fas fa-trash-alt"></i> Delete Client
                </Button>
                <div>
                  <Button 
                    variant="info" 
                    className="me-2"
                    onClick={() => {
                      const subject = `Hello ${selectedClient.firstName} ${selectedClient.lastName}`;
                      const body = `Dear ${selectedClient.firstName},\n\nI hope this email finds you well.\n\nBest regards,\nYour Team`;
                      const mailtoLink = `mailto:${encodeURIComponent(selectedClient.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      
                      // Copy email to clipboard
                      navigator.clipboard.writeText(selectedClient.email)
                        .then(() => toast.info('Email copied to clipboard'))
                        .catch(err => console.error('Failed to copy email:', err));
                      
                      // Open email client
                      window.open(mailtoLink, '_blank');
                    }}
                  >
                    <i className="fas fa-envelope"></i> Send Email
                  </Button>
                  <Button 
                    variant="success" 
                    className="me-2"
                    onClick={() => {
                      window.location.href = `/bookings/new?clientId=${selectedClient._id}&clientName=${encodeURIComponent(selectedClient.firstName + ' ' + selectedClient.lastName)}`;
                    }}
                  >
                    <i className="fas fa-calendar-plus"></i> Create Booking
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => {
                      // Set up the edit form with the selected client's data
                      console.log("Selected client for edit:", selectedClient);
                      
                      // Extract address properly
                      let addressStr = '';
                      if (selectedClient.address) {
                        if (typeof selectedClient.address === 'object' && selectedClient.address.street) {
                          addressStr = selectedClient.address.street;
                        } else if (typeof selectedClient.address === 'string') {
                          addressStr = selectedClient.address;
                        }
                      }
                      
                      // Extract first and last name from name if they're not available
                      let firstName = selectedClient.firstName || '';
                      let lastName = selectedClient.lastName || '';
                      
                      if ((!firstName || !lastName) && selectedClient.name) {
                        const nameParts = selectedClient.name.split(' ');
                        if (nameParts.length > 0) {
                          firstName = firstName || nameParts[0];
                          lastName = lastName || nameParts.slice(1).join(' ');
                        }
                      }
                      
                      // Ensure locationAreas is properly formatted
                      let locationAreas = [];
                      if (selectedClient.locationAreas && Array.isArray(selectedClient.locationAreas)) {
                        locationAreas = selectedClient.locationAreas.map(area => 
                          typeof area === 'object' ? area._id : area);
                      }
                      
                      // Make sure we're using IDs consistently
                      console.log("Location areas for edit (before):", locationAreas);
                      
                      // Simplify location areas handling
                      // Extract IDs from location areas
                      if (selectedClient.locationAreas && Array.isArray(selectedClient.locationAreas)) {
                        locationAreas = selectedClient.locationAreas.map(area => 
                          typeof area === 'object' ? area._id : area);
                      } else {
                        locationAreas = [];
                      }
                      
                      console.log("Simplified location areas for edit:", locationAreas);
                      
                      // Set the form data directly
                      setNewClient({
                        firstName: firstName,
                        lastName: lastName,
                        email: selectedClient.email || '',
                        phone: selectedClient.phone || '',
                        address: addressStr,
                        city: selectedClient.address?.city || '',
                        postalCode: selectedClient.address?.postcode || '',
                        country: selectedClient.address?.country || 'UK',
                        notes: selectedClient.notes || '',
                        consultantName: selectedClient.consultant?.name || '',
                        consultantEmail: selectedClient.consultant?.email || '',
                        locationAreas: locationAreas,
                        photo: selectedClient.photo || ''
                      });
                      
                      // Set the modal type to edit and store the client ID
                      setModalType('edit');
                      setCurrentClientId(selectedClient._id);
                      
                      // Close details modal and open edit modal
                      setShowClientDetails(false);
                      setShowAddModal(true);
                    }}
                  >
                    <i className="fas fa-edit"></i> Edit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <style>{`
        .client-tabs .nav-link {
          color: #495057;
          border-bottom: 2px solid transparent;
        }
        
        .client-tabs .nav-link.active {
          color: #007bff;
          border-bottom: 2px solid #007bff;
        }
        
        .client-management-card {
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        
        .client-table tbody tr {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .client-table tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.05);
        }
        
        .client-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #495057;
        }
        
        .client-avatar-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e9ecef;
        }
        
        .client-avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 2rem;
          color: #495057;
          margin: 0 auto 1rem;
        }
        
        .client-photo {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #e9ecef;
          margin: 0 auto 1rem;
        }
      `}</style>
    </Container>
  );
};

export default ClientManagement;