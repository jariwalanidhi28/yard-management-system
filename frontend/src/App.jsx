import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GateVisits from './pages/GateVisits';
import YardMap from './pages/YardMap';
import YardSlotsManagement from './pages/YardSlotsManagement';
import DockAppointments from './pages/DockAppointments';
import DocksDirectory from './pages/DocksDirectory';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Shipments from './pages/Shipments';
import Reports from './pages/Reports';
import StaffManagement from './pages/StaffManagement';
import Profile from './pages/Profile';
import PublicTracking from './pages/PublicTracking';
import NotFound from './pages/NotFound';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#0f172a',
                color: '#f8fafc',
                fontSize: '0.875rem',
                borderRadius: '0.5rem',
              },
            }}
          />

          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/track" element={<PublicTracking />} />
            <Route path="/track/:trackingNumber" element={<PublicTracking />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="gate-visits" element={<GateVisits />} />
              <Route path="yard-map" element={<YardMap />} />
              <Route path="yard-slots" element={<YardSlotsManagement />} />
              <Route path="dock-appointments" element={<DockAppointments />} />
              <Route path="docks" element={<DocksDirectory />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="drivers" element={<Drivers />} />
              <Route path="shipments" element={<Shipments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />

              {/* Admin-only Routes */}
              <Route
                path="staff"
                element={
                  <ProtectedRoute roles={['admin']}>
                    <StaffManagement />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
