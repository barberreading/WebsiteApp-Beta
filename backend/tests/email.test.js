const {
    sendBookingConfirmation,
    sendBookingReminder,
    sendInvoice,
    sendPaymentConfirmation,
    sendPasswordResetEmail,
    sendTimesheetSubmissionReminder,
    sendNewUserEmail,
    sendTimesheetReminder,
    sendTimesheetStatusNotification,
    sendTestEmail,
    sendBookingUpdateNotification,
    sendBookingCancellationNotification,
    sendLeaveRequestSubmissionNotification,
    sendLeaveRequestStatusNotification,
    sendLeaveRequestWithdrawalNotification,
    sendEmail
} = require('../modules/email/email.services');

const User = require('../models/User');
const Booking = require('../models/Booking');
const Client = require('../models/Client');
const Service = require('../models/Service');
const Timesheet = require('../models/Timesheet');
const LeaveRequest = require('../models/LeaveRequest');

describe('Email Services', () => {
    // Mock the email transporter to prevent actual emails from being sent
    const mockSendMail = jest.fn();
    jest.mock('../modules/email/utils/sendEmail', () => ({
        sendEmail: mockSendMail
    }));

    // Mock the email templates
    jest.mock('../modules/email/email.templates', () => ({
        getEmailTemplate: (templateName) => Promise.resolve(`This is the ${templateName} template`)
    }));

    // Mock the models
    jest.mock('../models/User');
    jest.mock('../models/Booking');
    jest.mock('../models/Client');
    jest.mock('../models/Service');
    jest.mock('../models/Timesheet');
    jest.mock('../models/LeaveRequest');

    beforeEach(() => {
        // Clear all mocks before each test
        mockSendMail.mockClear();
        User.find.mockClear();
        Booking.find.mockClear();
    });

    describe('sendBookingConfirmation', () => {
        it('should send a booking confirmation email to the client and staff', async () => {
            const booking = {
                _id: 'booking123',
                client: 'client123',
                staff: 'staff123',
                service: 'service123',
                startTime: new Date(),
                endTime: new Date(),
                notes: 'Test notes'
            };
            const client = { _id: 'client123', name: 'Test Client', email: 'client@example.com' };
            const staff = { _id: 'staff123', name: 'Test Staff', email: 'staff@example.com' };
            const service = { _id: 'service123', name: 'Test Service' };

            jest.spyOn(Booking, 'findById').mockResolvedValue(booking);
            jest.spyOn(Client, 'findById').mockResolvedValue(client);
            jest.spyOn(User, 'findById').mockResolvedValue(staff);
            jest.spyOn(Service, 'findById').mockResolvedValue(service);

            await sendBookingConfirmation(booking._id);

            expect(sendEmail).toHaveBeenCalledTimes(2);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'client@example.com',
                subject: 'Booking Confirmation'
            }));
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'staff@example.com',
                subject: 'New Booking Notification'
            }));
        });
    });

    describe('sendBookingReminder', () => {
        it('should send a booking reminder email to the client', async () => {
            const booking = {
                _id: 'booking123',
                client: 'client123',
                staff: 'staff123',
                service: 'service123',
                startTime: new Date(),
                endTime: new Date(),
                notes: 'Test notes',
            };
            const client = { _id: 'client123', name: 'Test Client', email: 'client@example.com' };
            const staff = { _id: 'staff123', name: 'Test Staff', email: 'staff@example.com' };
            const service = { _id: 'service123', name: 'Test Service' };

            jest.spyOn(Booking, 'findById').mockResolvedValue(booking);
            jest.spyOn(Client, 'findById').mockResolvedValue(client);
            jest.spyOn(User, 'findById').mockResolvedValue(staff);
            jest.spyOn(Service, 'findById').mockResolvedValue(service);

            await sendBookingReminder(booking._id);

            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'client@example.com',
                subject: 'Booking Reminder',
            }));
        });
    });

    describe('sendInvoice', () => {
        it('should send an invoice email to the client', async () => {
            const booking = {
                _id: 'booking123',
                client: 'client123',
                staff: 'staff123',
                service: 'service123',
                startTime: new Date(),
                endTime: new Date(),
                notes: 'Test notes',
            };
            const client = { _id: 'client123', name: 'Test Client', email: 'client@example.com' };
            const invoiceDetails = {
                invoiceNumber: 'INV-001',
                issueDate: '2023-10-27',
                dueDate: '2023-11-10',
                items: [
                    { description: 'Test Service', quantity: 1, unitPrice: 100, amount: 100 },
                ],
                totalAmount: 100,
            };

            jest.spyOn(Booking, 'findById').mockResolvedValue(booking);
            jest.spyOn(Client, 'findById').mockResolvedValue(client);

            await sendInvoice(booking._id, invoiceDetails);

            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'client@example.com',
                subject: 'Invoice for Your Recent Booking',
            }));
        });
    });

    describe('sendTimesheetReminder', () => {
        it('should send a timesheet reminder email to staff who have not submitted', async () => {
            const staff = [
                { name: 'Staff 1', email: 'staff1@example.com' },
                { name: 'Staff 2', email: 'staff2@example.com' },
            ];
    
            await sendTimesheetReminder(staff);
    
            expect(sendEmail).toHaveBeenCalledTimes(2);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'staff1@example.com',
                subject: 'Timesheet Reminder',
            }));
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'staff2@example.com',
                subject: 'Timesheet Reminder',
            }));
        });
    });

    describe('sendBookingUpdateNotification', () => {
        it('should send a booking update notification to the client and staff', async () => {
            const booking = {
                _id: 'booking123',
                client: 'client123',
                staff: 'staff123',
                service: 'service123',
                startTime: new Date(),
                endTime: new Date(),
            };
            const client = { name: 'Client', email: 'client@example.com' };
            const staff = { name: 'Staff', email: 'staff@example.com' };
            const service = { name: 'Service' };
    
            jest.spyOn(Booking, 'findById').mockResolvedValue(booking);
            jest.spyOn(Client, 'findById').mockResolvedValue(client);
            jest.spyOn(User, 'findById').mockResolvedValue(staff);
            jest.spyOn(Service, 'findById').mockResolvedValue(service);
    
            await sendBookingUpdateNotification(booking._id);
    
            expect(sendEmail).toHaveBeenCalledTimes(2);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'client@example.com',
                subject: 'Booking Update Notification',
            }));
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'staff@example.com',
                subject: 'Booking Update Notification',
            }));
        });
    });

    describe('sendBookingCancellationNotification', () => {
        it('should send a booking cancellation notification to the client and staff', async () => {
            const booking = {
                _id: 'booking123',
                client: 'client123',
                staff: 'staff123',
                service: 'service123',
                startTime: new Date(),
                endTime: new Date(),
            };
            const client = { name: 'Client', email: 'client@example.com' };
            const staff = { name: 'Staff', email: 'staff@example.com' };
            const service = { name: 'Service' };
    
            jest.spyOn(Booking, 'findById').mockResolvedValue(booking);
            jest.spyOn(Client, 'findById').mockResolvedValue(client);
            jest.spyOn(User, 'findById').mockResolvedValue(staff);
            jest.spyOn(Service, 'findById').mockResolvedValue(service);
    
            await sendBookingCancellationNotification(booking._id);
    
            expect(sendEmail).toHaveBeenCalledTimes(2);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'client@example.com',
                subject: 'Booking Cancellation Notification',
            }));
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'staff@example.com',
                subject: 'Booking Cancellation Notification',
            }));
        });
    });

    describe('sendLeaveRequestSubmissionNotification', () => {
        it('should send a leave request submission notification to the admin', async () => {
            const leaveRequest = {
                _id: 'leaveRequest123',
                staff: 'staff123',
                startDate: new Date(),
                endDate: new Date(),
                reason: 'Vacation',
            };
            const staff = { name: 'Staff', email: 'staff@example.com' };
            const admin = { name: 'Admin', email: 'admin@example.com' };
    
            jest.spyOn(LeaveRequest, 'findById').mockResolvedValue(leaveRequest);
            jest.spyOn(User, 'findById').mockResolvedValue(staff);
            jest.spyOn(User, 'findOne').mockResolvedValue(admin);
    
            await sendLeaveRequestSubmissionNotification(leaveRequest._id);
    
            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'admin@example.com',
                subject: 'New Leave Request Submission',
            }));
        });
    });

    describe('sendLeaveRequestStatusNotification', () => {
        it('should send a leave request status notification to the staff', async () => {
            const leaveRequest = {
                _id: 'leaveRequest123',
                staff: 'staff123',
                status: 'Approved',
            };
            const staff = { name: 'Staff', email: 'staff@example.com' };
    
            jest.spyOn(LeaveRequest, 'findById').mockResolvedValue(leaveRequest);
            jest.spyOn(User, 'findById').mockResolvedValue(staff);
    
            await sendLeaveRequestStatusNotification(leaveRequest._id);
    
            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'staff@example.com',
                subject: 'Leave Request Status Update',
            }));
        });
    });

    describe('sendLeaveRequestWithdrawalNotification', () => {
        it('should send a leave request withdrawal notification to the admin', async () => {
            const leaveRequest = {
                _id: 'leaveRequest123',
                staff: 'staff123',
            };
            const staff = { name: 'Staff', email: 'staff@example.com' };
            const admin = { name: 'Admin', email: 'admin@example.com' };
    
            jest.spyOn(LeaveRequest, 'findById').mockResolvedValue(leaveRequest);
            jest.spyOn(User, 'findById').mockResolvedValue(staff);
            jest.spyOn(User, 'findOne').mockResolvedValue(admin);
    
            await sendLeaveRequestWithdrawalNotification(leaveRequest._id);
    
            expect(sendEmail).toHaveBeenCalledTimes(1);
            expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
                to: 'admin@example.com',
                subject: 'Leave Request Withdrawal',
            }));
        });
    });
});