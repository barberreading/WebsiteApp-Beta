import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
  const { hasRole } = useAuth();
  const [reportType, setReportType] = useState('weekly');
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [includeNoClientBookings, setIncludeNoClientBookings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  const handleDateChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };
  
  const handleNoClientBookingsChange = (e) => {
    setIncludeNoClientBookings(e.target.checked);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    setReportData(null);
    try {
      const res = await axiosInstance.get(`/reports/${reportType}`, {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          includeNoClientBookings
        }
      });
      setReportData(res.data);
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    }
    setLoading(false);
  };

  const handleExportPDF = () => {
    if (!reportData || !reportData.data) {
      alert('No data to export');
      return;
    }

    const doc = new jsPDF();
    const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`;
    doc.text(title, 14, 16);

    let tableColumn = [];
    let tableRows = [];

    switch (reportType) {
      case 'weekly':
      case 'monthly':
        if (reportData.data.bookings) {
          tableColumn = ["Date", "Staff", "Client", "Duration (hours)"];
          reportData.data.bookings.forEach(booking => {
            const bookingData = [
              new Date(booking.date).toLocaleDateString(),
              booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'N/A',
              booking.client ? booking.client.name : 'N/A',
              booking.duration
            ];
            tableRows.push(bookingData);
          });
        }
        break;
      case 'staff':
        tableColumn = ["Staff", "Total Bookings", "Total Hours"];
        reportData.data.forEach(staff => {
          const staffData = [
            staff._id ? `${staff._id.firstName} ${staff._id.lastName}`: 'N/A',
            staff.totalBookings,
            staff.totalHours
          ];
          tableRows.push(staffData);
        });
        break;
      case 'client':
        tableColumn = ["Client", "Total Bookings", "Total Hours"];
        reportData.data.forEach(client => {
          const clientData = [
            client._id ? client._id.name : 'N/A',
            client.totalBookings,
            client.totalHours
          ];
          tableRows.push(clientData);
        });
        break;
      case 'financial':
        alert(reportData.data.message);
        return;
      default:
        alert('PDF export is not available for this report type.');
        return;
    }

    if (tableRows.length > 0) {
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 20
      });
      doc.save(`${reportType}_report.pdf`);
    } else if (reportType !== 'financial') {
      alert('No data to export for the selected report.');
    }
  };

  const renderReportPreview = () => {
    if (loading) {
      return (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }

    if (!reportData) {
      return (
        <p className="text-center text-muted">
          Select report type and date range, then click "Generate Report" to view the report preview here.
        </p>
      );
    }

    // Example of a simple report display
    return (
      <div>
        <h5>{reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h5>
        <pre>{JSON.stringify(reportData, null, 2)}</pre>
      </div>
    );
  };

  if (!hasRole(['manager', 'superuser'])) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          You do not have permission to view this page.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">Reports</h2>
      
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <h4>Generate Report</h4>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Report Type</Form.Label>
                  <Form.Select 
                    value={reportType} 
                    onChange={handleReportTypeChange}
                  >
                    <option value="weekly">Weekly Summary</option>
                    <option value="monthly">Monthly Summary</option>
                    <option value="staff">Staff Performance</option>
                    <option value="client">Client Bookings</option>
                    <option value="financial">Financial Summary</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Start Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleDateChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>End Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleDateChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="includeNoClientBookings"
                    label="Include bookings without clients (HR, staff sickness, etc.)"
                    checked={includeNoClientBookings}
                    onChange={handleNoClientBookingsChange}
                  />
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  className="w-100"
                  onClick={handleGenerateReport}
                  disabled={loading}
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Body>
              <h4>Saved Reports</h4>
              <p className="text-muted">No saved reports available</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Report Preview</h4>
                <div>
                  <Button variant="outline-secondary" size="sm" className="me-2" onClick={handleExportPDF} disabled={!reportData}>
                    <i className="fas fa-download"></i> Download PDF
                  </Button>
                  <Button variant="outline-secondary" size="sm">
                    <i className="fas fa-envelope"></i> Email Report
                  </Button>
                </div>
              </div>
              
              <div className="report-preview p-3 border rounded">
                {renderReportPreview()}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Reports;