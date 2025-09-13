import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Modal, Badge } from 'react-bootstrap';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import CircularPhotoUpload from '../components/common/CircularPhotoUpload';

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    postcode: '',
    contactInfo: '',
    documentSharing: {
      shareProfile: true,
      shareDBS: true,
      shareRiskAssessment: true
    }
  });
  const { token, currentUser, isAuthenticated } = useAuth();
  
  // Helper function to check user roles
  const hasRole = (roles) => {
    return currentUser && roles.includes(currentUser.role);
  };
  
  useEffect(() => {
    console.log("Profile - Auth State:", { currentUser, isAuthenticated });
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchUserProfile = async () => {
    if (!token) {
      setError('Authentication token missing');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // If impersonating, show the impersonated user's data
      if (currentUser?._impersonated && currentUser?._testUser) {
        const impersonatedProfile = {
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          address: currentUser.address || {},
          contactInfo: currentUser.contactInfo || '',
          documentSharing: currentUser.documentSharing || {
            shareProfile: true,
            shareDBS: true,
            shareRiskAssessment: true
          },
          createdAt: currentUser.createdAt || new Date().toISOString(),
          photo: currentUser.photo || null
        };
        
        setUserProfile(impersonatedProfile);
        setFormData({
          name: impersonatedProfile.name || '',
          email: impersonatedProfile.email || '',
          address: impersonatedProfile.address?.street || '',
          postcode: impersonatedProfile.address?.postcode || '',
          contactInfo: impersonatedProfile.contactInfo || '',
          documentSharing: impersonatedProfile.documentSharing
        });
      } else {
        // Normal profile fetch for non-impersonated users
        const res = await axiosInstance.get('/users/profile');
        setUserProfile(res.data);
        setFormData({
          name: res.data.name || '',
          email: res.data.email || '',
          address: res.data.address?.street || '',
          postcode: res.data.address?.postcode || '',
          contactInfo: res.data.contactInfo || '',
          documentSharing: res.data.documentSharing || {
            shareProfile: true,
            shareDBS: true,
            shareRiskAssessment: true
          }
        });
      }
      setError('');
    } catch (err) {
      setError('Failed to fetch profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent updates when impersonating test users
    if (currentUser?._impersonated && currentUser?._testUser) {
      setError('Cannot update profile while viewing as test user. Return to superuser to make changes.');
      setIsEditing(false);
      return;
    }
    
    // Check if user is a manager or superuser
    if (userProfile.role !== 'manager' && userProfile.role !== 'superuser') {
      setError('Only managers can update profile information');
      setIsEditing(false);
      return;
    }
    
    try {
      setLoading(true);
      // Format the data to match the expected structure
      const updatedData = {
        ...formData,
        address: {
          street: formData.address,
          postcode: formData.postcode
        },
        documentSharing: formData.documentSharing
      };
      
      await axiosInstance.put('/users/profile', updatedData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      fetchUserProfile();
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        email: userProfile.email || '',
        address: userProfile.address || '',
        contactInfo: userProfile.contactInfo || ''
      });
    }
    setError('');
    setSuccess('');
  };
  
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      await axiosInstance.put('/users/change-password', 
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      );
      setSuccess('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.msg || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userProfile) return <div className="loading-spinner">Loading...</div>;

  return (
    <Container className="mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">My Profile</h2>
          {currentUser?._impersonated && currentUser?._testUser && (
            <Badge bg="warning" className="fs-6">
              <i className="fas fa-user-secret me-1"></i>
              Viewing Test User Profile
            </Badge>
          )}
        </div>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}
      
      <Row>
        <Col md={4} className="mb-4 text-center">
          <Card>
            <Card.Body>
              {hasRole(['manager', 'superuser', 'admin']) ? (
                <CircularPhotoUpload 
                  currentPhoto={userProfile?.photo} 
                  onPhotoUpdate={(photoUrl) => {
                    setUserProfile({...userProfile, photo: photoUrl});
                    setSuccess('Profile photo updated successfully');
                  }}
                  size={200}
                />
              ) : (
                <div className="text-center">
                  <img 
                    src={userProfile?.photo || '/static/default-avatar.png'} 
                    alt="Profile" 
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #f0f0f0',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Profile Information</h5>
                {!isEditing && (
                  <Button variant="outline-primary" onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {isEditing ? (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Postcode</Form.Label>
                    <Form.Control
                      type="text"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleChange}
                      placeholder="Enter your postcode"
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Contact Information</Form.Label>
                    <Form.Control
                      type="text"
                      name="contactInfo"
                      value={formData.contactInfo}
                      onChange={handleChange}
                      placeholder="Phone number, emergency contact, etc."
                    />
                  </Form.Group>
                  
                  {userProfile?.role === 'staff' && (
                    <Form.Group className="mb-3">
                      <Form.Label>Document Sharing Options (Set by Manager)</Form.Label>
                      <div className="mb-2 d-flex align-items-center">
                        <div className={`me-2 badge ${formData.documentSharing?.shareProfile ? 'bg-success' : 'bg-secondary'}`} style={{width: '60px'}}>
                          {formData.documentSharing?.shareProfile ? 'Enabled' : 'Disabled'}
                        </div>
                        <span>Share staff profile in booking emails</span>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <div className={`me-2 badge ${formData.documentSharing?.shareDBS ? 'bg-success' : 'bg-secondary'}`} style={{width: '60px'}}>
                          {formData.documentSharing?.shareDBS ? 'Enabled' : 'Disabled'}
                        </div>
                        <span>Share DBS certificate in booking emails</span>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <div className={`me-2 badge ${formData.documentSharing?.shareRiskAssessment ? 'bg-success' : 'bg-secondary'}`} style={{width: '60px'}}>
                          {formData.documentSharing?.shareRiskAssessment ? 'Enabled' : 'Disabled'}
                        </div>
                        <span>Share risk assessment in booking emails</span>
                      </div>
                      <small className="text-muted">Note: Only managers can change these settings.</small>
                    </Form.Group>
                  )}
                  
                  <div className="d-flex gap-2">
                    <Button type="submit" variant="primary" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="secondary" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </Form>
              ) : (
                <div>
                  <Row className="mb-3">
                    <Col sm={3}><strong>Name:</strong></Col>
                    <Col sm={9}>{userProfile?.name || 'Not provided'}</Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={3}><strong>Email:</strong></Col>
                    <Col sm={9}>{userProfile?.email || 'Not provided'}</Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={3}><strong>Role:</strong></Col>
                    <Col sm={9}>
                      <span className={`badge bg-${
                        userProfile?.role === 'superuser' ? 'danger' :
                        userProfile?.role === 'manager' ? 'warning' :
                        userProfile?.role === 'staff' ? 'info' : 'secondary'
                      }`}>
                        {userProfile?.role || 'Not assigned'}
                      </span>
                    </Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={3}><strong>Address:</strong></Col>
                    <Col sm={9}>{userProfile?.address?.street || (typeof userProfile?.address === 'string' ? userProfile?.address : '') || 'Not provided'}</Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={3}><strong>Postcode:</strong></Col>
                    <Col sm={9}>{userProfile?.address?.postcode || 'Not provided'}</Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={3}><strong>Contact Info:</strong></Col>
                    <Col sm={9}>{userProfile?.contactInfo || 'Not provided'}</Col>
                  </Row>
                  
                  <Row className="mb-3">
                    <Col sm={3}><strong>Member Since:</strong></Col>
                    <Col sm={9}>
                      {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'}) : 'Unknown'}
                    </Col>
                  </Row>
                  
                  {userProfile?.role === 'staff' && (
                    <Row className="mb-3">
                      <Col sm={3}><strong>Document Sharing:</strong></Col>
                      <Col sm={9}>
                        <div>
                          <i className={`fas fa-${userProfile?.documentSharing?.shareProfile ? 'check text-success' : 'times text-danger'} me-2`}></i>
                          Share Profile
                        </div>
                        <div>
                          <i className={`fas fa-${userProfile?.documentSharing?.shareDBS ? 'check text-success' : 'times text-danger'} me-2`}></i>
                          Share DBS Certificate
                        </div>
                        <div>
                          <i className={`fas fa-${userProfile?.documentSharing?.shareRiskAssessment ? 'check text-success' : 'times text-danger'} me-2`}></i>
                          Share Risk Assessment
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Account Settings</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-warning" size="sm" onClick={() => setShowPasswordModal(true)}>
                  Change Password
                </Button>
                <Button variant="outline-info" size="sm">
                  Download My Data
                </Button>
                <Button variant="outline-danger" size="sm">
                  Delete Account
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Password Change Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Password</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {passwordError && <Alert variant="danger">{passwordError}</Alert>}
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Current Password</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>New Password</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Profile;