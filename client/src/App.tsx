import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Client Pages
import { ClientDashboard } from './pages/client/ClientDashboard';
import { SubmitCase } from './pages/client/SubmitCase';
import { CaseList } from './pages/client/CaseList';
import { AIChat } from './pages/client/AIChat';
import { AdvocateSearch } from './pages/client/AdvocateSearch';
import { AdvocateRecommendations } from './pages/client/AdvocateRecommendations';

// Advocate Pages
import { AdvocateDashboard } from './pages/advocate/AdvocateDashboard';
import { AdvocateRequests } from './pages/advocate/AdvocateRequests';
import { AdvocateAnalytics } from './pages/advocate/AdvocateAnalytics';

import { AdvocateCalendar } from './pages/advocate/AdvocateCalendar';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUserManagement } from './pages/admin/AdminUserManagement';
import { AdminAdvocates } from './pages/admin/AdminAdvocates';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSettings } from './pages/admin/AdminSystemSettings';
import { AdminComplaints } from './pages/admin/AdminComplaints';

// Shared Pages
import { Notifications } from './pages/shared/Notifications';
import { CaseDetails } from './pages/shared/CaseDetails';
import { AdvocateProfile } from './pages/shared/AdvocateProfile';
import { ProfileSettings } from './pages/shared/ProfileSettings';



export default function App() {
    return (
        <Router>
            <ThemeProvider>
                <AuthProvider>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/search" element={<AdvocateSearch />} />

                        {/* Client Dashboard Routes */}
                        <Route path="/dashboard" element={
                            <ProtectedRoute allowedRoles={['client']}>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<ClientDashboard />} />
                            <Route path="cases" element={<CaseList />} />
                            <Route path="cases/:id" element={<CaseDetails />} />
                            <Route path="submit-case" element={<SubmitCase />} />
                            <Route path="recommendations" element={<AdvocateRecommendations />} />
                            <Route path="advocates" element={<AdvocateSearch />} />
                            <Route path="advocates/:id" element={<AdvocateProfile />} />

                            <Route path="chat" element={<AIChat />} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="settings" element={<ProfileSettings />} />
                        </Route>

                        {/* Advocate Dashboard Routes */}
                        <Route path="/advocate" element={
                            <ProtectedRoute allowedRoles={['advocate']}>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<AdvocateDashboard />} />
                            <Route path="cases" element={<CaseList />} />
                            <Route path="cases/:id" element={<CaseDetails />} />
                            <Route path="requests" element={<AdvocateRequests />} />
                            <Route path="analytics" element={<AdvocateAnalytics />} />
                            <Route path="calendar" element={<AdvocateCalendar />} />
                            <Route path="notifications" element={<Notifications />} />
                            <Route path="profile" element={<ProfileSettings />} />
                        </Route>

                        {/* Admin Dashboard Routes */}
                        <Route path="/admin" element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<AdminDashboard />} />
                            <Route path="users" element={<AdminUserManagement />} />
                            <Route path="advocates" element={<AdminAdvocates />} />
                            <Route path="cases" element={<CaseList />} />
                            <Route path="cases/:id" element={<CaseDetails />} />
                            <Route path="complaints" element={<AdminComplaints />} />
                            <Route path="analytics" element={<AdminAnalytics />} />
                            <Route path="settings" element={<AdminSettings />} />
                            <Route path="profile" element={<ProfileSettings />} />
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AuthProvider>
            </ThemeProvider>
        </Router>
    );
}
