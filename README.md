# Staff Management Desktop Application

[![Security Status](https://img.shields.io/badge/Security-Audited-green.svg)](./DESKTOP_AUDIT_REPORT.md)
[![License](https://img.shields.io/badge/License-Private-red.svg)](#)
[![Electron](https://img.shields.io/badge/Electron-20.3.12-blue.svg)](https://electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

A comprehensive desktop application for staff management built with Electron, React, and Node.js. This application provides a complete solution for managing staff, bookings, clients, and administrative tasks with robust security features and GDPR compliance.

## 🚀 Features

### Core Functionality
- **Staff Management**: Complete employee lifecycle management
- **Booking System**: Advanced scheduling and booking management
- **Client Management**: Customer relationship management
- **Document Management**: Secure document storage and access
- **Timesheet Management**: Time tracking and reporting
- **Leave Request System**: Automated leave management
- **Audit Trail**: Comprehensive activity logging

### Security Features
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permission management
- **Rate Limiting**: Protection against abuse and attacks
- **Input Validation**: Comprehensive data sanitization
- **GDPR Compliance**: Data protection and privacy features
- **Secure File Upload**: Protected document handling

### Desktop Features
- **Cross-platform**: Windows, macOS, and Linux support
- **Single Instance**: Prevents multiple application instances
- **Graceful Shutdown**: Proper cleanup of all processes
- **Auto-updater Ready**: Built-in update mechanism support

## 📋 Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **MongoDB**: Local installation or cloud instance
- **Git**: For version control

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd WebsiteApp
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root directory
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit the .env file with your configuration
# Required variables:
# - MONGO_URI: Your MongoDB connection string
# - JWT_SECRET: Strong secret key for JWT tokens
# - ADMIN_EMAIL: Admin user email
# - ADMIN_PASSWORD: Secure admin password
```

### 4. Database Setup
```bash
# Create admin user (run from backend directory)
cd backend
node scripts/createSuperuser.js
```

## 🚀 Running the Application

### Development Mode
```bash
# Start the desktop application
npm run electron

# Or start in development mode
npm run electron-dev
```

### Production Build
```bash
# Build for current platform
npm run dist

# Build for specific platforms
npm run dist-win    # Windows
npm run dist-mac    # macOS
npm run dist-linux  # Linux

# Build for all platforms
npm run build:all
```

## 📁 Project Structure

```
WebsiteApp/
├── backend/                 # Node.js backend server
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── modules/           # Feature modules
│   ├── routes.js          # API routes
│   └── server.js          # Main server file
├── frontend/               # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # React source code
│   └── package.json       # Frontend dependencies
├── assets/                 # Application assets
├── electron-desktop.js     # Main Electron process
├── package.json           # Root dependencies
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3002
NODE_ENV=production

# Database
MONGO_URI=mongodb://localhost:27017/test

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_here
JWT_EXPIRE=30d

# Admin Credentials
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your_secure_admin_password

# Email Configuration (Optional)
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your_email@yourdomain.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_ENABLED=true
```

### Security Configuration

The application includes comprehensive security measures:

- **Rate Limiting**: Configurable limits for different endpoints
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers for protection
- **Input Validation**: Request validation and sanitization

## 🛡️ Security

### Security Audit
A comprehensive security audit has been conducted. See [DESKTOP_AUDIT_REPORT.md](./DESKTOP_AUDIT_REPORT.md) for detailed findings and recommendations.

### Key Security Features
- ✅ **Backend**: 0 vulnerabilities
- ⚠️ **Frontend**: 10 vulnerabilities (mostly dev dependencies)
- ⚠️ **Electron**: 8 vulnerabilities (requires updates)

### Security Best Practices
1. **Never commit `.env` files** to version control
2. **Use strong passwords** for admin accounts
3. **Regularly update dependencies** to patch vulnerabilities
4. **Monitor security advisories** for used packages
5. **Implement proper backup strategies** for data protection

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📦 Building and Distribution

### Electron Builder Configuration
The application uses Electron Builder for creating distributable packages:

- **Windows**: `.exe` installer and portable version
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` and `.deb` packages

### Build Commands
```bash
# Development build
npm run electron-dev

# Production build
npm run dist

# Platform-specific builds
npm run build:win
npm run build:mac
npm run build:linux
```

## 🔄 Updates and Maintenance

### Dependency Updates
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Security audit
npm audit
npm audit fix
```

### Database Maintenance
```bash
# Run from backend directory
node scripts/createSuperuser.js    # Create admin user
node scripts/clear_logs.js          # Clear application logs
node scripts/clear_errors.js        # Clear error logs
```

## 📚 Documentation

- [Desktop App Instructions](./DESKTOP_APP_INSTRUCTIONS.md)
- [Security Report](./SECURITY_REPORT.md)
- [Desktop Audit Report](./DESKTOP_AUDIT_REPORT.md)
- [Electron Troubleshooting](./ELECTRON_TROUBLESHOOTING.md)
- [Backend Security README](./backend/SECURITY_README.md)

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Check if another instance is running
   - Kill existing Node.js processes
   - Verify port configuration in `.env`

2. **Database Connection Issues**
   - Verify MongoDB is running
   - Check connection string in `.env`
   - Ensure database permissions are correct

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

### Logs and Debugging
- Application logs: `electron-startup.log`
- Backend logs: `backend/combined.log`
- Error logs: `backend/error.log`

## 🤝 Contributing

1. **Security First**: All contributions must pass security review
2. **Code Quality**: Follow existing code style and patterns
3. **Testing**: Include tests for new features
4. **Documentation**: Update documentation for changes

## 📄 License

This is proprietary software. All rights reserved.

## 📞 Support

For technical support or questions:
- Review the troubleshooting documentation
- Check the security audit report
- Consult the API documentation

---

**⚠️ Important Security Notice**

Before deploying to production:
1. Update Electron to the latest version (38.1.0+)
2. Resolve frontend dependency vulnerabilities
3. Implement proper SSL/TLS certificates
4. Configure proper backup and monitoring
5. Review and test all security configurations

See [DESKTOP_AUDIT_REPORT.md](./DESKTOP_AUDIT_REPORT.md) for detailed security recommendations.