const cronJobsService = require('../modules/cron-jobs/cron-jobs.services');
const User = require('../models/User');
const timesheetReminders = require('../utils/timesheetReminders.js');
const logger = require('../modules/logging/logging.services');

jest.mock('../models/User');
jest.mock('../utils/timesheetReminders.js');
jest.mock('../modules/logging/logging.services');

describe('Cron Jobs Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('runMissingTimesheetReminders', () => {
    it('should send reminders for missing timesheets', async () => {
      User.find.mockResolvedValue([{
        _id: 'staff1',
        role: 'staff',
        active: true
      }]);
      timesheetReminders.sendMissingTimesheetReminders.mockResolvedValue(true);

      const result = await cronJobsService.runMissingTimesheetReminders();

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('runClientApprovalReminders', () => {
    it('should send reminders for client approvals', async () => {
      timesheetReminders.sendClientApprovalReminders.mockResolvedValue(true);

      const result = await cronJobsService.runClientApprovalReminders();

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('runApprovalNotifications', () => {
    it('should send notifications for approvals', async () => {
      timesheetReminders.sendApprovalNotification.mockResolvedValue(true);

      const result = await cronJobsService.runApprovalNotifications();

      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
    });
  });
});