# Staff Management Application

A comprehensive staff management application with calendar booking, timesheet tracking, and GDPR compliance for remote workers in the UK.

## Features

- **User Authentication and Roles**: Secure login with role-based access (Superuser, Manager, Staff, Client)
- **Calendar Interface**: Timify-like calendar for booking management with customizable settings
- **Booking Management**: Create, view, and manage bookings
- **Service Management**: Create and manage services with duration and category
- **Client Management**: Maintain a database of clients with contact information
- **Email Notifications**: Automatic booking confirmations and 24-hour reminders
- **Clock In/Out**: Track staff working hours
- **Timesheet Generation**: Generate and review timesheets
- **GDPR Compliance**: Data protection features and consent management
- **Weekly Reports**: Generate reports for invoicing
- **Proximity-Based Booking**: Find staff closest to clients
- **Shift Requests**: Allow clients to request shifts

## Tech Stack

- **Frontend**: React, Bootstrap, FullCalendar
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/staff-management
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   EMAIL_SERVICE=gmail
   EMAIL_USERNAME=your_email@gmail.com
   EMAIL_PASSWORD=your_email_password
   EMAIL_FROM=noreply@staffmanagement.com
   NODE_ENV=development
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend development server:
   ```
   npm start
   ```

4. Access the application at `http://localhost:3000`

## Initial Setup

### Creating a Superuser Account

The application requires a superuser account to manage all aspects of the system. To create one:

1. Make sure your MongoDB connection is set up correctly in the `.env` file
2. Run the following commands:
   ```
   cd backend
   npm run create-superuser
   ```
3. This will create a superuser with these credentials:
   - Email: admin@example.com
   - Password: admin123
   - **Important**: Change this password immediately after first login!

4. Log in with these credentials at http://localhost:3000/login

## User Guide

### User Management

As a superuser or manager, you can create and manage users with different roles:
- **Superuser**: Full access to all features
- **Manager**: Can manage staff, clients, services, and bookings
- **Staff**: Can view their own bookings and clock in/out
- **Client**: Can request bookings and view their appointments

### Service Management

1. Navigate to the Services tab in the sidebar
2. Click "Add Service" to create a new service
3. Fill in the required fields:
   - Name: The service name
   - Category: The type of service
   - Duration: Hours and minutes the service takes
   - Description: Details about the service
4. Click "Save" to create the service
5. Existing services can be edited by clicking the edit button

### Client Management

1. Navigate to the Clients tab in the sidebar
2. Click "Add Client" to create a new client
3. Fill in the client details:
   - Name: Client's full name
   - Email: Contact email (used for booking confirmations)
   - Phone: Contact phone number
   - Address: Client's location
4. Click "Save" to add the client
5. Existing clients can be edited by clicking the edit button

### Calendar Customization

1. On the Calendar page, click the "Calendar Settings" button
2. Customize your calendar view:
   - First Day of Week: Choose which day your week starts on
   - Business Hours Start: Set when your business day begins
   - Business Hours End: Set when your business day ends
3. Click "Save Settings" to apply changes
4. Settings are saved to your browser and will persist between sessions

### Booking Management

1. Navigate to the Calendar page
2. Click on an empty time slot to create a new booking
3. Follow the booking workflow:
   - Select a service
   - Choose or create a client
   - Select a staff member
   - Set the date and time
4. Click "Save" to create the booking
5. The system will automatically send a confirmation email to the client
6. 24 hours before the appointment, a reminder email will be sent

### Email Notifications

The system sends two types of automated emails:
1. **Booking Confirmations**: Sent immediately when a booking is created
2. **Appointment Reminders**: Sent 24 hours before scheduled appointments

To enable email notifications:
1. Configure your email settings in the backend `.env` file:
   ```
   EMAIL_HOST=your_smtp_server
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_email@example.com
   EMAIL_PASSWORD=your_email_password
   EMAIL_ENABLED=true
   ```
2. Restart the backend server for changes to take effect

## Troubleshooting

### Email System Issues
- If emails are not being sent, check that `EMAIL_ENABLED=true` is set in your `.env` file
- Verify your SMTP credentials are correct
- Check the server logs for any email-related errors

### Calendar Issues
- If calendar settings are not saving, clear your browser cache
- If bookings are not displaying, ensure you have the correct permissions for your user role
- Calendar customization settings are stored in local storage; switching browsers will reset them

### Booking Creation Problems
- If you cannot create bookings, ensure you have services and clients created in the system
- Managers need to have staff members available to assign to bookings
- Check that the selected time slot doesn't conflict with existing bookings

### General Issues
- If the application is not loading, ensure both frontend and backend servers are running
- For database connection issues, verify your MongoDB connection string
- For authentication problems, try clearing your browser cookies and logging in again

Once logged in as a superuser:
1. Use the User Management page to create manager accounts
2. Managers can then create staff and client accounts
3. Each user type has different permissions:
   - **Superuser**: Full system access
   - **Manager**: Manage staff, bookings, and clients
   - **Staff**: View and manage their own bookings and timesheets
   - **Client**: Book staff and view their bookings

## GDPR Compliance

This application includes features to comply with UK GDPR regulations:

- User consent tracking
- Data access and deletion requests
- Secure data storage and transmission
- Audit logs for user actions

## License

[MIT License](LICENSE)