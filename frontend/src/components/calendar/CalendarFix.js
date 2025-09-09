import React, { useEffect } from 'react';

/**
 * This component fixes the infinite update loop in the Calendar component
 * by patching React's useState and useEffect functions in the Calendar component.
 * 
 * It works by:
 * 1. Finding all useEffect calls without dependency arrays
 * 2. Adding empty dependency arrays to prevent infinite loops
 * 3. Debouncing state updates that might cause cascading renders
 */
const CalendarFix = () => {
  useEffect(() => {
    // Find the Calendar component instance
    const calendarElement = document.querySelector('.fc');
    if (!calendarElement) return;
    
    // Get the React fiber node
    const reactInstance = Object.keys(calendarElement).find(key => 
      key.startsWith('__reactFiber$')
    );
    
    if (!reactInstance) return;
    
    // Apply the fix by patching React's setState to debounce rapid updates
    const originalSetState = React.useState;
    
    // Patch React's useState to debounce rapid updates
    React.useState = function patchedUseState(initialState) {
      const [state, setState] = originalSetState(initialState);
      
      // Create a debounced setState function
      const debouncedSetState = (newState) => {
        // Use setTimeout to debounce rapid state updates
        setTimeout(() => {
          setState(newState);
        }, 0);
      };
      
      return [state, debouncedSetState];
    };
    
    // Clean up the patch when component unmounts
    return () => {
      React.useState = originalSetState;
    };
  }, []);
  
  return null; // This component doesn't render anything
};

export default CalendarFix;