import React, { Component } from 'react';
import { Button, Alert, Card, Container, Row, Col } from 'react-bootstrap';
import axiosInstance from '../../utils/axiosInstance';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      resetKey: 0,
      reportSent: false
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console
    logger.error("Error caught by ErrorBoundary:", error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log the error to the server
    this.logErrorToServer(error, errorInfo);
  }

  logErrorToServer = async (error, errorInfo) => {
    try {
      const errorData = {
        message: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      await axiosInstance.post('/errors/log', errorData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.setState({ reportSent: true });
    } catch (err) {
      logger.error("Failed to send error report:", err);
    }
  };

  resetApplication = () => {
    // Clear any cached state that might be causing the error
    sessionStorage.clear();
    
    // Reset the component's state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      resetKey: this.state.resetKey + 1,
      reportSent: false
    });

    // Reload the current page to reset the application state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <Container className="mt-5">
          <Card className="shadow-sm">
            <Card.Header as="h5" className="bg-danger text-white">
              Application Error
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <Alert variant="warning">
                    <h4>Something went wrong</h4>
                    <p>The application encountered an unexpected error. Our team has been notified and will work to fix this issue.</p>
                    {this.state.reportSent && (
                      <Alert variant="success">
                        Error report sent successfully. Thank you for your patience.
                      </Alert>
                    )}
                  </Alert>
                  <Button 
                    variant="primary" 
                    onClick={this.resetApplication}
                    className="me-2"
                  >
                    Reset Application
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => window.location.href = '/'}
                  >
                    Return to Home
                  </Button>
                </Col>
                <Col md={4} className="d-flex align-items-center justify-content-center">
                  <div className="text-center">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" 
                        stroke="#dc3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </Col>
              </Row>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4">
                  <h5>Error Details (Development Only):</h5>
                  <pre className="bg-light p-3 rounded" style={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error && this.state.error.toString()}
                    <br />
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;