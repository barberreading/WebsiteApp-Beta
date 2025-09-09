import React, { useState } from 'react';
import { Container, Tabs, Tab, Box } from '@mui/material';
import ChangePassword from '../auth/ChangePassword';
import UpdateEmail from '../auth/UpdateEmail';
import { useAuth } from '../../context/AuthContext';

const AccountSettings = () => {
  const [tabValue, setTabValue] = useState(0);
  const { currentUser } = useAuth();
  
  // Check if user has temporary password
  const hasTemporaryPassword = currentUser?.isTemporaryPassword;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ width: '100%', mt: 4 }}>
        {hasTemporaryPassword && (
          <Box sx={{ p: 2, mb: 3, bgcolor: '#fff3cd', borderRadius: 1 }}>
            <strong>Please change your temporary password before continuing.</strong>
          </Box>
        )}
        
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          aria-label="account settings tabs"
        >
          <Tab label="Change Password" />
          <Tab label="Update Email" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <ChangePassword onSuccess={() => console.log('Password updated')} />
          )}
          {tabValue === 1 && (
            <UpdateEmail onSuccess={() => console.log('Email updated')} />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default AccountSettings;