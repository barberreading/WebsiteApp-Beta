import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

const AppNavbar = () => {
  const { currentUser, logout, hasRole } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Generate logo content based on branding configuration
  const getLogoContent = () => {
    if (branding?.logo) {
      // Use custom logo from branding
      return branding.logo;
    } else {
      // Generate default SVG with branding colors and company name
      const companyName = branding?.companyName || 'Everything Childcare Agency';
      const primaryColor = branding?.primaryColor || '#00E1E1';
      const secondaryColor = branding?.secondaryColor || '#FF40B4';
      const initials = companyName.split(' ').map(word => word.charAt(0)).join('').substring(0, 3);
      
      const logoSvg = `
        <svg width="150" height="50" viewBox="0 0 150 50" xmlns="http://www.w3.org/2000/svg">
          <circle cx="25" cy="25" r="23" fill="${primaryColor}" />
          <text x="25" y="30" font-family="Arial" font-size="16" font-weight="bold" fill="${secondaryColor}" text-anchor="middle">${initials}</text>
          <text x="85" y="30" font-family="Arial" font-size="10" font-weight="bold" fill="#333" text-anchor="middle">${companyName}</text>
        </svg>
      `;
      
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(logoSvg)}`;
    }
  };

  const logoUrl = getLogoContent();

  return (
    <Navbar bg="light" variant="light" expand="lg" sticky="top" className="custom-navbar">
      <Container>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img 
            src={logoUrl}
            alt="Everything Childcare Agency"
            height="40"
            className="d-inline-block align-top me-2"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            
            {currentUser && (
              <>
                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                
                {/* Main dropdown for scheduling and bookings */}
                <NavDropdown title="Schedule" id="schedule-dropdown">
                  <NavDropdown.Item as={Link} to="/calendar">Calendar</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/bookings">Manage Bookings</NavDropdown.Item>
                  {hasRole(['staff', 'manager', 'superuser', 'admin']) && (
                    <NavDropdown.Item as={Link} to="/booking-alerts">Booking Alerts</NavDropdown.Item>
                  )}
                  {hasRole(['manager', 'superuser']) && (
                    <>
                      <NavDropdown.Item as={Link} to="/booking-alerts/new">Create Alert</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/booking-categories">Manage Categories</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/admin/bookings">Create Booking</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Resources dropdown - hidden for staff and client users */}
                {hasRole(['manager', 'superuser']) && (
                  <NavDropdown title="Resources" id="resources-dropdown">
                    <NavDropdown.Item as={Link} to="/clients">Clients</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/resources-management">Resources</NavDropdown.Item>
                    {hasRole(['manager', 'superuser']) && (
                      <>
                        <NavDropdown.Item as={Link} to="/services">Services</NavDropdown.Item>
                      </>
                    )}
                  </NavDropdown>
                )}
                
                {/* Staff dropdown */}
                <NavDropdown title="Staff" id="staff-dropdown">
                  <NavDropdown.Item as={Link} to="/staff-gallery">Staff Gallery</NavDropdown.Item>
                  {hasRole(['client']) && (
                    <NavDropdown.Item as={Link} to="/booked-staff">Booked Staff</NavDropdown.Item>
                  )}
                  {hasRole(['staff']) && (
                    <>
                      <NavDropdown.Item as={Link} to="/leave-requests">Leave Requests</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/staff-hr">My HR Documents</NavDropdown.Item>
                    </>
                  )}
                  {hasRole(['manager', 'superuser']) && (
                    <>
                      <NavDropdown.Item as={Link} to="/leave-requests/manage">Manage Leave Requests</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/staff-search">Search by Distance</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/staff-hr">HR Documents</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Timesheets dropdown */}
                {hasRole(['manager', 'superuser', 'client']) && (
                  <NavDropdown title="Timesheets" id="timesheet-dropdown">
                    <NavDropdown.Item as={Link} to="/timesheets">My Timesheets</NavDropdown.Item>
                    {hasRole(['manager', 'superuser']) && (
                      <>
                        <NavDropdown.Item as={Link} to="/bulk-timesheets">Paper Timesheet Upload</NavDropdown.Item>
                      </>
                    )}
                    {hasRole(['manager', 'superuser', 'client']) && (
                      <NavDropdown.Item as={Link} to="/timesheet-approval">Approval Dashboard</NavDropdown.Item>
                    )}
                  </NavDropdown>
                )}
                
                {/* Activity and Reports */}
                <NavDropdown title="Reports" id="reports-dropdown">
                  {hasRole(['admin', 'superuser', 'manager']) && <NavDropdown.Item as={Link} to="/activity-log">Activity Log</NavDropdown.Item>}
                  {hasRole(['manager', 'superuser']) && (
                    <>
                      <NavDropdown.Item as={Link} to="/reports">Reports</NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/payroll-report">Payroll Report</NavDropdown.Item>
                    </>
                  )}
                </NavDropdown>
                
                {/* Admin dropdown - consolidated */}
                {hasRole(['superuser', 'manager']) && (
                  <NavDropdown title="Admin" id="admin-dropdown">
                    {hasRole(['manager', 'admin', 'superuser']) && (
                      <NavDropdown.Item as={Link} to="/manager/todo">Manager Tasks</NavDropdown.Item>
                    )}
                    <NavDropdown.Item as={Link} to="/users">User Management</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/bulk-import">Bulk Import</NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item as={Link} to="/gdpr-requests">GDPR Requests</NavDropdown.Item>
                    <NavDropdown.Item as={Link} to="/email-settings">Email Settings</NavDropdown.Item>
                    {hasRole(['superuser']) && (
                      <>
                        <NavDropdown.Item as={Link} to="/email-templates">Email Templates</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/global-permissions">Global Permissions</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/user-guide-editor">User Guide Editor</NavDropdown.Item>
                        <NavDropdown.Item as={Link} to="/error-dashboard">Error Dashboard</NavDropdown.Item>
                      </>
                    )}
                  </NavDropdown>
                )}
              </>
            )}
          </Nav>
          
          <Nav>
            {currentUser ? (
              <NavDropdown title={currentUser.name || 'User'} id="user-dropdown" align="end">
                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>Logout</NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav.Link as={Link} to="/login">Login</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;