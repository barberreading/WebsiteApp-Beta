# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-01-13

### Security
- Fixed 10 frontend dependency vulnerabilities
- Removed hardcoded credentials from scripts and test files
- Enhanced security for createSuperuser script - now requires environment variables
- Updated test files to use more secure test passwords

### Added
- Full backup and restore system for application state
- Production-ready environment configuration support
- Comprehensive security audit implementation

### Changed
- Updated frontend dependencies to resolve security vulnerabilities
- Improved error handling in admin scripts
- Enhanced logging for superuser creation process

### Fixed
- Resolved npm audit security warnings
- Fixed potential credential exposure in development scripts

## [1.0.0] - Initial Release

### Added
- Staff management system with GDPR compliance
- User authentication and authorization
- Role-based access control
- File upload functionality with security validation
- MongoDB integration with proper indexing
- JWT token management with blacklisting
- Comprehensive error handling
- Security headers and CORS configuration