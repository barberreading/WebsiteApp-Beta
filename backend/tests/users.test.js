const userService = require('../modules/users/users.services');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const path = require('path');
const fs = require('fs');

jest.mock('../models/User');
jest.mock('../modules/email/email.services.js', () => ({
    sendNewUserPasswordEmail: jest.fn(),
}));

const mockUser = {
    _id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    active: true,
    save: jest.fn(),
};

describe('User Service', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should get a user profile', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
        const user = await userService.getProfile('1');
        expect(user).toEqual(mockUser);
    });

    it('should get staff members', async () => {
        User.find.mockReturnValue({ select: jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue([mockUser]) }) });
        const staff = await userService.getStaff();
        expect(staff).toEqual([mockUser]);
    });

    it('should update a user profile', async () => {
        User.findByIdAndUpdate.mockResolvedValue(mockUser);
        const user = await userService.updateProfile('1', { name: 'Updated User' });
        expect(user).toEqual(mockUser);
    });

    it('should get all users', async () => {
        User.find.mockReturnValue({ select: jest.fn().mockResolvedValue([mockUser]) });
        const users = await userService.getUsers();
        expect(users).toEqual([mockUser]);
    });

    it('should get a user by id', async () => {
        User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
        const user = await userService.getUserById('1');
        expect(user).toEqual(mockUser);
    });

    it('should create a user', async () => {
        const newUser = { ...mockUser, password: 'password' };
        User.prototype.save = jest.fn().mockResolvedValue(newUser);
        const user = await userService.createUser(newUser);
        expect(user).toBeInstanceOf(User);
    });

    it('should update a user', async () => {
        User.findByIdAndUpdate.mockResolvedValue(mockUser);
        const user = await userService.updateUser('1', { name: 'Updated User' });
        expect(user).toEqual(mockUser);
    });

    it('should update user documents', async () => {
        User.findByIdAndUpdate.mockResolvedValue(mockUser);
        const user = await userService.updateUserDocuments('1', { documents: ['doc1.pdf'] });
        expect(user).toEqual(mockUser);
    });

    it('should delete a user', async () => {
        User.findByIdAndRemove.mockResolvedValue(mockUser);
        const user = await userService.deleteUser('1');
        expect(user).toEqual(mockUser);
    });

    it('should change a user password', async () => {
        User.findById.mockResolvedValue(mockUser);
        await userService.changePassword('1', 'newpassword');
        expect(mockUser.save).toHaveBeenCalled();
    });

    describe('uploadPhoto', () => {
        const file = {
            name: 'test.jpg',
            mimetype: 'image/jpeg',
            size: 1024,
            mv: jest.fn(),
        };

        beforeEach(() => {
            process.env.MAX_FILE_UPLOAD = 5 * 1024 * 1024;
            process.env.FILE_UPLOAD_PATH = './public/uploads';
            User.findById.mockResolvedValue(mockUser);
        });

        it('should upload a photo', async () => {
            file.mv.mockImplementation((path, cb) => cb());
            User.findByIdAndUpdate.mockResolvedValue(mockUser);
            const fileName = await userService.uploadPhoto('1', file);
            expect(fileName).toBe(`photo_1.jpg`);
        });

        it('should throw an error if no file is provided', async () => {
            await expect(userService.uploadPhoto('1', null)).rejects.toThrow(
                new ErrorResponse('Please upload a file', 400)
            );
        });

        it('should throw an error if user is not found', async () => {
            User.findById.mockResolvedValue(null);
            await expect(userService.uploadPhoto('1', file)).rejects.toThrow(
                new ErrorResponse('User not found with id of 1', 404)
            );
        });

        it('should throw an error if file is not an image', async () => {
            const nonImageFile = { ...file, mimetype: 'application/pdf' };
            await expect(userService.uploadPhoto('1', nonImageFile)).rejects.toThrow(
                new ErrorResponse('Please upload an image file', 400)
            );
        });

        it('should throw an error if file size exceeds the limit', async () => {
            const largeFile = { ...file, size: 10 * 1024 * 1024 };
            await expect(userService.uploadPhoto('1', largeFile)).rejects.toThrow(
                new ErrorResponse(
                    `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`,
                    400
                )
            );
        });

        it('should throw an error if file move fails', async () => {
            const errorMessage = 'File move failed';
            file.mv.mockImplementation((path, cb) => cb(new Error(errorMessage)));
            await expect(userService.uploadPhoto('1', file)).rejects.toThrow(
                new ErrorResponse('Problem with file upload', 500)
            );
        });
    });
});