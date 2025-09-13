// Frontend input validation utilities
// These complement the backend validation middleware
import { useState } from 'react';

// Email validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation
export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Phone number validation
export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

// Name validation (no special characters except spaces, hyphens, apostrophes)
export const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s\-\']{2,50}$/;
  return nameRegex.test(name.trim());
};

// Date validation
export const validateDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj) && dateObj > new Date('1900-01-01');
};

// Time validation (HH:MM format)
export const validateTime = (time) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Duration validation (positive number)
export const validateDuration = (duration) => {
  const num = parseFloat(duration);
  return !isNaN(num) && num > 0 && num <= 24;
};

// Price validation (positive number with up to 2 decimal places)
export const validatePrice = (price) => {
  const priceRegex = /^\d+(\.\d{1,2})?$/;
  const num = parseFloat(price);
  return priceRegex.test(price) && num >= 0 && num <= 10000;
};

// Text sanitization (remove HTML tags and dangerous characters)
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, '') // Remove dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
};

// Form validation helper
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    // Required field validation
    if (fieldRules.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${field} is required`;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') return;
    
    // Type-specific validations
    if (fieldRules.type === 'email' && !validateEmail(value)) {
      errors[field] = 'Please enter a valid email address';
    } else if (fieldRules.type === 'password' && !validatePassword(value)) {
      errors[field] = 'Password must be at least 8 characters with uppercase, lowercase, and number';
    } else if (fieldRules.type === 'phone' && !validatePhone(value)) {
      errors[field] = 'Please enter a valid phone number';
    } else if (fieldRules.type === 'name' && !validateName(value)) {
      errors[field] = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    } else if (fieldRules.type === 'date' && !validateDate(value)) {
      errors[field] = 'Please enter a valid date';
    } else if (fieldRules.type === 'time' && !validateTime(value)) {
      errors[field] = 'Please enter a valid time (HH:MM)';
    } else if (fieldRules.type === 'duration' && !validateDuration(value)) {
      errors[field] = 'Duration must be a positive number (max 24 hours)';
    } else if (fieldRules.type === 'price' && !validatePrice(value)) {
      errors[field] = 'Please enter a valid price';
    }
    
    // Length validations
    if (fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${field} must be at least ${fieldRules.minLength} characters`;
    }
    if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${field} must be no more than ${fieldRules.maxLength} characters`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Real-time validation hook for React components
export const useFormValidation = (initialState, validationRules) => {
  const [values, setValues] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validateField = (name, value) => {
    const fieldRules = validationRules[name];
    if (!fieldRules) return '';
    
    const result = validateForm({ [name]: value }, { [name]: fieldRules });
    return result.errors[name] || '';
  };
  
  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };
  
  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  const validateAll = () => {
    const result = validateForm(values, validationRules);
    setErrors(result.errors);
    setTouched(Object.keys(validationRules).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
    return result.isValid;
  };
  
  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    isValid: Object.keys(errors).length === 0
  };
};

// Import React hooks if available
try {
  const { useState } = require('react');
} catch (e) {
  // React not available in this context
}