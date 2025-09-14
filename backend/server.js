require('dotenv').config();
const http = require('http');
const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const logManager = require('./modules/logging/logging.services.js');
const { generalLimiter, authLimiter, passwordResetLimiter, uploadLimiter, createLimiter } = require('./middleware/rateLimiter');

const loadRoutes = require('./routes');

const { initSchedulers } = require('./utils/initSchedulers');
const { initEmailSystem } = require('./utils/initEmailSystem');
const { startTokenCleanupScheduler } = require('./utils/tokenCleanup');
const errorMonitoringService = require('./services/errorMonitoringService');

const app = express();

// Increase Node.js default HTTP server timeout and max connections
http.globalAgent.maxSockets = 100; // Increase max concurrent connections
http.globalAgent.keepAlive = true;
http.globalAgent.keepAliveMsecs = 60000; // Keep connections alive for 60 seconds

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'test-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers with cross-origin resource policy

// Configure CORS with specific options
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
})); // Enable CORS with specific configuration
app.use(express.json({ limit: '500mb' })); // Parse JSON bodies with greatly increased size limit
app.use(express.urlencoded({ limit: '500mb', extended: true })); // Parse URL-encoded bodies with greatly increased size limit
app.use(morgan('combined')); // HTTP request logger

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Add request timeout and connection limits
app.use((req, res, next) => {
  // Set a timeout for all requests
  req.setTimeout(30000); // 30 seconds timeout
  res.setTimeout(30000, () => {
    res.status(408).send('Request timeout');
  }); // Add response timeout to prevent hanging connections
  next();
});

// Custom middleware to prevent circular JSON errors
const jsonSafeResponse = require('./middleware/jsonSafeResponse');
const { errorHandler, notFound } = require('./middleware/errorHandler');
app.use(jsonSafeResponse); // Apply globally to all routes

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production' || process.pkg) {
  const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build');
  if (fs.existsSync(frontendBuildPath)) {
    app.use(express.static(frontendBuildPath));
    console.log('Serving static files from:', frontendBuildPath);
  } else {
    console.log('Frontend build path not found:', frontendBuildPath);
  }
}

// API routes
loadRoutes(app);

// Add specific body-parser middleware for timesheet routes to handle large requests
// app.use('/api/timesheets', express.json({ limit: '10mb' }), timesheetRoutes);

const cronJobsRoutes = require('./modules/cron-jobs/cron-jobs.routes');
const emailRoutes = require('./modules/email/email.routes');
const errorLoggingRoutes = require('./modules/error-logging/error-logging.routes');
const imageUploadRoutes = require('./modules/image-upload/image-upload.routes');
const passwordResetRoutes = require('./modules/password-reset/password-reset.routes');
const calendarIntegrationRoutes = require('./modules/calendar-integration/calendar-integration.routes');
const loggingRoutes = require('./modules/logging/logging.routes');
const documentRemindersRoutes = require('./modules/document-reminders/document-reminders.routes');
const timesheetNotificationsRoutes = require('./modules/timesheet-notifications/timesheet-notifications.routes');
const gdprRoutes = require('./modules/gdpr/gdpr.routes');
const serviceRoutes = require('./modules/services/services.routes');
const clientRoutes = require('./modules/clients/clients.routes');
const userGuideRoutes = require('./modules/user-guide/user-guide.routes');
const bulkImportRoutes = require('./modules/bulk-import/bulk-import.routes');
const userTemplatesRoutes = require('./modules/user-templates/user-templates.routes');
const availableStaffRoutes = require('./modules/available-staff/available-staff.routes');
const healthRoutes = require('./modules/health/health.routes');

// Temporarily disabled due to issues
app.use('/api/timesheet-notifications', timesheetNotificationsRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/branding', require('./modules/branding/branding.routes'));
app.use('/api/email-settings', require('./modules/email-settings/email-settings.routes'));
app.use('/api/email-templates', require('./modules/email-templates/email-templates.routes'));
app.use('/api/user-guide', userGuideRoutes);
app.use('/api/staff-documents', require('./modules/staff-documents/staff-documents.routes'));
app.use('/api/bulk-import', bulkImportRoutes);
app.use('/api/user-templates', userTemplatesRoutes);
app.use('/api/global-permissions', require('./modules/global-permissions/global-permissions.routes'));
app.use('/api/hr-document-access', require('./modules/hr-document-access/hr-document-access.routes'));
app.use('/api/available-staff', availableStaffRoutes);
app.use('/api/health', healthRoutes);

app.use('/api/email', emailRoutes);
app.use('/api/error-logging', errorLoggingRoutes);
app.use('/api/image-upload', uploadLimiter, imageUploadRoutes);
app.use('/api/password-reset', passwordResetLimiter, passwordResetRoutes);
app.use('/api/calendar-integration', calendarIntegrationRoutes);
app.use('/api/document-reminders', documentRemindersRoutes);
app.use('/api/logging', loggingRoutes);

// Add a root endpoint for basic connectivity checks
app.get('/api', (req, res) => {
  res.json({ message: 'Staff Management API is running', timestamp: new Date().toISOString() });
});

// Add root endpoint for development mode
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production' || process.pkg) {
    // This will be handled by the catch-all route below
    return;
  }
  res.json({ 
    message: 'Staff Management Backend API Server', 
    version: '1.3-beta',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    frontend_url: 'http://localhost:3001',
    api_base: '/api',
    timestamp: new Date().toISOString()
  });
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production' || process.pkg) {
  app.get('*', (req, res) => {
    // In packaged app, frontend files are in the app.asar
    let frontendBuildPath;
    
    if (process.pkg) {
      // When packaged with pkg or electron, files are in app.asar
      frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build', 'index.html');
    } else {
      // In regular production mode
      frontendBuildPath = path.join(__dirname, '..', 'frontend', 'build', 'index.html');
    }
    
    console.log('Looking for frontend at:', frontendBuildPath);
    console.log('File exists:', fs.existsSync(frontendBuildPath));
    console.log('__dirname:', __dirname);
    console.log('process.pkg:', !!process.pkg);
    
    if (fs.existsSync(frontendBuildPath)) {
      res.sendFile(path.resolve(frontendBuildPath));
    } else {
      // Try alternative paths for packaged app
      const alternativePaths = [
        path.join(__dirname, 'frontend', 'build', 'index.html'),
        path.join(process.cwd(), 'frontend', 'build', 'index.html'),
        path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'frontend', 'build', 'index.html')
      ];
      
      let found = false;
      for (const altPath of alternativePaths) {
        console.log('Trying alternative path:', altPath);
        if (fs.existsSync(altPath)) {
          console.log('Found frontend at:', altPath);
          res.sendFile(path.resolve(altPath));
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log('Frontend not found in any path');
        res.status(404).json({ 
          message: 'Frontend not found', 
          searchedPaths: [frontendBuildPath, ...alternativePaths],
          __dirname,
          execPath: process.execPath,
          cwd: process.cwd()
        });
      }
    }
  });
}

// Error handling middleware (must be last)
app.use(notFound); // Handle 404 errors
app.use(errorHandler); // Handle all other errors

// Connect to MongoDB with support for both Atlas and Synology
const connectDB = async () => {
  try {
    // Connection priority:
    // 1. SYNOLOGY_MONGO_URI from .env (if available)
    // 2. MONGO_URI from .env (fallback to Atlas)
    // 3. Local MongoDB as last resort
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/test';
    
    // Log which connection we're using (without exposing credentials)
    const connectionType = connectionString.includes('synology') ? 'Synology NAS' : 
                          connectionString.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB';
    logger.info(`Attempting to connect to ${connectionType}`);
    
    await mongoose.connect(connectionString, {
      useNewUrlParser: false,
      useUnifiedTopology: false,
      // Connection settings optimized for MongoDB 2.6 on Synology NAS
      socketTimeoutMS: 60000, // Longer timeout for more reliable connections
      connectTimeoutMS: 60000, // Longer connection timeout
      // Retry settings
      serverSelectionTimeoutMS: 10000, // More time for server selection
      heartbeatFrequencyMS: 10000, // Regular heartbeats
    });
    
    // Only apply these limits if using Atlas free tier
    if (connectionString.includes('mongodb.net')) {
      // Set global mongoose options to handle MongoDB free tier limits
      mongoose.set('bufferCommands', false); // Don't buffer commands when disconnected
      logger.info('Applied MongoDB Atlas free tier optimizations');
    }
    
    logger.info(`MongoDB connected successfully to ${connectionType}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    // Don't exit process on connection error, just log it
    logger.info('Continuing without database connection');
  }
};

// Initialize log manager to handle "40 logs" issue
// logManager.checkAllLogs();
// logger.info('Log manager initialized - logs will be automatically managed');

// Start server
const PORT = process.env.PORT || 3002;

if (process.env.NODE_ENV !== 'test') {
    connectDB().then(() => {
        app.listen(PORT, async () => {
            logger.info(`Server running on port ${PORT}`, { service: 'test-api' });

            // Initialize log manager
            logManager.checkAllLogs();

            // Initialize schedulers and email system
            // initSchedulers();
            // initEmailSystem();
            
            // Start token cleanup scheduler
            startTokenCleanupScheduler();
            
            // Start error monitoring service
            try {
                await errorMonitoringService.startMonitoring();
                logger.info('Error monitoring service started successfully');
            } catch (monitoringError) {
                logger.error('Failed to start error monitoring service:', monitoringError);
            }
        });
    });
}

module.exports = app; // For testing