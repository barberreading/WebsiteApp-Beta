import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * A component that generates placeholder boxes with text
 * Used as a replacement for external placeholder image services
 */
const Placeholder = ({ 
  width = 600, 
  height = 400, 
  text = 'Placeholder', 
  backgroundColor = '#e0e0e0',
  textColor = '#555555'
}) => {
  return (
    <Box
      sx={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    >
      <Typography 
        variant="h5" 
        component="div" 
        sx={{ 
          color: textColor,
          fontWeight: 'bold',
          textAlign: 'center',
          padding: 2
        }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default Placeholder;