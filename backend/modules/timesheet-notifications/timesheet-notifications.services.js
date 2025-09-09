const getNotifications = () => {
  // Return test notifications
  const testNotifications = [
    {
      _id: 'test-notification-1',
      type: 'reminder',
      title: 'Timesheet Reminder',
      message: 'Don\'t forget to submit your timesheets for this week.',
      date: new Date().toISOString(),
      actionLink: '/timesheets',
      actionText: 'View Timesheets'
    },
    {
      _id: 'test-notification-2',
      type: 'submission',
      title: 'Pending Submission',
      message: 'You have timesheets that need to be submitted.',
      date: new Date().toISOString(),
      actionLink: '/timesheets',
      actionText: 'Submit Now'
    },
    {
      _id: 'test-notification-3',
      type: 'lockout',
      title: 'Timesheet Lockout Warning',
      message: 'All timesheets for last week will be locked tomorrow at 10 AM.',
      date: new Date().toISOString(),
      actionLink: '/timesheets',
      actionText: 'View Timesheets'
    }
  ];
  
  return testNotifications;
};

module.exports = {
    getNotifications
};