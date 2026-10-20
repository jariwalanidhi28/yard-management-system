import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Truck,
  DoorOpen,
  MapPin,
  Anchor,
  Package,
  AlertTriangle,
  Clock,
  ArrowRight,
  PlusCircle,
  Grid,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating yard operations metrics..." />;
  }

  const { cards = {}, charts = {}, activities = {}, alerts = {} } = data || {};

  return (
    <div className="container-fluid p-0">
      {/* Top Banner & Quick Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h2 className="fs-4 fw-bold text-dark mb-1">Operations Control Dashboard</h2>
          <p className="text-muted small mb-0">Real-time yard telemetry, gate events, and dock scheduling</p>
        </div>
        <div className="mt-3 mt-md-0 d-flex flex-wrap gap-2">
          <Link to="/gate-visits" className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <PlusCircle size={15} />
            <span>Gate Check-In</span>
          </Link>
          <Link to="/yard-map" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Grid size={15} />
            <span>Visual Yard</span>
          </Link>
          <Link to="/shipments" className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm">
            <Package size={15} />
            <span>Shipments</span>
          </Link>
        </div>
      </div>

      {/* Critical Alerts Row */}
      {((alerts.driverLicenses && alerts.driverLicenses.length > 0) ||
        (alerts.overdueAppointments && alerts.overdueAppointments.length > 0)) && (
        <div className="mb-4">
          {alerts.driverLicenses?.map((al, idx) => (
            <div
              key={idx}
              className={`alert ${
                al.type === 'CRITICAL_EXPIRED' ? 'alert-danger' : 'alert-warning'
              } d-flex align-items-center gap-2 py-2 mb-2 shadow-sm`}
              role="alert"
            >
              <AlertTriangle size={18} className="flex-shrink-0" />
              <div className="small flex-grow-1">
                <strong>{al.type === 'CRITICAL_EXPIRED' ? 'License Expired:' : 'License Expiry Notice:'}</strong>{' '}
                {al.message}
              </div>
              <Link to={`/drivers`} className="btn btn-sm btn-link text-decoration-none py-0">
                View Driver
              </Link>
            </div>
          ))}

          {alerts.overdueAppointments?.map((appt, idx) => (
            <div key={idx} className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-2 shadow-sm" role="alert">
              <Clock size={18} className="flex-shrink-0" />
              <div className="small flex-grow-1">
                <strong>Overdue Dock Appointment:</strong> {appt.message}
              </div>
              <Link to="/dock-appointments" className="btn btn-sm btn-link text-decoration-none py-0">
                Manage Schedule
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Row 1: Primary Metrics */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Inside Yard"
            value={cards.vehiclesInsideYard || 0}
            icon={DoorOpen}
            color="primary"
            subtext="Current parked vehicles"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Today Entries"
            value={cards.todayEntries || 0}
            icon={Truck}
            color="info"
            subtext="Check-ins recorded"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Today Exits"
            value={cards.todayExits || 0}
            icon={DoorOpen}
            color="success"
            subtext="Completed departures"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Available Slots"
            value={cards.availableSlots || 0}
            icon={MapPin}
            color="success"
            subtext="Ready for parking"
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Dock In-Progress"
            value={cards.appointmentsInProgress || 0}
            icon={Anchor}
            color="warning"
            subtext={`${cards.todayScheduledAppointments || 0} scheduled today`}
          />
        </div>
        <div className="col-6 col-md-4 col-xl-2">
          <StatCard
            title="Active Shipments"
            value={cards.activeShipments || 0}
            icon={Package}
            color="primary"
            subtext={`${cards.deliveredShipments || 0} delivered`}
          />
        </div>
      </div>

      {/* Row 2: Secondary Yard Capacity Breakdown */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card p-3 h-100 border-0 shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted fw-bold text-uppercase">Yard Capacity Utilization</span>
              <span className="badge bg-primary fs-7">{cards.yardUtilization || 0}%</span>
            </div>
            <div className="progress mb-3" style={{ height: '10px' }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: `${cards.yardUtilization || 0}%` }}
                aria-valuenow={cards.yardUtilization || 0}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <div className="row text-center pt-2 border-top g-0">
              <div className="col-4 border-end">
                <div className="text-success fw-bold fs-5">{cards.availableSlots || 0}</div>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Available</small>
              </div>
              <div className="col-4 border-end">
                <div className="text-warning fw-bold fs-5">{cards.occupiedSlots || 0}</div>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Occupied</small>
              </div>
              <div className="col-4">
                <div className="text-danger fw-bold fs-5">{cards.blockedSlots || 0}</div>
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>Blocked</small>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Trend Chart */}
        <div className="col-12 col-md-8">
          <div className="card p-3 h-100 border-0 shadow-sm">
            <div className="fw-semibold text-secondary small mb-3">Vehicle Movements (Last 7 Days)</div>
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.entryExitTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="entries" name="Entries" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="exits" name="Exits" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Active Operations & Live Feeds */}
      <div className="row g-3 mb-4">
        {/* Recent Gate Visits */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">Recent Gate Activity</span>
              <Link to="/gate-visits" className="small text-decoration-none d-flex align-items-center gap-1">
                <span>View All Visits</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light fs-7 text-uppercase text-secondary">
                  <tr>
                    <th>Gate Pass</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Entry Time</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {activities.recentGateVisits?.length > 0 ? (
                    activities.recentGateVisits.map((v) => (
                      <tr key={v._id}>
                        <td className="fw-semibold text-primary">{v.gatePassNumber}</td>
                        <td>{v.vehicle?.registrationNumber || 'N/A'}</td>
                        <td>{v.driver?.fullName || 'N/A'}</td>
                        <td><StatusBadge status={v.status} /></td>
                        <td className="text-muted">{new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No gate visits recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Upcoming Dock Operations */}
        <div className="col-12 col-lg-6">
          <div className="card h-100 border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
              <span className="fw-bold text-dark">Upcoming Dock Appointments</span>
              <Link to="/dock-appointments" className="small text-decoration-none d-flex align-items-center gap-1">
                <span>View Calendar</span>
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light fs-7 text-uppercase text-secondary">
                  <tr>
                    <th>Dock</th>
                    <th>Time Slot</th>
                    <th>Operation</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="fs-7">
                  {activities.upcomingAppointments?.length > 0 ? (
                    activities.upcomingAppointments.map((appt) => (
                      <tr key={appt._id}>
                        <td className="fw-semibold text-dark">{appt.dock?.code}</td>
                        <td className="text-muted">{appt.startTime} - {appt.endTime}</td>
                        <td>{appt.operationType}</td>
                        <td>{appt.gateVisit?.vehicle?.registrationNumber || 'Assigned'}</td>
                        <td><StatusBadge status={appt.status} /></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No upcoming appointments scheduled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
