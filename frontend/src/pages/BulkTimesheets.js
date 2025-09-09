import React from 'react';
import BulkTimesheetUpload from '../components/timesheets/BulkTimesheetUpload';
import { Container } from '@mui/material';

const BulkTimesheets = () => {
  return (
    <Container maxWidth="lg" className="page-container">
      <BulkTimesheetUpload />
    </Container>
  );
};

export default BulkTimesheets;