import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { UserTemplateProvider } from './context/UserTemplateContext';
import ErrorBoundary from './components/error/ErrorBoundary';
import NetworkErrorHandler from './components/error/NetworkErrorHandler';
import ImpersonationBar from './components/auth/ImpersonationBar';
import { initializeDateFormatting } from './utils/updateDateFormats';

// Auth Components
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AccountSettings from './components/profile/AccountSettings';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page Components
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';

import ActivityLog from './pages/ActivityLog';
import ClientManagement from './pages/ClientManagement';
import ResourcesManagement from './pages/ResourcesManagement';
import UserManagement from './pages/UserManagement';
import Services from './pages/Services';
import Clients from './pages/Clients';
import Timesheets from './pages/Timesheets';
import BulkTimesheets from './pages/BulkTimesheets';
import TimesheetApprovalDashboard from './pages/TimesheetApprovalDashboard';
import Reports from './pages/Reports';
import PayrollReport from './pages/PayrollReport';
import GDPRRequests from './pages/GDPRRequests';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ErrorDashboard from './pages/ErrorDashboard';
import EmailSettings from './pages/EmailSettings';
import EmailTemplates from './pages/EmailTemplates';
import GlobalPermissions from './pages/GlobalPermissions';
import UserGuideEditor from './pages/UserGuideEditor';
import StaffGallery from './pages/StaffGallery';
import BookedStaffGallery from './pages/BookedStaffGallery';
import StaffProfile from './pages/StaffProfile';
import StaffHR from './pages/StaffHR';
import BrandingManager from './components/admin/BrandingManager';
import PublicDocument from './pages/PublicDocument';
import BulkImport from './pages/BulkImport';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import BookingEdit from './pages/BookingEdit';
import BookingNew from './pages/BookingNew';
import BookingsList from './pages/BookingsList';
import ClockInOut from './pages/ClockInOut';
import UserGuide from './pages/UserGuide';

// Booking Components
import BookingForm from './components/bookings/BookingForm';
import BookingAlertForm from './components/bookings/BookingAlertForm';
import BookingAlertList from './components/bookings/BookingAlertList';
import BookingAlertTemplateManager from './components/bookings/BookingAlertTemplateManager';
import BookingCategoriesManager from './components/bookings/BookingCategoriesManager';

// Leave Request Components
import LeaveRequestForm from './components/leave/LeaveRequestForm';
import LeaveRequestList from './components/leave/LeaveRequestList';
import LeaveRequests from './pages/LeaveRequests';

// Manager Components
import ManagerTodoList from './components/manager/ManagerTodoList';

// Staff Components
import StaffDistanceSearch from './components/staff/StaffDistanceSearch';

// Route Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';

import './App.css';
import './responsive.css';

function App() {
  const { loading, currentUser, isAuthenticated } = useAuth();

  // No shutdown code - removed to prevent app from closing when browser closes

  // Add console log for debugging authentication state
  useEffect(() => {
    console.log('Auth State:', { isAuthenticated, currentUser });
  }, [isAuthenticated, currentUser]);
  
  // Initialize date formatting to DD/MM/YYYY across the app
  useEffect(() => {
    initializeDateFormatting();
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <ErrorBoundary autoReport={true}>
      <UserTemplateProvider>
        <div className="app-container">
          <NetworkErrorHandler />
          <Navbar />

          <main className="main-content">
            <ImpersonationBar />
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* User Guide Route */}
          <Route path="/user-guide" element={
            <ProtectedRoute>
              <UserGuide />
            </ProtectedRoute>
          } />

          {/* Booking Routes */}
          <Route path="/bookings" element={
            <ProtectedRoute>
              <BookingsList />
            </ProtectedRoute>
          } />
          <Route path="/bookings/new" element={
            <ProtectedRoute>
              <BookingNew />
            </ProtectedRoute>
          } />
          <Route path="/bookings/edit/:id" element={
            <RoleProtectedRoute allowedRoles={['manager', 'superuser', 'admin']}>
              <BookingEdit />
            </RoleProtectedRoute>
          } />
          <Route path="/admin/bookings" element={
            <RoleRoute allowedRoles={['manager', 'superuser']}>
              <BookingForm />
            </RoleRoute>
          } />
          
          {/* Booking Alert Routes */}
          <Route path="/booking-alerts" element={
            <RoleRoute allowedRoles={['staff', 'manager', 'superuser', 'admin']}>
              <BookingAlertList />
            </RoleRoute>
          } />
          <Route path="/booking-alerts/new" element={
            <RoleRoute allowedRoles={['manager', 'superuser', 'admin']}>
              <BookingAlertForm />
            </RoleRoute>
          } />
          <Route path="/booking-alert-templates" element={
            <RoleRoute allowedRoles={['manager', 'superuser', 'admin']}>
              <BookingAlertTemplateManager />
            </RoleRoute>
          } />
          
          {/* Booking Categories Routes */}
          <Route path="/booking-categories" element={
            <RoleRoute allowedRoles={['manager', 'superuser']}>
              <BookingCategoriesManager />
            </RoleRoute>
          } />
          
          {/* Leave Request Routes */}
          <Route path="/leave-requests" element={
            <ProtectedRoute>
              <LeaveRequestList />
            </ProtectedRoute>
          } />
          <Route path="/leave-requests/new" element={
            <RoleRoute allowedRoles={['staff']}>
              <LeaveRequestForm />
            </RoleRoute>
          } />
          <Route path="/leave-requests/manage" element={
            <RoleRoute allowedRoles={['manager', 'superuser', 'admin']}>
              <LeaveRequests />
            </RoleRoute>
          } />
          <Route path="/shifts/requests" element={
            <ProtectedRoute>
              <LeaveRequestList />
            </ProtectedRoute>
          } />
          
          {/* Manager Todo List Route */}
          <Route path="/manager/todo" element={
            <RoleRoute allowedRoles={['manager', 'superuser', 'admin']}>
              <ManagerTodoList />
            </RoleRoute>
          } />
          
          {/* Staff Search Routes */}
          <Route path="/staff-search" element={
            <RoleRoute allowedRoles={['manager', 'superuser']}>
              <StaffDistanceSearch />
            </RoleRoute>
          } />
          
          <Route path="/calendar" element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          } />
          
          <Route path="/activity-log" element={
            <ProtectedRoute>
              <ActivityLog />
            </ProtectedRoute>
          } />
          
          <Route path="/client-management" element={
            <ProtectedRoute>
              <ClientManagement />
            </ProtectedRoute>
          } />
          
          {/* Redirect old customer-management URL to new client-management for backward compatibility */}
          <Route path="/customer-management" element={
            <ProtectedRoute>
              <ClientManagement />
            </ProtectedRoute>
          } />
          
          {/* Redirecting resources-management to users for consolidation */}
          <Route path="/resources-management" element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          } />
          
          <Route path="/timesheets" element={
            <RoleRoute allowedRoles={['staff', 'manager', 'admin', 'superuser']}>
              <Timesheets />
            </RoleRoute>
          } />
          
          <Route path="/bulk-timesheets" element={
            <RoleRoute allowedRoles={['manager', 'admin', 'superuser']}>
              <BulkTimesheets />
            </RoleRoute>
          } />
          
          <Route path="/approve-timesheet/:id" element={
            <ProtectedRoute>
              <TimesheetApprovalDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/timesheet-approval" element={
            <RoleRoute allowedRoles={['manager', 'admin', 'superuser', 'client']}>
              <TimesheetApprovalDashboard />
            </RoleRoute>
          } />
          
          {/* HR Routes */}
          <Route path="/staff-hr" element={
            <ProtectedRoute>
              <StaffHR />
            </ProtectedRoute>
          } />
          
          {/* Public Document Route */}
          <Route path="/public-document/:accessKey" element={<PublicDocument />} />
          
          {/* Bulk Import Route */}
          <Route path="/bulk-import" element={
            <RoleRoute allowedRoles={['manager', 'superuser']}>
              <BulkImport />
            </RoleRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />
          
          {/* Payroll Report Route */}
          <Route path="/payroll-report" element={
            <RoleProtectedRoute allowedRoles={['manager', 'superuser', 'admin']}>
              <PayrollReport />
            </RoleProtectedRoute>
          } />
          
          {/* Role-based Routes */}
          <Route path="/users" element={
            <RoleRoute allowedRoles={['superuser', 'manager']}>
              <UserManagement />
            </RoleRoute>
          } />
          
          <Route path="/services" element={
            <RoleRoute allowedRoles={['superuser', 'manager']}>
              <Services />
            </RoleRoute>
          } />
          
          <Route path="/clients" element={
            <RoleRoute allowedRoles={['superuser', 'manager']}>
              <ClientManagement />
            </RoleRoute>
          } />
          
          <Route path="/gdpr-requests" element={
            <RoleRoute allowedRoles={['superuser', 'manager']}>
              <GDPRRequests />
            </RoleRoute>
          } />
          
          <Route path="/error-dashboard" element={
            <RoleRoute allowedRoles={['superuser']}>
              <ErrorDashboard />
            </RoleRoute>
          } />
          
          <Route path="/email-settings" element={
            <RoleRoute allowedRoles={['manager', 'superuser']}>
              <EmailSettings />
            </RoleRoute>
          } />
          
          <Route path="/email-templates" element={
            <RoleRoute allowedRoles={['superuser']}>
              <EmailTemplates />
            </RoleRoute>
          } />
          
          <Route path="/global-permissions" element={
            <RoleRoute allowedRoles={['superuser']}>
              <GlobalPermissions />
            </RoleRoute>
          } />
          
          {/* User Guide Editor Route */}
          <Route path="/user-guide-editor" element={
            <RoleRoute allowedRoles={['superuser']}>
              <UserGuideEditor />
            </RoleRoute>
          } />
          
          {/* Branding Tools Route */}
          <Route path="/branding" element={
            <RoleRoute allowedRoles={['superuser']}>
              <BrandingManager />
            </RoleRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/account-settings" element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          } />
          <Route path="/staff-gallery" element={
            <ProtectedRoute>
              <StaffGallery />
            </ProtectedRoute>
          } />
          <Route path="/booked-staff" element={
            <RoleRoute allowedRoles={['client']}>
              <BookedStaffGallery />
            </RoleRoute>
          } />
          <Route path="/staff-profile/:staffId" element={
            <RoleRoute allowedRoles={['client']}>
              <StaffProfile />
            </RoleRoute>
          } />
          
          {/* Clock In/Out Route */}
          <Route path="/clock" element={
            <ProtectedRoute>
              <ClockInOut />
            </ProtectedRoute>
          } />
          
          {/* Public Routes */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
        <Footer />
      </div>
      </UserTemplateProvider>
    </ErrorBoundary>
  );
}

export default App;