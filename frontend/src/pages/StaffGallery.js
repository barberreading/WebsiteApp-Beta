import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { handleApiError, validateToken } from '../utils/errorHandler';

const StaffGallery = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, hasRole } = useAuth();

  useEffect(() => {
    const fetchStaffMembers = async () => {
      try {
        setLoading(true);
        if (!validateToken()) {
          throw new Error('Authentication token not found');
        }
        
        const response = await axiosInstance.get('/users/staff');
        
        // Filter to only include staff, managers, and superusers
        let filteredStaff = response.data.filter(user => 
          ['staff', 'manager', 'superuser'].includes(user.role)
        );
        
        // If current user is staff, only show their own data
        if (hasRole(['staff']) && !hasRole(['manager', 'superuser'])) {
          filteredStaff = filteredStaff.filter(user => user._id === currentUser.id);
        }
        
        setStaffMembers(filteredStaff);
        setLoading(false);
      } catch (err) {
        setError(handleApiError(err, 'Error fetching staff members'));
        setLoading(false);
      }
    };

    fetchStaffMembers();
  }, []);

  const handleEmailClick = (email) => {
    window.location.href = `mailto:${email}`;
  };

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">Our Staff</h2>
      <p className="text-center mb-5">Click on a staff member's photo to send them an email</p>
      
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {staffMembers.map((staff) => (
          <Col key={staff._id}>
            <Card className="h-100 text-center shadow-sm hover-effect">
              <div 
                onClick={() => handleEmailClick(staff.email)}
                style={{ cursor: 'pointer' }}
              >
                <div className="text-center p-3">
                  <img
                    src={staff.photo || '/static/default-avatar.png'}
                    alt={staff.name}
                    style={{
                      width: '150px',
                      height: '150px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #f0f0f0',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                      margin: '0 auto'
                    }}
                  />
                </div>
                <Card.Body>
                  <Card.Title>{staff.name}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
                  </Card.Subtitle>
                </Card.Body>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default StaffGallery;