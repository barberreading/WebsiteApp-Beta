import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { useBranding } from '../context/BrandingContext';
import { ModernCard as Card, PageHeader } from '../components/ui/ModernComponents';
import { handleApiError, validateToken } from '../utils/errorHandler';
import TimesheetNotifications from '../components/timesheets/TimesheetNotifications';

const Dashboard = () => {
  const { currentUser, hasRole, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    upcomingBookings: 0,
    pendingTimesheets: 0,
    totalHoursThisWeek: 0,
    shiftRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Dashboard - Auth State:", { currentUser, isAuthenticated });
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    // Fetch dashboard stats based on user role
    const fetchStats = async () => {
      if (!currentUser || !isAuthenticated) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        if (!validateToken()) {
          throw new Error('Authentication token not found');
        }
        
        const response = await axiosInstance.get('/dashboard/stats');
        
        setStats(response.data || {
          upcomingBookings: 0,
          pendingTimesheets: 0,
          totalHoursThisWeek: 0,
          shiftRequests: 0
        });
        setError(null);
      } catch (err) {
        setError(handleApiError(err, 'Error fetching dashboard stats'));
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchStats();
    }
  }, [currentUser, isAuthenticated]);

  // Using useBranding hook but not using branding directly
  useBranding();
  
  return (
    <Container className="py-4">
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome to Everything Childcare Agency"
      />
      
      {error && (
        <Card className="mb-4 bg-danger text-white">
          <Card.Body>
            <h5>Error</h5>
            <p>{error}</p>
          </Card.Body>
        </Card>
      )}
      
      {loading ? (
        <Card className="mb-4">
          <Card.Body className="text-center">
            <h5>Loading dashboard data...</h5>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Welcome Card */}
          <Card className="mb-4">
            <Card.Body>
              <h4>Welcome, {currentUser?.name || 'User'}!</h4>
              <p>Role: {currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Unknown'}</p>
            </Card.Body>
          </Card>
          
          {/* Timesheet Notifications */}
      {hasRole(['staff', 'manager', 'superuser', 'client']) && (
        <Row className="mb-4">
          <Col md={12}>
            <TimesheetNotifications />
          </Col>
        </Row>
      )}
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className="dashboard-card text-center h-100">
            <Card.Body>
              <div className="dashboard-icon text-primary">
                <i className="bi bi-calendar-check"></i>
              </div>
              <h5>Upcoming Bookings</h5>
              <h2>{stats.upcomingBookings}</h2>
              <Link to="/calendar">
                <Button variant="outline-primary" size="sm">View Calendar</Button>
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        {hasRole(['staff', 'manager', 'superuser']) && (
          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-card text-center h-100">
              <Card.Body>
                <div className="dashboard-icon text-success">
                  <i className="bi bi-clock-history"></i>
                </div>
                <h5>Hours This Week</h5>
                <h2>{stats.totalHoursThisWeek}</h2>
                <Link to="/timesheets">
                  <Button variant="outline-success" size="sm">View Timesheets</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        )}
        
        {hasRole(['manager', 'superuser', 'client']) && (
          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-card text-center h-100">
              <Card.Body>
                <div className="dashboard-icon text-warning">
                  <i className="bi bi-file-earmark-text"></i>
                </div>
                <h5>Pending Timesheets</h5>
                <h2>{stats.pendingTimesheets}</h2>
                <Link to="/timesheets">
                  <Button variant="outline-warning" size="sm">Review Timesheets</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        )}
        
        {hasRole(['staff']) && (
          <Col md={3} sm={6} className="mb-3">
            <Card className="dashboard-card text-center h-100">
              <Card.Body>
                <div className="dashboard-icon text-info">
                  <i className="bi bi-bell"></i>
                </div>
                <h5>Shift Requests</h5>
                <h2>{stats.shiftRequests}</h2>
                <Link to="/booking-alerts">
                  <Button variant="outline-info" size="sm">View Requests</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
      
      {/* Quick Actions */}
      <h4 className="mb-3">Quick Actions</h4>
      <Row>
        {/* User Guide Card - Available to all users */}
        <Col md={3} sm={6} className="mb-3">
          <a href="/user_guide.html" target="_blank" rel="noopener noreferrer" className="text-decoration-none">
            <Card className="dashboard-card text-center h-100">
              <Card.Body>
                <div className="dashboard-icon text-warning">
                  <i className="bi bi-book"></i>
                </div>
                <h5>User Guide</h5>
              </Card.Body>
            </Card>
          </a>
        </Col>
        
        {hasRole(['staff']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/clock" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-primary">
                    <i className="bi bi-stopwatch"></i>
                  </div>
                  <h5>Clock In/Out</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['manager', 'superuser']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/clients" onClick={(e) => {
              e.preventDefault();
              window.location.href = '/clients?action=createDirect';
            }} className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-info">
                    <i className="bi bi-person-plus"></i>
                  </div>
                  <h5>Add New Client</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['manager', 'superuser']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/calendar" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-success">
                    <i className="bi bi-calendar-plus"></i>
                  </div>
                  <h5>Create Booking</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['manager', 'admin', 'superuser']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/booking-alerts?filter=pending" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-warning">
                    <i className="bi bi-exclamation-triangle"></i>
                  </div>
                  <h5>Pending Booking Alerts</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['manager', 'admin', 'superuser']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/manager/todo" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-primary">
                    <i className="bi bi-list-check"></i>
                  </div>
                  <h5>Manager Tasks</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['manager', 'superuser']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/users" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-info">
                    <i className="bi bi-person-plus"></i>
                  </div>
                  <h5>Add User</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['superuser']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/branding" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-purple">
                    <i className="bi bi-palette"></i>
                  </div>
                  <h5>Branding Tools</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['admin']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/monitoring-dashboard" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-info">
                    <i className="bi bi-activity"></i>
                  </div>
                  <h5>System Monitoring</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['manager', 'superuser', 'client']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/reports" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-warning">
                    <i className="bi bi-file-earmark-bar-graph"></i>
                  </div>
                  <h5>Generate Report</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
        
        {hasRole(['client']) && (
          <Col md={3} sm={6} className="mb-3">
            <Link to="/booking-alerts/new" className="text-decoration-none">
              <Card className="dashboard-card text-center h-100">
                <Card.Body>
                  <div className="dashboard-icon text-danger">
                    <i className="bi bi-calendar-plus"></i>
                  </div>
                  <h5>Request Shift</h5>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        )}
      </Row>
        </>
      )}
    </Container>
  );
};

export default Dashboard;