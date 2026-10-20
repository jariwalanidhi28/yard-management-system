import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  DoorOpen,
  MapPin,
  Truck,
  Users,
  Anchor,
  Package,
  BarChart3,
  UserCheck,
  Search,
  Grid,
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onCloseMobile }) => {
  const { isAdmin } = useAuth();

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className={`yms-sidebar d-flex flex-column flex-shrink-0 ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="d-flex align-items-center gap-2 px-4 py-3 border-bottom border-secondary border-opacity-25" style={{ height: '64px' }}>
        <div className="bg-primary text-white p-2 rounded-3 d-flex align-items-center justify-content-center">
          <Truck size={20} />
        </div>
        <div>
          <div className="fw-bold text-white fs-6 lh-1">YMS Portal</div>
          <small className="text-secondary" style={{ fontSize: '0.72rem' }}>Logistics & Yard Control</small>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-grow-1 overflow-y-auto py-3">
        <div className="yms-nav-section-title">Operations</div>
        <NavLink to="/dashboard" className="yms-nav-link" onClick={handleLinkClick}>
          <LayoutDashboard size={18} className="me-2 text-primary-emphasis" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/gate-visits" className="yms-nav-link" onClick={handleLinkClick}>
          <DoorOpen size={18} className="me-2 text-info" />
          <span>Gate Operations</span>
        </NavLink>
        <NavLink to="/yard-map" className="yms-nav-link" onClick={handleLinkClick}>
          <Grid size={18} className="me-2 text-success" />
          <span>Visual Yard Map</span>
        </NavLink>
        <NavLink to="/dock-appointments" className="yms-nav-link" onClick={handleLinkClick}>
          <Anchor size={18} className="me-2 text-warning" />
          <span>Dock Schedule</span>
        </NavLink>
        <NavLink to="/shipments" className="yms-nav-link" onClick={handleLinkClick}>
          <Package size={18} className="me-2 text-primary" />
          <span>Shipment Tracking</span>
        </NavLink>

        <div className="yms-nav-section-title mt-3">Assets & Fleet</div>
        <NavLink to="/vehicles" className="yms-nav-link" onClick={handleLinkClick}>
          <Truck size={18} className="me-2" />
          <span>Vehicles</span>
        </NavLink>
        <NavLink to="/drivers" className="yms-nav-link" onClick={handleLinkClick}>
          <Users size={18} className="me-2" />
          <span>Drivers</span>
        </NavLink>
        <NavLink to="/yard-slots" className="yms-nav-link" onClick={handleLinkClick}>
          <MapPin size={18} className="me-2" />
          <span>Zones & Slots</span>
        </NavLink>
        <NavLink to="/docks" className="yms-nav-link" onClick={handleLinkClick}>
          <Anchor size={18} className="me-2" />
          <span>Docks Directory</span>
        </NavLink>

        <div className="yms-nav-section-title mt-3">Intelligence</div>
        <NavLink to="/reports" className="yms-nav-link" onClick={handleLinkClick}>
          <BarChart3 size={18} className="me-2 text-info" />
          <span>Reports & Analytics</span>
        </NavLink>
        <NavLink to="/track" className="yms-nav-link" onClick={handleLinkClick} target="_blank">
          <Search size={18} className="me-2 text-warning" />
          <span>Public Tracker ↗</span>
        </NavLink>

        {isAdmin && (
          <>
            <div className="yms-nav-section-title mt-3">Administration</div>
            <NavLink to="/staff" className="yms-nav-link" onClick={handleLinkClick}>
              <UserCheck size={18} className="me-2 text-danger" />
              <span>Staff Accounts</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-top border-secondary border-opacity-25 text-center text-muted small">
        YMS Enterprise v1.0.0
      </div>
    </aside>
  );
};

export default Sidebar;
