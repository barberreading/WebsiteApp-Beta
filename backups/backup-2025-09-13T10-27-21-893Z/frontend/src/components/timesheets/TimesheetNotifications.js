import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { handleApiError } from '../../utils/errorHandler';
import { formatDate } from '../../utils/dateUtils';

const TimesheetNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/timesheet-notifications');
        setNotifications(response.data || []);
        setError(null);
      } catch (err) {
        setError(handleApiError(err, 'Error fetching timesheet notifications'));
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // Refresh notifications every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Function to determine badge color based on notification type
  const getBadgeVariant = (type) => {
    switch (type) {
      case 'reminder':
        return 'warning';
      case 'submission':
        return 'info';
      case 'approval':
        return 'success';
      case 'rejection':
        return 'danger';
      case 'lockout':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-bell me-2"></i>
            Timesheet Notifications
          </h5>
        </Card.Header>
        <Card.Body className="text-center">
          <p>Loading notifications...</p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-bell me-2"></i>
            Timesheet Notifications
          </h5>
        </Card.Header>
        <Card.Body className="text-center text-danger">
          <p>{error}</p>
        </Card.Body>
      </Card>
    );
  }

  // If no notifications, show a message
  if (notifications.length === 0) {
    return (
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">
            <i className="bi bi-bell me-2"></i>
            Timesheet Notifications
          </h5>
        </Card.Header>
        <Card.Body className="text-center">
          <p>No timesheet notifications at this time.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5 className="mb-0">
          <i className="bi bi-bell me-2"></i>
          Timesheet Notifications
          <Badge bg="danger" className="ms-2" pill>
            {notifications.length}
          </Badge>
        </h5>
      </Card.Header>
      <ListGroup variant="flush">
        {notifications.map((notification) => (
          <ListGroup.Item key={notification._id} className="d-flex justify-content-between align-items-start">
            <div className="ms-2 me-auto">
              <div className="fw-bold">
                {notification.title}
                <Badge bg={getBadgeVariant(notification.type)} className="ms-2" pill>
                  {notification.type}
                </Badge>
              </div>
              <div className="mb-1">{notification.message}</div>
              {notification.date && (
                <small className="text-muted">
                  {formatDate(notification.date)}
                </small>
              )}
            </div>
            {notification.actionLink && (
              <Link to={notification.actionLink} className="btn btn-sm btn-primary">
                {notification.actionText || 'View'}
              </Link>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
};

export default TimesheetNotifications;