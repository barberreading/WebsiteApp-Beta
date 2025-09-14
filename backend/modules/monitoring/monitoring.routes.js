const express = require('express');
const router = express.Router();
const MonitoringController = require('./monitoring.controller');
const auth = require('../../middleware/auth');

// Middleware to check admin privileges
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superuser') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

/**
 * @route   GET /api/monitoring/status
 * @desc    Get current system monitoring status
 * @access  Private (Admin)
 */
router.get('/status', auth, requireAdmin, MonitoringController.getStatus);

/**
 * @route   POST /api/monitoring/auto-resolution
 * @desc    Enable or disable automatic error resolution
 * @access  Private (Admin)
 */
router.post('/auto-resolution', auth, requireAdmin, MonitoringController.toggleAutoResolution);

/**
 * @route   POST /api/monitoring/health-check
 * @desc    Trigger manual health check
 * @access  Private (Admin)
 */
router.post('/health-check', auth, requireAdmin, MonitoringController.performHealthCheck);

/**
 * @route   GET /api/monitoring/metrics
 * @desc    Get detailed system metrics
 * @access  Private (Admin)
 */
router.get('/metrics', auth, requireAdmin, MonitoringController.getMetrics);

/**
 * @route   GET /api/monitoring/resolution-history
 * @desc    Get error resolution history
 * @access  Private (Admin)
 */
router.get('/resolution-history', auth, requireAdmin, MonitoringController.getResolutionHistory);

/**
 * @route   POST /api/monitoring/start
 * @desc    Start error monitoring service
 * @access  Private (Admin)
 */
router.post('/start', auth, requireAdmin, MonitoringController.startMonitoring);

/**
 * @route   POST /api/monitoring/stop
 * @desc    Stop error monitoring service
 * @access  Private (Admin)
 */
router.post('/stop', auth, requireAdmin, MonitoringController.stopMonitoring);

/**
 * @route   GET /api/monitoring/statistics
 * @desc    Get error statistics and trends
 * @access  Private (Admin)
 */
router.get('/statistics', auth, requireAdmin, MonitoringController.getErrorStatistics);

module.exports = router;