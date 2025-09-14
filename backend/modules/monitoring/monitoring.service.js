const errorMonitoringService = require('../../services/errorMonitoringService');
const { logError } = require('../../utils/errorLogger');

class MonitoringService {
  /**
   * Get comprehensive system status
   */
  static getSystemStatus() {
    try {
      const baseStatus = errorMonitoringService.getSystemStatus();
      
      return {
        ...baseStatus,
        serverInfo: {
          uptime: process.uptime(),
          version: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          nodeEnv: process.env.NODE_ENV
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system status:', error);
      throw new Error('Failed to retrieve system status');
    }
  }

  /**
   * Get detailed system metrics including performance data
   */
  static getDetailedMetrics() {
    try {
      const systemStatus = this.getSystemStatus();
      
      // Get memory usage details
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
        external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
      };
      
      // Get CPU usage
      const cpuUsage = process.cpuUsage();
      
      // Get resource usage (if available)
      const resourceUsage = process.resourceUsage ? process.resourceUsage() : null;
      
      return {
        systemStatus,
        performance: {
          memoryUsage: memoryUsageMB,
          cpuUsage,
          resourceUsage,
          uptime: process.uptime()
        },
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          architecture: process.arch,
          processId: process.pid,
          nodeEnv: process.env.NODE_ENV,
          port: process.env.PORT || 3001
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting detailed metrics:', error);
      throw new Error('Failed to retrieve detailed metrics');
    }
  }

  /**
   * Analyze error patterns and trends
   */
  static analyzeErrorPatterns(timeframe = '24h') {
    try {
      const systemStatus = errorMonitoringService.getSystemStatus();
      const resolutionHistory = systemStatus.resolutionHistory || [];
      
      // Calculate timeframe in milliseconds
      const timeframes = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const timeframeMs = timeframes[timeframe] || timeframes['24h'];
      const cutoffTime = Date.now() - timeframeMs;
      
      // Filter recent errors
      const recentErrors = resolutionHistory.filter(entry => 
        new Date(entry.timestamp).getTime() > cutoffTime
      );
      
      // Analyze error patterns
      const errorsByType = {};
      const errorsByHour = {};
      const resolutionSuccess = { resolved: 0, failed: 0 };
      
      recentErrors.forEach(entry => {
        // Group by error type
        const errorType = entry.errorType || 'Unknown';
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        
        // Group by hour
        const hour = new Date(entry.timestamp).getHours();
        errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
        
        // Track resolution success
        if (entry.resolved) {
          resolutionSuccess.resolved++;
        } else {
          resolutionSuccess.failed++;
        }
      });
      
      // Calculate resolution rate
      const totalErrors = recentErrors.length;
      const resolutionRate = totalErrors > 0 
        ? (resolutionSuccess.resolved / totalErrors * 100).toFixed(2)
        : 0;
      
      // Find most common error types
      const sortedErrorTypes = Object.entries(errorsByType)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      return {
        timeframe,
        summary: {
          totalErrors,
          resolvedErrors: resolutionSuccess.resolved,
          failedResolutions: resolutionSuccess.failed,
          resolutionRate: parseFloat(resolutionRate)
        },
        patterns: {
          errorsByType,
          errorsByHour,
          topErrorTypes: sortedErrorTypes
        },
        trends: {
          averageErrorsPerHour: totalErrors / (timeframeMs / (60 * 60 * 1000)),
          peakErrorHour: Object.entries(errorsByHour)
            .reduce((max, [hour, count]) => count > max.count ? { hour, count } : max, { hour: 0, count: 0 })
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing error patterns:', error);
      throw new Error('Failed to analyze error patterns');
    }
  }

  /**
   * Get health check summary
   */
  static async getHealthSummary() {
    try {
      // Perform health check
      await errorMonitoringService.performHealthCheck();
      
      const systemStatus = errorMonitoringService.getSystemStatus();
      
      return {
        overall: systemStatus.systemHealth || 'unknown',
        components: {
          monitoring: systemStatus.isMonitoring ? 'healthy' : 'stopped',
          autoResolution: systemStatus.autoResolutionEnabled ? 'enabled' : 'disabled',
          errorCount: systemStatus.errorCount || 0,
          lastCheck: systemStatus.lastHealthCheck || null
        },
        recommendations: this.generateHealthRecommendations(systemStatus),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting health summary:', error);
      throw new Error('Failed to get health summary');
    }
  }

  /**
   * Generate health recommendations based on system status
   */
  static generateHealthRecommendations(systemStatus) {
    const recommendations = [];
    
    try {
      // Check if monitoring is running
      if (!systemStatus.isMonitoring) {
        recommendations.push({
          type: 'warning',
          message: 'Error monitoring service is not running',
          action: 'Start the monitoring service to enable automatic error detection'
        });
      }
      
      // Check auto-resolution status
      if (!systemStatus.autoResolutionEnabled) {
        recommendations.push({
          type: 'info',
          message: 'Automatic error resolution is disabled',
          action: 'Enable auto-resolution to automatically fix common errors'
        });
      }
      
      // Check error count
      const errorCount = systemStatus.errorCount || 0;
      if (errorCount > 10) {
        recommendations.push({
          type: 'warning',
          message: `High error count detected (${errorCount} errors)`,
          action: 'Review error logs and consider investigating recurring issues'
        });
      }
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
      if (heapUsedMB > 500) {
        recommendations.push({
          type: 'warning',
          message: `High memory usage detected (${Math.round(heapUsedMB)}MB)`,
          action: 'Monitor memory usage and consider optimizing application performance'
        });
      }
      
      // Check uptime
      const uptimeHours = process.uptime() / 3600;
      if (uptimeHours > 24 * 7) { // More than a week
        recommendations.push({
          type: 'info',
          message: `Server has been running for ${Math.round(uptimeHours)} hours`,
          action: 'Consider scheduling regular restarts to ensure optimal performance'
        });
      }
      
      // If no issues found
      if (recommendations.length === 0) {
        recommendations.push({
          type: 'success',
          message: 'System is running optimally',
          action: 'Continue monitoring for any changes in system health'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [{
        type: 'error',
        message: 'Unable to generate health recommendations',
        action: 'Check system logs for more information'
      }];
    }
  }

  /**
   * Export system data for analysis
   */
  static exportSystemData(format = 'json') {
    try {
      const systemStatus = this.getSystemStatus();
      const metrics = this.getDetailedMetrics();
      const errorAnalysis = this.analyzeErrorPatterns('7d');
      
      const exportData = {
        exportTimestamp: new Date().toISOString(),
        systemStatus,
        metrics,
        errorAnalysis,
        metadata: {
          version: '1.0',
          format,
          generatedBy: 'WebsiteApp Error Monitoring System'
        }
      };
      
      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      }
      
      // For other formats, return the raw data object
      return exportData;
    } catch (error) {
      console.error('Error exporting system data:', error);
      throw new Error('Failed to export system data');
    }
  }
}

module.exports = MonitoringService;