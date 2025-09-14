const ErrorLog = require('../models/ErrorLog');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

/**
 * Comprehensive Error Monitoring and Auto-Resolution Service
 * Monitors system health and automatically resolves common backend errors
 */
class ErrorMonitoringService {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.healthCheckInterval = 30000; // 30 seconds
    this.errorThresholds = {
      memory: 0.85, // 85% memory usage
      cpu: 0.90,    // 90% CPU usage
      disk: 0.95,   // 95% disk usage
      errorRate: 10 // errors per minute
    };
    this.resolutionHistory = [];
    this.systemMetrics = {
      memory: { used: 0, total: 0, percentage: 0 },
      cpu: { usage: 0 },
      disk: { used: 0, total: 0, percentage: 0 },
      errors: { count: 0, rate: 0 }
    };
    this.autoResolutionEnabled = true;
  }

  /**
   * Start the error monitoring service
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      logger.log('📊 Error monitoring service is already running');
      return;
    }

    logger.log('🚀 Starting Error Monitoring Service...');
    this.isMonitoring = true;

    // Start periodic health checks
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.healthCheckInterval);

    // Initial health check
    await this.performHealthCheck();
    
    logger.log('✅ Error Monitoring Service started successfully');
  }

  /**
   * Stop the error monitoring service
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    logger.log('🛑 Stopping Error Monitoring Service...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.log('✅ Error Monitoring Service stopped');
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    try {
      logger.log('🔍 Performing system health check...');
      
      // Collect system metrics
      await this.collectSystemMetrics();
      
      // Check for critical issues
      const issues = await this.identifyIssues();
      
      if (issues.length > 0) {
        logger.log(`⚠️ Found ${issues.length} issues:`, issues.map(i => i.type));
        
        if (this.autoResolutionEnabled) {
          await this.resolveIssues(issues);
        }
      } else {
        logger.log('✅ System health check passed');
      }
      
      // Log health status
      await this.logHealthStatus(issues);
      
    } catch (error) {
      logger.error('❌ Health check failed:', error);
      await this.logError('HEALTH_CHECK_FAILED', error.message, { error: error.stack });
    }
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    // Memory metrics
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    this.systemMetrics.memory = {
      used: usedMemory,
      total: totalMemory,
      percentage: usedMemory / totalMemory,
      process: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      }
    };

    // CPU metrics (simplified)
    const cpuUsage = process.cpuUsage();
    this.systemMetrics.cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system,
      usage: (cpuUsage.user + cpuUsage.system) / 1000000 // Convert to seconds
    };

    // Disk metrics
    try {
      const stats = await fs.stat(process.cwd());
      // This is a simplified disk check - in production, you'd want more detailed disk monitoring
      this.systemMetrics.disk = {
        available: true,
        path: process.cwd()
      };
    } catch (error) {
      this.systemMetrics.disk = {
        available: false,
        error: error.message
      };
    }

    // Error rate metrics
    const recentErrors = await this.getRecentErrorCount();
    this.systemMetrics.errors = {
      count: recentErrors,
      rate: recentErrors / (this.healthCheckInterval / 60000) // errors per minute
    };
  }

  /**
   * Get recent error count from database
   */
  async getRecentErrorCount() {
    try {
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const errorCount = await ErrorLog.countDocuments({
        timestamp: { $gte: oneMinuteAgo }
      });
      return errorCount;
    } catch (error) {
      logger.error('Failed to get recent error count:', error);
      return 0;
    }
  }

  /**
   * Identify system issues based on metrics
   */
  async identifyIssues() {
    const issues = [];

    // Memory issues
    if (this.systemMetrics.memory.percentage > this.errorThresholds.memory) {
      issues.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'HIGH',
        details: {
          current: (this.systemMetrics.memory.percentage * 100).toFixed(2) + '%',
          threshold: (this.errorThresholds.memory * 100) + '%'
        }
      });
    }

    // Process memory issues
    const processMemoryMB = this.systemMetrics.memory.process.heapUsed / 1024 / 1024;
    if (processMemoryMB > 512) { // 512MB threshold for Node.js process
      issues.push({
        type: 'HIGH_PROCESS_MEMORY',
        severity: 'MEDIUM',
        details: {
          current: processMemoryMB.toFixed(2) + 'MB',
          threshold: '512MB'
        }
      });
    }

    // Error rate issues
    if (this.systemMetrics.errors.rate > this.errorThresholds.errorRate) {
      issues.push({
        type: 'HIGH_ERROR_RATE',
        severity: 'HIGH',
        details: {
          current: this.systemMetrics.errors.rate.toFixed(2) + ' errors/min',
          threshold: this.errorThresholds.errorRate + ' errors/min'
        }
      });
    }

    // Database connectivity
    try {
      await ErrorLog.findOne().limit(1);
    } catch (dbError) {
      issues.push({
        type: 'DATABASE_CONNECTION_FAILED',
        severity: 'CRITICAL',
        details: {
          error: dbError.message
        }
      });
    }

    // Disk space (simplified check)
    if (!this.systemMetrics.disk.available) {
      issues.push({
        type: 'DISK_ACCESS_FAILED',
        severity: 'HIGH',
        details: {
          error: this.systemMetrics.disk.error
        }
      });
    }

    return issues;
  }

  /**
   * Resolve identified issues automatically
   */
  async resolveIssues(issues) {
    for (const issue of issues) {
      logger.log(`🔧 Attempting to resolve: ${issue.type}`);
      
      try {
        const resolved = await this.resolveIssue(issue);
        
        const resolutionRecord = {
          type: issue.type,
          severity: issue.severity,
          resolved: resolved,
          timestamp: new Date(),
          details: issue.details
        };
        
        this.resolutionHistory.push(resolutionRecord);
        
        // Keep only last 100 resolution records
        if (this.resolutionHistory.length > 100) {
          this.resolutionHistory = this.resolutionHistory.slice(-100);
        }
        
        if (resolved) {
          logger.log(`✅ Successfully resolved: ${issue.type}`);
          await this.logError('ISSUE_RESOLVED', `Automatically resolved ${issue.type}`, {
            issue: issue,
            resolution: resolutionRecord
          });
        } else {
          logger.log(`❌ Failed to resolve: ${issue.type}`);
          await this.logError('RESOLUTION_FAILED', `Failed to resolve ${issue.type}`, {
            issue: issue
          });
        }
      } catch (resolutionError) {
        logger.error(`💥 Error while resolving ${issue.type}:`, resolutionError);
        await this.logError('RESOLUTION_ERROR', `Error during resolution of ${issue.type}`, {
          issue: issue,
          error: resolutionError.stack
        });
      }
    }
  }

  /**
   * Resolve a specific issue
   */
  async resolveIssue(issue) {
    switch (issue.type) {
      case 'HIGH_MEMORY_USAGE':
        return await this.resolveHighMemoryUsage();
      
      case 'HIGH_PROCESS_MEMORY':
        return await this.resolveHighProcessMemory();
      
      case 'HIGH_ERROR_RATE':
        return await this.resolveHighErrorRate();
      
      case 'DATABASE_CONNECTION_FAILED':
        return await this.resolveDatabaseConnection();
      
      case 'DISK_ACCESS_FAILED':
        return await this.resolveDiskAccess();
      
      default:
        logger.log(`⚠️ No resolution strategy for issue type: ${issue.type}`);
        return false;
    }
  }

  /**
   * Resolve high memory usage
   */
  async resolveHighMemoryUsage() {
    try {
      logger.log('🧠 Attempting to resolve high memory usage...');
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        logger.log('🗑️ Forced garbage collection');
      }
      
      // Clear any large caches
      if (global.appCache) {
        global.appCache.clear();
        logger.log('🗑️ Cleared application cache');
      }
      
      // Wait a moment and check if memory usage improved
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const newMemoryUsage = process.memoryUsage();
      const improvement = this.systemMetrics.memory.process.heapUsed - newMemoryUsage.heapUsed;
      
      if (improvement > 0) {
        logger.log(`🧠 Memory usage improved by ${(improvement / 1024 / 1024).toFixed(2)}MB`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Failed to resolve high memory usage:', error);
      return false;
    }
  }

  /**
   * Resolve high process memory
   */
  async resolveHighProcessMemory() {
    try {
      logger.log('⚡ Attempting to resolve high process memory...');
      
      // Similar to high memory usage but more aggressive
      if (global.gc) {
        // Run GC multiple times
        for (let i = 0; i < 3; i++) {
          global.gc();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Clear require cache for non-essential modules
      const initialModules = Object.keys(require.cache).length;
      Object.keys(require.cache).forEach(key => {
        if (key.includes('node_modules') && !key.includes('express') && !key.includes('mongoose')) {
          delete require.cache[key];
        }
      });
      
      const clearedModules = initialModules - Object.keys(require.cache).length;
      if (clearedModules > 0) {
        logger.log(`🗑️ Cleared ${clearedModules} cached modules`);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to resolve high process memory:', error);
      return false;
    }
  }

  /**
   * Resolve high error rate
   */
  async resolveHighErrorRate() {
    try {
      logger.log('🚨 Attempting to resolve high error rate...');
      
      // Analyze recent errors to identify patterns
      const recentErrors = await this.getRecentErrors();
      const errorPatterns = this.analyzeErrorPatterns(recentErrors);
      
      logger.log('📊 Error patterns identified:', errorPatterns);
      
      // Implement circuit breaker pattern for failing endpoints
      if (errorPatterns.apiErrors > 5) {
        logger.log('🔌 Implementing temporary circuit breaker for API endpoints');
        // This would integrate with your API middleware
        global.circuitBreakerActive = true;
        
        // Reset circuit breaker after 5 minutes
        setTimeout(() => {
          global.circuitBreakerActive = false;
          logger.log('🔌 Circuit breaker reset');
        }, 300000);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to resolve high error rate:', error);
      return false;
    }
  }

  /**
   * Resolve database connection issues
   */
  async resolveDatabaseConnection() {
    try {
      logger.log('🗄️ Attempting to resolve database connection...');
      
      // Try to reconnect to database
      const mongoose = require('mongoose');
      
      if (mongoose.connection.readyState !== 1) {
        logger.log('🔄 Attempting database reconnection...');
        await mongoose.connection.close();
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/websiteapp');
        logger.log('✅ Database reconnected successfully');
        return true;
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to resolve database connection:', error);
      return false;
    }
  }

  /**
   * Resolve disk access issues
   */
  async resolveDiskAccess() {
    try {
      logger.log('💾 Attempting to resolve disk access issues...');
      
      // Check if we can create a temporary file
      const tempFile = path.join(os.tmpdir(), `health-check-${Date.now()}.tmp`);
      await fs.writeFile(tempFile, 'health check');
      await fs.unlink(tempFile);
      
      logger.log('✅ Disk access restored');
      return true;
    } catch (error) {
      logger.error('Failed to resolve disk access:', error);
      return false;
    }
  }

  /**
   * Get recent errors from database
   */
  async getRecentErrors() {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000);
      return await ErrorLog.find({
        timestamp: { $gte: oneHourAgo }
      }).sort({ timestamp: -1 }).limit(100);
    } catch (error) {
      logger.error('Failed to get recent errors:', error);
      return [];
    }
  }

  /**
   * Analyze error patterns
   */
  analyzeErrorPatterns(errors) {
    const patterns = {
      total: errors.length,
      apiErrors: 0,
      databaseErrors: 0,
      authErrors: 0,
      networkErrors: 0,
      unknownErrors: 0
    };

    errors.forEach(error => {
      const message = error.message.toLowerCase();
      
      if (message.includes('api') || message.includes('endpoint') || message.includes('route')) {
        patterns.apiErrors++;
      } else if (message.includes('database') || message.includes('mongo') || message.includes('connection')) {
        patterns.databaseErrors++;
      } else if (message.includes('auth') || message.includes('token') || message.includes('unauthorized')) {
        patterns.authErrors++;
      } else if (message.includes('network') || message.includes('timeout') || message.includes('econnrefused')) {
        patterns.networkErrors++;
      } else {
        patterns.unknownErrors++;
      }
    });

    return patterns;
  }

  /**
   * Log health status
   */
  async logHealthStatus(issues) {
    const healthStatus = {
      timestamp: new Date(),
      status: issues.length === 0 ? 'HEALTHY' : 'ISSUES_DETECTED',
      metrics: this.systemMetrics,
      issues: issues,
      resolutionHistory: this.resolutionHistory.slice(-10) // Last 10 resolutions
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.log('📊 Health Status:', JSON.stringify(healthStatus, null, 2));
    }

    // Store health status (you could save this to database or file)
    global.lastHealthStatus = healthStatus;
  }

  /**
   * Log error to database
   */
  async logError(type, message, metadata = {}) {
    try {
      const errorLog = new ErrorLog({
        message: `[${type}] ${message}`,
        stack: metadata.error || '',
        url: 'system',
        method: 'SYSTEM',
        userAgent: 'ErrorMonitoringService',
        ip: 'localhost',
        userId: null,
        metadata: metadata,
        resolved: false,
        timestamp: new Date()
      });

      await errorLog.save();
    } catch (error) {
      logger.error('Failed to log error to database:', error);
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      isMonitoring: this.isMonitoring,
      autoResolutionEnabled: this.autoResolutionEnabled,
      metrics: this.systemMetrics,
      resolutionHistory: this.resolutionHistory.slice(-10),
      lastHealthCheck: global.lastHealthStatus?.timestamp
    };
  }

  /**
   * Enable/disable auto-resolution
   */
  setAutoResolution(enabled) {
    this.autoResolutionEnabled = enabled;
    logger.log(`🤖 Auto-resolution ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create singleton instance
const errorMonitoringService = new ErrorMonitoringService();

module.exports = errorMonitoringService;