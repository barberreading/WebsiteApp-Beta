# Staff Management System - Beta 1.2.0

🚀 **Beta Release** - Security Enhanced Version

## What's New in Beta 1.2.0

### 🔒 Security Improvements
- Fixed 10 frontend dependency vulnerabilities
- Removed hardcoded credentials from development scripts
- Enhanced security for admin user creation
- Improved test data security practices

### 🛠️ New Features
- Full backup and restore system
- Production-ready environment configuration
- Comprehensive deployment guide
- Enhanced error handling and logging

### 📋 System Requirements
- Node.js 16+ 
- MongoDB 4.4+
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd WebsiteApp

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Setup
```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend environment (for production)
cp frontend/.env.production frontend/.env.production.local
# Edit with your API URL
```

### 3. Database Setup
Ensure MongoDB is running, then create a superuser:
```bash
cd backend
# Set environment variables first:
export ADMIN_EMAIL=admin@yourcompany.com
export ADMIN_PASSWORD=your-secure-password
npm run create-superuser
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 5. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables (Backend)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/staff-management
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your-secure-password
```

### Environment Variables (Frontend)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📦 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive production deployment instructions.

## 🔄 Backup & Restore

### Create Backup
```bash
node backup-restore.js create
```

### List Backups
```bash
node backup-restore.js list
```

### Restore from Backup
```bash
node backup-restore.js restore <backup-name>
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Security Audit
```bash
# Frontend
cd frontend
npm audit

# Backend
cd backend
npm audit
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md)
- [Security Report](./SECURITY_REPORT.md)
- [Changelog](./CHANGELOG.md)

## 🐛 Known Issues

- Frontend may show deprecation warnings during development (non-breaking)
- MongoDB backup requires `mongodump` to be installed separately

## 🤝 Contributing

1. Create a backup before making changes
2. Follow the existing code style
3. Update tests for new features
4. Update documentation as needed

## 📞 Support

For issues and questions:
1. Check the [troubleshooting section](./DEPLOYMENT.md#troubleshooting)
2. Review the security report for best practices
3. Create an issue in the repository

## 🔐 Security

**Important Security Notes:**
- Never commit `.env` files to version control
- Use strong passwords for admin accounts
- Enable HTTPS in production
- Regularly update dependencies
- Review the security report before deployment

---

**Version:** 1.2.0-beta  
**Release Date:** January 13, 2025  
**Compatibility:** Node.js 16+, MongoDB 4.4+