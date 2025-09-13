import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Modal, Form, Alert, Row, Col, Tabs, Tab, Badge, Card } from 'react-bootstrap';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { useUserTemplates } from '../context/UserTemplateContext';
import UserTemplateManager from '../components/users/UserTemplateManager';
import CircularPhotoUpload from '../components/common/CircularPhotoUpload';
import { toast } from 'react-toastify';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('userInfo');
  const [editActiveTab, setEditActiveTab] = useState('userInfo');
  const [availableServices, setAvailableServices] = useState([]);
  const [locationAreas, setLocationAreas] = useState([]);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    photo: '',
    services: [],
    postcode: '',
    locationArea: '',
    rooms: [],
    sendPasswordEmail: true,
    isTestUser: false,
    workingHours: {
      monday: { isWorking: true, start: '09:00', end: '17:00' },
      tuesday: { isWorking: true, start: '09:00', end: '17:00' },
      wednesday: { isWorking: true, start: '09:00', end: '17:00' },
      thursday: { isWorking: true, start: '09:00', end: '17:00' },
      friday: { isWorking: true, start: '09:00', end: '17:00' },
      saturday: { isWorking: false, start: '09:00', end: '17:00' },
      sunday: { isWorking: false, start: '09:00', end: '17:00' }
    },
    permissions: {
      dashboard: { read: true, write: false, hidden: false },
      calendar: { read: true, write: false, hidden: false },
      bookings: { read: true, write: false, hidden: false },
      clients: { read: true, write: false, hidden: false },
      services: { read: true, write: false, hidden: false },
      userManagement: { read: false, write: false, hidden: true },
      resourcesManagement: { read: false, write: false, hidden: true },
      staffHR: { read: true, write: false, hidden: false },
      timesheets: { read: true, write: true, hidden: false },
      leaveRequests: { read: true, write: true, hidden: false },
      reports: { read: false, write: false, hidden: true },
      settings: { read: false, write: false, hidden: true },
      branding: { read: false, write: false, hidden: true },
      emailTemplates: { read: false, write: false, hidden: true },
      bulkImport: { read: false, write: false, hidden: true }
    }
  });
  
  // eslint-disable-next-line no-unused-vars
  const [newRoom, setNewRoom] = useState({
    name: '',
    capacity: '',
    location: '',
    isActive: true
  });
  
  // eslint-disable-next-line no-unused-vars
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: '',
    serialNumber: '',
    purchaseDate: '',
    isActive: true
  });
  
  // eslint-disable-next-line no-unused-vars
  const { token, hasRole = () => false } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/users/staff');
      setUsers(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
    fetchServices();
    fetchRooms();
    fetchEquipment();
    fetchLocationAreas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUsers]);
  
  const fetchServices = async () => {
    try {
      const res = await axiosInstance.get('/services');
      setAvailableServices(res.data);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const fetchLocationAreas = async () => {
    try {
      const res = await axiosInstance.get('/booking-categories/areas');
      setLocationAreas(res.data.data || []);
    } catch (err) {
      console.error('Error fetching location areas:', err);
    }
  };
  
  const fetchRooms = async () => {
    try {
      const res = await axiosInstance.get('/resources?type=room');
      setRooms(res.data);
    } catch (err) {
      console.error('Error fetching rooms:', err);
    }
  };
  
  const fetchEquipment = async () => {
    try {
      const res = await axiosInstance.get('/resources?type=equipment');
      setEquipment(res.data);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

  const handleEdit = (user) => {
    // Initialize user with all required fields and defaults
    const editUser = {
      ...user,
      postcode: user.postcode || '',
      locationArea: user.locationArea?._id || user.locationArea || '',
      photo: user.photo || '',
      workingHours: user.workingHours || {
        monday: { isWorking: true, start: '09:00', end: '17:00' },
        tuesday: { isWorking: true, start: '09:00', end: '17:00' },
        wednesday: { isWorking: true, start: '09:00', end: '17:00' },
        thursday: { isWorking: true, start: '09:00', end: '17:00' },
        friday: { isWorking: true, start: '09:00', end: '17:00' },
        saturday: { isWorking: false, start: '09:00', end: '17:00' },
        sunday: { isWorking: false, start: '09:00', end: '17:00' }
      },
      services: user.services || [],
      rooms: user.rooms || [],
      permissions: user.permissions || {
        dashboard: { read: true, write: false, hidden: false },
        calendar: { read: true, write: false, hidden: false },
        bookings: { read: true, write: false, hidden: false },
        clients: { read: true, write: false, hidden: false },
        services: { read: true, write: false, hidden: false },
        userManagement: { read: false, write: false, hidden: true },
        resourcesManagement: { read: false, write: false, hidden: true },
        staffHR: { read: true, write: false, hidden: false },
        timesheets: { read: true, write: true, hidden: false },
        leaveRequests: { read: true, write: true, hidden: false },
        reports: { read: false, write: false, hidden: true },
        settings: { read: false, write: false, hidden: true },
        branding: { read: false, write: false, hidden: true },
        emailTemplates: { read: false, write: false, hidden: true },
        bulkImport: { read: false, write: false, hidden: true }
      }
    };
    setSelectedUser(editUser);
    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedUser(null);
    setEditActiveTab('userInfo');
  };
  
  const handleAddModalClose = () => {
    setShowAddModal(false);
    setActiveTab('userInfo');
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      photo: '',
      services: [],
      postcode: '',
      locationArea: '',
      rooms: [],
      sendPasswordEmail: true,
      workingHours: {
        monday: { isWorking: true, start: '09:00', end: '17:00' },
        tuesday: { isWorking: true, start: '09:00', end: '17:00' },
        wednesday: { isWorking: true, start: '09:00', end: '17:00' },
        thursday: { isWorking: true, start: '09:00', end: '17:00' },
        friday: { isWorking: true, start: '09:00', end: '17:00' },
        saturday: { isWorking: false, start: '09:00', end: '17:00' },
        sunday: { isWorking: false, start: '09:00', end: '17:00' }
      },
      permissions: {
        dashboard: { read: true, write: false, hidden: false },
        calendar: { read: true, write: false, hidden: false },
        bookings: { read: true, write: false, hidden: false },
        clients: { read: true, write: false, hidden: false },
        services: { read: true, write: false, hidden: false },
        userManagement: { read: false, write: false, hidden: true },
        resourcesManagement: { read: false, write: false, hidden: true },
        staffHR: { read: true, write: false, hidden: false },
        timesheets: { read: true, write: true, hidden: false },
        leaveRequests: { read: true, write: true, hidden: false },
        reports: { read: false, write: false, hidden: true },
        settings: { read: false, write: false, hidden: true },
        branding: { read: false, write: false, hidden: true },
        emailTemplates: { read: false, write: false, hidden: true },
        bulkImport: { read: false, write: false, hidden: true }
      }
    });
  };
  
  // Apply template to new user
  const handleApplyTemplate = (template) => {
    setNewUser({
      ...newUser,
      role: template.role,
      services: template.services || [],
      rooms: template.rooms || [],
      location: template.location || '',
      workingHours: {
        monday: { 
          isWorking: template.workingHours.monday.available, 
          start: template.workingHours.monday.start, 
          end: template.workingHours.monday.end 
        },
        tuesday: { 
          isWorking: template.workingHours.tuesday.available, 
          start: template.workingHours.tuesday.start, 
          end: template.workingHours.tuesday.end 
        },
        wednesday: { 
          isWorking: template.workingHours.wednesday.available, 
          start: template.workingHours.wednesday.start, 
          end: template.workingHours.wednesday.end 
        },
        thursday: { 
          isWorking: template.workingHours.thursday.available, 
          start: template.workingHours.thursday.start, 
          end: template.workingHours.thursday.end 
        },
        friday: { 
          isWorking: template.workingHours.friday.available, 
          start: template.workingHours.friday.start, 
          end: template.workingHours.friday.end 
        },
        saturday: { 
          isWorking: template.workingHours.saturday.available, 
          start: template.workingHours.saturday.start, 
          end: template.workingHours.saturday.end 
        },
        sunday: { 
          isWorking: template.workingHours.sunday.available, 
          start: template.workingHours.sunday.start, 
          end: template.workingHours.sunday.end 
        }
      },
      permissions: template.permissions || {
        dashboard: { read: true, write: false, hidden: false },
        calendar: { read: true, write: false, hidden: false },
        bookings: { read: true, write: false, hidden: false },
        clients: { read: true, write: false, hidden: false },
        services: { read: true, write: false, hidden: false },
        userManagement: { read: false, write: false, hidden: true },
        resourcesManagement: { read: false, write: false, hidden: true },
        staffHR: { read: true, write: false, hidden: false },
        timesheets: { read: true, write: true, hidden: false },
        leaveRequests: { read: true, write: true, hidden: false },
        reports: { read: false, write: false, hidden: true },
        settings: { read: false, write: false, hidden: true },
        branding: { read: false, write: false, hidden: true },
        emailTemplates: { read: false, write: false, hidden: true },
        bulkImport: { read: false, write: false, hidden: true }
      }
    });
    toast.success(`Applied template: ${template.name}`);
  };

  const handleChange = (e) => {
    setSelectedUser({
      ...selectedUser,
      [e.target.name]: e.target.value
    });
  };

  // Edit user helper functions
  const handleEditWorkingHoursChange = (day, field, value) => {
    setSelectedUser({
      ...selectedUser,
      workingHours: {
        ...selectedUser.workingHours,
        [day]: {
          ...selectedUser.workingHours[day],
          [field]: field === 'isWorking' ? !selectedUser.workingHours[day].isWorking : value
        }
      }
    });
  };

  const handleEditServiceToggle = (serviceId) => {
    const services = [...selectedUser.services];
    const index = services.indexOf(serviceId);
    if (index > -1) {
      services.splice(index, 1);
    } else {
      services.push(serviceId);
    }
    setSelectedUser({
      ...selectedUser,
      services
    });
  };

  const handleEditPermissionChange = (feature, type, value) => {
    setSelectedUser({
      ...selectedUser,
      permissions: {
        ...selectedUser.permissions,
        [feature]: {
          ...selectedUser.permissions[feature],
          [type]: value
        }
      }
    });
  };

  const handleEditPhotoUpload = (photoData) => {
    setSelectedUser({
      ...selectedUser,
      photo: photoData
    });
  };

  const handleEditPermissionPreset = (preset) => {
    let permissions = {};
    
    switch(preset) {
      case 'staff':
        permissions = {
          dashboard: { read: true, write: false, hidden: false },
          calendar: { read: true, write: false, hidden: false },
          bookings: { read: true, write: false, hidden: false },
          clients: { read: true, write: false, hidden: false },
          services: { read: true, write: false, hidden: false },
          userManagement: { read: false, write: false, hidden: true },
          resourcesManagement: { read: false, write: false, hidden: true },
          staffHR: { read: true, write: false, hidden: false },
          timesheets: { read: true, write: true, hidden: false },
          leaveRequests: { read: true, write: true, hidden: false },
          reports: { read: false, write: false, hidden: true },
          settings: { read: false, write: false, hidden: true },
          branding: { read: false, write: false, hidden: true },
          emailTemplates: { read: false, write: false, hidden: true },
          bulkImport: { read: false, write: false, hidden: true }
        };
        break;
      case 'manager':
        permissions = {
          dashboard: { read: true, write: true, hidden: false },
          calendar: { read: true, write: true, hidden: false },
          bookings: { read: true, write: true, hidden: false },
          clients: { read: true, write: true, hidden: false },
          services: { read: true, write: true, hidden: false },
          userManagement: { read: true, write: false, hidden: false },
          resourcesManagement: { read: true, write: true, hidden: false },
          staffHR: { read: true, write: true, hidden: false },
          timesheets: { read: true, write: true, hidden: false },
          leaveRequests: { read: true, write: true, hidden: false },
          reports: { read: true, write: false, hidden: false },
          settings: { read: true, write: false, hidden: false },
          branding: { read: false, write: false, hidden: true },
          emailTemplates: { read: true, write: false, hidden: false },
          bulkImport: { read: true, write: false, hidden: false }
        };
        break;
      case 'superuser':
        permissions = {
          dashboard: { read: true, write: true, hidden: false },
          calendar: { read: true, write: true, hidden: false },
          bookings: { read: true, write: true, hidden: false },
          clients: { read: true, write: true, hidden: false },
          services: { read: true, write: true, hidden: false },
          userManagement: { read: true, write: true, hidden: false },
          resourcesManagement: { read: true, write: true, hidden: false },
          staffHR: { read: true, write: true, hidden: false },
          timesheets: { read: true, write: true, hidden: false },
          leaveRequests: { read: true, write: true, hidden: false },
          reports: { read: true, write: true, hidden: false },
          settings: { read: true, write: true, hidden: false },
          branding: { read: true, write: true, hidden: false },
          emailTemplates: { read: true, write: true, hidden: false },
          bulkImport: { read: true, write: true, hidden: false }
        };
        break;
      default:
        return;
    }
    
    setSelectedUser({
      ...selectedUser,
      permissions
    });
    toast.success(`Applied ${preset} permissions`);
  };
  
  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleWorkingHoursChange = (day, field, value) => {
    setNewUser({
      ...newUser,
      workingHours: {
        ...newUser.workingHours,
        [day]: {
          ...newUser.workingHours[day],
          [field]: field === 'isWorking' ? !newUser.workingHours[day].isWorking : value
        }
      }
    });
  };
  
  const handleServiceToggle = (serviceId) => {
    const services = [...newUser.services];
    const index = services.indexOf(serviceId);
    
    if (index === -1) {
      services.push(serviceId);
    } else {
      services.splice(index, 1);
    }
    
    setNewUser({
      ...newUser,
      services
    });
  };
  
  const handlePhotoUpload = (photoUrl) => {
    setNewUser({
      ...newUser,
      photo: photoUrl
    });
  };

  const handlePermissionChange = (feature, permissionType, value) => {
    setNewUser({
      ...newUser,
      permissions: {
        ...newUser.permissions,
        [feature]: {
          ...newUser.permissions[feature],
          [permissionType]: value
        }
      }
    });
  };

  const handlePermissionPreset = (preset) => {
    let permissions = {};
    
    if (preset === 'staff') {
      permissions = {
        dashboard: { read: true, write: false, hidden: false },
        calendar: { read: true, write: false, hidden: false },
        bookings: { read: true, write: false, hidden: false },
        clients: { read: true, write: false, hidden: false },
        services: { read: true, write: false, hidden: false },
        userManagement: { read: false, write: false, hidden: true },
        resourcesManagement: { read: false, write: false, hidden: true },
        staffHR: { read: true, write: false, hidden: false },
        timesheets: { read: true, write: true, hidden: false },
        leaveRequests: { read: true, write: true, hidden: false },
        reports: { read: false, write: false, hidden: true },
        settings: { read: false, write: false, hidden: true },
        branding: { read: false, write: false, hidden: true },
        emailTemplates: { read: false, write: false, hidden: true },
        bulkImport: { read: false, write: false, hidden: true }
      };
    } else if (preset === 'manager') {
      permissions = {
        dashboard: { read: true, write: true, hidden: false },
        calendar: { read: true, write: true, hidden: false },
        bookings: { read: true, write: true, hidden: false },
        clients: { read: true, write: true, hidden: false },
        services: { read: true, write: true, hidden: false },
        userManagement: { read: true, write: true, hidden: false },
        resourcesManagement: { read: true, write: true, hidden: false },
        staffHR: { read: true, write: true, hidden: false },
        timesheets: { read: true, write: true, hidden: false },
        leaveRequests: { read: true, write: true, hidden: false },
        reports: { read: true, write: false, hidden: false },
        settings: { read: true, write: false, hidden: false },
        branding: { read: false, write: false, hidden: true },
        emailTemplates: { read: true, write: false, hidden: false },
        bulkImport: { read: true, write: true, hidden: false }
      };
    } else if (preset === 'superuser') {
      permissions = {
        dashboard: { read: true, write: true, hidden: false },
        calendar: { read: true, write: true, hidden: false },
        bookings: { read: true, write: true, hidden: false },
        clients: { read: true, write: true, hidden: false },
        services: { read: true, write: true, hidden: false },
        userManagement: { read: true, write: true, hidden: false },
        resourcesManagement: { read: true, write: true, hidden: false },
        staffHR: { read: true, write: true, hidden: false },
        timesheets: { read: true, write: true, hidden: false },
        leaveRequests: { read: true, write: true, hidden: false },
        reports: { read: true, write: true, hidden: false },
        settings: { read: true, write: true, hidden: false },
        branding: { read: true, write: true, hidden: false },
        emailTemplates: { read: true, write: true, hidden: false },
        bulkImport: { read: true, write: true, hidden: false }
      };
    }
    
    setNewUser({
      ...newUser,
      permissions
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`/users/${selectedUser._id}`, selectedUser);
      fetchUsers();
      handleClose();
    } catch (err) {
      setError('Failed to update user');
      console.error(err);
    }
  };
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    console.log('Adding new user with enhanced data:', newUser);
    
    // Validate required fields
    if (!newUser.name || !newUser.email || (!newUser.password && !newUser.sendPasswordEmail)) {
      setError('Name, email and password are required');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a complete user object with all the new fields
      const userToCreate = {
        ...newUser,
        // Include all the enhanced fields
        photo: newUser.photo,
        services: newUser.services,
        workingHours: newUser.workingHours,
        postcode: newUser.postcode,
        locationArea: newUser.locationArea,
        rooms: newUser.rooms,
        sendPasswordEmail: newUser.sendPasswordEmail,
        permissions: newUser.permissions
      };
      
      // Make API call to create user
      const response = await axiosInstance.post('/users', userToCreate);
      
      console.log('User created successfully with enhanced data:', response.data);
      
      // Show success message and reset form
      setSuccess('User created successfully with all details!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Close modal and refresh user list
      handleAddModalClose();
      await fetchUsers();
      toast.success('User added with photo, working hours, and service assignments');
      
    } catch (err) {
      console.error('Error creating user:', err.response?.data || err.message);
      setError(err.response?.data?.msg || 'Failed to create user. Please try again.');
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    // Only managers and superusers can delete accounts
    if (currentUser.role !== 'manager' && currentUser.role !== 'superuser') {
      toast.error('Only managers can delete user accounts');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axiosInstance.delete(`/users/${id}`);
        fetchUsers();
        toast.success('User deleted successfully');
      } catch (err) {
        setError('Failed to delete user');
        console.error(err);
        toast.error('Failed to delete user');
      }
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">User Management</h2>
      
      <div className="d-flex justify-content-between mb-3">
        <div></div>
        <Button 
          variant="primary" 
          onClick={() => setShowAddModal(true)}
        >
          Add New User
        </Button>
      </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td style={{width: '60px', textAlign: 'center'}}>
                <img 
                  src={user.photo || '/static/default-avatar.png'} 
                  alt={user.name}
                  style={{
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid #ddd'
                  }}
                />
              </td>
              <td>
                {user.name}
                {user.isTestUser && currentUser?.role === 'superuser' && (
                  <Badge bg="warning" className="ms-2">TEST</Badge>
                )}
              </td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>
                <Button 
                  variant="info" 
                  size="sm" 
                  className="me-2"
                  onClick={() => handleEdit(user)}
                >
                  Edit
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleDelete(user._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal 
        show={showModal} 
        onHide={handleClose}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <Form onSubmit={handleSubmit}>
              <Tabs
                activeKey={editActiveTab}
                onSelect={(k) => setEditActiveTab(k)}
                className="mb-4"
              >
                <Tab eventKey="userInfo" title="User Information">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="name"
                          value={selectedUser.name}
                          onChange={handleChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={selectedUser.email}
                          onChange={handleChange}
                          required
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
                          value={selectedUser.role}
                          onChange={handleChange}
                          required
                        >
                          <option value="client">Client</option>
                          <option value="staff">Staff</option>
                          {hasRole(['manager', 'superuser']) && (
                            <option value="manager">Manager</option>
                          )}
                          {hasRole(['superuser']) && (
                            <option value="superuser">Superuser</option>
                          )}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Postcode</Form.Label>
                        <Form.Control
                          type="text"
                          name="postcode"
                          value={selectedUser.postcode}
                          onChange={handleChange}
                          placeholder="Enter postcode for radius search"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Location Area</Form.Label>
                        <Form.Select
                          name="locationArea"
                          value={selectedUser.locationArea}
                          onChange={handleChange}
                        >
                          <option value="">Select location area...</option>
                          {locationAreas.map(area => (
                            <option key={area._id} value={area._id}>
                              {area.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          Used for staff filtering and search functionality
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col md={12} className="text-center">
                      <Form.Label>Profile Photo</Form.Label>
                      <div className="d-flex justify-content-center">
                        <CircularPhotoUpload
                          currentPhoto={selectedUser.photo}
                          onPhotoUpdate={handleEditPhotoUpload}
                          size={150}
                        />
                      </div>
                    </Col>
                  </Row>
                </Tab>
                
                <Tab eventKey="workingHours" title="Working Hours">
                  <Card className="mb-3">
                    <Card.Body>
                      {Object.keys(selectedUser.workingHours).map((day) => (
                        <Row key={day} className="mb-3 align-items-center">
                          <Col md={3}>
                            <Form.Check
                              type="checkbox"
                              id={`edit-working-${day}`}
                              label={day.charAt(0).toUpperCase() + day.slice(1)}
                              checked={selectedUser.workingHours[day].isWorking}
                              onChange={() => handleEditWorkingHoursChange(day, 'isWorking')}
                            />
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>Start Time</Form.Label>
                              <Form.Control
                                type="time"
                                value={selectedUser.workingHours[day].start}
                                onChange={(e) => handleEditWorkingHoursChange(day, 'start', e.target.value)}
                                disabled={!selectedUser.workingHours[day].isWorking}
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label>End Time</Form.Label>
                              <Form.Control
                                type="time"
                                value={selectedUser.workingHours[day].end}
                                onChange={(e) => handleEditWorkingHoursChange(day, 'end', e.target.value)}
                                disabled={!selectedUser.workingHours[day].isWorking}
                              />
                            </Form.Group>
                          </Col>
                        </Row>
                      ))}
                    </Card.Body>
                  </Card>
                </Tab>
                
                <Tab eventKey="services" title="Services & Resources">
                  <Card className="mb-3">
                    <Card.Header>Assigned Services</Card.Header>
                    <Card.Body>
                      <Row>
                        {availableServices.map(service => (
                          <Col md={6} key={service._id} className="mb-2">
                            <Form.Check
                              type="checkbox"
                              id={`edit-service-${service._id}`}
                              label={service.name}
                              checked={selectedUser.services.includes(service._id)}
                              onChange={() => handleEditServiceToggle(service._id)}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Card.Body>
                  </Card>
                </Tab>
                
                <Tab eventKey="permissions" title="Permissions">
                  <Card className="mb-3">
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <span>User Permissions</span>
                        <div>
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEditPermissionPreset('staff')}
                          >
                            Staff
                          </Button>
                          <Button 
                            variant="outline-success" 
                            size="sm" 
                            className="me-2"
                            onClick={() => handleEditPermissionPreset('manager')}
                          >
                            Manager
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            onClick={() => handleEditPermissionPreset('superuser')}
                          >
                            Superuser
                          </Button>
                        </div>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>Read</th>
                            <th>Write</th>
                            <th>Hidden</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.keys(selectedUser.permissions).map(feature => (
                            <tr key={feature}>
                              <td className="fw-bold">
                                {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                              </td>
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={selectedUser.permissions[feature].read}
                                  onChange={(e) => handleEditPermissionChange(feature, 'read', e.target.checked)}
                                  disabled={selectedUser.permissions[feature].hidden}
                                />
                              </td>
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={selectedUser.permissions[feature].write}
                                  onChange={(e) => handleEditPermissionChange(feature, 'write', e.target.checked)}
                                  disabled={!selectedUser.permissions[feature].read || selectedUser.permissions[feature].hidden}
                                />
                              </td>
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={selectedUser.permissions[feature].hidden}
                                  onChange={(e) => handleEditPermissionChange(feature, 'hidden', e.target.checked)}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Tab>
              </Tabs>
              
              <div className="d-flex justify-content-end">
                <Button variant="secondary" className="me-2" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Add User Modal */}
      <Modal
        show={showAddModal}
        onHide={handleAddModalClose}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddUser}>
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-4"
            >
              <Tab eventKey="userInfo" title="User Information">
                <div className="mb-4">
                  <h5>User Templates</h5>
                  <p className="text-muted">Select a template to pre-fill user settings</p>
                  <UserTemplateManager onSelectTemplate={handleApplyTemplate} />
                </div>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={newUser.name}
                        onChange={handleNewUserChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={newUser.email}
                        onChange={handleNewUserChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={newUser.password}
                        onChange={handleNewUserChange}
                        required={!newUser.sendPasswordEmail}
                        disabled={newUser.sendPasswordEmail}
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="Send password reset email to user"
                        name="sendPasswordEmail"
                        checked={newUser.sendPasswordEmail}
                        onChange={(e) => setNewUser({...newUser, sendPasswordEmail: e.target.checked})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      <Form.Select
                        name="role"
                        value={newUser.role}
                        onChange={handleNewUserChange}
                        required
                      >
                        <option value="client">Client</option>
                        <option value="staff">Staff</option>
                        {hasRole(['manager', 'superuser']) && (
                          <option value="manager">Manager</option>
                        )}
                        {hasRole(['superuser']) && (
                          <option value="superuser">Superuser</option>
                        )}
                      </Form.Select>
                    </Form.Group>
                    {hasRole(['superuser']) && (
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          name="isTestUser"
                          label="Test User (data only visible to superusers)"
                          checked={newUser.isTestUser}
                          onChange={handleNewUserChange}
                        />
                      </Form.Group>
                    )}
                    <Form.Group className="mb-3">
                      <Form.Label>Postcode</Form.Label>
                      <Form.Control
                        type="text"
                        name="postcode"
                        value={newUser.postcode}
                        onChange={handleNewUserChange}
                        placeholder="Enter postcode for radius search"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Location Area</Form.Label>
                      <Form.Select
                        name="locationArea"
                        value={newUser.locationArea}
                        onChange={handleNewUserChange}
                      >
                        <option value="">Select location area...</option>
                        {locationAreas.map(area => (
                          <option key={area._id} value={area._id}>
                            {area.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Used for staff filtering and search functionality
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col md={12} className="text-center">
                    <Form.Label>Profile Photo</Form.Label>
                    <div className="d-flex justify-content-center">
                      <CircularPhotoUpload
                        currentPhoto={newUser.photo}
                        onPhotoUpdate={handlePhotoUpload}
                        size={150}
                      />
                    </div>
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="workingHours" title="Working Hours">
                <Card className="mb-3">
                  <Card.Body>
                    {Object.keys(newUser.workingHours).map((day) => (
                      <Row key={day} className="mb-3 align-items-center">
                        <Col md={3}>
                          <Form.Check
                            type="checkbox"
                            id={`working-${day}`}
                            label={day.charAt(0).toUpperCase() + day.slice(1)}
                            checked={newUser.workingHours[day].isWorking}
                            onChange={() => handleWorkingHoursChange(day, 'isWorking')}
                          />
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>Start Time</Form.Label>
                            <Form.Control
                              type="time"
                              value={newUser.workingHours[day].start}
                              onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                              disabled={!newUser.workingHours[day].isWorking}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label>End Time</Form.Label>
                            <Form.Control
                              type="time"
                              value={newUser.workingHours[day].end}
                              onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                              disabled={!newUser.workingHours[day].isWorking}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                    ))}
                  </Card.Body>
                </Card>
              </Tab>
              
              <Tab eventKey="services" title="Services & Resources">
                <Card className="mb-3">
                  <Card.Header>Assigned Services</Card.Header>
                  <Card.Body>
                    <Row>
                      {availableServices.map(service => (
                        <Col md={6} key={service._id} className="mb-2">
                          <Form.Check
                            type="checkbox"
                            id={`service-${service._id}`}
                            label={service.name}
                            checked={newUser.services.includes(service._id)}
                            onChange={() => handleServiceToggle(service._id)}
                          />
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
                
                <Row>
                  <Col md={6}>
                    <Card>
                      <Card.Header>Rooms</Card.Header>
                      <Card.Body style={{maxHeight: '200px', overflowY: 'auto'}}>
                        <Table striped bordered hover size="sm">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Capacity</th>
                              <th>Location</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rooms.map(room => (
                              <tr key={room._id}>
                                <td>{room.name}</td>
                                <td>{room.capacity}</td>
                                <td>{room.location}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <Card.Header>Equipment</Card.Header>
                      <Card.Body style={{maxHeight: '200px', overflowY: 'auto'}}>
                        <Table striped bordered hover size="sm">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Type</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {equipment.map(item => (
                              <tr key={item._id}>
                                <td>{item.name}</td>
                                <td>{item.type}</td>
                                <td>
                                  <Badge bg={item.isActive ? "success" : "secondary"}>
                                    {item.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Tab>
              
              <Tab eventKey="permissions" title="Permissions">
                <Card className="mb-3">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Access Permissions</h5>
                    <div>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handlePermissionPreset('staff')}
                      >
                        Staff Preset
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handlePermissionPreset('manager')}
                      >
                        Manager Preset
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={() => handlePermissionPreset('superuser')}
                      >
                        Superuser Preset
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body>
                    <div className="table-responsive">
                      <Table striped bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Feature</th>
                            <th>Read</th>
                            <th>Write</th>
                            <th>Hidden</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(newUser.permissions).map(([feature, perms]) => (
                            <tr key={feature}>
                              <td className="fw-bold">
                                {feature.charAt(0).toUpperCase() + feature.slice(1).replace(/([A-Z])/g, ' $1')}
                              </td>
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={perms.read}
                                  onChange={(e) => handlePermissionChange(feature, 'read', e.target.checked)}
                                  disabled={perms.hidden}
                                />
                              </td>
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={perms.write}
                                  onChange={(e) => handlePermissionChange(feature, 'write', e.target.checked)}
                                  disabled={perms.hidden || !perms.read}
                                />
                              </td>
                              <td>
                                <Form.Check
                                  type="checkbox"
                                  checked={perms.hidden}
                                  onChange={(e) => {
                                    handlePermissionChange(feature, 'hidden', e.target.checked);
                                    if (e.target.checked) {
                                      handlePermissionChange(feature, 'read', false);
                                      handlePermissionChange(feature, 'write', false);
                                    }
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    <div className="mt-3">
                      <small className="text-muted">
                        <strong>Read:</strong> User can view this feature<br/>
                        <strong>Write:</strong> User can modify data in this feature (requires Read)<br/>
                        <strong>Hidden:</strong> Feature is completely hidden from user
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
            
            <div className="d-flex justify-content-between mt-4">
              <Button 
                variant="secondary" 
                onClick={() => {
                  if (activeTab === 'userInfo') {
                    handleAddModalClose();
                  } else if (activeTab === 'workingHours') {
                    setActiveTab('userInfo');
                  } else if (activeTab === 'services') {
                    setActiveTab('workingHours');
                  } else if (activeTab === 'permissions') {
                    setActiveTab('services');
                  }
                }}
              >
                {activeTab === 'userInfo' ? 'Cancel' : 'Back'}
              </Button>
              
              <div>
                {activeTab !== 'permissions' ? (
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      if (activeTab === 'userInfo') {
                        setActiveTab('workingHours');
                      } else if (activeTab === 'workingHours') {
                        setActiveTab('services');
                      } else if (activeTab === 'services') {
                        setActiveTab('permissions');
                      }
                    }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button variant="success" type="submit">
                    Add User
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default UserManagement;