import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { 
  Container, Row, Col, Table, Button, Modal, Form, 
  Spinner, Tabs, Tab, Badge, Alert, Card, Pagination
} from 'react-bootstrap';
import { format } from 'date-fns';

const ErrorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedError, setSelectedError] = useState(null);
  const [resolution, setResolution] = useState('');
  const [resolutionDialogOpen, setResolutionDialogOpen] = useState(false);
  const [resolvingError, setResolvingError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchErrors();
  }, [page, tabValue]);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      const resolved = tabValue === 1 ? true : tabValue === 2 ? false : null;
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        ...(resolved !== null && { resolved })
      });
      
      const response = await axiosInstance.get(`/errors?${queryParams}`);
      setErrors(response.data.logs);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
      setErrorMessage('Failed to load error logs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (key) => {
    setTabValue(parseInt(key));
    setPage(1); // Reset to first page when changing tabs
  };

  const handleViewDetails = (error) => {
    setSelectedError(error);
  };

  const handleCloseDetails = () => {
    setSelectedError(null);
  };

  const handleOpenResolutionDialog = (error) => {
    setSelectedError(error);
    setResolution('');
    setResolutionDialogOpen(true);
  };

  const handleCloseResolutionDialog = () => {
    setResolutionDialogOpen(false);
  };

  const handleResolveError = async () => {
    if (!resolution.trim()) {
      return;
    }

    try {
      setResolvingError(true);
      await axiosInstance.put(`/errors/${selectedError._id}/resolve`, { resolution });
      setResolutionDialogOpen(false);
      fetchErrors(); // Refresh the list
    } catch (error) {
      console.error('Failed to resolve error:', error);
      setErrorMessage('Failed to resolve error. Please try again.');
    } finally {
      setResolvingError(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <Container className="mt-4 mb-4">
      <h2 className="mb-3">Error Logs Dashboard</h2>

      <Tabs
        activeKey={tabValue}
        onSelect={handleTabChange}
        className="mb-3"
      >
        <Tab eventKey={0} title="All Errors" />
        <Tab eventKey={1} title="Resolved" />
        <Tab eventKey={2} title="Unresolved" />
      </Tabs>

      {errorMessage && (
        <Alert variant="danger" className="mb-3">
          {errorMessage}
        </Alert>
      )}

      {loading ? (
        <div className="d-flex justify-content-center my-4">
          <Spinner animation="border" />
        </div>
      ) : errors.length === 0 ? (
        <Card className="p-4 text-center">
          <Card.Body>
            <h5>No error logs found</h5>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Table responsive striped bordered hover>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Error Message</th>
                <th>User</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((error) => (
                <tr key={error._id}>
                  <td>
                    {format(new Date(error.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                  <td>
                    {error.message.length > 50 
                      ? `${error.message.substring(0, 50)}...` 
                      : error.message}
                  </td>
                  <td>
                    {error.userId ? `${error.userId} (${error.userRole})` : 'Anonymous'}
                  </td>
                  <td>
                    <Badge bg={error.resolved ? 'primary' : 'warning'}>
                      {error.resolved ? 'Resolved' : 'Unresolved'}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      size="sm" 
                      variant="primary" 
                      onClick={() => handleViewDetails(error)}
                      className="me-2"
                    >
                      Details
                    </Button>
                    {!error.resolved && (
                      <Button 
                        size="sm" 
                        variant="warning" 
                        onClick={() => handleOpenResolutionDialog(error)}
                      >
                        Resolve
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="d-flex justify-content-center mt-3">
            <Pagination>
              <Pagination.Prev 
                disabled={page === 1} 
                onClick={() => handlePageChange(page - 1)}
              />
              
              {[...Array(totalPages).keys()].map(num => (
                <Pagination.Item 
                  key={num + 1} 
                  active={num + 1 === page}
                  onClick={() => handlePageChange(num + 1)}
                >
                  {num + 1}
                </Pagination.Item>
              ))}
              
              <Pagination.Next 
                disabled={page === totalPages} 
                onClick={() => handlePageChange(page + 1)}
              />
            </Pagination>
          </div>
        </>
      )}

      {/* Details Modal */}
      <Modal show={selectedError !== null} onHide={handleCloseDetails} size="lg">
        {selectedError && (
          <>
            <Modal.Header closeButton>
              <Modal.Title>Error Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Row className="mb-3">
                <Col sm={3} className="fw-bold">Timestamp:</Col>
                <Col>{format(new Date(selectedError.timestamp), 'yyyy-MM-dd HH:mm:ss')}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3} className="fw-bold">Error Message:</Col>
                <Col>{selectedError.message}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3} className="fw-bold">Stack Trace:</Col>
                <Col>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                    {selectedError.stack}
                  </pre>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3} className="fw-bold">User:</Col>
                <Col>{selectedError.userId ? `${selectedError.userId} (${selectedError.userRole})` : 'Anonymous'}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3} className="fw-bold">URL:</Col>
                <Col>{selectedError.url || 'N/A'}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3} className="fw-bold">Method:</Col>
                <Col>{selectedError.method || 'N/A'}</Col>
              </Row>
              <Row className="mb-3">
                <Col sm={3} className="fw-bold">Status:</Col>
                <Col>
                  <Badge bg={selectedError.resolved ? 'primary' : 'warning'}>
                    {selectedError.resolved ? 'Resolved' : 'Unresolved'}
                  </Badge>
                </Col>
              </Row>
              {selectedError.resolved && (
                <>
                  <Row className="mb-3">
                    <Col sm={3} className="fw-bold">Resolution:</Col>
                    <Col>{selectedError.resolution}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col sm={3} className="fw-bold">Resolved At:</Col>
                    <Col>
                      {selectedError.resolvedAt 
                        ? format(new Date(selectedError.resolvedAt), 'yyyy-MM-dd HH:mm:ss')
                        : 'N/A'}
                    </Col>
                  </Row>
                </>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseDetails}>
                Close
              </Button>
              {!selectedError.resolved && (
                <Button variant="warning" onClick={() => handleOpenResolutionDialog(selectedError)}>
                  Resolve
                </Button>
              )}
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* Resolution Dialog */}
      <Modal show={resolutionDialogOpen} onHide={handleCloseResolutionDialog}>
        <Modal.Header closeButton>
          <Modal.Title>Resolve Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Resolution</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe how this error was resolved..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseResolutionDialog}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleResolveError}
            disabled={resolvingError || !resolution.trim()}
          >
            {resolvingError ? <Spinner animation="border" size="sm" /> : 'Resolve'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ErrorDashboard;