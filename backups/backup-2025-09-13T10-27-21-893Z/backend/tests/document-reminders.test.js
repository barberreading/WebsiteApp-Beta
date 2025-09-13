const documentRemindersService = require('../modules/document-reminders/document-reminders.services');
const StaffDocument = require('../models/StaffDocument');
const emailService = require('../modules/email/email.services');

jest.mock('../models/StaffDocument');
jest.mock('../modules/email/email.services');

describe('Document Reminders Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDocumentReminders', () => {
    it('should send reminders for expiring documents', async () => {
      const mockDocuments = [
        {
          _id: 'doc1',
          title: 'Test Doc 1',
          expiryDate: new Date(),
          reminderSent: false,
          userId: { email: 'user1@test.com', name: 'User1' },
          save: jest.fn(),
        },
      ];
      StaffDocument.find.mockResolvedValue(mockDocuments);

      const result = await documentRemindersService.checkDocumentReminders();

      expect(result.success).toBe(true);
      expect(result.count).toBe(1);
      expect(emailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockDocuments[0].save).toHaveBeenCalled();
    });
  });

  describe('resetReminderFlags', () => {
    it('should reset reminder flags for valid documents', async () => {
      StaffDocument.updateMany.mockResolvedValue({ modifiedCount: 5 });

      const result = await documentRemindersService.resetReminderFlags();

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
    });
  });
});