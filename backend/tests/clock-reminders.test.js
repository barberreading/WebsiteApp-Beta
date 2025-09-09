const clockRemindersService = require('../modules/clock-reminders/clock-reminders.services');
const Booking = require('../models/Booking');
const emailService = require('../modules/email/email.services.js');
const logger = require('../modules/logging/logging.services');

jest.mock('../models/Booking');
jest.mock('../modules/email/email.services.js');
jest.mock('../modules/logging/logging.services');

describe('Clock Reminders Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendClockInReminders', () => {
    it('should send clock-in reminders for upcoming bookings', async () => {
      const mockBookings = [
        {
          staff: { email: 'staff1@test.com', firstName: 'Staff1' },
          client: { name: 'Client1' },
          startTime: new Date(),
        },
      ];
      Booking.find.mockResolvedValue(mockBookings);

      const result = await clockRemindersService.sendClockInReminders();

      expect(result.success).toBe(true);
      expect(result.remindersSent).toBe(1);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('sendClockOutReminders', () => {
    it('should send clock-out reminders for completed bookings', async () => {
      const mockBookings = [
        {
          staff: { email: 'staff1@test.com', firstName: 'Staff1' },
          client: { name: 'Client1' },
          endTime: new Date(),
        },
      ];
      Booking.find.mockResolvedValue(mockBookings);

      const result = await clockRemindersService.sendClockOutReminders();

      expect(result.success).toBe(true);
      expect(result.remindersSent).toBe(1);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalled();
    });
  });
});