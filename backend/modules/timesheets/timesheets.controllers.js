const timesheetService = require('./timesheets.services.js');

exports.checkTimesheetLock = (req, res, next) => {
    if (timesheetService.checkTimesheetLock(req.user, req.body.date)) {
        next();
    } else {
        res.status(403).json({
            msg: 'Timesheet is locked. Previous week timesheets are locked after Monday 10 AM.'
        });
    }
};

exports.updateTimesheet = async (req, res) => {
    try {
        const timesheet = await timesheetService.updateTimesheet(req.params.id, req.user, req.body);
        res.json(timesheet);
    } catch (err) {
        logger.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.clockIn = async (req, res) => {
    try {
        const timesheet = await timesheetService.clockIn(req.user.id, req.body);
        res.json(timesheet);
    } catch (err) {
        logger.error('Error clocking in:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.clockOut = async (req, res) => {
    try {
        const timesheet = await timesheetService.clockOut(req.user.id, req.body);
        res.json(timesheet);
    } catch (err) {
        logger.error('Error clocking out:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getCurrentStatus = async (req, res) => {
    try {
        const status = await timesheetService.getCurrentStatus(req.user.id);
        res.json(status);
    } catch (err) {
        logger.error('Error getting clock status:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.bulkUpload = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }
        const results = await timesheetService.bulkUpload(req.file, req.user.id);
        res.json({ success: true, message: 'Bulk upload processed', results });
    } catch (err) {
        logger.error('Bulk upload error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getLockSettings = (req, res) => {
    try {
        const settings = timesheetService.getLockSettings();
        res.json(settings);
    } catch (err) {
        logger.error('Error getting lock settings:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateLockSettings = (req, res) => {
    const settings = timesheetService.updateLockSettings(req.body);
    res.json(settings);
};

exports.overrideTimesheet = async (req, res) => {
    try {
        const timesheet = await timesheetService.overrideTimesheet(req.params.id, req.user.id);
        res.json(timesheet);
    } catch (err) {
        logger.error('Error overriding timesheet:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getClientApprovalTimesheets = async (req, res) => {
    try {
        const timesheets = await timesheetService.getClientApprovalTimesheets(req.user.id);
        res.json(timesheets);
    } catch (err) {
        logger.error('Error getting client approval timesheets:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.clientApproveTimesheet = async (req, res) => {
    try {
        const timesheet = await timesheetService.clientApproveTimesheet(req.params.id, req.user.id, req.body);
        res.json(timesheet);
    } catch (err) {
        logger.error('Error approving timesheet:', err.message);
        res.status(500).send('Server Error');
    }
};