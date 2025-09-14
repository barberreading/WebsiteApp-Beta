import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Tabs, Tab, Table, Badge } from 'react-bootstrap';
import { FaDownload, FaUpload, FaCheck, FaTimes } from 'react-icons/fa';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';

const BulkImport = () => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [importType, setImportType] = useState('clients');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const downloadTemplate = async () => {
    try {
      const response = await axiosInstance.get(`/bulk-import/templates/${importType}`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${importType}_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download template. Please try again.');
      logger.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a CSV file to upload');
      return;
    }
    
    if (file.type !== 'text/csv') {
      setError('Only CSV files are allowed');
      return;
    }
    
    setLoading(true);
    setError(null);
    setResults(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axiosInstance.post(`/bulk-import/${importType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during import');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <h1>Bulk Import</h1>
      <p>Import multiple clients or users at once using CSV files.</p>
      
      <Card className="mb-4">
        <Card.Body>
          <Tabs
            activeKey={importType}
            onSelect={(k) => {
              setImportType(k);
              setFile(null);
              setResults(null);
              setError(null);
            }}
            className="mb-3"
          >
            <Tab eventKey="clients" title="Clients">
              <p>Import multiple clients at once using a CSV file.</p>
            </Tab>
            {currentUser.role === 'superuser' && (
              <Tab eventKey="users" title="Users">
                <p>Import multiple users at once using a CSV file.</p>
              </Tab>
            )}
          </Tabs>
          
          <Row className="mb-3">
            <Col md={6}>
              <h5>Step 1: Download Template</h5>
              <p>Download our CSV template with the correct headers.</p>
              <Button 
                variant="outline-primary" 
                onClick={downloadTemplate}
                className="d-flex align-items-center"
              >
                <FaDownload className="me-2" /> Download {importType === 'clients' ? 'Client' : 'User'} Template
              </Button>
            </Col>
            
            <Col md={6}>
              <h5>Step 2: Fill and Upload</h5>
              <p>Fill the template with your data and upload it.</p>
              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formFile" className="mb-3">
                  <Form.Label>Select CSV File</Form.Label>
                  <Form.Control 
                    type="file" 
                    accept=".csv" 
                    onChange={handleFileChange}
                  />
                  <Form.Text className="text-muted">
                    Only CSV files are accepted. Maximum size: 5MB.
                  </Form.Text>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={!file || loading}
                  className="d-flex align-items-center"
                >
                  {loading ? 'Processing...' : (
                    <>
                      <FaUpload className="me-2" /> Upload and Import
                    </>
                  )}
                </Button>
              </Form>
            </Col>
          </Row>
          
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
          
          {results && (
            <div className="mt-4">
              <h4>Import Results</h4>
              <Alert variant={results.errors.length > 0 ? "warning" : "success"}>
                {results.message}
              </Alert>
              
              {results.errors.length > 0 && (
                <>
                  <h5>Errors ({results.errors.length})</h5>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Row Data</th>
                        <th>Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.errors.map((error, index) => (
                        <tr key={index}>
                          <td>
                            <pre className="mb-0">{JSON.stringify(error.row, null, 2)}</pre>
                          </td>
                          <td>{error.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
              
              {results.results.length > 0 && (
                <>
                  <h5>Successfully Imported ({results.results.length})</h5>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        {importType === 'clients' ? (
                          <>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                          </>
                        ) : (
                          <>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {results.results.map((item, index) => (
                        <tr key={index}>
                          {importType === 'clients' ? (
                            <>
                              <td>{item.name}</td>
                              <td>{item.email}</td>
                              <td>{item.phone}</td>
                            </>
                          ) : (
                            <>
                              <td>{item.name}</td>
                              <td>{item.email}</td>
                              <td>
                                <Badge bg={
                                  item.role === 'superuser' ? 'danger' :
                                  item.role === 'manager' ? 'warning' : 'info'
                                }>
                                  {item.role}
                                </Badge>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
      
      <Card>
        <Card.Body>
          <h4>Instructions</h4>
          <h5>For Clients CSV:</h5>
          <ul>
            <li><strong>name</strong> (required): Full name of the client</li>
            <li><strong>email</strong> (required): Email address</li>
            <li><strong>phone</strong> (optional): Phone number</li>
            <li><strong>address</strong> (optional): Street address</li>
            <li><strong>city</strong> (optional): City</li>
            <li><strong>postcode</strong> (optional): Postal code</li>
            <li><strong>notes</strong> (optional): Additional notes</li>
          </ul>
          
          {currentUser.role === 'superuser' && (
            <>
              <h5>For Users CSV:</h5>
              <ul>
                <li><strong>name</strong> (required): Full name of the user</li>
                <li><strong>email</strong> (required): Email address</li>
                <li><strong>phone</strong> (optional): Phone number</li>
                <li><strong>role</strong> (required): Must be 'staff', 'manager', or 'superuser'</li>
                <li><strong>password</strong> (required): Initial password</li>
                <li><strong>notes</strong> (optional): Additional notes</li>
              </ul>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default BulkImport;