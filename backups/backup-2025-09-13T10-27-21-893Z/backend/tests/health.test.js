const { healthCheck } = require('../modules/health/health.services');

describe('Health Module', () => {
    it('should return a health check object', async () => {
        const health = await healthCheck();
        expect(health).toEqual({ status: 'ok', message: 'Server is running' });
    });
});