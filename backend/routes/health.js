/**
 * Health Check Endpoint
 * Provides server status information for the frontend status indicator
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        database: 'unknown',
        server: 'healthy'
      }
    };

    // Check database connectivity
    try {
      await new Promise((resolve, reject) => {
        db.get('SELECT 1', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      healthStatus.services.database = 'healthy';
    } catch (dbError) {
      console.error('Database health check failed:', dbError);
      healthStatus.services.database = 'unhealthy';
      healthStatus.status = 'degraded';
    }

    // Return appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error',
      services: {
        database: 'unknown',
        server: 'unhealthy'
      }
    });
  }
});

// Detailed health check with more information
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
      platform: process.platform,
      services: {
        database: 'unknown',
        server: 'healthy'
      },
      checks: []
    };

    // Database connectivity check
    try {
      const dbStart = Date.now();
      await new Promise((resolve, reject) => {
        db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      const dbTime = Date.now() - dbStart;
      
      detailedHealth.services.database = 'healthy';
      detailedHealth.checks.push({
        name: 'database_connectivity',
        status: 'pass',
        responseTime: `${dbTime}ms`
      });
    } catch (dbError) {
      console.error('Database detailed check failed:', dbError);
      detailedHealth.services.database = 'unhealthy';
      detailedHealth.status = 'degraded';
      detailedHealth.checks.push({
        name: 'database_connectivity',
        status: 'fail',
        error: dbError.message
      });
    }

    // Memory usage check
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    detailedHealth.checks.push({
      name: 'memory_usage',
      status: memoryUsageMB < 500 ? 'pass' : 'warn',
      value: `${Math.round(memoryUsageMB)}MB`
    });

    // Uptime check
    detailedHealth.checks.push({
      name: 'uptime',
      status: 'pass',
      value: `${Math.round(process.uptime())}s`
    });

    const statusCode = detailedHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);

  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Internal server error'
    });
  }
});

module.exports = router;