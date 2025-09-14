const errorMonitoringService = require('../../services/errorMonitoringService');
const { logError } = require('../../utils/errorLogger');

class MonitoringController {
  /**
   * Get current system monitoring status
   */
  static async getStatus(req, res) {
    try {
      const systemStatus = errorMonitoringService.getSystemStatus();
      
      res.json({
        success: true,
        data: {
          ...systemStatus,
          serverUptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting monitoring status:', error);
      await logError('MONITORING_STATUS_ERROR', error.message, {
        userId: req.user?.id,
        error: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get monitoring status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Toggle automatic error resolution
   */
  static async toggleAutoResolution(req, res) {
    try {
      const { enabled } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Invalid input. "enabled" must be a boolean value.'
        });
      }

      errorMonitoringService.setAutoResolution(enabled);
      
      await logError('AUTO_RESOLUTION_CHANGED', `Auto-resolution ${enabled ? 'enabled' : 'disabled'} by admin`, {
        userId: req.user.id,
        enabled: enabled
      });
      
      res.json({
        success: true,
        message: `Auto-resolution ${enabled ? 'enabled' : 'disabled'} successfully`,
        autoResolutionEnabled: enabled
      });
    } catch (error) {
      console.error('Error toggling auto-resolution:', error);
      await logError('AUTO_RESOLUTION_TOGGLE_ERROR', error.message, {
        userId: req.user?.id,
        error: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to toggle auto-resolution',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Trigger manual health check
   */
  static async performHealthCheck(req, res) {
    try {
      // Trigger manual health check
      await errorMonitoringService.performHealthCheck();
      
      const systemStatus = errorMonitoringService.getSystemStatus();
      
      await logError('MANUAL_HEALTH_CHECK', 'Manual health check triggered by admin', {
        userId: req.user.id,
        systemStatus: systemStatus
      });
      
      res.json({
        success: true,
        message: 'Health check completed successfully',
        data: systemStatus
      });
    } catch (error) {
      console.error('Error performing manual health check:', error);
      await logError('MANUAL_HEALTH_CHECK_ERROR', error.message, {
        userId: req.user?.id,
        error: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to perform health check',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get detailed system metrics
   */
  static async getMetrics(req, res) {
    try {
      const systemStatus = errorMonitoringService.getSystemStatus();
      
      // Add additional Node.js process metrics
      const processMetrics = {
        uptime: process.uptime(),
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        resourceUsage: process.resourceUsage ? process.resourceUsage() : null
      };
      
      // Get environment information
      const environmentInfo = {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || 3001,
        mongoUri: process.env.MONGODB_URI ? 'Connected' : 'Not configured',
        jwtSecret: process.env.JWT_SECRET ? 'Configured' : 'Not configured'
      };
      
      res.json({
        success: true,
        data: {
          systemStatus,
          processMetrics,
          environmentInfo,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error getting system metrics:', error);
      await logError('METRICS_ERROR', error.message, {
        userId: req.user?.id,
        error: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get system metrics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get error resolution history
   */
  static async getResolutionHistory(req, res) {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const systemStatus = errorMonitoringService.getSystemStatus();
      
      const resolutionHistory = systemStatus.resolutionHistory || [];
      const startIndex = Math.max(0, resolutionHistory.length - parseInt(limit) - parseInt(offset));
      const endIndex = resolutionHistory.length - parseInt(offset);
      const paginatedHistory = resolutionHistory.slice(startIndex, endIndex).reverse();
      
      res.json({
        success: true,
        data: {
          history: paginatedHistory,
          total: resolutionHistory.length,
          showing: paginatedHistory.length,
          hasMore: startIndex > 0
        }
      });
    } catch (error) {
      console.error('Error getting resolution history:', error);
      await logError('RESOLUTION_HISTORY_ERROR', error.message, {
        userId: req.user?.id,
        error: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get resolution history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Start error monitoring service
   */
  static async startMonitoring(req, res) {
    try {
      await errorMonitoringService.startMonitoring();
      
      await logError('MONITORING_STARTED', 'Error monitoring service started by admin', {
        userId: req.user.id
      });
      
      res.json({
        success: true,
        message: 'Error monitoring service started successfully',
        status: errorMonitoringService.getSystemStatus()
      });
    } catch (error) {
      console.error('Error starting monitoring service:', error);
      await logError('MONITORING_START_ERROR', error.message, {
        userId: req.user?.id,
        error: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to start monitoring service',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Stop error monitoring service
   */
  static async stopMonitoring(req, res) {
    try {
      errorMonitoringService.stopMonitoring();
      
      await logError('MONITORING_STOPPED', 'Error monitoring service stopped by admin', {
        userId: req.user.id
      });
      
      res.json({
        success: true,
        message: 'Error monitoring service stopped successfully',
        status: errorMonitoringService.getSystemStatus()
      });
    } catch (error) {
      console.error('Error stopping monitoring service:', error);
      await logError('MONITORING_STOP_ERROR', error.message, {
        userId: req.user?.id,
        error: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to stop monitoring service',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get error statistics and trends
   */
  static async getErrorStatistics(req, res) {
    try {
      const { timeframe = '24h' } = req.query;
      const systemStatus = errorMonitoringService.getSystemStatus();
      
      // Calculate timeframe in milliseconds
      const timeframes = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      const timeframeMs = timeframes[timeframe] || timeframes['24h'];
      const cutoffTime = Date.now() - timeframeMs;
      
      const recentHistory = (systemStatus.resolutionHistory || [])
        .filter(entry => new Date(entry.timestamp).getTime() > cutoffTime);
      
      // Group errors by type
      const errorsByType = {};
      const resolutionsByType = {};
      
      recentHistory.forEach(entry => {
        const errorType = entry.errorType || 'Unknown';
        errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
        
        if (entry.resolved) {
          resolutionsByType[errorType] = (resolutionsByType[errorType] || 0) + 1;
        }
      });
      
      const statistics = {
        timeframe,
        totalErrors: recentHistory.length,
        resolvedErrors: recentHistory.filter(e => e.resolved).length,
        resolutionRate: recentHistory.length > 0 
          ? (recentHistory.filter(e => e.resolved).length / recentHistory.length * 100).toFixed(2)
          : 0,
        errorsByType,
        resolutionsByType,
        systemHealth: systemStatus.systemHealth || 'unknown'
      };
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Error getting error statistics:', error);
      await logError('ERROR_STATISTICS_ERROR', error.message, {
        userId: req.user?.id,
        error: error.stack
      });
      
      res.status(500).json({
        success: false,
        message: 'Failed to get error statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = MonitoringController;