import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1>Staff Management Solution</h1>
              <p className="lead">
                A comprehensive platform for managing remote workers with calendar booking, 
                timesheet tracking, and full GDPR compliance.
              </p>
              {!currentUser ? (
                <>
                  <Link to="/login">
                    <Button variant="light" size="lg" className="me-3">
                      Login
                    </Button>
                  </Link>
                  <Link to="/user-guide">
                    <Button variant="outline-light" size="lg">
                      User Guide
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard">
                    <Button variant="light" size="lg" className="me-3">
                      Go to Dashboard
                    </Button>
                  </Link>
                  <Link to="/user-guide">
                    <Button variant="outline-light" size="lg" className="me-3">
                      User Guide
                    </Button>
                  </Link>
                  <a href="/create_shortcut.zip" download onClick={() => window.open('/shortcut_instructions.html', '_blank')}>
                    <Button variant="success" size="lg">
                      Download Desktop Shortcut
                    </Button>
                  </a>
                </>
              )}
            </Col>
            <Col lg={6} className="d-none d-lg-block">
              <img 
                src="/logo512.png" 
                alt="Staff Management" 
                className="img-fluid rounded shadow"
              />
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Key Features</h2>
        <Row>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="display-4 text-primary mb-3">
                  <i className="bi bi-calendar-check"></i>
                </div>
                <Card.Title>Calendar Booking</Card.Title>
                <Card.Text>
                  Intuitive calendar interface for managing staff bookings and appointments.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="display-4 text-primary mb-3">
                  <i className="bi bi-clock-history"></i>
                </div>
                <Card.Title>Time Tracking</Card.Title>
                <Card.Text>
                  Clock in/out functionality with automatic timesheet generation.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Body className="text-center">
                <div className="display-4 text-primary mb-3">
                  <i className="bi bi-shield-check"></i>
                </div>
                <Card.Title>GDPR Compliant</Card.Title>
                <Card.Text>
                  Full compliance with UK data protection regulations and user privacy.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Role-based Access Section */}
      <div className="bg-light py-5">
        <Container>
          <h2 className="text-center mb-5">Role-Based Access</h2>
          <Row>
            <Col md={3} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-dark text-white">Superuser</Card.Header>
                <Card.Body>
                  <ul>
                    <li>Manage all users</li>
                    <li>Create manager accounts</li>
                    <li>Access all system features</li>
                    <li>Configure system settings</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-primary text-white">Manager</Card.Header>
                <Card.Body>
                  <ul>
                    <li>Create staff accounts</li>
                    <li>Create client accounts</li>
                    <li>Book staff for clients</li>
                    <li>Generate reports</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-success text-white">Staff</Card.Header>
                <Card.Body>
                  <ul>
                    <li>View assigned bookings</li>
                    <li>Clock in/out of shifts</li>
                    <li>View personal timesheets</li>
                    <li>Respond to shift requests</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3} className="mb-4">
              <Card className="h-100 shadow-sm">
                <Card.Header className="bg-info text-white">Client</Card.Header>
                <Card.Body>
                  <ul>
                    <li>View booked staff</li>
                    <li>Request shifts</li>
                    <li>Review timesheets</li>
                    <li>Access weekly reports</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Call to Action */}
      <Container className="py-5 text-center">
        <h2>Ready to get started?</h2>
        <p className="lead mb-4">
          Contact your manager for an account or log in to access the system.
        </p>
        {!currentUser ? (
          <Link to="/login">
            <Button variant="primary" size="lg">
              Login Now
            </Button>
          </Link>
        ) : (
          <Link to="/dashboard">
            <Button variant="primary" size="lg">
              Go to Dashboard
            </Button>
          </Link>
        )}
      </Container>
    </div>
  );
};

export default Home;