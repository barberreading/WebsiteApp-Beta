import React from 'react';
import { Button, Card, Form, Alert, Badge } from 'react-bootstrap';
import { useBranding } from '../../context/BrandingContext';

// Modern styled button with branding colors
export const ModernButton = ({ variant = 'primary', children, ...props }) => {
  const { branding } = useBranding();
  
  return (
    <Button 
      variant={variant} 
      className={`modern-button modern-button-${variant}`} 
      {...props}
    >
      {children}
    </Button>
  );
};

// Modern styled card with branding colors
export const ModernCard = ({ children, className = '', ...props }) => {
  return (
    <Card className={`modern-card ${className}`} {...props}>
      {children}
    </Card>
  );
};

// Add Card.Body component to ModernCard
ModernCard.Body = Card.Body;

// Modern styled form controls
export const ModernFormControl = ({ className = '', ...props }) => {
  return (
    <Form.Control className={`modern-form-control ${className}`} {...props} />
  );
};

// Modern styled form group
export const ModernFormGroup = ({ className = '', children, ...props }) => {
  return (
    <Form.Group className={`modern-form-group ${className}`} {...props}>
      {children}
    </Form.Group>
  );
};

// Modern styled alert
export const ModernAlert = ({ variant = 'primary', className = '', children, ...props }) => {
  return (
    <Alert variant={variant} className={`modern-alert modern-alert-${variant} ${className}`} {...props}>
      {children}
    </Alert>
  );
};

// Modern styled badge
export const ModernBadge = ({ variant = 'primary', className = '', children, ...props }) => {
  return (
    <Badge bg={variant} className={`modern-badge modern-badge-${variant} ${className}`} {...props}>
      {children}
    </Badge>
  );
};

// Modern styled section header
export const SectionHeader = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`modern-section-header ${className}`}>
      <h2 className="modern-section-title">{title}</h2>
      {subtitle && <p className="modern-section-subtitle">{subtitle}</p>}
    </div>
  );
};

// Modern styled page header with optional actions
export const PageHeader = ({ title, subtitle, actions, className = '' }) => {
  return (
    <div className={`modern-page-header d-flex justify-content-between align-items-center mb-4 ${className}`}>
      <div>
        <h1 className="modern-page-title">{title}</h1>
        {subtitle && <p className="modern-page-subtitle text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="modern-page-actions">{actions}</div>}
    </div>
  );
};

// Modern styled data table wrapper
export const DataTableWrapper = ({ children, className = '' }) => {
  return (
    <div className={`modern-data-table-wrapper ${className}`}>
      {children}
    </div>
  );
};

export default {
  ModernButton,
  ModernCard,
  ModernFormControl,
  ModernFormGroup,
  ModernAlert,
  ModernBadge,
  SectionHeader,
  PageHeader,
  DataTableWrapper
};