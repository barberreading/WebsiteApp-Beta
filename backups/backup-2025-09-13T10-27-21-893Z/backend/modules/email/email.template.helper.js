const wrapEmailContent = (content, title, branding = {}) => {
  const companyName = branding.companyName || 'Everything Childcare Agency';
  const primaryColor = branding.primaryColor || '#007bff';
  const logo = branding.logo;
  
  // Generate logo content
  const logoContent = logo ? 
    `<img src="${logo}" alt="${companyName} Logo" style="max-height: 60px; max-width: 200px; margin-bottom: 10px;">` :
    `<svg width="50" height="50" viewBox="0 0 50 50" style="margin-bottom: 10px;">
      <circle cx="25" cy="25" r="20" fill="${primaryColor}" stroke="#fff" stroke-width="2"/>
      <text x="25" y="30" text-anchor="middle" fill="white" font-size="16" font-weight="bold">${companyName.charAt(0)}</text>
    </svg>`;
  
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid ${primaryColor}; border-radius: 5px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd;">
          ${logoContent}
          <h1 style="color: #333; margin: 10px 0;">${title || companyName}</h1>
        </div>
        <div style="padding: 20px 0;">
          ${content}
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #777;">
          <p>This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
    </div>
  `;
};

module.exports = { wrapEmailContent };