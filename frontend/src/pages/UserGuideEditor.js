import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../context/AuthContext';

const UserGuideEditor = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is superuser
  useEffect(() => {
    if (user && user.role !== 'superuser') {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch user guide content
  useEffect(() => {
    const fetchUserGuide = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/user-guide');
        setContent(res.data.content);
        setError('');
      } catch (err) {
        setError('Failed to load user guide content');
        logger.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserGuide();
  }, []);

  // Save user guide content
  const handleSave = async () => {
    try {
      setSaving(true);
      await axiosInstance.put('/user-guide', { content });
      setSuccess('User guide updated successfully');
      setError('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Failed to update user guide');
      logger.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Preview user guide
  const handlePreview = () => {
    window.open('/user_guide.html', '_blank');
  };

  if (loading) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" />
        <p>Loading user guide content...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">User Guide Editor</h4>
              <small>Edit the HTML content of the user guide</small>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              <Form>
                <Form.Group>
                  <Form.Label>HTML Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={20}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{ fontFamily: 'monospace' }}
                  />
                  <Form.Text className="text-muted">
                    Edit the HTML content directly. Be careful to maintain proper HTML structure.
                  </Form.Text>
                </Form.Group>
                
                <div className="mt-3 d-flex justify-content-between">
                  <Button 
                    variant="primary" 
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                        />
                        {' '}Saving...
                      </>
                    ) : 'Save Changes'}
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={handlePreview}
                  >
                    Preview User Guide
                  </Button>
                </div>
              </Form>
            </Card.Body>
            <Card.Footer>
              <small className="text-muted">
                <strong>Note:</strong> Changes will be immediately visible to all users. A backup of the previous version is automatically created.
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserGuideEditor;