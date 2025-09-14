const EmailTemplate = require('../../models/EmailTemplate');

/**
 * Get email template by type and replace variables
 * @param {String} type - Template type
 * @param {Object} variables - Variables to replace in template
 */
const getEmailTemplate = async (type, variables) => {
  try {
    // Get template from database
    const template = await EmailTemplate.findOne({ type });
    
    if (!template) {
      throw new Error(`Email template '${type}' not found`);
    }
    
    // Replace variables in subject and body
    let subject = template.subject;
    let body = template.body;
    
    // Replace variables in subject and body
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        body = body.replace(regex, value);
      }
    }
    
    return { subject, body };
  } catch (error) {
    logger.error(`Error getting email template '${type}':`, error);
    throw error;
  }
};

module.exports = { getEmailTemplate };