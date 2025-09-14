const mongoose = require('mongoose');

exports.healthCheck = async () => {
    try {
        const healthStatus = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                unit: 'MB'
            },
            services: {
                database: 'unknown',
                server: 'healthy'
            }
        };

        // Check database connectivity
        try {
            if (mongoose.connection.readyState === 1) {
                // Test a simple query
                await mongoose.connection.db.admin().ping();
                healthStatus.services.database = 'healthy';
            } else {
                healthStatus.services.database = 'disconnected';
                healthStatus.status = 'degraded';
            }
        } catch (dbError) {
            logger.error('Database health check failed:', dbError);
            healthStatus.services.database = 'unhealthy';
            healthStatus.status = 'degraded';
        }

        return healthStatus;

    } catch (error) {
        logger.error('Health check error:', error);
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Internal server error',
            services: {
                database: 'unknown',
                server: 'unhealthy'
            }
        };
    }
};

exports.detailedHealthCheck = async () => {
    try {
        const basicHealth = await exports.healthCheck();
        
        const detailedHealth = {
            ...basicHealth,
            version: process.version,
            platform: process.platform,
            cpu: process.cpuUsage(),
            checks: []
        };

        // Memory usage check
        const memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
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

        // Database connectivity check
        if (mongoose.connection.readyState === 1) {
            detailedHealth.checks.push({
                name: 'database_connectivity',
                status: 'pass',
                value: 'Connected'
            });
        } else {
            detailedHealth.checks.push({
                name: 'database_connectivity',
                status: 'fail',
                value: 'Disconnected'
            });
        }

        return detailedHealth;

    } catch (error) {
        logger.error('Detailed health check error:', error);
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Internal server error'
        };
    }
};