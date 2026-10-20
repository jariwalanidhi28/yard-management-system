import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, LogIn, Lock, Mail, ShieldCheck, Search } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';
  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get('expired') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
      <div className="card shadow border-0 rounded-4 overflow-hidden" style={{ maxWidth: '440px', width: '100%' }}>
        {/* Header Banner */}
        <div className="bg-primary text-white p-4 text-center">
          <div className="bg-white text-primary p-3 rounded-circle d-inline-flex mb-3 shadow-sm">
            <Truck size={32} />
          </div>
          <h4 className="fw-bold mb-1">Yard Management System</h4>
          <p className="text-white-50 small mb-0">Enterprise Logistics & Gate Control</p>
        </div>

        <div className="card-body p-4 p-md-5">
          {sessionExpired && (
            <div className="alert alert-warning small py-2 d-flex align-items-center gap-2 mb-4" role="alert">
              <span>Your session has expired. Please log in again.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Work Email</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="form-control bg-light"
                  placeholder="name@yms.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light text-muted">
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  className="form-control bg-light"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status"></span>
              ) : (
                <LogIn size={18} />
              )}
              <span>Sign In to Console</span>
            </button>
          </form>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-4 pt-3 border-top text-center">
            <div className="text-muted small fw-semibold mb-2 d-flex align-items-center justify-content-center gap-1">
              <ShieldCheck size={14} className="text-success" />
              <span>Fill Quick Demo Credentials</span>
            </div>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => handleQuickFill('admin@yms.local', 'Admin@123456')}
              >
                Admin User
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleQuickFill('staff1@yms.local', 'Staff@123456')}
              >
                Staff User 1
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => handleQuickFill('staff2@yms.local', 'Staff@123456')}
              >
                Staff User 2
              </button>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link to="/track" className="small text-decoration-none text-muted d-inline-flex align-items-center gap-1">
              <Search size={14} />
              <span>Public Shipment Tracking Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
