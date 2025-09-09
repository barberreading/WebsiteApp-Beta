const timesheetNotificationsService = require('./timesheet-notifications.services');

const getNotifications = (req, res) => {
  const notifications = timesheetNotificationsService.getNotifications();
  res.json(notifications);
};

module.exports = {
    getNotifications
};