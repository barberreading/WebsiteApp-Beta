import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const PrivacyPolicy = () => {
  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow-sm">
            <Card.Body className="p-4 p-md-5">
              <h1 className="mb-4">Privacy Policy</h1>
              
              <p className="lead">Last Updated: {new Date().toLocaleDateString('en-GB', {day: '2-digit', month: '2-digit', year: 'numeric'})}</p>
              
              <hr className="my-4" />
              
              <section className="mb-4">
                <h2>1. Introduction</h2>
                <p>
                  This Privacy Policy explains how the Staff Management App collects, uses, and protects your personal information. 
                  We are committed to ensuring that your privacy is protected and that we comply with applicable data protection laws.
                </p>
              </section>
              
              <section className="mb-4">
                <h2>2. Information We Collect</h2>
                <p>We may collect the following information:</p>
                <ul>
                  <li>Name and job title</li>
                  <li>Contact information including email address and phone number</li>
                  <li>Demographic information such as postcode, preferences, and interests</li>
                  <li>Professional information related to staff management</li>
                  <li>Location data for staff distance search functionality</li>
                  <li>Other information relevant to customer surveys and/or offers</li>
                </ul>
              </section>
              
              <section className="mb-4">
                <h2>3. How We Use Your Information</h2>
                <p>We use this information to:</p>
                <ul>
                  <li>Provide and improve our staff management services</li>
                  <li>Personalize your experience</li>
                  <li>Process bookings and manage staff assignments</li>
                  <li>Send periodic emails regarding your account or other products and services</li>
                  <li>Improve our website based on your feedback</li>
                </ul>
              </section>
              
              <section className="mb-4">
                <h2>4. Data Security</h2>
                <p>
                  We are committed to ensuring that your information is secure. We have implemented suitable physical, 
                  electronic, and managerial procedures to safeguard and secure the information we collect online.
                </p>
              </section>
              
              <section className="mb-4">
                <h2>5. Cookies</h2>
                <p>
                  Our website uses cookies to enhance your experience. You can choose to accept or decline cookies. 
                  Most web browsers automatically accept cookies, but you can usually modify your browser settings 
                  to decline cookies if you prefer.
                </p>
              </section>
              
              <section className="mb-4">
                <h2>6. Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                  <li>Access your personal data</li>
                  <li>Correct inaccurate personal data</li>
                  <li>Request deletion of your personal data</li>
                  <li>Object to processing of your personal data</li>
                  <li>Request restriction of processing your personal data</li>
                  <li>Request transfer of your personal data</li>
                  <li>Withdraw consent</li>
                </ul>
              </section>
              
              <section className="mb-4">
                <h2>7. Changes to This Privacy Policy</h2>
                <p>
                  We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
                  the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </section>
              
              <section className="mb-4">
                <h2>8. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at:
                  <br />
                  <strong>Email:</strong> privacy@staffmanagementapp.com
                  <br />
                  <strong>Phone:</strong> +44 123 456 7890
                </p>
              </section>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PrivacyPolicy;