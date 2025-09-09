import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const TermsOfService = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <h1 className="mb-4">Terms of Service</h1>
              
              <p className="lead">Last Updated: {new Date().toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}</p>
              
              <hr className="my-4" />
              
              <section className="mb-4">
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using the Staff Management App, you accept and agree to be bound by the terms and provisions of this agreement.</p>
              </section>
              
              <section className="mb-4">
                <h2>2. Description of Service</h2>
                <p>The Staff Management App provides tools for managing staff, bookings, and related business operations.</p>
              </section>
              
              <section className="mb-4">
                <h2>3. Contact Us</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us.
                </p>
              </section>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TermsOfService;