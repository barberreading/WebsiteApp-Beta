import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, Alert } from 'react-bootstrap';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';

const TimesheetApprovalDashboard = () => {
  const [approvedTimesheets, setApprovedTimesheets] = useState([]);
  const [pendingTimesheets, setPendingTimesheets] = useState([]);
  const [rejectedTimesheets, setRejectedTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const { token, user } = useAuth();

  useEffect(() => {
    if (token) {
      fetchTimesheets();
    }
  }, [token]);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      // Use different endpoint based on user role
      const endpoint = user?.role === 'client' ? '/api/timesheets/client-approval' : '/timesheets/approval-status';
      const response = await axiosInstance.get(endpoint);
      setApprovedTimesheets(response.data.approved || []);
      setPendingTimesheets(response.data.pending || []);
      setRejectedTimesheets(response.data.rejected || []);
    } catch (err) {
      setError('Failed to fetch timesheets. Please try again later.');
      console.error('Error fetching timesheets:', err);
    } finally {
      setLoading(false);
    }
  };

  const openOverrideModal = (timesheet, initialStatus) => {
    setSelectedTimesheet(timesheet);
    setNewStatus(initialStatus || 'approved');
    setRejectionReason('');
    setShowOverrideModal(true);
  };

  const handleOverride = async () => {
    if (newStatus === 'rejected' && !rejectionReason.trim()) {
      toast.error('A reason is required for the override.');
      return;
    }

    try {
      // Use different endpoint based on user role
      const endpoint = user?.role === 'client'
        ? `/api/timesheets/${selectedTimesheet._id}/client-approve`
        : `/timesheets/${selectedTimesheet._id}/status`;
      
      await axiosInstance.put(endpoint, {
        status: newStatus,
        rejectionReason: rejectionReason,
      });

      setSuccess('Timesheet status updated successfully');
      // Refresh the timesheet list
      fetchTimesheets();
      setShowOverrideModal(false);
      
    } catch (err) {
      setError('Failed to update timesheet status. Please try again.');
      console.error('Error updating timesheet:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const renderTimesheetTable = (timesheets, title, variant) => {
    return (
      <Card className="mb-4" border={variant}>
        <Card.Header className={`bg-${variant} text-white`}>
          <h5 className="mb-0">{title} ({timesheets.length})</h5>
        </Card.Header>
        <Card.Body>
          {timesheets.length === 0 ? (
            <p className="text-center">No timesheets found</p>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Staff</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.map(timesheet => (
                  <tr key={timesheet._id}>
                    <td>{timesheet.staff?.name || 'Unknown'}</td>
                    <td>{timesheet.client?.name || 'Unknown'}</td>
                    <td>{formatDate(timesheet.date)}</td>
                    <td>{timesheet.hours}</td>
                    <td>
                      <Badge bg={
                        timesheet.status === 'approved' ? 'success' :
                        timesheet.status === 'rejected' ? 'danger' : 'warning'
                      }>
                        {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                        {timesheet.managerOverride && ' (Override)'}
                      </Badge>
                      {timesheet.manualEntry && (
                        <Badge bg="info" className="ms-1">Manual Entry</Badge>
                      )}
                      {timesheet.needsReview && (
                        <Badge bg="warning" className="ms-1">Needs Review</Badge>
                      )}
                    </td>
                    <td>
                      <Button 
                        size="sm" 
                        variant="outline-primary"
                        onClick={() => openOverrideModal(timesheet, timesheet.status !== 'approved' ? 'approved' : 'pending')}
                      >
                        Override Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h2>Timesheet Approval Dashboard</h2>
          <p className="text-muted">Manage and override timesheet approval statuses</p>
        </Col>
        <Col xs="auto">
          <Button variant="primary" onClick={fetchTimesheets}>
            Refresh Data
          </Button>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading timesheets...</p>
        </div>
      ) : (
        <>
          {renderTimesheetTable(pendingTimesheets, 'Pending Approval', 'warning')}
          {renderTimesheetTable(approvedTimesheets, 'Approved Timesheets', 'success')}
          {renderTimesheetTable(rejectedTimesheets, 'Rejected Timesheets', 'danger')}
        </>
      )}

      {/* Override Modal */}
      <Modal show={showOverrideModal} onHide={() => setShowOverrideModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Override Timesheet Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTimesheet && (
            <>
              <p>
                <strong>Staff:</strong> {selectedTimesheet.staff?.name}<br />
                <strong>Client:</strong> {selectedTimesheet.client?.name}<br />
                <strong>Date:</strong> {formatDate(selectedTimesheet.date)}<br />
                <strong>Hours:</strong> {selectedTimesheet.hours}<br />
                <strong>Current Status:</strong> {selectedTimesheet.status}
              </p>

              <Form.Group className="mb-3">
                <Form.Label>New Status</Form.Label>
                <Form.Select 
                  value={newStatus} 
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="pending">Pending</option>
                </Form.Select>
              </Form.Group>

              {newStatus === 'rejected' && (
                <Form.Group className="mb-3">
                  <Form.Label>Rejection Reason</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection"
                    required
                  />
                </Form.Group>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowOverrideModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleOverride}
            disabled={newStatus === 'rejected' && !rejectionReason}
          >
            Confirm Override
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TimesheetApprovalDashboard;