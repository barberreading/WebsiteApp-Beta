import React, { useState, useEffect } from 'react';
import { useUserTemplates } from '../../context/UserTemplateContext';
import { useAuth } from '../../context/AuthContext';
import { Button, Modal, Form, Table, Alert } from 'react-bootstrap';

const UserTemplateManager = ({ onSelectTemplate }) => {
  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate } = useUserTemplates();
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    role: 'staff',
    services: [],
    workingHours: {
      monday: { start: '09:00', end: '17:00', available: true },
      tuesday: { start: '09:00', end: '17:00', available: true },
      wednesday: { start: '09:00', end: '17:00', available: true },
      thursday: { start: '09:00', end: '17:00', available: true },
      friday: { start: '09:00', end: '17:00', available: true },
      saturday: { start: '09:00', end: '17:00', available: false },
      sunday: { start: '09:00', end: '17:00', available: false }
    },
    rooms: [],
    location: '',
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

  // Check if user can manage templates
  const canManageTemplates = ['admin', 'manager', 'superuser'].includes(currentUser?.role);

  // Reset form when modal closes
  useEffect(() => {
    if (!showModal) {
      resetForm();
    }
  }, [showModal]);

  // Reset form to default values
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      role: 'staff',
      services: [],
      workingHours: {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '17:00', available: false },
        sunday: { start: '09:00', end: '17:00', available: false }
      },
      rooms: [],
      location: '',
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
    setEditMode(false);
    setCurrentTemplate(null);
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle working hours changes
  const handleWorkingHoursChange = (day, field, value) => {
    setFormData({
      ...formData,
      workingHours: {
        ...formData.workingHours,
        [day]: {
          ...formData.workingHours[day],
          [field]: field === 'available' ? value === 'true' : value
        }
      }
    });
  };

  // Handle services and rooms (comma-separated values)
  const handleArrayChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value.split(',').map(item => item.trim()).filter(item => item !== '')
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editMode && currentTemplate) {
        await updateTemplate(currentTemplate._id, formData);
      } else {
        await createTemplate(formData);
      }
      setShowModal(false);
    } catch (err) {
      logger.error('Error saving template:', err);
    }
  };

  // Edit template
  const handleEdit = (template) => {
    setCurrentTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      role: template.role,
      services: template.services || [],
      workingHours: template.workingHours || {
        monday: { start: '09:00', end: '17:00', available: true },
        tuesday: { start: '09:00', end: '17:00', available: true },
        wednesday: { start: '09:00', end: '17:00', available: true },
        thursday: { start: '09:00', end: '17:00', available: true },
        friday: { start: '09:00', end: '17:00', available: true },
        saturday: { start: '09:00', end: '17:00', available: false },
        sunday: { start: '09:00', end: '17:00', available: false }
      },
      rooms: template.rooms || [],
      location: template.location || '',
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
    setEditMode(true);
    setShowModal(true);
  };

  // Delete template
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  // Select template for use
  const handleSelect = (template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  return (
    <div className="user-template-manager">
      {error && <Alert variant="danger">{error}</Alert>}
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>User Templates</h3>
        {canManageTemplates && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            Create New Template
          </Button>
        )}
      </div>

      {loading ? (
        <p>Loading templates...</p>
      ) : templates.length === 0 ? (
        <p>No templates available. {canManageTemplates && 'Create one to get started.'}</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Description</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template._id}>
                <td>{template.name}</td>
                <td>{template.role}</td>
                <td>{template.description}</td>
                <td>{template.location}</td>
                <td>
                  <Button 
                    variant="success" 
                    size="sm" 
                    className="me-2"
                    onClick={() => handleSelect(template)}
                  >
                    Use
                  </Button>
                  
                  {canManageTemplates && (
                    <>
                      <Button 
                        variant="info" 
                        size="sm" 
                        className="me-2"
                        onClick={() => handleEdit(template)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDelete(template._id)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Template Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? 'Edit Template' : 'Create New Template'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Template Name*</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Role*</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Location</Form.Label>
              <Form.Control
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Services (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                name="services"
                value={formData.services.join(', ')}
                onChange={handleArrayChange}
                placeholder="Service 1, Service 2, Service 3"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rooms (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                name="rooms"
                value={formData.rooms.join(', ')}
                onChange={handleArrayChange}
                placeholder="Room 1, Room 2, Room 3"
              />
            </Form.Group>

            <h5 className="mt-4">Working Hours</h5>
            {Object.keys(formData.workingHours).map(day => (
              <div key={day} className="working-hours-row mb-3">
                <div className="d-flex align-items-center">
                  <div className="col-md-2">
                    <Form.Label className="text-capitalize">{day}</Form.Label>
                  </div>
                  <div className="col-md-3">
                    <Form.Select
                      value={formData.workingHours[day].available.toString()}
                      onChange={(e) => handleWorkingHoursChange(day, 'available', e.target.value)}
                    >
                      <option value="true">Available</option>
                      <option value="false">Unavailable</option>
                    </Form.Select>
                  </div>
                  {formData.workingHours[day].available && (
                    <>
                      <div className="col-md-3 ms-2">
                        <Form.Control
                          type="time"
                          value={formData.workingHours[day].start}
                          onChange={(e) => handleWorkingHoursChange(day, 'start', e.target.value)}
                        />
                      </div>
                      <div className="col-md-1 text-center">to</div>
                      <div className="col-md-3">
                        <Form.Control
                          type="time"
                          value={formData.workingHours[day].end}
                          onChange={(e) => handleWorkingHoursChange(day, 'end', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editMode ? 'Update Template' : 'Create Template'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default UserTemplateManager;