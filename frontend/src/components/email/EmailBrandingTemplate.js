import React from 'react';
import { useBranding } from '../../context/BrandingContext';

// This component provides standardized email header and footer templates
// with the company branding applied

export const getEmailHeader = (companyName = 'Everything Childcare Agency') => {
  return `
    <div style="background-color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; border-bottom: 3px solid #FF40B4; text-align: center;">
      <div style="margin-bottom: 10px;">
        <svg width="200" height="70" viewBox="0 0 200 70" xmlns="http://www.w3.org/2000/svg">
          <circle cx="35" cy="35" r="32" fill="#00E1E1" />
          <text x="35" y="42" font-family="Arial" font-size="22" font-weight="bold" fill="#FF40B4" text-anchor="middle">ECA</text>
          <text x="120" y="30" font-family="Arial" font-size="18" font-weight="bold" fill="#6A2C94" text-anchor="middle">Everything</text>
          <text x="120" y="50" font-family="Arial" font-size="18" font-weight="bold" fill="#FF40B4" text-anchor="middle">Childcare Agency</text>
        </svg>
      </div>
      <h1 style="color: #6A2C94; font-size: 24px; margin: 0;">${companyName}</h1>
    </div>
  `;
};

export const getEmailFooter = () => {
  return `
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef; text-align: center; margin-top: 30px;">
      <p style="color: #6A2C94; margin-bottom: 10px;">© ${new Date().getFullYear()} Everything Childcare Agency. All rights reserved.</p>
      <p style="color: #6A2C94; font-size: 14px;">
        If you have any questions, please contact our support team at <a href="mailto:support@everythingchildcareagency.com" style="color: #FF40B4; text-decoration: none;">support@everythingchildcareagency.com</a>
      </p>
      <div style="margin-top: 15px;">
        <a href="#" style="color: #FF40B4; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
        <a href="#" style="color: #FF40B4; text-decoration: none; margin: 0 10px;">Terms of Service</a>
        <a href="mailto:support@everythingchildcareagency.com" style="color: #FF40B4; text-decoration: none; margin: 0 10px;">Contact Us</a>
      </div>
    </div>
  `;
};

export const wrapEmailContent = (content, title = '') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>${title || 'Everything Childcare Agency'}</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        .email-content {
          padding: 30px;
        }
        .button {
          display: inline-block;
          background-color: #FF40B4;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #e030a0;
        }
        h2 {
          color: #6A2C94;
          margin-top: 0;
        }
        a {
          color: #FF40B4;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        ${getEmailHeader()}
        <div class="email-content">
          ${content}
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const EmailBrandingTemplate = () => {
  const { branding } = useBranding();
  
  return (
    <div>
      <h2>Email Branding Preview</h2>
      <div dangerouslySetInnerHTML={{ __html: wrapEmailContent('<h2>Sample Email Content</h2><p>This is a preview of how emails will look with the new branding applied.</p><a href="#" class="button">Call to Action</a>') }} />
    </div>
  );
};

export default EmailBrandingTemplate;