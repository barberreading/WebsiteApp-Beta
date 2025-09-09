const wrapEmailContent = (content, title) => {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #ddd;">
          <h1 style="color: #333;">${title}</h1>
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