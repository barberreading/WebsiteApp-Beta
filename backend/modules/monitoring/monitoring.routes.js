const express = require('express');
const router = express.Router();
const MonitoringController = require('./monitoring.controller');
const { protect, authorize } = require('../../middleware/auth');

// Middleware to check superuser privileges only
const requireSuperuser = authorize('superuser');

/**
 * @route   GET /api/monitoring/status
 * @desc    Get current system monitoring status
 * @access  Private (Superuser)
 */
router.get('/status', protect, requireSuperuser, MonitoringController.getStatus);

/**
 * @route   POST /api/monitoring/auto-resolution
 * @desc    Enable or disable automatic error resolution
 * @access  Private (Superuser)
 */
router.post('/auto-resolution', protect, requireSuperuser, MonitoringController.toggleAutoResolution);

/**
 * @route   POST /api/monitoring/health-check
 * @desc    Trigger manual health check
 * @access  Private (Superuser)
 */
router.post('/health-check', protect, requireSuperuser, MonitoringController.performHealthCheck);

/**
 * @route   GET /api/monitoring/metrics
 * @desc    Get detailed system metrics
 * @access  Private (Superuser)
 */
router.get('/metrics', protect, requireSuperuser, MonitoringController.getMetrics);

/**
 * @route   GET /api/monitoring/resolution-history
 * @desc    Get error resolution history
 * @access  Private (Superuser)
 */
router.get('/resolution-history', protect, requireSuperuser, MonitoringController.getResolutionHistory);

/**
 * @route   POST /api/monitoring/start
 * @desc    Start error monitoring service
 * @access  Private (Superuser)
 */
router.post('/start', protect, requireSuperuser, MonitoringController.startMonitoring);

/**
 * @route   POST /api/monitoring/stop
 * @desc    Stop error monitoring service
 * @access  Private (Superuser)
 */
router.post('/stop', protect, requireSuperuser, MonitoringController.stopMonitoring);

/**
 * @route   GET /api/monitoring/statistics
 * @desc    Get error statistics and trends
 * @access  Private (Superuser)
 */
router.get('/statistics', protect, requireSuperuser, MonitoringController.getErrorStatistics);

module.exports = router;