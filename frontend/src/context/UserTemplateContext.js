import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from './AuthContext';

const UserTemplateContext = createContext();

export const UserTemplateProvider = ({ children }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // Load templates
  const loadTemplates = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await axiosInstance.get('/user-templates');
      setTemplates(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error loading templates');
      logger.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create template
  const createTemplate = async (templateData) => {
    try {
      const res = await axiosInstance.post('/user-templates', templateData);
      setTemplates([res.data, ...templates]);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating template');
      logger.error('Error creating template:', err);
      return { success: false, error: err.response?.data?.msg || 'Error creating template' };
    }
  };

  // Update template
  const updateTemplate = async (id, templateData) => {
    try {
      const res = await axiosInstance.put(`/user-templates/${id}`, templateData);
      setTemplates(templates.map(template => 
        template._id === id ? res.data : template
      ));
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating template');
      logger.error('Error updating template:', err);
      return { success: false, error: err.response?.data?.msg || 'Error updating template' };
    }
  };

  // Delete template
  const deleteTemplate = async (id) => {
    try {
      await axiosInstance.delete(`/user-templates/${id}`);
      setTemplates(templates.filter(template => template._id !== id));
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting template');
      logger.error('Error deleting template:', err);
      return { success: false, error: err.response?.data?.msg || 'Error deleting template' };
    }
  };

  // Load templates when token changes
  useEffect(() => {
    if (token) {
      loadTemplates();
    }
  }, [token]);

  return (
    <UserTemplateContext.Provider
      value={{
        templates,
        loading,
        error,
        loadTemplates,
        createTemplate,
        updateTemplate,
        deleteTemplate
      }}
    >
      {children}
    </UserTemplateContext.Provider>
  );
};

export const useUserTemplates = () => useContext(UserTemplateContext);

export default UserTemplateContext;