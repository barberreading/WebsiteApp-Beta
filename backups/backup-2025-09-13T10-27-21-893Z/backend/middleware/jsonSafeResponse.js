/**
 * Middleware to prevent circular JSON errors by intercepting responses
 * and converting Mongoose documents to plain objects
 */

const jsonSafeResponse = (req, res, next) => {
  // Store the original res.json function
  const originalJson = res.json;
  
  // Override the res.json function
  res.json = function(data) {
    // Function to safely convert objects with potential circular references
    const safelyStringify = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => safelyStringify(item));
      }
      
      // Handle Mongoose documents (they have a toObject method)
      if (obj.toObject && typeof obj.toObject === 'function') {
        return obj.toObject();
      }
      
      // Handle plain objects
      const result = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = safelyStringify(obj[key]);
        }
      }
      return result;
    };
    
    // Convert the data to a safe format
    const safeData = safelyStringify(data);
    
    // Call the original json method with the safe data
    return originalJson.call(this, safeData);
  };
  
  next();
};

module.exports = jsonSafeResponse;