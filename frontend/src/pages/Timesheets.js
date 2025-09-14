import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Container, Table, Form, Row, Col, Button, Alert, Modal, Spinner, Card, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { format, parseISO, isAfter, startOfWeek, setHours, setMinutes } from 'date-fns';
import axiosInstance from '../utils/axiosInstance';

const Timesheets = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { token, user } = useAuth();
  
  // Scanning interface states
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanFiles, setScanFiles] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle, processing, completed, error
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingResults, setProcessingResults] = useState([]);
  const [manualEntryData, setManualEntryData] = useState(null);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [showNewManualEntryModal, setShowNewManualEntryModal] = useState(false);
  const [newManualEntry, setNewManualEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    clockInTime: '',
    clockOutTime: '',
    breakDuration: 0,
    notes: ''
  });
  const fileInputRef = useRef(null);

  const fetchTimesheets = useCallback(async () => {
    try {
      setLoading(true);
      
      // Use the correct API endpoint format with axiosInstance
      const res = await axiosInstance.get(`/timesheets`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          populate: 'client,user,staff'
        }
      });
      
      logger.log('Fetched timesheets:', res.data);
      setTimesheets(res.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch timesheets');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleExport = () => {
    // In a real application, this would generate a CSV or PDF export
  };
  
  // Payroll report functions
  // eslint-disable-next-line no-unused-vars
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [payrollReport, setPayrollReport] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [payrollLoading, setPayrollLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [payrollError, setPayrollError] = useState(null);
  const [payrollDateRange, setPayrollDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    endDate: new Date().toISOString().split('T')[0] // Today
  });
  
  // eslint-disable-next-line no-unused-vars
  const handlePayrollDateChange = (e) => {
    setPayrollDateRange({
      ...payrollDateRange,
      [e.target.name]: e.target.value
    });
  };
  
  const handleOpenPayrollModal = () => {
    setShowPayrollModal(true);
    setPayrollReport(null);
    setPayrollLoading(false);
    setPayrollError(null);
    generatePayrollReport();
  };
  
  // eslint-disable-next-line no-unused-vars
  const handleClosePayrollModal = () => {
    setShowPayrollModal(false);
  };
  
  // eslint-disable-next-line no-unused-vars
  const generatePayrollReport = async () => {
    try {
      setPayrollLoading(true);
      setPayrollError(null);
      
      const res = await axiosInstance.get(`/timesheets/payroll-report`, {
        params: {
          startDate: payrollDateRange.startDate,
          endDate: payrollDateRange.endDate
        }
      });
      
      setPayrollReport(res.data);
    } catch (err) {
      setPayrollError('Failed to generate payroll report');
      logger.error(err);
    } finally {
      setPayrollLoading(false);
    }
  };
    
  // State for timesheet editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTimesheet, setEditingTimesheet] = useState(null);
  const [editFormData, setEditFormData] = useState({
    clockIn: '',
    clockOut: '',
    date: '',
    notes: '',
    status: '',
    breakDuration: '',
    totalHours: '',
    needsReview: false,
    editReason: ''
  });
  
  // Client approval modal state
  const [showClientApprovalModal, setShowClientApprovalModal] = useState(false);
  const [clientApprovalData, setClientApprovalData] = useState({
    timesheetId: '',
    clockIn: '',
    clockOut: '',
    notes: '',
    editReason: ''
  });
  const [saving, setSaving] = useState(false);
  
  // Manager override for timesheet approval
  const [overrideReason, setOverrideReason] = useState('');
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  
  // eslint-disable-next-line no-unused-vars
  const openOverrideModal = (timesheet) => {
    setSelectedTimesheet(timesheet);
    setShowOverrideModal(true);
  };
  
  // eslint-disable-next-line no-unused-vars
  const handleManagerOverride = async (status) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/timesheets/${selectedTimesheet._id}/manager-override`, {
        status,
        reason: overrideReason
      });
      fetchTimesheets();
      setShowOverrideModal(false);
      setOverrideReason('');
      alert(`Timesheet ${status} by manager override`);
    } catch (error) {
      logger.error('Error overriding timesheet:', error);
      setError('Failed to override timesheet');
    } finally {
      setLoading(false);
    }
  };

  // Delete timesheet function
  const handleDeleteTimesheet = async (timesheetId) => {
    if (!window.confirm('Are you sure you want to delete this timesheet? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.delete(`/timesheets/${timesheetId}`);
      
      // Remove the deleted timesheet from the state
      setTimesheets(timesheets.filter(ts => ts._id !== timesheetId));
      setError('');
      alert('Timesheet deleted successfully');
    } catch (error) {
      logger.error('Error deleting timesheet:', error);
      if (error.response?.data?.msg) {
        setError(error.response.data.msg);
      } else {
        setError('Failed to delete timesheet');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check if timesheet can be deleted by current user
  const canDeleteTimesheet = (timesheet) => {
    // Managers can always delete
    if (user && (user.role === 'manager' || user.role === 'superuser' || user.role === 'admin')) {
      return true;
    }
    
    // Staff can only delete their own unlocked timesheets
    if (timesheet.user === user?.id || timesheet.staff?._id === user?.id) {
      return isTimesheetEditable(timesheet);
    }
    
    return false;
  };
  
  // Check if timesheet is editable by staff (before Monday 10am of following week)
  const isTimesheetEditable = (timesheet) => {
    // If user is manager or client, they can always edit
    if (user && (user.role === 'manager' || user.role === 'superuser' || user.role === 'client')) {
      return true;
    }
    
    // For staff members, check if it's before Monday 10am of following week
    const timesheetDate = parseISO(timesheet.date);
    const nextMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const nextMondayAt10AM = setHours(setMinutes(nextMonday, 0), 10);
    
    // Check if timesheet is locked (after Monday 10am and from previous week)
    const isLocked = isAfter(new Date(), nextMondayAt10AM) && 
                     timesheetDate < startOfWeek(new Date(), { weekStartsOn: 0 });
    
    return !isLocked && timesheet.status !== 'approved';
  };
  
  // Helper function to check if a timesheet is locked for editing
  const isTimesheetLocked = (timesheet) => {
    // Skip lock check for managers and clients
    if (user && (user.role === 'manager' || user.role === 'superuser' || user.role === 'client')) {
      return false;
    }
    
    const timesheetDate = parseISO(timesheet.date);
    const nextMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const nextMondayAt10AM = setHours(setMinutes(nextMonday, 0), 10);
    
    // Timesheet is locked if it's after Monday 10am and the timesheet is from previous week
    return isAfter(new Date(), nextMondayAt10AM) && 
           timesheetDate < startOfWeek(new Date(), { weekStartsOn: 0 });
  };
  
  // Open edit modal for timesheet
  const openEditModal = (timesheet) => {
    setEditingTimesheet(timesheet);
    
    try {
      // Format times for the form inputs (HH:MM format)
      let clockInTime = '';
      let clockOutTime = '';
      
      if (timesheet.clockIn) {
        const clockInDate = new Date(timesheet.clockIn);
        clockInTime = `${clockInDate.getHours().toString().padStart(2, '0')}:${clockInDate.getMinutes().toString().padStart(2, '0')}`;
      }
      
      if (timesheet.clockOut) {
        const clockOutDate = new Date(timesheet.clockOut);
        clockOutTime = `${clockOutDate.getHours().toString().padStart(2, '0')}:${clockOutDate.getMinutes().toString().padStart(2, '0')}`;
      }
      
      // Get date from timesheet
      const timesheetDate = timesheet.date ? new Date(timesheet.date) : new Date();
      const formattedDate = `${timesheetDate.getFullYear()}-${(timesheetDate.getMonth() + 1).toString().padStart(2, '0')}-${timesheetDate.getDate().toString().padStart(2, '0')}`;
      
      logger.log('Setting form data:', {
        clockIn: clockInTime,
        clockOut: clockOutTime,
        date: formattedDate
      });
      
      setEditFormData({
        clockIn: clockInTime,
        clockOut: clockOutTime,
        date: formattedDate,
        notes: timesheet.notes || '',
        status: timesheet.status || 'pending',
        breakDuration: timesheet.breakDuration || 0,
        totalHours: timesheet.totalHours || 0,
        needsReview: timesheet.needsReview || false,
        editReason: ''
      });
      
      setShowEditModal(true);
    } catch (error) {
      logger.error('Error opening edit modal:', error);
      alert('Error opening edit modal. Please try again.');
    }
  };
  
  // Handle edit form input changes
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    logger.log(`Updating ${name} to ${fieldValue}`);
    setEditFormData({
      ...editFormData,
      [name]: fieldValue
    });
  };
  
  // Save timesheet edits
  const saveTimesheetEdit = async () => {
    try {
      // Validate edit reason is provided
      if (!editFormData.editReason || editFormData.editReason.trim() === '') {
        alert('Please provide a reason for editing this timesheet.');
        return;
      }
      
      setLoading(true);
      
      // Use the selected date from the form
      const selectedDate = new Date(editFormData.date);
      
      // Convert time strings to full datetime
      const [clockInHours, clockInMinutes] = editFormData.clockIn.split(':').map(Number);
      const [clockOutHours, clockOutMinutes] = editFormData.clockOut.split(':').map(Number);
      
      const clockInDate = new Date(selectedDate);
      clockInDate.setHours(clockInHours, clockInMinutes, 0, 0);
      
      let clockOutDate = new Date(selectedDate);
      clockOutDate.setHours(clockOutHours, clockOutMinutes, 0, 0);
      
      // Handle overnight shifts (if clock out is earlier than clock in)
      if (isAfter(clockInDate, clockOutDate)) {
        clockOutDate = new Date(clockOutDate);
        clockOutDate.setDate(clockOutDate.getDate() + 1);
      }
      
      logger.log('Saving updated timesheet with all fields');
      
      // Prepare update data with all fields
      const updateData = {
        date: selectedDate.toISOString(),
        clockIn: clockInDate.toISOString(),
        clockOut: clockOutDate.toISOString(),
        notes: editFormData.notes,
        editReason: editFormData.editReason
      };
      
      // Add manager-only fields if user is manager/admin
      if (user && (user.role === 'manager' || user.role === 'admin' || user.role === 'superuser')) {
        updateData.status = editFormData.status;
        updateData.breakDuration = parseInt(editFormData.breakDuration) || 0;
        updateData.totalHours = parseFloat(editFormData.totalHours) || 0;
        updateData.needsReview = editFormData.needsReview;
      }
      
      const response = await axiosInstance.put(`/timesheets/${editingTimesheet._id}`, updateData);
      
      // Update the local state with the updated timesheet
      const updatedTimesheets = timesheets.map(ts => 
        ts._id === editingTimesheet._id ? response.data : ts
      );
      setTimesheets(updatedTimesheets);
      
      setShowEditModal(false);
      setError('');
      alert('Timesheet updated successfully');
    } catch (err) {
      setError('Failed to update timesheet: ' + (err.response?.data?.msg || err.message));
      logger.error(err);
      alert('Failed to update timesheet');
    } finally {
      setLoading(false);
    }
  };
    
  // Timesheet scanning functions
  const handleOpenScanModal = () => {
    setShowScanModal(true);
    setScanFiles([]);
    setProcessingStatus('idle');
    setProcessingProgress(0);
    setProcessingResults([]);
  };
  
  const handleCloseScanModal = () => {
    setShowScanModal(false);
    if (processingStatus === 'processing') {
      // Confirm before closing if processing
      if (window.confirm('Processing is in progress. Are you sure you want to cancel?')) {
        setProcessingStatus('idle');
      } else {
        return;
      }
    }
  };
  
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setScanFiles(files);
  };
  
  const handleUploadTimesheets = async () => {
    if (scanFiles.length === 0) {
      setError('Please select files to upload');
      return;
    }
    
    setProcessingStatus('processing');
    setProcessingProgress(0);
    
    const formData = new FormData();
    scanFiles.forEach(file => {
      formData.append('timesheets', file);
    });
    
    // Add validation parameters
    formData.append('validateHours', 'true');
    formData.append('maxHoursPerDay', '12');
    formData.append('minBreakTime', '30');
    formData.append('checkOverlappingShifts', 'true');
    
    try {
      const response = await axiosInstance.post('/timesheets/scan', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProcessingProgress(percentCompleted);
        }
      });
      
      setProcessingResults(response.data.results);
      
      if (response.data.requiresManualEntry && response.data.requiresManualEntry.length > 0) {
        setManualEntryData(response.data.requiresManualEntry);
        setShowManualEntryModal(true);
      } else {
        setProcessingStatus('completed');
      }
    } catch (err) {
      logger.error('Error uploading timesheets:', err);
      setError('Failed to process timesheet scans');
      setProcessingStatus('error');
    }
  };
  
  const handleManualEntry = async (manualData) => {
    try {
      const response = await axiosInstance.post('/timesheets/manual-entry', {
        manualEntries: manualData
      });
      
      setProcessingResults(prev => [...prev, ...response.data.results]);
      setShowManualEntryModal(false);
      setProcessingStatus('completed');
      fetchTimesheets(); // Refresh the list
    } catch (err) {
      logger.error('Error submitting manual entries:', err);
      setError('Failed to process manual entries');
    }
  };
  
  const handleSubmitTimesheet = async (timesheetId) => {
    try {
      // Submit timesheet for approval
      await axiosInstance.put(`timesheets/${timesheetId}/submit`);
      
      // Refresh timesheets
      fetchTimesheets();
      
      // Success message
      alert('Timesheet submitted for approval successfully!');
    } catch (err) {
      logger.error('Error submitting timesheet for approval:', err);
      alert('Failed to submit timesheet for approval. Please try again.');
    }
  };
  
  const handleApproveTimesheet = async (timesheetId) => {
    // If user is a client, open approval modal for potential edits
    if (user.role === 'client') {
      const timesheet = timesheets.find(t => t._id === timesheetId);
      if (timesheet) {
        setClientApprovalData({
          timesheetId: timesheetId,
          clockIn: timesheet.clockIn ? new Date(timesheet.clockIn).toISOString().slice(0, 16) : '',
          clockOut: timesheet.clockOut ? new Date(timesheet.clockOut).toISOString().slice(0, 16) : '',
          notes: timesheet.notes || '',
          editReason: ''
        });
        setShowClientApprovalModal(true);
      }
      return;
    }
    
    // For managers/admins, approve directly
    try {
      await axiosInstance.put(`timesheets/${timesheetId}/approve`);
      fetchTimesheets();
      alert('Timesheet approved successfully!');
    } catch (err) {
      logger.error('Error approving timesheet:', err);
      alert('Failed to approve timesheet. Please try again.');
    }
  };
  
  const handleClientApprovalSubmit = async () => {
    try {
      const response = await axiosInstance.put(`timesheets/${clientApprovalData.timesheetId}/approve`, {
        clockIn: clientApprovalData.clockIn || undefined,
        clockOut: clientApprovalData.clockOut || undefined,
        notes: clientApprovalData.notes || undefined,
        editReason: clientApprovalData.editReason || undefined
      });
      
      setShowClientApprovalModal(false);
      fetchTimesheets();
      
      if (response.data.hasClientEdits) {
        alert('Timesheet approved with your edits. It has been sent to management for final approval.');
      } else {
        alert('Timesheet approved successfully!');
      }
    } catch (err) {
      logger.error('Error approving timesheet:', err);
      alert('Failed to approve timesheet. Please try again.');
    }
  };
  
  const handleManagerApproval = async (timesheetId) => {
    try {
      await axiosInstance.put(`timesheets/${timesheetId}/manager-approve`);
      fetchTimesheets();
      alert('Timesheet finally approved successfully!');
    } catch (err) {
      logger.error('Error in manager approval:', err);
      alert('Failed to approve timesheet. Please try again.');
    }
  };
  
  const handleClientApprovalChange = (e) => {
    const { name, value } = e.target;
    setClientApprovalData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleRejectTimesheet = async (timesheetId) => {
    try {
      // Get rejection reason
      const reason = prompt('Please provide a reason for rejecting this timesheet:');
      
      if (reason === null) {
        // User cancelled the prompt
        return;
      }
      
      // Reject timesheet
      await axiosInstance.put(`timesheets/${timesheetId}/reject`, { reason });
      
      // Refresh timesheets
      fetchTimesheets();
      
      // Success message
      alert('Timesheet rejected successfully!');
    } catch (err) {
      logger.error('Error rejecting timesheet:', err);
      alert('Failed to reject timesheet. Please try again.');
    }
  };

  const handleSubmitManualEntry = async () => {
    try {
      // Validate required fields
      if (!newManualEntry.date || !newManualEntry.clockInTime || !newManualEntry.clockOutTime) {
        alert('Please fill in all required fields (Date, Clock In Time, Clock Out Time)');
        return;
      }
      
      // Calculate duration in hours
      const start = new Date(`${newManualEntry.date}T${newManualEntry.clockInTime}`);
      const end = new Date(`${newManualEntry.date}T${newManualEntry.clockOutTime}`);
      
      // Handle overnight shifts
      if (end < start) {
        end.setDate(end.getDate() + 1);
      }
      
      let durationMs = end - start;
      
      // Subtract break duration if provided
      if (newManualEntry.breakDuration) {
        durationMs -= newManualEntry.breakDuration * 60 * 1000;
      }
      
      // Convert to hours (decimal)
      const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
      
      // Create timesheet object
      const timesheetData = {
        date: newManualEntry.date,
        clockIn: start.toISOString(),
        clockOut: end.toISOString(),
        breakDuration: newManualEntry.breakDuration,
        duration: durationHours.toFixed(2),
        notes: newManualEntry.notes,
        manuallyEntered: true,
        status: 'pending'
      };
      
      // Submit to API
      await axiosInstance.post('timesheets', timesheetData);
      
      // Reset form and close modal
      setNewManualEntry({
        date: new Date().toISOString().split('T')[0],
        clockInTime: '',
        clockOutTime: '',
        breakDuration: 0,
        notes: ''
      });
      setShowNewManualEntryModal(false);
      
      // Refresh timesheets
      fetchTimesheets();
      
      // Success message
      alert('Timesheet submitted successfully!');
    } catch (err) {
      logger.error('Error submitting timesheet:', err);
      alert('Failed to submit timesheet. Please try again.');
    }
  };

  if (loading) return <div className="loading-spinner">Loading...</div>;

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Timesheets</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row className="mb-4">
        <Col md={3}>
          <Form.Group>
            <Form.Label>Start Date</Form.Label>
            <Form.Control
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </Form.Group>
        </Col>
        <Col md={3}>
          <Form.Group>
            <Form.Label>End Date</Form.Label>
            <Form.Control
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
            />
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button variant="primary" onClick={fetchTimesheets} className="mr-2 me-2">
            Filter
          </Button>
          <Button variant="secondary" onClick={handleExport} className="mr-2 me-2">
            Export
          </Button>
          {user && (user.role === 'manager' || user.role === 'superuser') && (
            <>
              <Button variant="success" onClick={handleOpenScanModal} className="mr-2 me-2">
                Scan Paper Timesheets
              </Button>
              <Button variant="info" onClick={handleOpenPayrollModal} className="mr-2 me-2">
                Payroll Report
              </Button>
              <Button variant="outline-primary" onClick={() => setShowNewManualEntryModal(true)}>
                Add Manual Timesheet
              </Button>
            </>
          )}
        </Col>
      </Row>
      
      {/* Timesheet Scanning Modal */}
      <Modal show={showScanModal} onHide={handleCloseScanModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Scan Paper Timesheets</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {processingStatus === 'idle' && (
            <>
              <p>Upload scanned timesheet images to process them automatically.</p>
              <Form.Group>
                <Form.Label>Select Timesheet Files</Form.Label>
                <Form.Control 
                  type="file" 
                  multiple 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,.pdf"
                />
                <Form.Text className="text-muted">
                  Supported formats: JPG, PNG, PDF
                </Form.Text>
              </Form.Group>
              
              {scanFiles.length > 0 && (
                <div className="mt-3">
                  <h6>Selected Files ({scanFiles.length})</h6>
                  <ul className="list-group">
                    {scanFiles.map((file, index) => (
                      <li key={index} className="list-group-item">
                        {file.name} ({(file.size / 1024).toFixed(2)} KB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          
          {processingStatus === 'processing' && (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
              <h5 className="mt-3">Processing Timesheets...</h5>
              <ProgressBar now={processingProgress} label={`${processingProgress}%`} className="mt-2" />
            </div>
          )}
          
          {processingStatus === 'completed' && (
            <div className="my-3">
              <Alert variant="success">
                <Alert.Heading>Processing Complete!</Alert.Heading>
                <p>Successfully processed {processingResults.length} timesheets.</p>
              </Alert>
              
              {processingResults.length > 0 && (
                <div className="mt-3">
                  <h6>Processing Results</h6>
                  <ul className="list-group">
                    {processingResults.map((result, index) => (
                      <li key={index} className="list-group-item">
                        <strong>{result.staffName}</strong>: {result.totalHours} hours
                        {result.hasErrors && (
                          <span className="text-danger ms-2">
                            (Requires manual verification)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          {processingStatus === 'error' && (
            <Alert variant="danger">
              <Alert.Heading>Processing Error</Alert.Heading>
              <p>There was an error processing the timesheets. Please try again.</p>
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          {processingStatus === 'idle' && (
            <>
              <Button variant="secondary" onClick={handleCloseScanModal}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleUploadTimesheets}
                disabled={scanFiles.length === 0}
              >
                Process Timesheets
              </Button>
            </>
          )}
          
          {processingStatus === 'processing' && (
            <Button variant="secondary" onClick={handleCloseScanModal}>
              Cancel
            </Button>
          )}
          
          {(processingStatus === 'completed' || processingStatus === 'error') && (
            <Button variant="primary" onClick={handleCloseScanModal}>
              Close
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      
      {/* Manual Entry Modal */}
      <Modal show={showManualEntryModal} onHide={() => {}} backdrop="static" keyboard={false} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Manual Data Entry Required</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {manualEntryData && (
            <div>
              <p>Some timesheet data could not be read automatically. Please enter the missing information:</p>
              
              {manualEntryData.map((entry, index) => (
                <Card key={index} className="mb-3">
                  <Card.Header>
                    <strong>{entry.staffName}</strong> - {new Date(entry.date).toLocaleDateString()}
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Start Time</Form.Label>
                          <Form.Control
                            type="time"
                            value={entry.startTime || ''}
                            onChange={(e) => {
                              const updated = [...manualEntryData];
                              updated[index].startTime = e.target.value;
                              setManualEntryData(updated);
                            }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>End Time</Form.Label>
                          <Form.Control
                            type="time"
                            value={entry.endTime || ''}
                            onChange={(e) => {
                              const updated = [...manualEntryData];
                              updated[index].endTime = e.target.value;
                              setManualEntryData(updated);
                            }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Break Duration (minutes)</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        value={entry.breakDuration || ''}
                        onChange={(e) => {
                          const updated = [...manualEntryData];
                          updated[index].breakDuration = e.target.value;
                          setManualEntryData(updated);
                        }}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        label="No hours worked (mark as 0 hours)"
                        checked={entry.noHoursWorked || false}
                        onChange={(e) => {
                          const updated = [...manualEntryData];
                          updated[index].noHoursWorked = e.target.checked;
                          setManualEntryData(updated);
                        }}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowManualEntryModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleManualEntry(manualEntryData)}>
            Submit Manual Entries
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* New Manual Timesheet Entry Modal */}
      <Modal show={showNewManualEntryModal} onHide={() => {}} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Add Manual Timesheet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label><strong>Date</strong></Form.Label>
              <Form.Control
                type="date"
                value={newManualEntry.date}
                onChange={(e) => setNewManualEntry({...newManualEntry, date: e.target.value})}
              />
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Clock In Time</strong></Form.Label>
                  <Form.Control
                    type="time"
                    value={newManualEntry.clockInTime}
                    onChange={(e) => setNewManualEntry({...newManualEntry, clockInTime: e.target.value})}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label><strong>Clock Out Time</strong></Form.Label>
                  <Form.Control
                    type="time"
                    value={newManualEntry.clockOutTime}
                    onChange={(e) => setNewManualEntry({...newManualEntry, clockOutTime: e.target.value})}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label><strong>Break Duration (minutes)</strong></Form.Label>
              <Form.Control
                type="number"
                min="0"
                value={newManualEntry.breakDuration}
                onChange={(e) => setNewManualEntry({...newManualEntry, breakDuration: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Notes (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newManualEntry.notes}
                onChange={(e) => setNewManualEntry({...newManualEntry, notes: e.target.value})}
                placeholder="Add any additional information about this timesheet entry"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNewManualEntryModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitManualEntry}>
            Submit Timesheet
          </Button>
        </Modal.Footer>
      </Modal>
      
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Staff Name</th>
            <th>Date</th>
            <th>Client</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Duration</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {timesheets.length > 0 ? (
            timesheets.map(timesheet => (
              <tr key={timesheet._id}>
                <td>
                  Andrew Barber
                </td>
                <td>
                  {new Date(timesheet.date).toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}
                  {isTimesheetLocked(timesheet) && (
                    <span className="ms-2" title="Locked - Cannot be edited after Monday 10 AM">
                      🔒
                    </span>
                  )}
                </td>
                <td>{timesheet.client && timesheet.client.name ? timesheet.client.name : (timesheet.booking && timesheet.booking.title ? timesheet.booking.title : 'N/A')}</td>
                <td>{timesheet.clockIn ? new Date(timesheet.clockIn).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}) : 'N/A'}</td>
                <td>{timesheet.clockOut ? new Date(timesheet.clockOut).toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true}) : 'N/A'}</td>
                <td>{timesheet.duration ? formatDuration(timesheet.duration) : 'N/A'}</td>
                <td>
                  <span className={`badge bg-${timesheet.status === 'completed' ? 'success' : 
                    timesheet.status === 'in-progress' ? 'warning' : 'danger'}`}>
                    {timesheet.status}
                  </span>
                </td>
                <td>
                  <div className="d-flex">
                    {isTimesheetEditable(timesheet) && (
                      <Button 
                        size="sm" 
                        variant="outline-primary" 
                        onClick={() => openEditModal(timesheet)}
                        className="me-2"
                      >
                        Edit Times
                      </Button>
                    )}
                    {canDeleteTimesheet(timesheet) && (
                      <Button 
                        size="sm" 
                        variant="outline-danger" 
                        onClick={() => handleDeleteTimesheet(timesheet._id)}
                        className="me-2"
                        title={user && (user.role === 'manager' || user.role === 'superuser' || user.role === 'admin') ? 
                          'Delete timesheet (Manager)' : 
                          'Delete timesheet (Available until Monday 10 AM)'}
                      >
                        Delete
                      </Button>
                    )}
                    {timesheet.status === 'pending' && (
                      <Button 
                        variant="success" 
                        size="sm" 
                        onClick={() => handleSubmitTimesheet(timesheet._id)}
                      >
                        Submit
                      </Button>
                    )}
                    {timesheet.status === 'submitted' && (
                      <>
                        <span className="badge bg-warning text-dark me-2">Pending Approval</span>
                        {(user.role === 'manager' || user.role === 'admin' || user.role === 'client') && (
                          <>
                            <Button 
                              variant="success" 
                              size="sm" 
                              className="me-1"
                              onClick={() => handleApproveTimesheet(timesheet._id)}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleRejectTimesheet(timesheet._id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {timesheet.status === 'pending_manager_approval' && (
                      <>
                        <span className="badge bg-info text-dark me-2">Pending Manager Approval</span>
                        {(user.role === 'manager' || user.role === 'admin' || user.role === 'superuser') && (
                          <Button 
                            variant="success" 
                            size="sm" 
                            onClick={() => handleManagerApproval(timesheet._id)}
                            title="Final approval for client-edited timesheet"
                          >
                            Final Approve
                          </Button>
                        )}
                      </>
                    )}
                    {timesheet.status === 'approved' && (
                      <span className="badge bg-success">Approved</span>
                    )}
                    {timesheet.status === 'rejected' && (
                      <span className="badge bg-danger">Rejected</span>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center">No timesheets found for the selected date range</td>
            </tr>
          )}
        </tbody>
      </Table>
      
      {user && (user.role === 'manager' || user.role === 'superuser') ? (
        <div className="mt-4">
          <h4>Weekly Summary</h4>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Total Hours</th>
                <th>Completed Shifts</th>
                <th>Pending Approval</th>
              </tr>
            </thead>
            <tbody>
              {/* This would be populated with aggregated data in a real application */}
              <tr>
                <td colSpan="4" className="text-center">Weekly summary data would be displayed here</td>
              </tr>
            </tbody>
          </Table>
        </div>
      ) : null}
      
      {/* Timesheet Edit Modal */}
      <Modal show={showEditModal} onHide={() => {}} backdrop="static" keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Timesheet</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingTimesheet && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label><strong>Date</strong> (click to edit)</Form.Label>
                <Form.Control
                  type="date"
                  name="date"
                  value={editFormData.date}
                  onChange={handleEditFormChange}
                  required
                />
                <Form.Text className="text-muted">
                  Select the date of the shift
                </Form.Text>
              </Form.Group>
              
              {editingTimesheet.booking && editingTimesheet.booking.title && (
                <Form.Group className="mb-3">
                  <Form.Label>Booking</Form.Label>
                  <Form.Control
                    type="text"
                    value={editingTimesheet.booking.title}
                    disabled
                  />
                </Form.Group>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label><strong>Clock In Time</strong> (click to edit)</Form.Label>
                <Form.Control
                  type="time"
                  name="clockIn"
                  value={editFormData.clockIn}
                  onChange={handleEditFormChange}
                  required
                />
                <Form.Text className="text-muted">
                  Enter the time you started work (24-hour format)
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label><strong>Clock Out Time</strong> (click to edit)</Form.Label>
                <Form.Control
                  type="time"
                  name="clockOut"
                  value={editFormData.clockOut}
                  onChange={handleEditFormChange}
                  required
                />
                <Form.Text className="text-muted">
                  Enter the time you finished work (24-hour format)
                </Form.Text>
              </Form.Group>
              
              {/* Manager/Admin additional fields */}
              {user && (user.role === 'manager' || user.role === 'admin' || user.role === 'superuser') && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Break Duration (minutes)</strong></Form.Label>
                    <Form.Control
                      type="number"
                      name="breakDuration"
                      value={editFormData.breakDuration || ''}
                      onChange={handleEditFormChange}
                      min="0"
                      step="1"
                    />
                    <Form.Text className="text-muted">
                      Total break time in minutes
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Total Hours</strong></Form.Label>
                    <Form.Control
                      type="number"
                      name="totalHours"
                      value={editFormData.totalHours || ''}
                      onChange={handleEditFormChange}
                      min="0"
                      step="0.25"
                    />
                    <Form.Text className="text-muted">
                      Override calculated hours if needed
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label><strong>Status</strong></Form.Label>
                    <Form.Select
                      name="status"
                      value={editFormData.status || ''}
                      onChange={handleEditFormChange}
                    >
                      <option value="pending">Pending</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Check
                      type="checkbox"
                      name="needsReview"
                      label="Needs Review"
                      checked={editFormData.needsReview || false}
                      onChange={handleEditFormChange}
                    />
                  </Form.Group>
                </>
              )}
              
              <Form.Group className="mb-3">
                <Form.Label><strong>Notes</strong></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={editFormData.notes || ''}
                  onChange={handleEditFormChange}
                  placeholder="Add notes about this timesheet..."
                />
              </Form.Group>
              
              {/* Edit reason for audit trail */}
              <Form.Group className="mb-3">
                <Form.Label><strong>Reason for Edit</strong> (Required)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="editReason"
                  value={editFormData.editReason || ''}
                  onChange={handleEditFormChange}
                  placeholder="Explain why this timesheet is being edited..."
                  required
                />
                <Form.Text className="text-muted">
                  This will be recorded in the audit trail
                </Form.Text>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveTimesheetEdit} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Client Approval Modal */}
      <Modal show={showClientApprovalModal} onHide={() => setShowClientApprovalModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Approve Timesheet (with optional edits)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Clock In Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="clockIn"
                    value={clientApprovalData.clockIn}
                    onChange={handleClientApprovalChange}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Clock Out Time</Form.Label>
                  <Form.Control
                    type="datetime-local"
                    name="clockOut"
                    value={clientApprovalData.clockOut}
                    onChange={handleClientApprovalChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="notes"
                value={clientApprovalData.notes}
                onChange={handleClientApprovalChange}
                placeholder="Add any notes about this timesheet..."
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Reason for Edit (if making changes)</Form.Label>
              <Form.Control
                type="text"
                name="editReason"
                value={clientApprovalData.editReason}
                onChange={handleClientApprovalChange}
                placeholder="Explain why you're making changes to this timesheet..."
              />
            </Form.Group>
            <div className="alert alert-info">
              <strong>Note:</strong> If you make any changes to the times or notes, this timesheet will require final approval from management.
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowClientApprovalModal(false)}>
            Cancel
          </Button>
          <Button variant="success" onClick={handleClientApprovalSubmit}>
            Approve Timesheet
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Payroll Report Modal */}
      <Modal show={showPayrollModal} onHide={handleClosePayrollModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Payroll Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {payrollLoading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Generating payroll report...</p>
            </div>
          ) : payrollError ? (
            <Alert variant="danger">{payrollError}</Alert>
          ) : payrollReport ? (
            <div>
              <div className="mb-3">
                <p><strong>Report Period:</strong> {payrollDateRange.startDate} to {payrollDateRange.endDate}</p>
                <p><strong>Total Staff:</strong> {payrollReport.length}</p>
              </div>
              <Table striped bordered hover responsive>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Total Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollReport.length > 0 ? payrollReport.map((employee, index) => (
                    <tr key={index}>
                      <td>{employee.staffName}</td>
                      <td>{employee.totalHours?.toFixed(2) || '0.00'}</td>
                      <td>
                        {employee.totalHours === 0 ? (
                          <span className="badge bg-secondary">No Hours</span>
                        ) : employee.hasErrors ? (
                          <span className="badge bg-warning">Needs Review</span>
                        ) : (
                          <span className="badge bg-success">Ready</span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="text-center text-muted">
                        No staff members found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          ) : (
            <p>No payroll data available for the selected period.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePayrollModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Timesheets;