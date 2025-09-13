import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Table, Modal, Form, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaCheck, FaTimes, FaEye, FaCalendarAlt, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useHasRole } from '../utils/roleUtils';
import axiosInstance from '../utils/axiosInstance';
import moment from 'moment';

const LeaveRequests = () => {
  const { currentUser } = useAuth();
  const hasManagerRole = useHasRole(['manager', 'superuser', 'admin']);
  
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [conflictingBookings, setConflictingBookings] = useState([]);
  
  useEffect(() => {
    if (hasManagerRole) {
      fetchLeaveRequests();
      fetchBookings();
    }
  }, [hasManagerRole]);
  
  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/leave-requests');
      setLeaveRequests(res.data.data || []);
    } catch (err) {
      setError('Failed to fetch leave requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchBookings = async () => {
    try {
      const res = await axiosInstance.get('/bookings/range?limit=1000');
      setBookings(res.data.bookings || res.data || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };
  
  const checkBookingConflicts = (leaveRequest) => {
    const leaveStart = new Date(leaveRequest.startDate);
    const leaveEnd = new Date(leaveRequest.endDate);
    leaveEnd.setHours(23, 59, 59, 999); // End of day
    
    const conflicts = bookings.filter(booking => {
      if (booking.status === 'cancelled') return false;
      
      const bookingStart = new Date(booking.startTime);
      const bookingEnd = new Date(booking.endTime);
      
      // Check if booking staff matches leave request staff and times overlap
      return (
        booking.staff === leaveRequest.staff._id &&
        bookingStart < leaveEnd &&
        bookingEnd > leaveStart
      );
    });
    
    return conflicts;
  };
  
  const handleApprove = async (request) => {
    const conflicts = checkBookingConflicts(request);
    setConflictingBookings(conflicts);
    setSelectedRequest(request);
    setShowApprovalModal(true);
  };
  
  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowRejectionModal(true);
  };
  
  const handleViewDetails = (request) => {
    const conflicts = checkBookingConflicts(request);
    setConflictingBookings(conflicts);
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };
  
  const confirmApproval = async () => {
    try {
      setLoading(true);
      
      await axiosInstance.put(`/leave-requests/${selectedRequest._id}/approve`);
      
      toast.success('Leave request approved successfully');
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setConflictingBookings([]);
      fetchLeaveRequests();
    } catch (err) {
      toast.error('Failed to approve leave request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      setLoading(true);
      
      await axiosInstance.put(`/leave-requests/${selectedRequest._id}/deny`, {
        denialReason: rejectionReason
      });
      
      toast.success('Leave request rejected');
      setShowRejectionModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchLeaveRequests();
    } catch (err) {
      toast.error('Failed to reject leave request');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      case 'approved':
        return <Badge bg="success">Approved</Badge>;
      case 'denied':
        return <Badge bg="danger">Denied</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };
  
  const filteredRequests = leaveRequests.filter(request => {
    if (activeTab === 'all') return true;
    return request.status === activeTab;
  });
  
  if (!hasManagerRole) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          You don't have permission to access this page.
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h4>Leave Request Management</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-3"
              >
                <Tab eventKey="pending" title="Pending">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Pending Leave Requests</h5>
                    <Badge bg="warning">{filteredRequests.length}</Badge>
                  </div>
                </Tab>
                <Tab eventKey="approved" title="Approved">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Approved Leave Requests</h5>
                    <Badge bg="success">{filteredRequests.length}</Badge>
                  </div>
                </Tab>
                <Tab eventKey="denied" title="Denied">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Denied Leave Requests</h5>
                    <Badge bg="danger">{filteredRequests.length}</Badge>
                  </div>
                </Tab>
                <Tab eventKey="all" title="All">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>All Leave Requests</h5>
                    <Badge bg="info">{filteredRequests.length}</Badge>
                  </div>
                </Tab>
              </Tabs>
              
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Days</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted">
                          No leave requests found
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => {
                        const conflicts = checkBookingConflicts(request);
                        const daysDiff = moment(request.endDate).diff(moment(request.startDate), 'days') + 1;
                        
                        return (
                          <tr key={request._id}>
                            <td>
                              {request.staff?.name}
                              {conflicts.length > 0 && (
                                <div>
                                  <FaExclamationTriangle className="text-warning ms-2" title="Has booking conflicts" />
                                  <small className="text-warning">({conflicts.length} conflicts)</small>
                                </div>
                              )}
                            </td>
                            <td>{moment(request.startDate).format('MMM DD, YYYY')}</td>
                            <td>{moment(request.endDate).format('MMM DD, YYYY')}</td>
                            <td>{daysDiff} day{daysDiff !== 1 ? 's' : ''}</td>
                            <td>
                              <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {request.reason}
                              </div>
                            </td>
                            <td>{getStatusBadge(request.status)}</td>
                            <td>{moment(request.createdAt).format('MMM DD, YYYY')}</td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline-info"
                                  onClick={() => handleViewDetails(request)}
                                  title="View Details"
                                >
                                  <FaEye />
                                </Button>
                                {request.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline-success"
                                      onClick={() => handleApprove(request)}
                                      title="Approve"
                                    >
                                      <FaCheck />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline-danger"
                                      onClick={() => handleReject(request)}
                                      title="Reject"
                                    >
                                      <FaTimes />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Approval Modal */}
      <Modal show={showApprovalModal} onHide={() => setShowApprovalModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Approve Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <h6>Leave Request Details:</h6>
              <p><strong>Staff:</strong> {selectedRequest.staff?.name}</p>
              <p><strong>Dates:</strong> {moment(selectedRequest.startDate).format('MMM DD, YYYY')} - {moment(selectedRequest.endDate).format('MMM DD, YYYY')}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              
              {conflictingBookings.length > 0 && (
                <Alert variant="warning">
                  <h6><FaExclamationTriangle /> Booking Conflicts Detected</h6>
                  <p>The following bookings conflict with this leave request:</p>
                  <ul>
                    {conflictingBookings.map((booking, index) => (
                      <li key={index}>
                        {moment(booking.startTime).format('MMM DD, YYYY HH:mm')} - {moment(booking.endTime).format('HH:mm')}
                        {booking.client && ` (Client: ${booking.client.firstName} ${booking.client.lastName})`}
                        {booking.service && ` - ${booking.service.name}`}
                      </li>
                    ))}
                  </ul>
                  <p className="mb-0"><strong>Note:</strong> These bookings will need to be rescheduled or cancelled if you approve this leave request.</p>
                </Alert>
              )}
              
              <p>Are you sure you want to approve this leave request?</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApprovalModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={confirmApproval} disabled={loading}>
            {loading ? 'Approving...' : 'Approve Leave Request'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Rejection Modal */}
      <Modal show={showRejectionModal} onHide={() => setShowRejectionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Reject Leave Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <h6>Leave Request Details:</h6>
              <p><strong>Staff:</strong> {selectedRequest.staff?.name}</p>
              <p><strong>Dates:</strong> {moment(selectedRequest.startDate).format('MMM DD, YYYY')} - {moment(selectedRequest.endDate).format('MMM DD, YYYY')}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              
              <Form.Group className="mb-3">
                <Form.Label>Reason for Rejection *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this leave request..."
                  required
                />
              </Form.Group>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectionModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmRejection} disabled={loading || !rejectionReason.trim()}>
            {loading ? 'Rejecting...' : 'Reject Leave Request'}
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Leave Request Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <Row>
                <Col md={6}>
                  <h6>Request Information:</h6>
                  <p><strong>Staff:</strong> {selectedRequest.staff?.name}</p>
                  <p><strong>Email:</strong> {selectedRequest.staff?.email}</p>
                  <p><strong>Start Date:</strong> {moment(selectedRequest.startDate).format('MMM DD, YYYY')}</p>
                  <p><strong>End Date:</strong> {moment(selectedRequest.endDate).format('MMM DD, YYYY')}</p>
                  <p><strong>Total Days:</strong> {moment(selectedRequest.endDate).diff(moment(selectedRequest.startDate), 'days') + 1}</p>
                  <p><strong>Status:</strong> {getStatusBadge(selectedRequest.status)}</p>
                  <p><strong>Submitted:</strong> {moment(selectedRequest.createdAt).format('MMM DD, YYYY HH:mm')}</p>
                </Col>
                <Col md={6}>
                  <h6>Additional Information:</h6>
                  <p><strong>Reason:</strong></p>
                  <p className="border p-2 bg-light">{selectedRequest.reason}</p>
                  
                  {selectedRequest.status === 'denied' && selectedRequest.denialReason && (
                    <div>
                      <p><strong>Rejection Reason:</strong></p>
                      <p className="border p-2 bg-light text-danger">{selectedRequest.denialReason}</p>
                    </div>
                  )}
                  
                  {selectedRequest.reviewedBy && (
                        <div>
                          <p><strong>Reviewed By:</strong> {selectedRequest.reviewedBy.name}</p>
                          <p><strong>Reviewed At:</strong> {moment(selectedRequest.reviewedAt).format('MMM DD, YYYY HH:mm')}</p>
                        </div>
                      )}
                </Col>
              </Row>
              
              {conflictingBookings.length > 0 && (
                <div className="mt-3">
                  <Alert variant="warning">
                    <h6><FaExclamationTriangle /> Booking Conflicts</h6>
                    <Table size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Client</th>
                          <th>Service</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conflictingBookings.map((booking, index) => (
                          <tr key={index}>
                            <td>{moment(booking.startTime).format('MMM DD, YYYY HH:mm')} - {moment(booking.endTime).format('HH:mm')}</td>
                            <td>{booking.client?.firstName} {booking.client?.lastName}</td>
                            <td>{booking.service?.name}</td>
                            <td>{booking.location || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedRequest?.status === 'pending' && (
            <div className="d-flex gap-2">
              <Button variant="success" onClick={() => {
                setShowDetailsModal(false);
                handleApprove(selectedRequest);
              }}>
                <FaCheck /> Approve
              </Button>
              <Button variant="danger" onClick={() => {
                setShowDetailsModal(false);
                handleReject(selectedRequest);
              }}>
                <FaTimes /> Reject
              </Button>
            </div>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default LeaveRequests;