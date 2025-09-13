const fs = require('fs');
const csv = require('csv-parser');
const bulkImportService = require('../modules/bulk-import/bulk-import.services');
const Client = require('../models/Client');
const User = require('../models/User');

jest.mock('fs');
jest.mock('csv-parser');
jest.mock('../models/Client');
jest.mock('../models/User');

describe('Bulk Import Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTemplate', () => {
    it('should return client template', () => {
      const template = bulkImportService.getTemplate('clients');
      expect(template).toBe('name,email,phone,address,city,postcode,notes\n');
    });

    it('should return user template', () => {
      const template = bulkImportService.getTemplate('users');
      expect(template).toBe('name,email,phone,role,password,notes\n');
    });

    it('should return null for invalid type', () => {
      const template = bulkImportService.getTemplate('invalid');
      expect(template).toBeNull();
    });
  });

  describe('uploadClients', () => {
    it('should import clients successfully', async () => {
      const mockReadStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler({ name: 'Test Client', email: 'test@test.com' });
          }
          if (event === 'end') {
            handler();
          }
          return this;
        }),
      };
      fs.createReadStream.mockReturnValue(mockReadStream);
      Client.findOne.mockResolvedValue(null);
      Client.prototype.save.mockResolvedValue({});

      const result = await bulkImportService.uploadClients('test.csv');

      expect(result.success).toBe(1);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('uploadUsers', () => {
    it('should import users successfully', async () => {
      const mockReadStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn((event, handler) => {
          if (event === 'data') {
            handler({ name: 'Test User', email: 'user@test.com', role: 'staff', password: 'password' });
          }
          if (event === 'end') {
            handler();
          }
          return this;
        }),
      };
      fs.createReadStream.mockReturnValue(mockReadStream);
      User.findOne.mockResolvedValue(null);
      User.prototype.save.mockResolvedValue({});

      const result = await bulkImportService.uploadUsers('test.csv');

      expect(result.success).toBe(1);
      expect(result.errors.length).toBe(0);
    });
  });
});