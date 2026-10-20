import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, LogOut, User, Shield } from 'lucide-react';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="yms-topbar d-flex align-items-center justify-content-between px-4 sticky-top">
      <div className="d-flex align-items-center gap-3">
        <button
          className="btn btn-light btn-sm p-2 d-flex align-items-center justify-content-center"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <Menu size={18} />
        </button>
        <span className="fw-semibold text-secondary d-none d-sm-inline">
          Yard Operations Console
        </span>
      </div>

      <div className="d-flex align-items-center gap-3">
        {user && (
          <div className="dropdown">
            <button
              className="btn btn-light btn-sm d-flex align-items-center gap-2 px-3 py-1 dropdown-toggle"
              type="button"
              id="userMenuButton"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <div className="bg-primary text-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px' }}>
                <User size={16} />
              </div>
              <div className="text-start d-none d-md-block">
                <div className="fw-bold small lh-1 text-dark">{user.name}</div>
                <small className="text-muted text-capitalize" style={{ fontSize: '0.72rem' }}>
                  {user.role}
                </small>
              </div>
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0" aria-labelledby="userMenuButton">
              <li className="px-3 py-2 border-bottom">
                <div className="fw-semibold text-dark">{user.name}</div>
                <div className="text-muted small">{user.email}</div>
                <span className="badge bg-primary-subtle text-primary text-capitalize mt-1">
                  <Shield size={10} className="me-1" />
                  {user.role}
                </span>
              </li>
              <li>
                <Link className="dropdown-item py-2 d-flex align-items-center gap-2" to="/profile">
                  <User size={16} />
                  <span>Profile & Security</span>
                </Link>
              </li>
              <li><hr className="dropdown-divider my-1" /></li>
              <li>
                <button
                  className="dropdown-item py-2 text-danger d-flex align-items-center gap-2"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
