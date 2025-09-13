const app = require('./server');
const mongoose = require('mongoose');
const winston = require('winston');
require('dotenv').config();

const logManager = require('./modules/logging/logging.services.js');
const { initSchedulers } = require('./utils/initSchedulers');
const { initEmailSystem } = require('./utils/initEmailSystem');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'staff-management-api' },
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

const connectDB = async () => {
  try {
    const connectionString = process.env.SYNOLOGY_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/staff-management';
    
    const connectionType = connectionString.includes('synology') ? 'Synology NAS' : 
                          connectionString.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB';
    logger.info(`Attempting to connect to ${connectionType}`);
    
    await mongoose.connect(connectionString, {
      useNewUrlParser: false,
      useUnifiedTopology: false,
      socketTimeoutMS: 60000, 
      connectTimeoutMS: 60000, 
      serverSelectionTimeoutMS: 10000, 
      heartbeatFrequencyMS: 10000, 
    });
    
    if (connectionString.includes('mongodb.net')) {
      mongoose.set('bufferCommands', false);
      logger.info('Applied MongoDB Atlas free tier optimizations');
    }
    
    logger.info(`MongoDB connected successfully to ${connectionType}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    logger.info('Continuing without database connection');
  }
};

const PORT = process.env.PORT || 3002;

connectDB().then(() => {
    app.listen(PORT, async () => {
        logger.info(`Server running on port ${PORT}`, { service: 'staff-management-api' });
        logManager.checkAllLogs();
        // initSchedulers();
        // initEmailSystem();
    });
});