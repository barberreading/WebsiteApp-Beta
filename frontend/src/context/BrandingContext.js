import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const BrandingContext = createContext();

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }) => {
  const [branding, setBranding] = useState({
    companyName: 'Everything Childcare Agency',
    logo: '',
    primaryColor: '#FF40B4', // Bright pink from logo
    secondaryColor: '#00E1E1', // Cyan/turquoise from logo
    accentColor: '#6A2C94', // Purple from text
    emailHeader: 'Everything Childcare Agency - Your Agency',
    emailFooter: '',
    emailSignature: '',
    favicon: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Create MUI theme based on branding colors
  const theme = createTheme({
    palette: {
      primary: {
        main: branding.primaryColor,
      },
      secondary: {
        main: branding.secondaryColor,
      },
      accent: {
        main: branding.accentColor,
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontWeight: 500,
        color: branding.accentColor,
      },
      h2: {
        fontWeight: 500,
        color: branding.accentColor,
      },
      h3: {
        fontWeight: 500,
        color: branding.accentColor,
      },
      h4: {
        fontWeight: 500,
        color: branding.accentColor,
      },
      h5: {
        fontWeight: 500,
        color: branding.accentColor,
      },
      h6: {
        fontWeight: 500,
        color: branding.accentColor,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: branding.primaryColor,
              opacity: 0.9,
            },
          },
          containedSecondary: {
            '&:hover': {
              backgroundColor: branding.secondaryColor,
              opacity: 0.9,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#ffffff',
            color: branding.accentColor,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          },
        },
      },
    },
  });

  // Load branding from API
  const loadBranding = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/branding');
      
      // Merge with defaults for any missing values
      setBranding(prev => ({
        ...prev,
        ...res.data
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error loading branding:', err);
      setError('Failed to load branding configuration');
    } finally {
      setLoading(false);
    }
  };

  // Update branding
  const updateBranding = async (brandingData) => {
    try {
      const res = await axiosInstance.put('/branding', brandingData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      setBranding(prev => ({
        ...prev,
        ...res.data
      }));
      
      return { success: true, data: res.data };
    } catch (err) {
      console.error('Error updating branding:', err);
      setError('Failed to update branding configuration');
      return { success: false, error: err.response?.data?.msg || 'Error updating branding' };
    }
  };

  // Load branding on component mount
  useEffect(() => {
    loadBranding();
  }, []);

  return (
    <BrandingContext.Provider
      value={{
        branding,
        loading,
        error,
        loadBranding,
        updateBranding,
        theme
      }}
    >
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </BrandingContext.Provider>
  );
};

export default BrandingContext;