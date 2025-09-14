const { getBranding } = require('../../branding/branding.services');

/**
 * Get branding configuration for email templates
 * Returns default branding if database is unavailable
 */
const getBrandingForEmail = async () => {
  try {
    const branding = await getBranding();
    return branding || {};
  } catch (error) {
    logger.warn('Failed to fetch branding configuration for email:', error.message);
    // Return default branding if database is unavailable
    return {
      companyName: 'Everything Childcare Agency',
      primaryColor: '#007bff',
      logo: null
    };
  }
};

module.exports = { getBrandingForEmail };