const asyncHandler = require('../../middleware/async');
const dashboardService = require('./dashboard.services');

exports.getStats = asyncHandler(async (req, res) => {
    const stats = await dashboardService.getStats(req.user);
    res.status(200).json({
        success: true,
        data: stats
    });
});