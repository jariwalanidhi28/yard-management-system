import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullPage message="Authenticating session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="container py-5 text-center">
        <div className="card shadow-sm border-0 p-5 mx-auto" style={{ maxWidth: '500px' }}>
          <div className="text-danger mb-3">
            <ShieldAlert size={56} />
          </div>
          <h4 className="fw-bold text-dark mb-2">Access Denied (403)</h4>
          <p className="text-muted mb-4">
            Your role (<strong className="text-capitalize">{user.role}</strong>) does not have
            sufficient permissions to access this administrative resource.
          </p>
          <a href="/dashboard" className="btn btn-primary px-4 py-2">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
