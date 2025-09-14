import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import axiosInstance from '../utils/axiosInstance';

const ResolutionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    showing: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchResolutionHistory();
  }, []);

  const fetchResolutionHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/api/monitoring/resolution-history');
      
      if (response.data.success) {
        setHistory(response.data.data.history || []);
        setPagination({
          total: response.data.data.total || 0,
          showing: response.data.data.showing || 0,
          hasMore: response.data.data.hasMore || false
        });
      } else {
        setError('Failed to fetch resolution history');
      }
    } catch (err) {
      logger.error('Error fetching resolution history:', err);
      setError('Failed to load resolution history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      'critical': 'danger',
      'high': 'warning',
      'medium': 'info',
      'low': 'secondary'
    };
    return <Badge bg={variants[severity] || 'secondary'}>{severity}</Badge>;
  };

  const getStatusBadge = (resolved) => {
    return (
      <Badge bg={resolved ? 'success' : 'danger'}>
        {resolved ? 'Resolved' : 'Failed'}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading resolution history...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Error Resolution History</h2>
        <Button variant="outline-primary" onClick={fetchResolutionHistory}>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Resolution Records</h5>
            <small className="text-muted">
              Showing {pagination.showing} of {pagination.total} records
            </small>
          </div>
        </Card.Header>
        <Card.Body>
          {history.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted">No resolution history found.</p>
            </div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Issue Type</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => (
                  <tr key={index}>
                    <td>
                      <small>{formatTimestamp(record.timestamp)}</small>
                    </td>
                    <td>
                      <code>{record.type}</code>
                    </td>
                    <td>
                      {getSeverityBadge(record.severity)}
                    </td>
                    <td>
                      {getStatusBadge(record.resolved)}
                    </td>
                    <td>
                      <small className="text-muted">
                        {record.details ? (
                          typeof record.details === 'string' 
                            ? record.details 
                            : JSON.stringify(record.details, null, 2)
                        ) : 'No details available'}
                      </small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {pagination.hasMore && (
        <div className="text-center mt-3">
          <Button variant="outline-secondary">
            Load More
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ResolutionHistory;