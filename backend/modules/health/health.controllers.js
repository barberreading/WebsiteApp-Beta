const healthService = require('./health.services');

const healthCheck = async (req, res) => {
    try {
        const health = await healthService.healthCheck();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error) {
        logger.error('Health check controller error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed'
        });
    }
};

const detailedHealthCheck = async (req, res) => {
    try {
        const health = await healthService.detailedHealthCheck();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error) {
        logger.error('Detailed health check controller error:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Detailed health check failed'
        });
    }
};

module.exports = {
    healthCheck,
    detailedHealthCheck
};