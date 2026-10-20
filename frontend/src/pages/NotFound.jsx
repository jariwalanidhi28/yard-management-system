import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4 text-center">
      <div className="card border-0 shadow-sm p-5" style={{ maxWidth: '480px' }}>
        <div className="text-warning mb-3">
          <AlertCircle size={56} />
        </div>
        <h3 className="fw-bold text-dark mb-2">404 - Page Not Found</h3>
        <p className="text-muted small mb-4">
          The logistics resource, terminal page, or route you are attempting to access does not exist or has moved.
        </p>
        <Link to="/dashboard" className="btn btn-primary d-inline-flex align-items-center justify-content-center gap-2">
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
