import React, { useState } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const PayrollReport = () => {
  return (
    <Container fluid>
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <Card.Title>Payroll Report</Card.Title>
            </Card.Header>
            <Card.Body>
              <p>Payroll report content will be displayed here.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PayrollReport;