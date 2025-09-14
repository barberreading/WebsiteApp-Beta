const express = require('express');
const router = express.Router();
const errorMonitoringService = require('../services/errorMonitoringService');
const { logError } = require('../utils/errorLogger');
const auth = require('../middleware/auth');

/**
 * @route   GET /api/monitoring/status
 * @desc    Get current system monitoring status
 * @access  Private (Admin)
 */
router.get('/status', auth, async (req, res) => {
  try {
    // Check if user has admin privileges (you may need to adjust this based on your user model)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const systemStatus = errorMonitoringService.getSystemStatus();
    
    res.json({
      success: true,
      data: systemStatus,
      timestamp: new Date().toISOString()
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
});

/**
 * @route   POST /api/monitoring/auto-resolution
 * @desc    Enable or disable automatic error resolution
 * @access  Private (Admin)
 */
router.post('/auto-resolution', auth, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

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
});

/**
 * @route   POST /api/monitoring/health-check
 * @desc    Trigger manual health check
 * @access  Private (Admin)
 */
router.post('/health-check', auth, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

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
});

/**
 * @route   GET /api/monitoring/metrics
 * @desc    Get detailed system metrics
 * @access  Private (Admin)
 */
router.get('/metrics', auth, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

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
    
    res.json({
      success: true,
      data: {
        ...systemStatus,
        processMetrics: processMetrics,
        nodeEnv: process.env.NODE_ENV,
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
});

/**
 * @route   GET /api/monitoring/resolution-history
 * @desc    Get error resolution history
 * @access  Private (Admin)
 */
router.get('/resolution-history', auth, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    const { limit = 50 } = req.query;
    const systemStatus = errorMonitoringService.getSystemStatus();
    
    const resolutionHistory = systemStatus.resolutionHistory || [];
    const limitedHistory = resolutionHistory.slice(-parseInt(limit));
    
    res.json({
      success: true,
      data: {
        history: limitedHistory,
        total: resolutionHistory.length,
        showing: limitedHistory.length
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
});

/**
 * @route   POST /api/monitoring/start
 * @desc    Start error monitoring service
 * @access  Private (Admin)
 */
router.post('/start', auth, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    await errorMonitoringService.startMonitoring();
    
    await logError('MONITORING_STARTED', 'Error monitoring service started by admin', {
      userId: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Error monitoring service started successfully'
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
});

/**
 * @route   POST /api/monitoring/stop
 * @desc    Stop error monitoring service
 * @access  Private (Admin)
 */
router.post('/stop', auth, async (req, res) => {
  try {
    // Check if user has admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    errorMonitoringService.stopMonitoring();
    
    await logError('MONITORING_STOPPED', 'Error monitoring service stopped by admin', {
      userId: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Error monitoring service stopped successfully'
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
});

module.exports = router;