import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { handleApiError, validateToken } from '../utils/errorHandler';

const BookedStaffGallery = () => {
  const [bookedStaff, setBookedStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookedStaff = async () => {
      try {
        setLoading(true);
        if (!validateToken()) {
          throw new Error('Authentication token not found');
        }
        
        // Fetch staff members that the client has bookings with
        const response = await axiosInstance.get(`/bookings/client/${currentUser.id}/booked-staff`);
        
        setBookedStaff(response.data);
        setLoading(false);
      } catch (err) {
        setError(handleApiError(err, 'Error fetching booked staff members'));
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      fetchBookedStaff();
    }
  }, [currentUser]);

  const handleStaffClick = (staffId) => {
    navigate(`/staff-profile/${staffId}`);
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

  if (bookedStaff.length === 0) {
    return (
      <Container className="py-4">
        <h2 className="mb-4 text-center">Booked Staff</h2>
        <Alert variant="info" className="text-center">
          You haven't made any bookings yet. Once you book services, the staff members will appear here.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">Your Booked Staff</h2>
      <p className="text-center mb-5">Click on a staff member's photo to view their profile and access booking documents</p>
      
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {bookedStaff.map((staff) => (
          <Col key={staff._id}>
            <Card className="h-100 text-center shadow-sm hover-effect">
              <div 
                onClick={() => handleStaffClick(staff._id)}
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
                  {staff.bookingCount && (
                    <Card.Text className="text-success">
                      {staff.bookingCount} booking{staff.bookingCount > 1 ? 's' : ''}
                    </Card.Text>
                  )}
                </Card.Body>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default BookedStaffGallery;