/**
 * Comprehensive audit logging middleware
 * Tracks security events, user activities, and system operations
 */

const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Audit event types
const AUDIT_EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_LOCKED: 'account_locked',
  
  // Authorization events
  ACCESS_GRANTED: 'access_granted',
  ACCESS_DENIED: 'access_denied',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  
  // Data events
  DATA_CREATE: 'data_create',
  DATA_READ: 'data_read',
  DATA_UPDATE: 'data_update',
  DATA_DELETE: 'data_delete',
  DATA_EXPORT: 'data_export',
  
  // Security events
  SECURITY_VIOLATION: 'security_violation',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  INVALID_INPUT: 'invalid_input',
  
  // System events
  SYSTEM_ERROR: 'system_error',
  CONFIG_CHANGE: 'config_change',
  BACKUP_CREATED: 'backup_created',
  MAINTENANCE_MODE: 'maintenance_mode'
};

// Risk levels
const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

class AuditLogger {
  constructor() {
    this.auditLogPath = path.join(__dirname, '../logs/audit.log');
    this.securityLogPath = path.join(__dirname, '../logs/security.log');
    this.initializeLogFiles();
  }

  async initializeLogFiles() {
    try {
      const logsDir = path.dirname(this.auditLogPath);
      await fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize audit log files:', error);
    }
  }

  async logEvent(eventType, details = {}) {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      eventId: this.generateEventId(),
      ...details,
      environment: process.env.NODE_ENV || 'development'
    };

    try {
      // Log to main logger
      logger.info('Audit Event:', auditEntry);

      // Write to audit log file
      await this.writeToAuditLog(auditEntry);

      // Write to security log if it's a security event
      if (this.isSecurityEvent(eventType)) {
        await this.writeToSecurityLog(auditEntry);
      }

      // Alert on critical events
      if (details.riskLevel === RISK_LEVELS.CRITICAL) {
        await this.handleCriticalEvent(auditEntry);
      }

    } catch (error) {
      logger.error('Failed to log audit event:', error);
    }
  }

  async writeToAuditLog(entry) {
    const logLine = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.auditLogPath, logLine, 'utf8');
  }

  async writeToSecurityLog(entry) {
    const logLine = JSON.stringify(entry) + '\n';
    await fs.appendFile(this.securityLogPath, logLine, 'utf8');
  }

  isSecurityEvent(eventType) {
    const securityEvents = [
      AUDIT_EVENTS.LOGIN_FAILURE,
      AUDIT_EVENTS.ACCESS_DENIED,
      AUDIT_EVENTS.PRIVILEGE_ESCALATION,
      AUDIT_EVENTS.SECURITY_VIOLATION,
      AUDIT_EVENTS.SUSPICIOUS_ACTIVITY,
      AUDIT_EVENTS.RATE_LIMIT_EXCEEDED,
      AUDIT_EVENTS.INVALID_INPUT,
      AUDIT_EVENTS.ACCOUNT_LOCKED
    ];
    return securityEvents.includes(eventType);
  }

  generateEventId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async handleCriticalEvent(entry) {
    // In a real application, this would send alerts via email, SMS, etc.
    logger.error('CRITICAL SECURITY EVENT:', entry);
    
    // You could integrate with alerting services here
    // await this.sendAlert(entry);
  }

  extractRequestInfo(req) {
    return {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl || req.url,
      referer: req.get('Referer'),
      sessionId: req.sessionID,
      userId: req.user?.id,
      userEmail: req.user?.email,
      userRole: req.user?.role
    };
  }

  sanitizeData(data) {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...data };
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}

// Create singleton instance
const auditLogger = new AuditLogger();

// Middleware for automatic request logging
const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  const requestInfo = auditLogger.extractRequestInfo(req);
  
  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log the response
    auditLogger.logEvent(AUDIT_EVENTS.DATA_READ, {
      ...requestInfo,
      statusCode: res.statusCode,
      responseTime,
      success: res.statusCode < 400,
      riskLevel: res.statusCode >= 400 ? RISK_LEVELS.MEDIUM : RISK_LEVELS.LOW
    });
    
    return originalJson.call(this, data);
  };
  
  next();
};

// Authentication event loggers
const logLoginAttempt = async (req, success, user = null, reason = null) => {
  const requestInfo = auditLogger.extractRequestInfo(req);
  
  await auditLogger.logEvent(
    success ? AUDIT_EVENTS.LOGIN_SUCCESS : AUDIT_EVENTS.LOGIN_FAILURE,
    {
      ...requestInfo,
      success,
      userId: user?.id,
      userEmail: user?.email,
      failureReason: reason,
      riskLevel: success ? RISK_LEVELS.LOW : RISK_LEVELS.MEDIUM
    }
  );
};

const logLogout = async (req, user) => {
  const requestInfo = auditLogger.extractRequestInfo(req);
  
  await auditLogger.logEvent(AUDIT_EVENTS.LOGOUT, {
    ...requestInfo,
    userId: user?.id,
    userEmail: user?.email,
    riskLevel: RISK_LEVELS.LOW
  });
};

const logPasswordChange = async (req, user) => {
  const requestInfo = auditLogger.extractRequestInfo(req);
  
  await auditLogger.logEvent(AUDIT_EVENTS.PASSWORD_CHANGE, {
    ...requestInfo,
    userId: user?.id,
    userEmail: user?.email,
    riskLevel: RISK_LEVELS.MEDIUM
  });
};

// Data operation loggers
const logDataOperation = async (req, operation, resource, data = null) => {
  const requestInfo = auditLogger.extractRequestInfo(req);
  
  let eventType;
  switch (operation.toLowerCase()) {
    case 'create':
      eventType = AUDIT_EVENTS.DATA_CREATE;
      break;
    case 'read':
      eventType = AUDIT_EVENTS.DATA_READ;
      break;
    case 'update':
      eventType = AUDIT_EVENTS.DATA_UPDATE;
      break;
    case 'delete':
      eventType = AUDIT_EVENTS.DATA_DELETE;
      break;
    default:
      eventType = AUDIT_EVENTS.DATA_READ;
  }
  
  await auditLogger.logEvent(eventType, {
    ...requestInfo,
    resource,
    operation,
    data: auditLogger.sanitizeData(data || {}),
    riskLevel: operation === 'delete' ? RISK_LEVELS.HIGH : RISK_LEVELS.LOW
  });
};

// Security event loggers
const logSecurityViolation = async (req, violationType, details = {}) => {
  const requestInfo = auditLogger.extractRequestInfo(req);
  
  await auditLogger.logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
    ...requestInfo,
    violationType,
    details: auditLogger.sanitizeData(details),
    riskLevel: RISK_LEVELS.HIGH
  });
};

const logSuspiciousActivity = async (req, activityType, details = {}) => {
  const requestInfo = auditLogger.extractRequestInfo(req);
  
  await auditLogger.logEvent(AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, {
    ...requestInfo,
    activityType,
    details: auditLogger.sanitizeData(details),
    riskLevel: RISK_LEVELS.HIGH
  });
};

const logAccessDenied = async (req, resource, reason) => {
  const requestInfo = auditLogger.extractRequestInfo(req);
  
  await auditLogger.logEvent(AUDIT_EVENTS.ACCESS_DENIED, {
    ...requestInfo,
    resource,
    reason,
    riskLevel: RISK_LEVELS.MEDIUM
  });
};

module.exports = {
  AuditLogger,
  auditLogger,
  auditMiddleware,
  logLoginAttempt,
  logLogout,
  logPasswordChange,
  logDataOperation,
  logSecurityViolation,
  logSuspiciousActivity,
  logAccessDenied,
  AUDIT_EVENTS,
  RISK_LEVELS
};