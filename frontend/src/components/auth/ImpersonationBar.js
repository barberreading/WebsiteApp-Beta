import React, { useEffect } from 'react';
import { Button, Dropdown, Badge } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { FaUserSecret, FaUserAlt } from 'react-icons/fa';

const ImpersonationBar = () => {
  const { currentUser, impersonateUser, stopImpersonating, impersonating } = useAuth();
  
  const isVisible = currentUser?.role === 'superuser' || impersonating;
  
  // Add/remove bottom padding to body when ImpersonationBar is visible
  useEffect(() => {
    if (isVisible) {
      document.body.style.paddingBottom = '60px';
    } else {
      document.body.style.paddingBottom = '0';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.paddingBottom = '0';
    };
  }, [isVisible]);
  
  // Only show for superusers or when impersonating
  if (!isVisible) {
    return null;
  }

  const userRoles = [
    { role: 'admin', label: 'Admin' },
    { role: 'manager', label: 'Manager' },
    { role: 'staff', label: 'Staff' },
    { role: 'client', label: 'Client' }
  ];

  return (
    <div className="impersonation-bar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#f8d7da',
      padding: '10px',
      zIndex: 999,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
    }}>
      {impersonating ? (
        <>
          <Badge bg="danger" className="me-2">
            <FaUserSecret className="me-1" />
            Viewing as: {currentUser.role.toUpperCase()}
            {currentUser._testUser && ` (${currentUser.name})`}
          </Badge>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={stopImpersonating}
          >
            <FaUserAlt className="me-1" />
            Return to Superuser
          </Button>
        </>
      ) : (
        <>
          <span className="me-2">Superuser Tools:</span>
          <Dropdown>
            <Dropdown.Toggle variant="danger" size="sm">
              <FaUserSecret className="me-1" />
              View As
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {userRoles.map(({ role, label }) => (
                <Dropdown.Item 
                  key={role} 
                  onClick={async () => {
                    const result = await impersonateUser(role);
                    if (result.success && result.testUser) {
                      logger.log(`Switched to ${label} view as: ${result.testUser}`);
                    }
                  }}
                >
                  {label} {role === 'client' && '(Test Nursery)'} 
                  {role === 'staff' && '(Test Booker)'}
                  {role === 'manager' && '(Test Admin)'}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </>
      )}
    </div>
  );
};

export default ImpersonationBar;