import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { CustomerLanding } from './pages/CustomerLanding';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { EventDetail } from './pages/EventDetail';
import { TeamDashboard } from './pages/TeamDashboard';
import { CustomerGallery } from './pages/CustomerGallery';

const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }
  return <TeamDashboard />;
};

// Navbar only shows on staff/authenticated pages — NOT on customer landing or gallery
const AppLayout: React.FC<{ showNav?: boolean; children: React.ReactNode }> = ({ showNav = true, children }) => (
  <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300">
    {showNav && <Navbar />}
    <div className="flex-1">{children}</div>
  </div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── PUBLIC CUSTOMER ROUTES (no Navbar) ── */}
            {/* Customer landing — enter gallery code here */}
            <Route
              path="/"
              element={
                <AppLayout showNav={false}>
                  <CustomerLanding />
                </AppLayout>
              }
            />

            {/* Customer gallery — PIN-protected photo viewer */}
            <Route
              path="/gallery/:slug"
              element={
                <AppLayout showNav={false}>
                  <CustomerGallery />
                </AppLayout>
              }
            />

            {/* ── AUTH ROUTES (no Navbar needed before login) ── */}
            <Route path="/login" element={<AppLayout showNav={false}><Login /></AppLayout>} />
            <Route path="/register" element={<AppLayout showNav={false}><Register /></AppLayout>} />

            {/* ── PROTECTED STAFF ROUTES (with Navbar) ── */}
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <ProtectedRoute>
                    <RoleBasedDashboard />
                  </ProtectedRoute>
                </AppLayout>
              }
            />

            {/* Admin-only event curation */}
            <Route
              path="/events/:id"
              element={
                <AppLayout>
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <EventDetail />
                  </ProtectedRoute>
                </AppLayout>
              }
            />

            {/* Fallback — unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
