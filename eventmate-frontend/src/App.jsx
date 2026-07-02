import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { UserOnlyRoute, AdminOnlyRoute } from './components/auth/AccessControl';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// PASSWORD RECOVERY ROUTES
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// User Pages
import HomePage from './pages/user/HomePage';
import EventListPage from './pages/user/EventListPage';
import EventDetailsPage from './pages/user/EventDetailsPage';
import UserDashboardPage from './pages/user/UserDashboardPage';
import PaymentPage from './pages/user/PaymentPage';
import RatingsPage from './pages/user/RatingsPage';
import NotificationsPage from './pages/user/NotificationsPage';
import BookingSuccessPage from './pages/user/BookingSuccessPage';
import AboutPage from './pages/user/AboutPage';
import ContactPage from './pages/user/ContactPage';
import FAQPage from './pages/user/FAQPage';
import TermsPage from './pages/user/TermsPage';
import MyTicketsPage from './pages/user/MyTicketsPage'; // ✅ FIX: Added missing import

// Payment Integration Import
import BookingPage from './pages/user/BookingPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageEventsPage from './pages/admin/ManageEventsPage';
import CreateEventPage from './pages/admin/CreateEventPage';
import EditEventPage from './pages/admin/EditEventPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import OrganizerProfilePage from './pages/admin/OrganizerProfilePage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage'; 
import HallManagementPage from './pages/admin/HallManagementPage';
import ScheduleMoviePage from './pages/admin/ScheduleMoviePage'; // ✅ IMPORTED MISSING PAGE

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        {/* Toast Notifications for Success/Error messages */}
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

        {/* ✅ FIX: ErrorBoundary catches page-level crashes gracefully */}
        <ErrorBoundary>
          <Routes>
            
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* PASSWORD RECOVERY ROUTES */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* ZONE 1: USER & GUEST AREA */}
            <Route path="/" element={
              <UserOnlyRoute>
                <UserLayout />
              </UserOnlyRoute>
            }>
              <Route index element={<HomePage />} />                  
              <Route path="events" element={<EventListPage />} />     
              <Route path="events/:id" element={<EventDetailsPage />} /> 
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="faq" element={<FAQPage />} />
              <Route path="terms" element={<TermsPage />} />

              {/* Protected: Must be logged in as USER to see these */}
              <Route path="dashboard" element={<UserDashboardPage />} /> 
              <Route path="payment" element={<PaymentPage />} /> 
              <Route path="rate-event/:id" element={<RatingsPage />} />
              <Route path="my-tickets" element={<MyTicketsPage />} /> {/* ✅ FIX: Added missing route */}
              
              {/* Stripe Payment Route */}
              <Route path="book-event" element={<BookingPage />} />
              
              <Route path="booking-success" element={<BookingSuccessPage />} />
              <Route path="notifications" element={<NotificationsPage />} />     
            </Route>

            {/* ZONE 2: ADMIN & ORGANIZER AREA */}
            <Route path="/admin" element={
              <AdminOnlyRoute>
                <AdminLayout />
              </AdminOnlyRoute>
            }>
              <Route index element={<AdminDashboardPage />} />
              <Route path="events" element={<ManageEventsPage />} />
              <Route path="create-event" element={<CreateEventPage />} />
              <Route path="edit-event/:id" element={<EditEventPage />} />
              
              {/* ✅ FIXED: Added Missing Route for Scheduling */}
              <Route path="schedule-movie/:id" element={<ScheduleMoviePage />} />

              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="notifications" element={<AdminNotificationsPage />} />
              <Route path="profile" element={<OrganizerProfilePage />} />
              <Route path="reviews" element={<AdminReviewsPage />} />
              <Route path="halls" element={<HallManagementPage />} /> 
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
            
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;