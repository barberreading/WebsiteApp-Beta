const staffSearchService = require('./staff-search.services');

exports.searchStaffByDistance = async (req, res) => {
  try {
    const staff = await staffSearchService.searchStaffByDistance(req.query);
    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server Error'
    });
  }
};

exports.updateStaffLocation = async (req, res) => {
  try {
    const user = await staffSearchService.updateStaffLocation(
      req.body.userId,
      req.user,
      req.body
    );
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server Error'
    });
  }
};