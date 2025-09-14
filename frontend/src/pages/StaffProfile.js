import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Badge, ListGroup, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { handleApiError, validateToken } from '../utils/errorHandler';

const StaffProfile = () => {
  const { staffId } = useParams();
  const [staff, setStaff] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStaffProfile = async () => {
      try {
        setLoading(true);
        if (!validateToken()) {
          throw new Error('Authentication token not found');
        }
        
        // Fetch staff profile
        const staffResponse = await axiosInstance.get(`/users/${staffId}`);
        setStaff(staffResponse.data);
        
        // Fetch bookings between client and this staff member
        if (hasRole(['client'])) {
          const bookingsResponse = await axiosInstance.get(`/bookings/client/${currentUser.id}/staff/${staffId}`);
          setBookings(bookingsResponse.data);
          
          // Fetch documents related to these bookings
          const documentsResponse = await axiosInstance.get(`/documents/client/${currentUser.id}/staff/${staffId}`);
          setDocuments(documentsResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        setError(handleApiError(err, 'Error fetching staff profile'));
        setLoading(false);
      }
    };

    if (staffId && currentUser?.id) {
      fetchStaffProfile();
    }
  }, [staffId, currentUser]);

  const handleDocumentDownload = async (documentId, filename) => {
    try {
      const response = await axiosInstance.get(`/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('Error downloading document:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <Button variant="secondary" onClick={() => navigate('/booked-staff')}>
          Back to Booked Staff
        </Button>
      </Container>
    );
  }

  if (!staff) {
    return (
      <Container className="py-4">
        <Alert variant="warning">Staff member not found.</Alert>
        <Button variant="secondary" onClick={() => navigate('/booked-staff')}>
          Back to Booked Staff
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Button 
        variant="outline-secondary" 
        className="mb-3"
        onClick={() => navigate('/booked-staff')}
      >
        ← Back to Booked Staff
      </Button>
      
      <Row>
        <Col md={4}>
          <Card className="text-center shadow-sm">
            <Card.Body>
              <div className="mb-3">
                <img
                  src={staff.photo || '/static/default-avatar.png'}
                  alt={staff.name}
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
              <Card.Title className="h3">{staff.name}</Card.Title>
              <Badge bg="primary" className="mb-2">
                {staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}
              </Badge>
              {staff.email && (
                <Card.Text className="text-muted">
                  <i className="fas fa-envelope me-2"></i>
                  {staff.email}
                </Card.Text>
              )}
              {staff.phone && (
                <Card.Text className="text-muted">
                  <i className="fas fa-phone me-2"></i>
                  {staff.phone}
                </Card.Text>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          {/* Booking History */}
          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-calendar-alt me-2"></i>
                Booking History
              </h5>
            </Card.Header>
            <Card.Body>
              {bookings.length === 0 ? (
                <Alert variant="info">No bookings found with this staff member.</Alert>
              ) : (
                <ListGroup variant="flush">
                  {bookings.map((booking) => (
                    <ListGroup.Item key={booking._id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{booking.service}</strong>
                        <br />
                        <small className="text-muted">
                          {formatDate(booking.date)} at {booking.time}
                        </small>
                      </div>
                      <Badge bg={booking.status === 'completed' ? 'success' : 'warning'}>
                        {booking.status}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
          
          {/* Documents */}
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-file-alt me-2"></i>
                Booking Documents
              </h5>
            </Card.Header>
            <Card.Body>
              {documents.length === 0 ? (
                <Alert variant="info">No documents available for your bookings with this staff member.</Alert>
              ) : (
                <ListGroup variant="flush">
                  {documents.map((document) => (
                    <ListGroup.Item key={document._id} className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{document.filename}</strong>
                        <br />
                        <small className="text-muted">
                          {document.type} • {formatDate(document.createdAt)}
                        </small>
                        {document.description && (
                          <>
                            <br />
                            <small className="text-secondary">{document.description}</small>
                          </>
                        )}
                      </div>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleDocumentDownload(document._id, document.filename)}
                      >
                        <i className="fas fa-download me-1"></i>
                        Download
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StaffProfile;