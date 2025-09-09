import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Form, Button, Badge } from 'react-bootstrap';
import { format } from 'date-fns';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ActivityLog = () => {
  const { currentUser, hasRole } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activityType, setActivityType] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')); // 30 days ago
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd')); // Today
  const [totalResults, setTotalResults] = useState(0);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  useEffect(() => {
    if (!hasRole(['admin', 'superuser', 'manager'])) {
      toast.error('You are not authorized to view this page.');
      navigate('/dashboard');
    }
  }, [currentUser, hasRole, navigate]);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (activityType) params.append('activityType', activityType);
      if (searchTerm) params.append('search', searchTerm);
      
      // Fetch activities from API
      const response = await axiosInstance.get(`/bookings/activity?${params.toString()}`);
      
      // Use the transformed activities from the backend
      const activitiesData = response.data.activities || [];
      
      setActivities(activitiesData);
      setTotalResults(response.data.totalCount || activitiesData.length);
    } catch (err) {
      console.error('Error fetching activity log:', err);
      setError('Failed to load activity log. Please try again later.');
      toast.error('Error loading activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, activityType]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchActivities();
  };

  const getActivityBadge = (type) => {
    let variant = 'secondary';
    let text = 'Activity';
    
    switch (type) {
      case 'Booking Added':
        variant = 'success';
        text = 'BOOKING ADDED';
        break;
      case 'Booking Updated':
        variant = 'primary';
        text = 'BOOKING UPDATED';
        break;
      case 'Booking Cancelled':
        variant = 'warning';
        text = 'BOOKING CANCELLED';
        break;
      case 'Booking Deleted':
        variant = 'danger';
        text = 'BOOKING DELETED';
        break;
      default:
        variant = 'secondary';
        text = type || 'ACTIVITY';
    }
    
    return <Badge bg={variant}>{text}</Badge>;
  };

  const getActivityBorderColor = (type) => {
    switch (type) {
      case 'Booking Added':
        return '#28a745'; // Green
      case 'Booking Updated':
        return '#007bff'; // Blue
      case 'Booking Cancelled':
        return '#ffc107'; // Orange
      case 'Booking Deleted':
        return '#dc3545'; // Red
      default:
        return '#6c757d'; // Gray
    }
  };

  return (
    <Container fluid className="mt-4">
      <Card className="activity-log-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <i className="fas fa-history me-2"></i>
            <h4 className="mb-0">Activity Log</h4>
          </div>
          <div>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={() => window.open('/user_guide.html#activity-log', '_blank')}
              className="me-2"
            >
              <i className="fas fa-question-circle"></i> Help
            </Button>
            <Button 
              variant="outline-primary" 
              size="sm" 
              onClick={fetchActivities}
            >
              <i className="fas fa-sync-alt"></i> Refresh
            </Button>
          </div>
        </Card.Header>
        
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="mb-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Control 
                    type="text" 
                    placeholder="SEARCH" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Col>
              
              <Col md={3}>
                <Form.Group>
                  <Form.Select 
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Booking Added">Booking Added</option>
                    <option value="Booking Updated">Booking Updated</option>
                    <option value="Booking Cancelled">Booking Cancelled</option>
                    <option value="Booking Deleted">Booking Deleted</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6} className="d-flex">
                <Button variant="primary" type="submit" className="ms-auto">
                  Search
                </Button>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={12} className="d-flex align-items-center">
                <span className="me-2">{totalResults} results</span>
                <Button 
                  variant="link" 
                  className="ms-auto"
                  onClick={() => setShowMoreFilters(!showMoreFilters)}
                >
                  More filters <i className={`fas fa-chevron-${showMoreFilters ? 'up' : 'down'}`}></i>
                </Button>
              </Col>
            </Row>
            
            {showMoreFilters && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>From</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>To</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}
          </Form>
          
          {loading ? (
            <div className="text-center py-4">
              <i className="fas fa-spinner fa-spin fa-2x"></i>
              <p className="mt-2">Loading activity log...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-danger">
              <i className="fas fa-exclamation-circle fa-2x mb-2"></i>
              <p>{error}</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-4">
              <i className="fas fa-info-circle fa-2x mb-2"></i>
              <p>No activities found for the selected criteria.</p>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity, index) => (
                <div 
                  key={activity._id || index} 
                  className="activity-item"
                  style={{ borderLeftColor: getActivityBorderColor(activity.activityType) }}
                >
                  <div className="activity-badge">
                    {getActivityBadge(activity.activityType)}
                  </div>
                  
                  <div className="activity-date">
                    <div className="date">{activity.formattedDate}</div>
                    <div className="time">{activity.formattedTime}</div>
                  </div>
                  
                  <div className="activity-content">
                    <div className="activity-title">
                      {activity.title || 'Booking Activity'}
                    </div>
                    <div className="activity-description text-muted">
                      {activity.description || `${activity.clientName || 'No client'} - ${activity.staffName || 'No staff'}`}
                      {activity.serviceName && ` (${activity.serviceName})`}
                    </div>
                  </div>
                  
                  <div className="activity-user">
                    <div className="user-avatar">
                      S
                    </div>
                    <div className="user-name">
                      System
                    </div>
                  </div>
                  
                  <div className="activity-actions">
                    <Button variant="light" size="sm">
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
      
      <style jsx="true">{`
        .activity-log-card {
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .activity-list {
          margin-top: 20px;
        }
        
        .activity-item {
          display: flex;
          align-items: center;
          padding: 15px 10px;
          border-left: 4px solid;
          border-bottom: 1px solid #eee;
          transition: background-color 0.2s;
        }
        
        .activity-item:hover {
          background-color: #f8f9fa;
        }
        
        .activity-badge {
          width: 150px;
          padding: 0 10px;
        }
        
        .activity-date {
          width: 100px;
          text-align: center;
        }
        
        .activity-date .date {
          font-weight: bold;
        }
        
        .activity-date .time {
          font-size: 0.8rem;
          color: #6c757d;
        }
        
        .activity-content {
          flex: 1;
          padding: 0 15px;
        }
        
        .activity-title {
          font-weight: 500;
        }
        
        .activity-user {
          display: flex;
          align-items: center;
          width: 200px;
        }
        
        .user-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: #6c757d;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 10px;
          font-weight: bold;
        }
        
        .activity-actions {
          width: 50px;
          text-align: center;
        }
      `}</style>
    </Container>
  );
};

export default ActivityLog;