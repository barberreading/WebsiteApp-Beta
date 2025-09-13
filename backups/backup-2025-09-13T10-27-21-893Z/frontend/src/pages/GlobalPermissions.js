import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Badge } from 'react-bootstrap';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { validateToken } from '../utils/auth';

const GlobalPermissions = () => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('staff');

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      if (!validateToken()) {
        throw new Error('Authentication token not found');
      }
      
      const response = await axiosInstance.get('/global-permissions');
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (role, category, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      rolePermissions: {
        ...prev.rolePermissions,
        [role]: {
          ...prev.rolePermissions[role],
          [category]: {
            ...prev.rolePermissions[role][category],
            [permission]: value
          }
        }
      }
    }));
  };

  const handleClientTemplateChange = (category, permission, value) => {
    setPermissions(prev => ({
      ...prev,
      defaultClientPermissions: {
        ...prev.defaultClientPermissions,
        [category]: {
          ...prev.defaultClientPermissions[category],
          [permission]: value
        }
      }
    }));
  };

  const handleSettingsChange = (setting, value) => {
    setPermissions(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleAdminUserGroupChange = (groupType, userId, action) => {
    setPermissions(prev => {
      const currentGroup = prev.adminUserGroups?.[groupType] || [];
      let updatedGroup;
      
      if (action === 'add') {
        updatedGroup = [...currentGroup, userId];
      } else {
        updatedGroup = currentGroup.filter(id => id !== userId);
      }
      
      return {
        ...prev,
        adminUserGroups: {
          ...prev.adminUserGroups,
          [groupType]: updatedGroup
        }
      };
    });
  };

  const handleHRDocumentAccessChange = (setting, value) => {
    setPermissions(prev => ({
      ...prev,
      hrDocumentAccess: {
        ...prev.hrDocumentAccess,
        [setting]: value
      }
    }));
  };

  const handleStaffGalleryAccessChange = (setting, value) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      
      // Handle nested object paths like 'client.enabled' or 'manager.accessType'
      if (setting.includes('.')) {
        const [role, property] = setting.split('.');
        newPermissions.staffGalleryAccess = {
          ...prev.staffGalleryAccess,
          [role]: {
            ...prev.staffGalleryAccess?.[role],
            [property]: value
          }
        };
      } else {
        // Handle direct properties
        newPermissions.staffGalleryAccess = {
          ...prev.staffGalleryAccess,
          [setting]: value
        };
      }
      
      return newPermissions;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await axiosInstance.put('/global-permissions', permissions);
      toast.success('Global permissions updated successfully');
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all permissions to defaults? This action cannot be undone.')) {
      try {
        setSaving(true);
        await axiosInstance.post('/global-permissions/reset');
        await fetchPermissions();
        toast.success('Permissions reset to defaults');
      } catch (error) {
        console.error('Error resetting permissions:', error);
        toast.error('Failed to reset permissions');
      } finally {
        setSaving(false);
      }
    }
  };

  const renderPermissionSection = (role, rolePermissions) => {
    if (!rolePermissions) return null;

    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            {role.charAt(0).toUpperCase() + role.slice(1)} Permissions
            <Badge bg="secondary" className="ms-2">{role}</Badge>
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Calendar Permissions</h6>
              {Object.entries(rolePermissions.calendar || {}).map(([permission, value]) => (
                <Form.Check
                  key={permission}
                  type="switch"
                  id={`${role}-calendar-${permission}`}
                  label={permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  checked={value}
                  onChange={(e) => handlePermissionChange(role, 'calendar', permission, e.target.checked)}
                  className="mb-2"
                />
              ))}
            </Col>
            <Col md={6}>
              <h6>Data Permissions</h6>
              {Object.entries(rolePermissions.data || {}).map(([permission, value]) => (
                <Form.Check
                  key={permission}
                  type="switch"
                  id={`${role}-data-${permission}`}
                  label={permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  checked={value}
                  onChange={(e) => handlePermissionChange(role, 'data', permission, e.target.checked)}
                  className="mb-2"
                />
              ))}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  const renderClientTemplate = () => {
    if (!permissions?.defaultClientPermissions) return null;

    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            Default Client Permissions Template
            <Badge bg="info" className="ms-2">Template</Badge>
          </h5>
          <small className="text-muted">
            These permissions will be applied to new clients by default
          </small>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Calendar Permissions</h6>
              {Object.entries(permissions.defaultClientPermissions.calendar || {}).map(([permission, value]) => (
                <Form.Check
                  key={permission}
                  type="switch"
                  id={`client-template-calendar-${permission}`}
                  label={permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  checked={value}
                  onChange={(e) => handleClientTemplateChange('calendar', permission, e.target.checked)}
                  className="mb-2"
                />
              ))}
            </Col>
            <Col md={6}>
              <h6>Data Permissions</h6>
              {Object.entries(permissions.defaultClientPermissions.data || {}).map(([permission, value]) => (
                <Form.Check
                  key={permission}
                  type="switch"
                  id={`client-template-data-${permission}`}
                  label={permission.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  checked={value}
                  onChange={(e) => handleClientTemplateChange('data', permission, e.target.checked)}
                  className="mb-2"
                />
              ))}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    );
  };

  const renderAdminUserGroups = () => {
    return (
      <div>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              HR Document Administrators
              <Badge bg="warning" className="ms-2">HR Admin</Badge>
            </h5>
            <small className="text-muted">
              Users who can manage HR documents and access settings
            </small>
          </Card.Header>
          <Card.Body>
            <Alert variant="info">
              <strong>Note:</strong> HR Administrators can view and manage all HR documents, 
              configure document access settings, and manage temporary client access.
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Current HR Administrators:</Form.Label>
              <div className="border rounded p-3 bg-light">
                {permissions.adminUserGroups?.hrAdmins?.length > 0 ? (
                  permissions.adminUserGroups.hrAdmins.map(userId => (
                    <Badge key={userId} bg="primary" className="me-2 mb-2">
                      User ID: {userId}
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-white p-0 ms-1"
                        onClick={() => handleAdminUserGroupChange('hrAdmins', userId, 'remove')}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted">No HR administrators assigned</span>
                )}
              </div>
            </Form.Group>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              Staff Gallery Administrators
              <Badge bg="success" className="ms-2">Gallery Admin</Badge>
            </h5>
            <small className="text-muted">
              Users who can manage staff gallery and photo access settings
            </small>
          </Card.Header>
          <Card.Body>
            <Alert variant="info">
              <strong>Note:</strong> Gallery Administrators can manage staff photos, 
              configure gallery access settings, and control client viewing permissions.
            </Alert>
            <Form.Group className="mb-3">
              <Form.Label>Current Gallery Administrators:</Form.Label>
              <div className="border rounded p-3 bg-light">
                {permissions.adminUserGroups?.galleryAdmins?.length > 0 ? (
                  permissions.adminUserGroups.galleryAdmins.map(userId => (
                    <Badge key={userId} bg="success" className="me-2 mb-2">
                      User ID: {userId}
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-white p-0 ms-1"
                        onClick={() => handleAdminUserGroupChange('galleryAdmins', userId, 'remove')}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-muted">No gallery administrators assigned</span>
                )}
              </div>
            </Form.Group>
          </Card.Body>
        </Card>
      </div>
    );
  };

  const renderHRDocumentAccess = () => {
    const hrSettings = permissions.hrDocumentAccess || {};
    const gallerySettings = permissions.staffGalleryAccess || {};

    return (
      <div>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              HR Document Access Settings
              <Badge bg="danger" className="ms-2">HR Documents</Badge>
            </h5>
            <small className="text-muted">
              Configure temporary access to HR documents for clients based on booking schedules
            </small>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <h6>Access Control</h6>
                <Form.Check
                  type="switch"
                  id="hr-enable-temp-access"
                  label="Enable Temporary Access"
                  checked={hrSettings.enableTemporaryAccess || false}
                  onChange={(e) => handleHRDocumentAccessChange('enableTemporaryAccess', e.target.checked)}
                  className="mb-3"
                />
                
                <Form.Group className="mb-3">
                  <Form.Label>Access Window (hours before shift)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="168"
                    value={hrSettings.accessWindowHours || 48}
                    onChange={(e) => handleHRDocumentAccessChange('accessWindowHours', parseInt(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    Hours before shift start when access begins (default: 48)
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Access Duration (hours after shift)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    max="168"
                    value={hrSettings.accessDurationHours || 48}
                    onChange={(e) => handleHRDocumentAccessChange('accessDurationHours', parseInt(e.target.value))}
                  />
                  <Form.Text className="text-muted">
                    Hours after shift end when access expires (default: 48)
                  </Form.Text>
                </Form.Group>

                <Form.Check
                  type="switch"
                  id="hr-allow-overlapping"
                  label="Allow Overlapping Access"
                  checked={hrSettings.allowOverlappingAccess !== false}
                  onChange={(e) => handleHRDocumentAccessChange('allowOverlappingAccess', e.target.checked)}
                  className="mb-2"
                />
                <Form.Text className="text-muted d-block mb-3">
                  Extend access window when multiple bookings overlap
                </Form.Text>
              </Col>
              
              <Col md={6}>
                <h6>Document Types</h6>
                {['contract', 'handbook', 'policies', 'procedures', 'training', 'safety'].map(docType => (
                  <Form.Check
                    key={docType}
                    type="switch"
                    id={`hr-doc-${docType}`}
                    label={docType.charAt(0).toUpperCase() + docType.slice(1)}
                    checked={hrSettings.documentTypes?.includes(docType) !== false}
                    onChange={(e) => {
                      const currentTypes = hrSettings.documentTypes || ['contract', 'handbook', 'policies', 'procedures', 'training', 'safety'];
                      const updatedTypes = e.target.checked 
                        ? [...currentTypes, docType].filter((v, i, a) => a.indexOf(v) === i)
                        : currentTypes.filter(type => type !== docType);
                      handleHRDocumentAccessChange('documentTypes', updatedTypes);
                    }}
                    className="mb-2"
                  />
                ))}
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Client Access Settings */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              Client Staff Gallery Access
              <Badge bg="primary" className="ms-2">Client</Badge>
            </h5>
            <small className="text-muted">
              Configure how clients can access staff gallery
            </small>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="client-gallery-enabled"
                  label="Enable Client Access"
                  checked={gallerySettings.client?.enabled !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('client.enabled', e.target.checked)}
                  className="mb-3"
                />
                
                <Form.Group className="mb-3">
                  <Form.Label>Access Type</Form.Label>
                  <Form.Select
                    value={gallerySettings.client?.accessType || 'booked_only'}
                    onChange={(e) => handleStaffGalleryAccessChange('client.accessType', e.target.value)}
                  >
                    <option value="none">No Access</option>
                    <option value="booked_only">Only Booked Staff</option>
                    <option value="all">All Staff</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Booked only: Clients see staff they have bookings with
                  </Form.Text>
                </Form.Group>
                
                <Form.Check
                  type="switch"
                  id="client-time-limited"
                  label="Time Limited Access"
                  checked={gallerySettings.client?.timeLimitedAccess !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('client.timeLimitedAccess', e.target.checked)}
                  className="mb-2"
                />
                
                {gallerySettings.client?.timeLimitedAccess !== false && (
                  <Form.Group className="mb-3">
                    <Form.Label>Access Window (Hours)</Form.Label>
                    <Form.Control
                      type="number"
                      value={gallerySettings.client?.accessWindowHours || 48}
                      onChange={(e) => handleStaffGalleryAccessChange('client.accessWindowHours', parseInt(e.target.value))}
                      min="1"
                      max="168"
                    />
                    <Form.Text className="text-muted">
                      Hours before and after booking when access is allowed
                    </Form.Text>
                  </Form.Group>
                )}
              </Col>
              
              <Col md={6}>
                <h6>Client Display Options</h6>
                <Form.Check
                  type="switch"
                  id="client-show-profiles"
                  label="Show Staff Profiles"
                  checked={gallerySettings.client?.showStaffProfiles !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('client.showStaffProfiles', e.target.checked)}
                  className="mb-2"
                />
                
                <Form.Check
                  type="switch"
                  id="client-show-photos"
                  label="Show Staff Photos"
                  checked={gallerySettings.client?.showStaffPhotos !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('client.showStaffPhotos', e.target.checked)}
                  className="mb-2"
                />
                
                <Form.Check
                  type="switch"
                  id="client-show-qualifications"
                  label="Show Qualifications"
                  checked={gallerySettings.client?.showStaffQualifications || false}
                  onChange={(e) => handleStaffGalleryAccessChange('client.showStaffQualifications', e.target.checked)}
                  className="mb-2"
                />
                
                <Form.Check
                  type="switch"
                  id="client-show-contact"
                  label="Show Contact Info"
                  checked={gallerySettings.client?.showContactInfo || false}
                  onChange={(e) => handleStaffGalleryAccessChange('client.showContactInfo', e.target.checked)}
                  className="mb-2"
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Staff Access Settings */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              Staff Gallery Access
              <Badge bg="success" className="ms-2">Staff</Badge>
            </h5>
            <small className="text-muted">
              Configure how staff can access gallery
            </small>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Check
                  type="switch"
                  id="staff-gallery-enabled"
                  label="Enable Staff Access"
                  checked={gallerySettings.staff?.enabled !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('staff.enabled', e.target.checked)}
                  className="mb-3"
                />
                
                <Form.Group className="mb-3">
                  <Form.Label>Access Type</Form.Label>
                  <Form.Select
                    value={gallerySettings.staff?.accessType || 'own_only'}
                    onChange={(e) => handleStaffGalleryAccessChange('staff.accessType', e.target.value)}
                  >
                    <option value="none">No Access</option>
                    <option value="own_only">Own Data Only</option>
                    <option value="all">All Staff Data</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Staff typically see only their own data
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <h6>Staff Display Options</h6>
                <Form.Check
                  type="switch"
                  id="staff-show-profiles"
                  label="Show Staff Profiles"
                  checked={gallerySettings.staff?.showStaffProfiles !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('staff.showStaffProfiles', e.target.checked)}
                  className="mb-2"
                />
                
                <Form.Check
                  type="switch"
                  id="staff-show-photos"
                  label="Show Staff Photos"
                  checked={gallerySettings.staff?.showStaffPhotos !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('staff.showStaffPhotos', e.target.checked)}
                  className="mb-2"
                />
                
                <Form.Check
                  type="switch"
                  id="staff-show-qualifications"
                  label="Show Qualifications"
                  checked={gallerySettings.staff?.showStaffQualifications !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('staff.showStaffQualifications', e.target.checked)}
                  className="mb-2"
                />
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        {/* Manager/Admin/Superuser Access Settings */}
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">
              Manager & Admin Gallery Access
              <Badge bg="warning" className="ms-2">Manager</Badge>
              <Badge bg="danger" className="ms-2">Admin</Badge>
              <Badge bg="dark" className="ms-2">Superuser</Badge>
            </h5>
            <small className="text-muted">
              Configure access for managers, admins, and superusers
            </small>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <h6>Manager Access</h6>
                <Form.Check
                  type="switch"
                  id="manager-gallery-enabled"
                  label="Enable Manager Access"
                  checked={gallerySettings.manager?.enabled !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('manager.enabled', e.target.checked)}
                  className="mb-2"
                />
                
                <Form.Group className="mb-3">
                  <Form.Label>Access Type</Form.Label>
                  <Form.Select
                    value={gallerySettings.manager?.accessType || 'all'}
                    onChange={(e) => handleStaffGalleryAccessChange('manager.accessType', e.target.value)}
                  >
                    <option value="none">No Access</option>
                    <option value="team_only">Team Only</option>
                    <option value="all">All Staff Data</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <h6>Admin Access</h6>
                <Form.Check
                  type="switch"
                  id="admin-gallery-enabled"
                  label="Enable Admin Access"
                  checked={gallerySettings.admin?.enabled !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('admin.enabled', e.target.checked)}
                  className="mb-2"
                />
                
                <Form.Group className="mb-3">
                  <Form.Label>Access Type</Form.Label>
                  <Form.Select
                    value={gallerySettings.admin?.accessType || 'all'}
                    onChange={(e) => handleStaffGalleryAccessChange('admin.accessType', e.target.value)}
                  >
                    <option value="none">No Access</option>
                    <option value="all">All Staff Data</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <h6>Superuser Access</h6>
                <Form.Check
                  type="switch"
                  id="superuser-gallery-enabled"
                  label="Enable Superuser Access"
                  checked={gallerySettings.superuser?.enabled !== false}
                  onChange={(e) => handleStaffGalleryAccessChange('superuser.enabled', e.target.checked)}
                  className="mb-2"
                />
                
                <Form.Group className="mb-3">
                  <Form.Label>Access Type</Form.Label>
                  <Form.Select
                    value={gallerySettings.superuser?.accessType || 'all'}
                    onChange={(e) => handleStaffGalleryAccessChange('superuser.accessType', e.target.value)}
                  >
                    <option value="none">No Access</option>
                    <option value="all">All Staff Data</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  if (!permissions) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          Failed to load permissions. Please try refreshing the page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Global Permissions Management</h2>
            <div>
              <Button 
                variant="outline-danger" 
                onClick={handleReset}
                disabled={saving}
                className="me-2"
              >
                Reset to Defaults
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <Alert variant="info">
            <strong>Note:</strong> These settings control calendar and data access permissions for different user roles. 
            Changes will affect how users can view and interact with bookings and data.
          </Alert>

          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab eventKey="staff" title="Staff">
              {renderPermissionSection('staff', permissions.rolePermissions?.staff)}
            </Tab>
            <Tab eventKey="manager" title="Manager">
              {renderPermissionSection('manager', permissions.rolePermissions?.manager)}
            </Tab>
            <Tab eventKey="superuser" title="Superuser">
              {renderPermissionSection('superuser', permissions.rolePermissions?.superuser)}
            </Tab>
            <Tab eventKey="client" title="Client">
              {renderPermissionSection('client', permissions.rolePermissions?.client)}
            </Tab>
            <Tab eventKey="template" title="Client Template">
              {renderClientTemplate()}
            </Tab>
            <Tab eventKey="adminGroups" title="Admin User Groups">
              {renderAdminUserGroups()}
            </Tab>
            <Tab eventKey="hrAccess" title="HR Document Access">
              {renderHRDocumentAccess()}
            </Tab>
            <Tab eventKey="settings" title="System Settings">
              <Card>
                <Card.Header>
                  <h5 className="mb-0">System Settings</h5>
                </Card.Header>
                <Card.Body>
                  {Object.entries(permissions.settings || {}).map(([setting, value]) => (
                    <Form.Check
                      key={setting}
                      type="switch"
                      id={`setting-${setting}`}
                      label={setting.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      checked={value}
                      onChange={(e) => handleSettingsChange(setting, e.target.checked)}
                      className="mb-2"
                    />
                  ))}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
};

export default GlobalPermissions;