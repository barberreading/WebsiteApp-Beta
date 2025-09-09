import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
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
      const res = await axios.get('/user-templates', {
        headers: { 'x-auth-token': token }
      });
      setTemplates(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.msg || 'Error loading templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create template
  const createTemplate = async (templateData) => {
    try {
      const res = await axios.post('/user-templates', templateData, {
        headers: { 'x-auth-token': token }
      });
      setTemplates([res.data, ...templates]);
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.msg || 'Error creating template');
      console.error('Error creating template:', err);
      return { success: false, error: err.response?.data?.msg || 'Error creating template' };
    }
  };

  // Update template
  const updateTemplate = async (id, templateData) => {
    try {
      const res = await axios.put(`/user-templates/${id}`, templateData, {
        headers: { 'x-auth-token': token }
      });
      setTemplates(templates.map(template => 
        template._id === id ? res.data : template
      ));
      return { success: true, data: res.data };
    } catch (err) {
      setError(err.response?.data?.msg || 'Error updating template');
      console.error('Error updating template:', err);
      return { success: false, error: err.response?.data?.msg || 'Error updating template' };
    }
  };

  // Delete template
  const deleteTemplate = async (id) => {
    try {
      await axios.delete(`/user-templates/${id}`, {
        headers: { 'x-auth-token': token }
      });
      setTemplates(templates.filter(template => template._id !== id));
      return { success: true };
    } catch (err) {
      setError(err.response?.data?.msg || 'Error deleting template');
      console.error('Error deleting template:', err);
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