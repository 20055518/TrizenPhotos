import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { EventDetail } from './pages/EventDetail';
import { TeamDashboard } from './pages/TeamDashboard';
import { CustomerGallery } from './pages/CustomerGallery';

const RoleBasedHome: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'ADMIN') {
    return <AdminDashboard />;
  }
  return <TeamDashboard />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public customer gallery link (No auth needed) */}
              <Route path="/gallery/:slug" element={<CustomerGallery />} />

              {/* Auth routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Application routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <RoleBasedHome />
                  </ProtectedRoute>
                }
              />

              {/* Admin Curation & Event Detail */}
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <EventDetail />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
