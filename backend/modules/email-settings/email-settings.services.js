const EmailSettings = require('../../models/EmailSettings');
const nodemailer = require('nodemailer');
const ErrorResponse = require('../../utils/errorResponse');

/**
 * Get email settings
 * @returns {Object} Email settings
 */
exports.getEmailSettings = async () => {
    try {
        const settings = await EmailSettings.findOne().populate('updatedBy', 'name email');
        
        if (!settings) {
            return {
                host: '',
                port: 587,
                secure: false,
                auth: {
                    user: '',
                    pass: ''
                },
                from: {
                    name: '',
                    email: ''
                },
                enabled: false
            };
        }

        // Don't return the password for security
        const { auth, ...otherSettings } = settings.toObject();
        return {
            ...otherSettings,
            auth: {
                user: auth.user,
                pass: '' // Never return the actual password
            }
        };
    } catch (error) {
        console.error('Error fetching email settings:', error);
        throw new ErrorResponse('Failed to fetch email settings', 500);
    }
};

/**
 * Update email settings
 * @param {Object} settingsData - Email settings data
 * @param {String} userId - User ID who is updating
 * @returns {Object} Updated email settings
 */
exports.updateEmailSettings = async (settingsData, userId) => {
    try {
        const { host, port, secure, auth, from, enabled } = settingsData;

        // Validate required fields
        if (!host || !port || !auth?.user || !from?.name || !from?.email) {
            throw new ErrorResponse('Missing required fields', 400);
        }

        // Find existing settings or create new
        let settings = await EmailSettings.findOne();
        
        if (settings) {
            // Update existing settings
            settings.host = host;
            settings.port = port;
            settings.secure = secure || false;
            settings.auth.user = auth.user;
            
            // Only update password if provided
            if (auth.pass && auth.pass.trim() !== '') {
                settings.auth.pass = auth.pass;
            }
            
            settings.from.name = from.name;
            settings.from.email = from.email;
            settings.enabled = enabled !== undefined ? enabled : true;
            settings.lastUpdated = new Date();
            settings.updatedBy = userId;
            
            await settings.save();
        } else {
            // Create new settings
            if (!auth.pass || auth.pass.trim() === '') {
                throw new ErrorResponse('Password is required for new email settings', 400);
            }
            
            settings = await EmailSettings.create({
                host,
                port,
                secure: secure || false,
                auth: {
                    user: auth.user,
                    pass: auth.pass
                },
                from: {
                    name: from.name,
                    email: from.email
                },
                enabled: enabled !== undefined ? enabled : true,
                updatedBy: userId
            });
        }

        // Return settings without password
        const { auth: authData, ...otherSettings } = settings.toObject();
        return {
            ...otherSettings,
            auth: {
                user: authData.user,
                pass: ''
            }
        };
    } catch (error) {
        console.error('Error updating email settings:', error);
        if (error instanceof ErrorResponse) {
            throw error;
        }
        throw new ErrorResponse('Failed to update email settings', 500);
    }
};

/**
 * Test email settings by sending a test email
 * @param {String} testEmail - Email address to send test email to
 * @returns {Object} Test result
 */
exports.testEmailSettings = async (testEmail) => {
    try {
        if (!testEmail) {
            throw new ErrorResponse('Test email address is required', 400);
        }

        // Get current email settings
        const settings = await EmailSettings.findOne();
        
        if (!settings) {
            throw new ErrorResponse('No email settings configured', 400);
        }

        if (!settings.enabled) {
            throw new ErrorResponse('Email settings are disabled', 400);
        }

        // Create transporter
        const transporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port,
            secure: settings.secure,
            auth: {
                user: settings.auth.user,
                pass: settings.auth.pass
            }
        });

        // Verify connection
        await transporter.verify();

        // Send test email
        const mailOptions = {
            from: `"${settings.from.name}" <${settings.from.email}>`,
            to: testEmail,
            subject: 'Test Email - Email Settings Configuration',
            html: `
                <h2>Email Settings Test</h2>
                <p>This is a test email to verify that your email settings are configured correctly.</p>
                <p><strong>SMTP Host:</strong> ${settings.host}</p>
                <p><strong>SMTP Port:</strong> ${settings.port}</p>
                <p><strong>Secure:</strong> ${settings.secure ? 'Yes' : 'No'}</p>
                <p><strong>From:</strong> ${settings.from.name} &lt;${settings.from.email}&gt;</p>
                <hr>
                <p><small>This email was sent at ${new Date().toLocaleString()}</small></p>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        return {
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected,
            sentAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error testing email settings:', error);
        
        // Handle specific nodemailer errors
        if (error.code === 'EAUTH') {
            throw new ErrorResponse('Authentication failed. Please check your email credentials.', 400);
        } else if (error.code === 'ECONNECTION') {
            throw new ErrorResponse('Connection failed. Please check your SMTP host and port.', 400);
        } else if (error.code === 'ETIMEDOUT') {
            throw new ErrorResponse('Connection timeout. Please check your network connection.', 400);
        }
        
        if (error instanceof ErrorResponse) {
            throw error;
        }
        
        throw new ErrorResponse('Failed to send test email: ' + error.message, 500);
    }
};