import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Badge,
  Button,
  Alert,
  Spinner,
  Modal,
  ListGroup,
  Tab,
  Tabs,
  Form
} from 'react-bootstrap';
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaCalendarAlt, FaBell, FaUsers, FaStickyNote } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import axiosInstance from '../../utils/axiosInstance';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { handleApiError } from '../../utils/errorHandler';

const ManagerTodoList = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [todoItems, setTodoItems] = useState({
    bookingAlerts: [],
    leaveRequests: [],
    overdueBookings: [],
    staffDocuments: []
  });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (currentUser && ['manager', 'admin', 'superuser'].includes(currentUser.role)) {
      fetchTodoItems();
    }
  }, [currentUser]);

  const fetchTodoItems = async () => {
    try {
      setLoading(true);
      
      // Fetch pending booking alerts
      const alertsResponse = await axiosInstance.get('/booking-alerts');
      const pendingAlerts = alertsResponse.data.data?.filter(alert => 
        ['open', 'claimed'].includes(alert.status)
      ) || [];

      // Fetch pending leave requests
      const leaveResponse = await axiosInstance.get('/leave-requests');
      const pendingLeaveRequests = leaveResponse.data.data?.filter(request => 
        request.status === 'pending'
      ) || [];

      // Fetch overdue bookings (bookings that should have been completed but status is still pending)
      const bookingsResponse = await axiosInstance.get('/bookings');
      const now = new Date();
      const overdueBookings = bookingsResponse.data.data?.filter(booking => 
        new Date(booking.endTime) < now && booking.status === 'pending'
      ) || [];

      // Fetch staff documents that need review
      const documentsResponse = await axiosInstance.get('/staff-documents');
      const pendingDocuments = documentsResponse.data.data?.filter(doc => 
        doc.status === 'pending_review'
      ) || [];

      setTodoItems({
        bookingAlerts: pendingAlerts,
        leaveRequests: pendingLeaveRequests,
        overdueBookings: overdueBookings,
        staffDocuments: pendingDocuments
      });

    } catch (err) {
      console.error('Error fetching todo items:', err);
      setError('Failed to load manager tasks');
    } finally {
      setLoading(false);
    }
  };

  const getTotalPendingTasks = () => {
    return todoItems.bookingAlerts.length + 
           todoItems.leaveRequests.length + 
           todoItems.overdueBookings.length + 
           todoItems.staffDocuments.length;
  };

  const getPriorityLevel = (item, type) => {
    const now = new Date();
    
    switch (type) {
      case 'bookingAlert':
        const alertTime = new Date(item.startTime);
        const hoursUntilAlert = (alertTime - now) / (1000 * 60 * 60);
        if (hoursUntilAlert < 2) return 'danger';
        if (hoursUntilAlert < 24) return 'warning';
        return 'info';
        
      case 'leaveRequest':
        const requestDate = new Date(item.startDate);
        const daysUntilLeave = (requestDate - now) / (1000 * 60 * 60 * 24);
        if (daysUntilLeave < 3) return 'danger';
        if (daysUntilLeave < 7) return 'warning';
        return 'info';
        
      case 'overdueBooking':
        return 'danger';
        
      case 'staffDocument':
        const submittedDate = new Date(item.submittedAt || item.createdAt);
        const daysOverdue = (now - submittedDate) / (1000 * 60 * 60 * 24);
        if (daysOverdue > 7) return 'danger';
        if (daysOverdue > 3) return 'warning';
        return 'info';
        
      default:
        return 'info';
    }
  };

  const handleItemClick = (item, type) => {
    switch (type) {
      case 'bookingAlert':
        navigate('/booking-alerts');
        break;
      case 'leaveRequest':
        navigate('/leave-requests/manage');
        break;
      case 'overdueBooking':
        navigate('/bookings');
        break;
      case 'staffDocument':
        navigate('/staff-hr');
        break;
      default:
        setSelectedItem({ ...item, type });
        setShowDetailsModal(true);
        break;
    }
  };

  const handleQuickAction = async (item, action, type) => {
    try {
      let endpoint = '';
      let method = 'PUT';
      let body = {};

      switch (type) {
        case 'bookingAlert':
          if (action === 'confirm') {
            endpoint = `/booking-alerts/${item._id}/confirm`;
          } else if (action === 'cancel') {
            endpoint = `/booking-alerts/${item._id}/cancel-alert`;
            body = { reason: 'Cancelled by manager' };
          }
          break;
          
        case 'leaveRequest':
          if (action === 'approve') {
            endpoint = `/leave-requests/${item._id}/approve`;
          } else if (action === 'deny') {
            endpoint = `/leave-requests/${item._id}/deny`;
            body = { denialReason: 'Denied by manager' };
          }
          break;
          
        case 'overdueBooking':
          if (action === 'complete') {
            endpoint = `/bookings/${item._id}`;
            body = { status: 'completed' };
          }
          break;
          
        default:
          return;
      }

      await axiosInstance({
        method,
        url: endpoint,
        data: body
      });

      // Refresh the todo list
      fetchTodoItems();
      setShowDetailsModal(false);
      
    } catch (err) {
      console.error('Error performing quick action:', err);
      setError(`Failed to ${action} item`);
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (newNote.trim() !== '') {
      setNotes([...notes, { text: newNote, completed: false, id: Date.now() }]);
      setNewNote('');
    }
  };

  const handleToggleNote = (id) => {
    setNotes(
      notes.map(note =>
        note.id === id ? { ...note, completed: !note.completed } : note
      )
    );
  };

  const handleClearCompleted = () => {
    setNotes(notes.filter(note => !note.completed));
  };

  const renderTodoItem = (item, type, index) => {
    const priority = getPriorityLevel(item, type);
    
    return (
      <ListGroup.Item 
        key={`${type}-${index}`}
        className="d-flex justify-content-between align-items-center"
        style={{ cursor: 'pointer' }}
        onClick={() => handleItemClick(item, type)}
      >
        <div className="flex-grow-1">
          <div className="d-flex align-items-center mb-1">
            {type === 'bookingAlert' && <FaBell className="me-2 text-warning" />}
            {type === 'leaveRequest' && <FaCalendarAlt className="me-2 text-info" />}
            {type === 'overdueBooking' && <FaExclamationTriangle className="me-2 text-danger" />}
            {type === 'staffDocument' && <FaUsers className="me-2 text-primary" />}
            
            <strong>
              {type === 'bookingAlert' && item.title}
              {type === 'leaveRequest' && `Leave Request - ${item.staff?.name}`}
              {type === 'overdueBooking' && `Overdue Booking - ${item.client?.name}`}
              {type === 'staffDocument' && `Document Review - ${item.staff?.name}`}
            </strong>
          </div>
          
          <small className="text-muted">
            {type === 'bookingAlert' && (
              item.isMultiDay && item.bookingDays && item.bookingDays.length > 0 
                ? `Multi-day booking (${item.bookingDays.length} days): ${moment(item.bookingDays[0].startTime).format('MMM DD')} - ${moment(item.bookingDays[item.bookingDays.length - 1].endTime).format('MMM DD')}`
                : `Shift: ${moment(item.startTime).format('MMM DD, HH:mm')}`
            )}
            {type === 'leaveRequest' && `Dates: ${moment(item.startDate).format('MMM DD')} - ${moment(item.endDate).format('MMM DD')}`}
            {type === 'overdueBooking' && `Was due: ${moment(item.endTime).format('MMM DD, HH:mm')}`}
            {type === 'staffDocument' && `Submitted: ${moment(item.submittedAt || item.createdAt).format('MMM DD')}`}
          </small>
        </div>
        
        <Badge bg={priority}>
          {priority === 'danger' ? 'Urgent' : priority === 'warning' ? 'Soon' : 'Pending'}
        </Badge>
      </ListGroup.Item>
    );
  };

  if (!currentUser || !['manager', 'admin', 'superuser'].includes(currentUser.role)) {
    return (
      <Alert variant="warning">
        You do not have permission to view manager tasks.
      </Alert>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="manager-todo-list">
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <FaCheckCircle className="me-2 text-success" />
                Manager Task Dashboard
              </h4>
              <Badge bg="primary" pill>
                {getTotalPendingTasks()} pending tasks
              </Badge>
            </Card.Header>
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
        <Tab eventKey="overview" title="Overview">
          <Row>
            <Col md={6} className="mb-3">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FaBell className="me-2" />
                    Booking Alerts
                  </h6>
                  <Badge bg="warning">{todoItems.bookingAlerts.length}</Badge>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {todoItems.bookingAlerts.length === 0 ? (
                    <p className="text-muted mb-0">No pending booking alerts</p>
                  ) : (
                    <ListGroup variant="flush">
                      {todoItems.bookingAlerts.slice(0, 5).map((item, index) => 
                        renderTodoItem(item, 'bookingAlert', index)
                      )}
                    </ListGroup>
                  )}
                  {todoItems.bookingAlerts.length > 5 && (
                    <div className="text-center mt-2">
                      <Link to="/booking-alerts">
                        <Button variant="outline-primary" size="sm">
                          View All ({todoItems.bookingAlerts.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-3">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FaCalendarAlt className="me-2" />
                    Leave Requests
                  </h6>
                  <Badge bg="info">{todoItems.leaveRequests.length}</Badge>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {todoItems.leaveRequests.length === 0 ? (
                    <p className="text-muted mb-0">No pending leave requests</p>
                  ) : (
                    <ListGroup variant="flush">
                      {todoItems.leaveRequests.slice(0, 5).map((item, index) => 
                        renderTodoItem(item, 'leaveRequest', index)
                      )}
                    </ListGroup>
                  )}
                  {todoItems.leaveRequests.length > 5 && (
                    <div className="text-center mt-2">
                      <Link to="/leave-requests/manage">
                        <Button variant="outline-primary" size="sm">
                          View All ({todoItems.leaveRequests.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6} className="mb-3">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FaExclamationTriangle className="me-2" />
                    Overdue Bookings
                  </h6>
                  <Badge bg="danger">{todoItems.overdueBookings.length}</Badge>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {todoItems.overdueBookings.length === 0 ? (
                    <p className="text-muted mb-0">No overdue bookings</p>
                  ) : (
                    <ListGroup variant="flush">
                      {todoItems.overdueBookings.slice(0, 5).map((item, index) => 
                        renderTodoItem(item, 'overdueBooking', index)
                      )}
                    </ListGroup>
                  )}
                  {todoItems.overdueBookings.length > 5 && (
                    <div className="text-center mt-2">
                      <Link to="/bookings">
                        <Button variant="outline-primary" size="sm">
                          View All ({todoItems.overdueBookings.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-3">
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    <FaUsers className="me-2" />
                    Staff Documents
                  </h6>
                  <Badge bg="primary">{todoItems.staffDocuments.length}</Badge>
                </Card.Header>
                <Card.Body style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {todoItems.staffDocuments.length === 0 ? (
                    <p className="text-muted mb-0">No documents pending review</p>
                  ) : (
                    <ListGroup variant="flush">
                      {todoItems.staffDocuments.slice(0, 5).map((item, index) => 
                        renderTodoItem(item, 'staffDocument', index)
                      )}
                    </ListGroup>
                  )}
                  {todoItems.staffDocuments.length > 5 && (
                    <div className="text-center mt-2">
                      <Link to="/staff-hr">
                        <Button variant="outline-primary" size="sm">
                          View All ({todoItems.staffDocuments.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="urgent" title="Urgent Tasks">
          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <FaExclamationTriangle className="me-2 text-danger" />
                Urgent Tasks Requiring Immediate Attention
              </h6>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {[
                  ...todoItems.bookingAlerts.filter(item => getPriorityLevel(item, 'bookingAlert') === 'danger'),
                  ...todoItems.leaveRequests.filter(item => getPriorityLevel(item, 'leaveRequest') === 'danger'),
                  ...todoItems.overdueBookings,
                  ...todoItems.staffDocuments.filter(item => getPriorityLevel(item, 'staffDocument') === 'danger')
                ].map((item, index) => {
                  const type = item.title ? 'bookingAlert' : 
                              item.startDate ? 'leaveRequest' : 
                              item.client ? 'overdueBooking' : 'staffDocument';
                  return renderTodoItem(item, type, index);
                })}
                
                {getTotalPendingTasks() === 0 && (
                  <ListGroup.Item>
                    <div className="text-center text-success">
                      <FaCheckCircle className="me-2" />
                      No urgent tasks at this time!
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="notes" title="My Notes">
          <Card>
            <Card.Header>
              <h6 className="mb-0">
                <FaStickyNote className="me-2" />
                My Notes
              </h6>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleAddNote}>
                <Row>
                  <Col>
                    <Form.Control
                      type="text"
                      placeholder="Add a new to-do item..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                  </Col>
                  <Col xs="auto">
                    <Button type="submit">Add</Button>
                  </Col>
                </Row>
              </Form>
              <ListGroup variant="flush" className="mt-3">
                {notes.map((note) => (
                  <ListGroup.Item key={note.id} className="d-flex justify-content-between align-items-center">
                    <Form.Check
                      type="checkbox"
                      checked={note.completed}
                      onChange={() => handleToggleNote(note.id)}
                      label={
                        <span style={{ textDecoration: note.completed ? 'line-through' : 'none' }}>
                          {note.text}
                        </span>
                      }
                    />
                  </ListGroup.Item>
                ))}
              </ListGroup>
              {notes.some(note => note.completed) && (
                <div className="text-center mt-3">
                  <Button variant="outline-danger" size="sm" onClick={handleClearCompleted}>
                    Clear Completed
                  </Button>
                </div>
              )}
              {notes.length === 0 && (
                <p className="text-muted text-center mt-3">No notes yet. Add one above!</p>
              )}
            </Card.Body>
          </Card>
        </Tab>

      </Tabs>

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedItem?.type === 'bookingAlert' && 'Booking Alert Details'}
            {selectedItem?.type === 'leaveRequest' && 'Leave Request Details'}
            {selectedItem?.type === 'overdueBooking' && 'Overdue Booking Details'}
            {selectedItem?.type === 'staffDocument' && 'Staff Document Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedItem && (
            <div>
              {selectedItem.type === 'bookingAlert' && (
                <div>
                  <p><strong>Title:</strong> {selectedItem.title}</p>
                  <p><strong>Description:</strong> {selectedItem.description}</p>
                  <p><strong>Time:</strong> {moment(selectedItem.startTime).format('MMM DD, YYYY HH:mm')} - {moment(selectedItem.endTime).format('HH:mm')}</p>
                  <p><strong>Status:</strong> {selectedItem.status}</p>
                  {selectedItem.claimedBy && (
                    <p><strong>Claimed By:</strong> {selectedItem.claimedBy.name}</p>
                  )}
                </div>
              )}
              
              {selectedItem.type === 'leaveRequest' && (
                <div>
                  <p><strong>Staff:</strong> {selectedItem.staff?.name}</p>
                  <p><strong>Dates:</strong> {moment(selectedItem.startDate).format('MMM DD, YYYY')} - {moment(selectedItem.endDate).format('MMM DD, YYYY')}</p>
                  <p><strong>Reason:</strong> {selectedItem.reason}</p>
                  <p><strong>Status:</strong> {selectedItem.status}</p>
                </div>
              )}
              
              {selectedItem.type === 'overdueBooking' && (
                <div>
                  <p><strong>Client:</strong> {selectedItem.client?.name}</p>
                  <p><strong>Service:</strong> {selectedItem.service?.name}</p>
                  <p><strong>Was Due:</strong> {moment(selectedItem.endTime).format('MMM DD, YYYY HH:mm')}</p>
                  <p><strong>Status:</strong> {selectedItem.status}</p>
                </div>
              )}
              
              {selectedItem.type === 'staffDocument' && (
                <div>
                  <p><strong>Staff:</strong> {selectedItem.staff?.name}</p>
                  <p><strong>Document Type:</strong> {selectedItem.documentType}</p>
                  <p><strong>Submitted:</strong> {moment(selectedItem.submittedAt || selectedItem.createdAt).format('MMM DD, YYYY')}</p>
                  <p><strong>Status:</strong> {selectedItem.status}</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          
          {selectedItem?.type === 'bookingAlert' && selectedItem.status === 'claimed' && (
            <>
              <Button 
                variant="success" 
                onClick={() => handleQuickAction(selectedItem, 'confirm', 'bookingAlert')}
              >
                Confirm Booking
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleQuickAction(selectedItem, 'cancel', 'bookingAlert')}
              >
                Cancel Alert
              </Button>
            </>
          )}
          
          {selectedItem?.type === 'leaveRequest' && selectedItem.status === 'pending' && (
            <>
              <Button 
                variant="success" 
                onClick={() => handleQuickAction(selectedItem, 'approve', 'leaveRequest')}
              >
                Approve
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleQuickAction(selectedItem, 'deny', 'leaveRequest')}
              >
                Deny
              </Button>
            </>
          )}
          
          {selectedItem?.type === 'overdueBooking' && (
            <Button 
              variant="success" 
              onClick={() => handleQuickAction(selectedItem, 'complete', 'overdueBooking')}
            >
              Mark as Completed
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManagerTodoList;