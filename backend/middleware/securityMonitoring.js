/**
 * Automated security monitoring system
 * Detects and alerts on security events in real-time
 */

const logger = require('../utils/logger');
const { auditLogger, AUDIT_EVENTS, RISK_LEVELS } = require('./auditLogger');

// Security thresholds and patterns
const SECURITY_THRESHOLDS = {
  FAILED_LOGINS_PER_IP: 5,
  FAILED_LOGINS_TIME_WINDOW: 15 * 60 * 1000, // 15 minutes
  REQUESTS_PER_IP: 100,
  REQUESTS_TIME_WINDOW: 60 * 1000, // 1 minute
  SUSPICIOUS_PATTERNS_THRESHOLD: 3,
  CRITICAL_EVENTS_THRESHOLD: 1
};

// In-memory tracking (in production, use Redis or similar)
const securityMetrics = {
  failedLogins: new Map(),
  requestCounts: new Map(),
  suspiciousActivity: new Map(),
  blockedIPs: new Set(),
  criticalEvents: []
};

class SecurityMonitor {
  constructor() {
    this.alertHandlers = [];
    this.setupCleanupInterval();
  }

  // Add alert handler (email, SMS, webhook, etc.)
  addAlertHandler(handler) {
    this.alertHandlers.push(handler);
  }

  // Track failed login attempts
  trackFailedLogin(ip, userAgent, email = null) {
    const key = ip;
    const now = Date.now();
    
    if (!securityMetrics.failedLogins.has(key)) {
      securityMetrics.failedLogins.set(key, []);
    }
    
    const attempts = securityMetrics.failedLogins.get(key);
    attempts.push({ timestamp: now, userAgent, email });
    
    // Clean old attempts
    const validAttempts = attempts.filter(
      attempt => now - attempt.timestamp < SECURITY_THRESHOLDS.FAILED_LOGINS_TIME_WINDOW
    );
    securityMetrics.failedLogins.set(key, validAttempts);
    
    // Check threshold
    if (validAttempts.length >= SECURITY_THRESHOLDS.FAILED_LOGINS_PER_IP) {
      this.handleBruteForceDetection(ip, validAttempts);
    }
  }

  // Track request patterns
  trackRequest(ip, method, url, userAgent) {
    const key = ip;
    const now = Date.now();
    
    if (!securityMetrics.requestCounts.has(key)) {
      securityMetrics.requestCounts.set(key, []);
    }
    
    const requests = securityMetrics.requestCounts.get(key);
    requests.push({ timestamp: now, method, url, userAgent });
    
    // Clean old requests
    const validRequests = requests.filter(
      request => now - request.timestamp < SECURITY_THRESHOLDS.REQUESTS_TIME_WINDOW
    );
    securityMetrics.requestCounts.set(key, validRequests);
    
    // Check for rate limiting
    if (validRequests.length >= SECURITY_THRESHOLDS.REQUESTS_PER_IP) {
      this.handleRateLimitExceeded(ip, validRequests);
    }
    
    // Check for suspicious patterns
    this.detectSuspiciousPatterns(ip, validRequests);
  }

  // Detect suspicious request patterns
  detectSuspiciousPatterns(ip, requests) {
    const patterns = {
      sqlInjection: 0,
      xssAttempts: 0,
      pathTraversal: 0,
      scanningBehavior: 0
    };
    
    requests.forEach(request => {
      const url = request.url.toLowerCase();
      
      // SQL injection patterns
      if (/('|(\-\-)|(;)|(union|select|insert|delete|update|drop))/i.test(url)) {
        patterns.sqlInjection++;
      }
      
      // XSS patterns
      if (/<script|javascript:|on\w+=/i.test(url)) {
        patterns.xssAttempts++;
      }
      
      // Path traversal
      if (/\.\.[\/\\]/.test(url)) {
        patterns.pathTraversal++;
      }
      
      // Scanning behavior (accessing many different endpoints)
      if (request.method === 'GET' && url.includes('/admin')) {
        patterns.scanningBehavior++;
      }
    });
    
    // Check if any pattern exceeds threshold
    Object.entries(patterns).forEach(([pattern, count]) => {
      if (count >= SECURITY_THRESHOLDS.SUSPICIOUS_PATTERNS_THRESHOLD) {
        this.handleSuspiciousActivity(ip, pattern, count, requests);
      }
    });
  }

  // Handle brute force detection
  async handleBruteForceDetection(ip, attempts) {
    const alert = {
      type: 'BRUTE_FORCE_ATTACK',
      severity: 'HIGH',
      ip,
      attemptCount: attempts.length,
      timeWindow: SECURITY_THRESHOLDS.FAILED_LOGINS_TIME_WINDOW / 1000 / 60,
      emails: attempts.map(a => a.email).filter(Boolean),
      userAgents: [...new Set(attempts.map(a => a.userAgent))],
      timestamp: new Date().toISOString()
    };
    
    // Block IP temporarily
    securityMetrics.blockedIPs.add(ip);
    setTimeout(() => {
      securityMetrics.blockedIPs.delete(ip);
    }, 30 * 60 * 1000); // Block for 30 minutes
    
    await this.sendAlert(alert);
    
    // Log to audit
    await auditLogger.logEvent(AUDIT_EVENTS.SECURITY_VIOLATION, {
      ip,
      violationType: 'brute_force_attack',
      details: alert,
      riskLevel: RISK_LEVELS.CRITICAL
    });
  }

  // Handle rate limit exceeded
  async handleRateLimitExceeded(ip, requests) {
    const alert = {
      type: 'RATE_LIMIT_EXCEEDED',
      severity: 'MEDIUM',
      ip,
      requestCount: requests.length,
      timeWindow: SECURITY_THRESHOLDS.REQUESTS_TIME_WINDOW / 1000,
      endpoints: [...new Set(requests.map(r => r.url))],
      timestamp: new Date().toISOString()
    };
    
    await this.sendAlert(alert);
    
    await auditLogger.logEvent(AUDIT_EVENTS.RATE_LIMIT_EXCEEDED, {
      ip,
      requestCount: requests.length,
      riskLevel: RISK_LEVELS.MEDIUM
    });
  }

  // Handle suspicious activity
  async handleSuspiciousActivity(ip, pattern, count, requests) {
    const alert = {
      type: 'SUSPICIOUS_ACTIVITY',
      severity: 'HIGH',
      ip,
      pattern,
      count,
      requests: requests.slice(-5), // Last 5 requests
      timestamp: new Date().toISOString()
    };
    
    // Track suspicious IPs
    if (!securityMetrics.suspiciousActivity.has(ip)) {
      securityMetrics.suspiciousActivity.set(ip, []);
    }
    securityMetrics.suspiciousActivity.get(ip).push(alert);
    
    await this.sendAlert(alert);
    
    await auditLogger.logEvent(AUDIT_EVENTS.SUSPICIOUS_ACTIVITY, {
      ip,
      activityType: pattern,
      details: alert,
      riskLevel: RISK_LEVELS.HIGH
    });
  }

  // Check if IP is blocked
  isBlocked(ip) {
    return securityMetrics.blockedIPs.has(ip);
  }

  // Get security metrics
  getMetrics() {
    return {
      blockedIPs: Array.from(securityMetrics.blockedIPs),
      failedLoginAttempts: securityMetrics.failedLogins.size,
      suspiciousIPs: securityMetrics.suspiciousActivity.size,
      criticalEvents: securityMetrics.criticalEvents.length
    };
  }

  // Send alert to all handlers
  async sendAlert(alert) {
    logger.warn('Security Alert:', alert);
    
    // Add to critical events if high severity
    if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
      securityMetrics.criticalEvents.push(alert);
      
      // Keep only recent critical events
      if (securityMetrics.criticalEvents.length > 100) {
        securityMetrics.criticalEvents = securityMetrics.criticalEvents.slice(-50);
      }
    }
    
    // Send to all alert handlers
    for (const handler of this.alertHandlers) {
      try {
        await handler(alert);
      } catch (error) {
        logger.error('Alert handler failed:', error);
      }
    }
  }

  // Setup cleanup interval
  setupCleanupInterval() {
    setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Clean up old tracking data
  cleanupOldData() {
    const now = Date.now();
    
    // Clean failed logins
    for (const [ip, attempts] of securityMetrics.failedLogins.entries()) {
      const validAttempts = attempts.filter(
        attempt => now - attempt.timestamp < SECURITY_THRESHOLDS.FAILED_LOGINS_TIME_WINDOW
      );
      
      if (validAttempts.length === 0) {
        securityMetrics.failedLogins.delete(ip);
      } else {
        securityMetrics.failedLogins.set(ip, validAttempts);
      }
    }
    
    // Clean request counts
    for (const [ip, requests] of securityMetrics.requestCounts.entries()) {
      const validRequests = requests.filter(
        request => now - request.timestamp < SECURITY_THRESHOLDS.REQUESTS_TIME_WINDOW
      );
      
      if (validRequests.length === 0) {
        securityMetrics.requestCounts.delete(ip);
      } else {
        securityMetrics.requestCounts.set(ip, validRequests);
      }
    }
    
    // Clean old critical events (keep last 24 hours)
    securityMetrics.criticalEvents = securityMetrics.criticalEvents.filter(
      event => now - new Date(event.timestamp).getTime() < 24 * 60 * 60 * 1000
    );
  }
}

// Create singleton instance
const securityMonitor = new SecurityMonitor();

// Default alert handlers
const consoleAlertHandler = async (alert) => {
  logger.error(`🚨 SECURITY ALERT [${alert.severity}]: ${alert.type}`, alert);
};

// Email alert handler (placeholder)
const emailAlertHandler = async (alert) => {
  // In production, integrate with your email service
  logger.info('Email alert would be sent:', {
    to: process.env.SECURITY_ALERT_EMAIL,
    subject: `Security Alert: ${alert.type}`,
    alert
  });
};

// Add default handlers
securityMonitor.addAlertHandler(consoleAlertHandler);
if (process.env.NODE_ENV === 'production') {
  securityMonitor.addAlertHandler(emailAlertHandler);
}

// Middleware for security monitoring
const securityMonitoringMiddleware = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Check if IP is blocked
  if (securityMonitor.isBlocked(ip)) {
    logger.warn('Blocked IP attempted access:', { ip, url: req.url });
    return res.status(403).json({
      success: false,
      error: {
        message: 'Access denied',
        type: 'security'
      }
    });
  }
  
  // Track request
  securityMonitor.trackRequest(
    ip,
    req.method,
    req.originalUrl || req.url,
    req.get('User-Agent')
  );
  
  next();
};

// Middleware for tracking failed logins
const trackFailedLoginMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Check if this is a failed login response
    if (req.path.includes('/login') && 
        req.method === 'POST' && 
        (!data.success || res.statusCode >= 400)) {
      
      const ip = req.ip || req.connection.remoteAddress;
      securityMonitor.trackFailedLogin(
        ip,
        req.get('User-Agent'),
        req.body?.email
      );
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

module.exports = {
  SecurityMonitor,
  securityMonitor,
  securityMonitoringMiddleware,
  trackFailedLoginMiddleware,
  SECURITY_THRESHOLDS
};