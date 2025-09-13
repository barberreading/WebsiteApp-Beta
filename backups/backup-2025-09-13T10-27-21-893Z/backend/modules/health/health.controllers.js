const healthService = require('./health.services');

const healthCheck = async (req, res) => {
    const health = await healthService.healthCheck();
    res.status(200).json(health);
};

module.exports = {
    healthCheck
};