const authService = require('../modules/auth/auth.services');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../models/User');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

describe('Auth Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and return a token', async () => {
      const userData = { name: 'Test User', email: 'test@example.com', password: 'TestSecurePass123!' };
      User.findOne.mockResolvedValue(null);
      const userInstance = { ...userData, save: jest.fn().mockResolvedValue(true), getSignedJwtToken: jest.fn().mockReturnValue('test_token') };
      User.mockImplementation(() => userInstance);

      const result = await authService.register(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(userInstance.save).toHaveBeenCalled();
      expect(userInstance.getSignedJwtToken).toHaveBeenCalled();
      expect(result).toEqual({ token: 'test_token', isTemporaryPassword: true });
    });

    it('should throw an error if user already exists', async () => {
        const userData = { name: 'Test User', email: 'test@example.com', password: 'TestSecurePass123!' };
        User.findOne.mockResolvedValue(true);
  
        await expect(authService.register(userData)).rejects.toThrow('User already exists');
      });
    });

    describe('login', () => {
        it('should login a user and return a token', async () => {
          const email = 'test@example.com';
          const password = 'TestSecurePass123!';
          const user = {
            _id: '1',
            name: 'Test User',
            email: email,
            role: 'user',
            isTemporaryPassword: false,
            matchPassword: jest.fn().mockResolvedValue(true),
          };
    
          User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
          jwt.sign.mockImplementation((payload, secret, options, callback) => {
            callback(null, 'test_token');
          });
    
          const result = await authService.login(email, password);
    
          expect(User.findOne).toHaveBeenCalledWith({ email: email });
          expect(user.matchPassword).toHaveBeenCalledWith(password);
          expect(jwt.sign).toHaveBeenCalled();
          expect(result).toHaveProperty('token', 'test_token');
        });
    
        it('should throw an error for invalid credentials if user not found', async () => {
            User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      
            await expect(authService.login('wrong@example.com', 'TestSecurePass123!')).rejects.toThrow('Invalid credentials');
          });
      
          it('should throw an error for invalid credentials if password does not match', async () => {
            const user = { matchPassword: jest.fn().mockResolvedValue(false) };
            User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
      
            await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
          });
    });

    describe('getMe', () => {
        it('should return a user profile', async () => {
          const userId = '1';
          const user = { _id: userId, name: 'Test User', email: 'test@example.com' };
          User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(user) });
    
          const result = await authService.getMe(userId);
    
          expect(User.findById).toHaveBeenCalledWith(userId);
          expect(result).toEqual(user);
        });
      });
});