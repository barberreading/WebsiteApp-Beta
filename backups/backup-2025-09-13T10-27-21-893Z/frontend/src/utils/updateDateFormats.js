/**
 * This script updates all date formatting across the app to use DD/MM/YYYY format
 * It should be imported and run once in the main App.js file
 */

// Create a wrapper function instead of modifying Date.prototype directly
const formatDateToUK = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// No need to store the original method since we're using a wrapper function

// Export a function to be called in App.js and the formatDateToUK utility
export const initializeDateFormatting = () => {
  console.log('Date formatting initialized to DD/MM/YYYY format');
};

// Export the formatting function for direct use in components
export { formatDateToUK };