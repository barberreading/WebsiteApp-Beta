import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Badge, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format, parseISO, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useHasRole } from '../utils/roleUtils';
import axiosInstance from '../utils/axiosInstance';

const BookingsList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [filters, setFilters] = useState({
    startDate: new Date(),
    endDate: addDays(new Date(), 5),
    clientId: '',
    staffId: '',
    showAll: false,
    showCancelled: false
  });
  const { currentUser, isManager, isAdmin } = useAuth();
  const isClient = useHasRole(['client']);
  const hasManagerRole = useHasRole(['manager', 'superuser']);
  const canCreateBooking = useHasRole(['manager', 'superuser']);

  // Fetch bookings based on filters
  const fetchBookings = async (customFilters = null) => {
    const activeFilters = customFilters || filters;
    setLoading(true);
    setError(null);
    
    try {
      // Format dates for API
      const startDateStr = activeFilters.startDate.toISOString();
      const endDateStr = activeFilters.endDate.toISOString();
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('startDate', startDateStr);
      params.append('endDate', endDateStr);
      
      if (activeFilters.clientId) {
        params.append('clientId', activeFilters.clientId);
      }
      
      if (activeFilters.staffId) {
        params.append('staffId', activeFilters.staffId);
      }
      
      if (activeFilters.showCancelled) {
        params.append('showCancelled', 'true');
      }
      
      const response = await axiosInstance.get(`/bookings/range?${params.toString()}`);
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again.');
      toast.error(err.response?.data?.msg || 'Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients for filter dropdown
  const fetchClients = async () => {
    try {
      const response = await axiosInstance.get(`/clients`);
      setClients(response.data);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  // Fetch staff for filter dropdown
  const fetchStaff = async () => {
    try {
      const response = await axiosInstance.get(`/users/staff`);
      setStaff(response.data);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const newFilters = {
        ...filters,
        [name]: checked,
        // If showing all bookings, update date range
        ...(name === 'showAll' && checked ? {
          startDate: new Date(),
          endDate: addDays(new Date(), 30) // Show a month of bookings when "Show All" is checked
        } : {})
      };
      
      setFilters(newFilters);
      
      // Auto-apply filters when showCancelled checkbox is toggled
       if (name === 'showCancelled') {
         // Use setTimeout to ensure state is updated before fetching
         setTimeout(() => {
           fetchBookings(newFilters);
         }, 0);
       }
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      startDate: new Date(),
      endDate: addDays(new Date(), 5),
      clientId: '',
      staffId: '',
      showAll: false,
      showCancelled: false
    });
    
    // Fetch bookings with reset filters
    setTimeout(fetchBookings, 0);
  };

  // Group bookings by date
  const groupBookingsByDate = (bookingsList) => {
    const grouped = {};
    
    // Safety check to ensure bookingsList is an array
    if (!Array.isArray(bookingsList)) {
      console.warn('groupBookingsByDate received non-array:', bookingsList);
      return [];
    }
    
    bookingsList.forEach(booking => {
      const date = format(parseISO(booking.startTime), 'yyyy-MM-dd');
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(booking);
    });
    
    // Sort dates in ascending order
    return Object.keys(grouped)
      .sort()
      .map(date => ({
        date,
        bookings: grouped[date].sort((a, b) => 
          new Date(a.startTime) - new Date(b.startTime)
        )
      }));
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge bg="primary">Scheduled</Badge>;
      case 'in-progress':
        return <Badge bg="warning">In Progress</Badge>;
      case 'completed':
        return <Badge bg="success">Completed</Badge>;
      case 'cancelled':
        return <Badge bg="danger">Cancelled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Initialize component
  useEffect(() => {
    fetchBookings();
    fetchClients();
    fetchStaff();
  }, []);

  // Group bookings by date
  const groupedBookings = groupBookingsByDate(bookings || []);

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="mb-0">{isClient ? 'My Bookings' : 'Manage Bookings'}</h2>
          <p className="text-muted">{isClient ? 'View your upcoming bookings' : 'View and manage upcoming bookings'}</p>
        </Col>
        <Col xs="auto">
          <Link to="/calendar" className="btn btn-outline-primary me-2">
            <i className="fas fa-calendar-alt me-1"></i> Calendar View
          </Link>
          {canCreateBooking && (
            <Link to="/bookings/new" className="btn btn-primary">
              <i className="fas fa-plus me-1"></i> New Booking
            </Link>
          )}
        </Col>
      </Row>

      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Filters</h5>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={applyFilters}>
            <Row>
              {hasManagerRole && (
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Client</Form.Label>
                    <Form.Select 
                      name="clientId"
                      value={filters.clientId}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Clients</option>
                      {clients.filter(client => client && client.name).map(client => (
                        <option key={client._id} value={client._id}>
                          {client.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              {hasManagerRole && (
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Staff</Form.Label>
                    <Form.Select 
                      name="staffId"
                      value={filters.staffId}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Staff</option>
                      {staff.filter(staffMember => staffMember && staffMember.name).map(staffMember => (
                        <option key={staffMember._id} value={staffMember._id}>
                          {staffMember.name}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Date Range</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="date"
                      name="startDateInput"
                      value={format(filters.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        setFilters(prev => ({
                          ...prev,
                          startDate: date
                        }));
                      }}
                    />
                    <InputGroup.Text>to</InputGroup.Text>
                    <Form.Control
                      type="date"
                      name="endDateInput"
                      value={format(filters.endDate, 'yyyy-MM-dd')}
                      onChange={(e) => {
                        const date = new Date(e.target.value);
                        setFilters(prev => ({
                          ...prev,
                          endDate: date
                        }));
                      }}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3} className="d-flex align-items-end">
                <Button type="submit" variant="primary" className="me-2">
                  <i className="fas fa-filter me-1"></i> Apply Filters
                </Button>
                <Button type="button" variant="outline-secondary" onClick={resetFilters}>
                  <i className="fas fa-undo me-1"></i> Reset
                </Button>
              </Col>
            </Row>
            {hasManagerRole && (
               <Row>
                 <Col md={12}>
                   <Form.Group className="mb-3">
                     <Form.Check
                       type="checkbox"
                       name="showCancelled"
                       label="Show cancelled bookings"
                       checked={filters.showCancelled}
                       onChange={handleFilterChange}
                     />
                   </Form.Group>
                 </Col>
               </Row>
             )}
          </Form>
        </Card.Body>
      </Card>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading bookings...</p>
        </div>
      ) : error ? (
        <Card className="border-danger mb-4">
          <Card.Body className="text-danger">
            <i className="fas fa-exclamation-circle me-2"></i>
            {error}
          </Card.Body>
        </Card>
      ) : groupedBookings.length === 0 ? (
        <Card className="mb-4">
          <Card.Body className="text-center py-5">
            <i className="fas fa-calendar-times fa-3x mb-3 text-muted"></i>
            <h5>No bookings found</h5>
            <p className="text-muted">
              No bookings match your current filters. Try adjusting your filters or create a new booking.
            </p>
            {(isManager || isAdmin) && (
              <Link to="/bookings/new" className="btn btn-primary">
                <i className="fas fa-plus me-1"></i> Create New Booking
              </Link>
            )}
          </Card.Body>
        </Card>
      ) : (
        groupedBookings.map(group => (
          <Card key={group.date} className="mb-4 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                {format(parseISO(group.date), 'EEEE, MMMM d, yyyy')}
                {format(parseISO(group.date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                  <Badge bg="info" className="ms-2">Today</Badge>
                )}
              </h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Time</th>
                    <th>Service</th>
                    <th>Client</th>
                    <th>Staff</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.bookings.map(booking => (
                    <tr key={booking._id}>
                      <td>
                        {format(parseISO(booking.startTime), 'h:mm a')} - {format(parseISO(booking.endTime), 'h:mm a')}
                      </td>
                      <td>{booking.service.name}</td>
                      <td>
                        {booking.client ? (
                          <Link to={`/clients/${booking.client._id}`}>
                            {booking.client.name}
                          </Link>
                        ) : (
                          <span className="text-muted">No client</span>
                        )}
                      </td>
                      <td>
                        {booking.staff ? (
                          <Link to={`/staff/${booking.staff._id}`}>
                            {booking.staff.name}
                          </Link>
                        ) : (
                          <span className="text-muted">Unassigned</span>
                        )}
                      </td>
                      <td>
                        {booking.location ? (
                          <span>
                            {booking.location.address}, {booking.location.city}
                          </span>
                        ) : (
                          <span className="text-muted">No location</span>
                        )}
                      </td>
                      <td>{getStatusBadge(booking.status)}</td>
                      <td>
                        {hasManagerRole && (
                          <Link to={`/bookings/edit/${booking._id}`} className="btn btn-sm btn-primary me-2">
                            <i className="fas fa-edit"></i> Edit
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default BookingsList;