import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, InputGroup, FormControl, Modal, Badge, Tabs, Tab, Nav } from 'react-bootstrap';
import { format } from 'date-fns';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const ResourcesManagement = () => {
  const { currentUser } = useAuth();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResourceDetails, setShowResourceDetails] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [totalResources, setTotalResources] = useState(0);
  const [activeTab, setActiveTab] = useState('staff');
  const [activeSubTab, setActiveSubTab] = useState('active');

  // New resource form state
  const [newResource, setNewResource] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff',
    services: [],
    workingHours: {
      monday: { isWorking: true, start: '09:00', end: '17:00' },
      tuesday: { isWorking: true, start: '09:00', end: '17:00' },
      wednesday: { isWorking: true, start: '09:00', end: '17:00' },
      thursday: { isWorking: true, start: '09:00', end: '17:00' },
      friday: { isWorking: true, start: '09:00', end: '17:00' },
      saturday: { isWorking: false, start: '09:00', end: '17:00' },
      sunday: { isWorking: false, start: '09:00', end: '17:00' }
    },
    color: '#3498db',
    isActive: true
  });

  // Available services for assignment
  const [availableServices, setAvailableServices] = useState([]);

  useEffect(() => {
    fetchResources();
    fetchServices();
  }, [activeTab, activeSubTab]);

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('type', activeTab);
      params.append('status', activeSubTab);
      
      // Fetch resources from API
      const response = await axiosInstance.get(`/resources?${params.toString()}`, { headers });
      
      setResources(response.data);
      setTotalResources(response.data.length);
    } catch (err) {
      console.error('Error fetching resources:', err);
      setError('Failed to load resources. Please try again later.');
      toast.error('Error loading resources');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await axiosInstance.get('/services', { headers });
      setAvailableServices(response.data);
    } catch (err) {
      console.error('Error fetching services:', err);
      toast.error('Error loading services');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchResources();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewResource({
      ...newResource,
      [name]: value
    });
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setNewResource({
      ...newResource,
      workingHours: {
        ...newResource.workingHours,
        [day]: {
          ...newResource.workingHours[day],
          [field]: field === 'isWorking' ? !newResource.workingHours[day].isWorking : value
        }
      }
    });
  };

  const handleServiceToggle = (serviceId) => {
    const services = [...newResource.services];
    const index = services.indexOf(serviceId);
    
    if (index === -1) {
      services.push(serviceId);
    } else {
      services.splice(index, 1);
    }
    
    setNewResource({
      ...newResource,
      services
    });
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      await axiosInstance.post('/resources', newResource, { headers });
      
      toast.success('Resource added successfully');
      setShowAddModal(false);
      setNewResource({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        services: [],
        workingHours: {
          monday: { isWorking: true, start: '09:00', end: '17:00' },
          tuesday: { isWorking: true, start: '09:00', end: '17:00' },
          wednesday: { isWorking: true, start: '09:00', end: '17:00' },
          thursday: { isWorking: true, start: '09:00', end: '17:00' },
          friday: { isWorking: true, start: '09:00', end: '17:00' },
          saturday: { isWorking: false, start: '09:00', end: '17:00' },
          sunday: { isWorking: false, start: '09:00', end: '17:00' }
        },
        color: '#3498db',
        isActive: true
      });
      fetchResources();
    } catch (err) {
      console.error('Error adding resource:', err);
      toast.error('Failed to add resource');
    }
  };

  const handleViewResource = (resource) => {
    setSelectedResource(resource);
    setShowResourceDetails(true);
  };

  const getResourceStatusBadge = (status) => {
    if (status === 'active') {
      return <Badge bg="success">Active</Badge>;
    } else if (status === 'inactive') {
      return <Badge bg="secondary">Inactive</Badge>;
    } else if (status === 'on_leave') {
      return <Badge bg="warning">On Leave</Badge>;
    }
    return <Badge bg="secondary">Unknown</Badge>;
  };

  return (
    <Container fluid className="mt-4">
      <Card className="resource-management-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className="fas fa-users-cog me-2"></i>
            <h4 className="mb-0">Resources Management</h4>
          </div>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <i className="fas fa-plus"></i> Add Resource
          </Button>
        </Card.Header>
        
        <Card.Body>
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3 resource-tabs"
          >
            <Tab eventKey="staff" title="Staff">
              <Nav variant="pills" className="mb-3 sub-tabs">
                <Nav.Item>
                  <Nav.Link 
                    active={activeSubTab === 'active'} 
                    onClick={() => setActiveSubTab('active')}
                  >
                    Active
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeSubTab === 'inactive'} 
                    onClick={() => setActiveSubTab('inactive')}
                  >
                    Inactive
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeSubTab === 'on_leave'} 
                    onClick={() => setActiveSubTab('on_leave')}
                  >
                    On Leave
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              
              <Form onSubmit={handleSearch}>
                <Row className="mb-3">
                  <Col md={4}>
                    <InputGroup>
                      <FormControl
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button variant="outline-secondary" type="submit">
                        <i className="fas fa-search"></i>
                      </Button>
                    </InputGroup>
                  </Col>
                  
                  <Col md={8} className="text-end">
                    <span className="me-2">{totalResources} staff members</span>
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      className="ms-2"
                    >
                      <i className="fas fa-filter"></i> Filter
                    </Button>
                  </Col>
                </Row>
                
                {loading ? (
                  <div className="text-center py-4">
                    <i className="fas fa-spinner fa-spin fa-2x"></i>
                    <p className="mt-2">Loading staff...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-4 text-danger">
                    <i className="fas fa-exclamation-circle fa-2x mb-2"></i>
                    <p>{error}</p>
                  </div>
                ) : resources.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-info-circle fa-2x mb-2"></i>
                    <p>No staff members found. Add your first staff member to get started.</p>
                    <Button 
                      variant="primary"
                      onClick={() => setShowAddModal(true)}
                    >
                      <i className="fas fa-plus"></i> Add Staff Member
                    </Button>
                  </div>
                ) : (
                  <div className="resource-grid">
                    {resources.map((resource) => (
                      <Card 
                        key={resource._id} 
                        className="resource-card"
                        onClick={() => handleViewResource(resource)}
                      >
                        <Card.Body>
                          <div className="resource-avatar" style={{ backgroundColor: resource.color || '#6c757d' }}>
                            {resource.name?.charAt(0) || 'S'}
                          </div>
                          <h5 className="resource-name">{resource.name}</h5>
                          <div className="resource-email">{resource.email}</div>
                          <div className="resource-status mt-2">
                            {getResourceStatusBadge(resource.status || 'active')}
                          </div>
                          <div className="resource-services mt-3">
                            <small className="text-muted">Services:</small>
                            <div className="service-badges">
                              {resource.services?.slice(0, 2).map(service => (
                                <Badge 
                                  key={service._id || service} 
                                  bg="info" 
                                  className="me-1"
                                >
                                  {typeof service === 'object' ? service.name : 'Service'}
                                </Badge>
                              ))}
                              {resource.services?.length > 2 && (
                                <Badge bg="secondary">+{resource.services.length - 2} more</Badge>
                              )}
                              {(!resource.services || resource.services.length === 0) && (
                                <span className="text-muted">No services assigned</span>
                              )}
                            </div>
                          </div>
                        </Card.Body>
                        <Card.Footer>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewResource(resource);
                            }}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle schedule view
                            }}
                          >
                            <i className="fas fa-calendar-alt"></i> Schedule
                          </Button>
                        </Card.Footer>
                      </Card>
                    ))}
                  </div>
                )}
              </Form>
            </Tab>
            <Tab eventKey="rooms" title="Rooms">
              <div className="text-center py-4">
                <i className="fas fa-door-open fa-2x mb-3"></i>
                <h5>Room Management</h5>
                <p className="text-muted">
                  Create rooms to manage your physical resources and assign them to services.
                </p>
                <Button variant="primary">
                  <i className="fas fa-plus"></i> Add Room
                </Button>
              </div>
            </Tab>
            <Tab eventKey="equipment" title="Equipment">
              <div className="text-center py-4">
                <i className="fas fa-tools fa-2x mb-3"></i>
                <h5>Equipment Management</h5>
                <p className="text-muted">
                  Manage your equipment resources and assign them to services or staff.
                </p>
                <Button variant="primary">
                  <i className="fas fa-plus"></i> Add Equipment
                </Button>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Add Resource Modal */}
      <Modal 
        show={showAddModal} 
        onHide={() => setShowAddModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-user-plus me-2"></i>
            Add New {activeTab === 'staff' ? 'Staff Member' : activeTab === 'rooms' ? 'Room' : 'Equipment'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddResource}>
            <Tabs defaultActiveKey="basic" className="mb-3">
              <Tab eventKey="basic" title="Basic Information">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name*</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={newResource.name}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Color</Form.Label>
                      <div className="d-flex">
                        <Form.Control
                          type="color"
                          name="color"
                          value={newResource.color}
                          onChange={handleInputChange}
                          className="me-2"
                          style={{ width: '50px' }}
                        />
                        <Form.Control
                          type="text"
                          value={newResource.color}
                          onChange={handleInputChange}
                          name="color"
                        />
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                
                {activeTab === 'staff' && (
                  <>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={newResource.email}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={newResource.phone}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Role</Form.Label>
                          <Form.Select
                            name="role"
                            value={newResource.role}
                            onChange={handleInputChange}
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Administrator</option>
                            <option value="manager">Manager</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Status</Form.Label>
                          <Form.Select
                            name="isActive"
                            value={newResource.isActive}
                            onChange={(e) => setNewResource({
                              ...newResource,
                              isActive: e.target.value === 'true'
                            })}
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}
              </Tab>
              
              {activeTab === 'staff' && (
                <Tab eventKey="services" title="Services">
                  <p className="text-muted mb-3">
                    Select the services this staff member can provide:
                  </p>
                  
                  <div className="service-selection">
                    {availableServices.map(service => (
                      <Form.Check
                        key={service._id}
                        type="checkbox"
                        id={`service-${service._id}`}
                        label={service.name}
                        checked={newResource.services.includes(service._id)}
                        onChange={() => handleServiceToggle(service._id)}
                        className="mb-2"
                      />
                    ))}
                    
                    {availableServices.length === 0 && (
                      <p className="text-center text-muted">
                        No services available. Please create services first.
                      </p>
                    )}
                  </div>
                </Tab>
              )}
              
              {activeTab === 'staff' && (
                <Tab eventKey="schedule" title="Working Hours">
                  <p className="text-muted mb-3">
                    Set the working hours for this staff member:
                  </p>
                  
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <Row key={day} className="mb-3 align-items-center">
                      <Col md={3}>
                        <Form.Check
                          type="switch"
                          id={`${day}-switch`}
                          label={day.charAt(0).toUpperCase() + day.slice(1)}
                          checked={newResource.workingHours[day].isWorking}
                          onChange={() => handleWorkingHoursChange(day, 'isWorking')}
                        />
                      </Col>
                      
                      <Col md={4}>
                        <Form.Control
                          type="time"
                          value={newResource.workingHours[day].start}
                          onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                          disabled={!newResource.workingHours[day].isWorking}
                        />
                      </Col>
                      
                      <Col md={1} className="text-center">
                        <span>to</span>
                      </Col>
                      
                      <Col md={4}>
                        <Form.Control
                          type="time"
                          value={newResource.workingHours[day].end}
                          onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                          disabled={!newResource.workingHours[day].isWorking}
                        />
                      </Col>
                    </Row>
                  ))}
                </Tab>
              )}
            </Tabs>
            
            <div className="d-flex justify-content-end mt-4">
              <Button 
                variant="outline-secondary" 
                className="me-2"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
              >
                Save {activeTab === 'staff' ? 'Staff Member' : activeTab === 'rooms' ? 'Room' : 'Equipment'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Resource Details Modal */}
      <Modal 
        show={showResourceDetails} 
        onHide={() => setShowResourceDetails(false)}
        size="lg"
      >
        {selectedResource && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>
                <div className="d-flex align-items-center">
                  <div 
                    className="resource-avatar-large me-3"
                    style={{ backgroundColor: selectedResource.color || '#6c757d' }}
                  >
                    {selectedResource.name?.charAt(0) || 'R'}
                  </div>
                  <div>
                    {selectedResource.name}
                    <div className="text-muted fs-6">
                      {getResourceStatusBadge(selectedResource.status || 'active')}
                    </div>
                  </div>
                </div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Tabs defaultActiveKey="info" className="mb-3">
                <Tab eventKey="info" title="Basic Info">
                  <Row>
                    <Col md={6}>
                      <h5 className="mb-3">Contact Information</h5>
                      <p>
                        <strong>Email:</strong> {selectedResource.email || 'Not provided'}
                      </p>
                      <p>
                        <strong>Phone:</strong> {selectedResource.phone || 'Not provided'}
                      </p>
                      <p>
                        <strong>Role:</strong> {selectedResource.role || 'Staff'}
                      </p>
                    </Col>
                    <Col md={6}>
                      <h5 className="mb-3">Services</h5>
                      {selectedResource.services?.length > 0 ? (
                        <div className="service-badges">
                          {selectedResource.services.map(service => (
                            <Badge 
                              key={typeof service === 'object' ? service._id : service} 
                              bg="info" 
                              className="me-1 mb-1"
                            >
                              {typeof service === 'object' ? service.name : 'Service'}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted">No services assigned</p>
                      )}
                    </Col>
                  </Row>
                </Tab>
                <Tab eventKey="schedule" title="Working Hours">
                  {selectedResource.workingHours ? (
                    <div className="working-hours">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <div key={day} className="d-flex justify-content-between py-2 border-bottom">
                          <div className="day-name">
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </div>
                          <div className="hours">
                            {selectedResource.workingHours[day]?.isWorking ? (
                              `${selectedResource.workingHours[day].start} - ${selectedResource.workingHours[day].end}`
                            ) : (
                              <span className="text-muted">Not working</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted">No working hours defined</p>
                  )}
                </Tab>
                <Tab eventKey="bookings" title="Bookings">
                  <div className="text-center py-4">
                    <i className="fas fa-calendar-check fa-2x mb-3"></i>
                    <h5>Booking History</h5>
                    <p className="text-muted">
                      No bookings found for this resource.
                    </p>
                    <Button variant="primary">
                      <i className="fas fa-calendar-plus"></i> Create Booking
                    </Button>
                  </div>
                </Tab>
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              <Button 
                variant="outline-danger" 
                className="me-auto"
              >
                <i className="fas fa-trash-alt"></i> Delete
              </Button>
              <Button 
                variant="outline-secondary" 
                className="me-2"
              >
                <i className="fas fa-calendar-alt"></i> View Schedule
              </Button>
              <Button 
                variant="primary"
              >
                <i className="fas fa-edit"></i> Edit
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>
      
      <style jsx="true">{`
        .resource-tabs .nav-link {
          color: #495057;
          font-weight: 500;
        }
        
        .resource-tabs .nav-link.active {
          color: #0d6efd;
          font-weight: 600;
        }
        
        .sub-tabs .nav-link {
          color: #6c757d;
          border-radius: 20px;
          padding: 0.25rem 1rem;
          margin-right: 0.5rem;
        }
        
        .sub-tabs .nav-link.active {
          background-color: #0d6efd;
          color: white;
        }
        
        .resource-management-card {
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .resource-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
        }
        
        .resource-card {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .resource-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        
        .resource-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #6c757d;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.5rem;
          margin: 0 auto 1rem;
        }
        
        .resource-name {
          text-align: center;
          margin-bottom: 0.25rem;
        }
        
        .resource-email {
          text-align: center;
          color: #6c757d;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }
        
        .resource-status {
          text-align: center;
        }
        
        .resource-services {
          text-align: center;
        }
        
        .service-badges {
          margin-top: 0.5rem;
        }
        
        .resource-avatar-large {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background-color: #0d6efd;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 1.2rem;
        }
        
        .working-hours .day-name {
          font-weight: 500;
        }
      `}</style>
    </Container>
  );
};

export default ResourcesManagement;