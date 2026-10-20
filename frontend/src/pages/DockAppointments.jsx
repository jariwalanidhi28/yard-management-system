import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import {
  Anchor,
  PlusCircle,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Truck,
  RotateCcw,
} from 'lucide-react';

const DockAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [docks, setDocks] = useState([]);
  const [activeVisits, setActiveVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDock, setSelectedDock] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Appointment Form
  const [formData, setFormData] = useState({
    dock: '',
    gateVisit: '',
    appointmentDate: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:30',
    operationType: 'Loading',
    notes: '',
  });

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDock) params.dock = selectedDock;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedDate) params.date = selectedDate;

      const [aRes, dRes, vRes] = await Promise.all([
        api.get('/dock-appointments', { params }),
        api.get('/docks'),
        api.get('/gate-visits?status=Inside Yard&limit=100'),
      ]);

      setAppointments(aRes.data.data || []);
      setDocks(dRes.data.data || []);
      setActiveVisits(vRes.data.visits || []);
    } catch (err) {
      toast.error('Failed to load dock appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [selectedDock, selectedStatus, selectedDate]);

  const handleOpenCreate = () => {
    setFormData({
      dock: docks[0]?._id || '',
      gateVisit: activeVisits[0]?._id || '',
      appointmentDate: new Date().toISOString().slice(0, 10),
      startTime: '09:00',
      endTime: '10:30',
      operationType: 'Loading',
      notes: '',
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.dock || !formData.gateVisit) {
      toast.error('Dock and active vehicle visit are required.');
      return;
    }

    if (formData.endTime <= formData.startTime) {
      toast.error('End time must be strictly after start time.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post('/dock-appointments', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowCreateModal(false);
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Appointment booking failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Start Operation
  const handleStartOperation = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/dock-appointments/${id}/start`);
      if (res.data.success) {
        toast.success('Dock operation started.');
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start dock operation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Operation
  const handleCompleteOperation = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/dock-appointments/${id}/complete`);
      if (res.data.success) {
        toast.success('Dock operation marked as completed.');
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete dock operation.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Appointment
  const handleCancelConfirm = async () => {
    if (!selectedAppt) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/dock-appointments/${selectedAppt._id}/cancel`, {
        reason: cancelReason,
      });
      if (res.data.success) {
        toast.success('Dock appointment cancelled.');
        setShowCancelModal(false);
        setSelectedAppt(null);
        setCancelReason('');
        fetchAppointments();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Dock / Bay',
      key: 'dock.code',
      render: (row) => (
        <div>
          <div className="fw-bold font-monospace text-primary">{row.dock?.code}</div>
          <small className="text-muted">{row.dock?.name}</small>
        </div>
      ),
    },
    {
      header: 'Vehicle & Pass',
      key: 'gateVisit.gatePassNumber',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">
            {row.gateVisit?.vehicle?.registrationNumber || 'Vehicle'}
          </div>
          <small className="text-muted font-monospace">{row.gateVisit?.gatePassNumber}</small>
        </div>
      ),
    },
    {
      header: 'Schedule Date & Time',
      key: 'startDateTime',
      render: (row) => (
        <div>
          <div className="small fw-semibold text-dark">
            {new Date(row.appointmentDate).toLocaleDateString()}
          </div>
          <div className="text-muted small d-flex align-items-center gap-1">
            <Clock size={12} />
            <span>{row.startTime} - {row.endTime}</span>
          </div>
          {row.isOverdue && (
            <span className="badge bg-danger-subtle text-danger p-1 mt-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
              <AlertCircle size={10} />
              <span>Overdue</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Operation',
      key: 'operationType',
      render: (row) => (
        <span className="badge bg-light text-dark border">
          {row.operationType}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="d-flex align-items-center gap-2">
          {row.status === 'Scheduled' && (
            <>
              <button
                className="btn btn-outline-success btn-sm px-2 py-1 d-flex align-items-center gap-1"
                onClick={() => handleStartOperation(row._id)}
                title="Start Operation"
              >
                <Play size={14} />
                <span>Start</span>
              </button>
              <button
                className="btn btn-outline-danger btn-sm p-1"
                onClick={() => {
                  setSelectedAppt(row);
                  setShowCancelModal(true);
                }}
                title="Cancel Appointment"
              >
                <XCircle size={15} />
              </button>
            </>
          )}

          {row.status === 'In Progress' && (
            <button
              className="btn btn-success btn-sm px-2 py-1 d-flex align-items-center gap-1"
              onClick={() => handleCompleteOperation(row._id)}
              title="Complete Operation"
            >
              <CheckCircle size={14} />
              <span>Complete</span>
            </button>
          )}

          {(row.status === 'Completed' || row.status === 'Cancelled') && (
            <span className="text-muted small">Locked</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Dock Scheduling & Appointments"
        subtitle="Schedule loading/unloading bays, prevent overlapping intervals, and track operations."
        actions={
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenCreate}
          >
            <PlusCircle size={16} />
            <span>Book Dock Appointment</span>
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="card border-0 shadow-sm p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedDock}
              onChange={(e) => setSelectedDock(e.target.value)}
            >
              <option value="">All Docks</option>
              {docks.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-3">
            <select
              className="form-select form-select-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Appointment Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="col-12 col-md-3">
            <input
              type="date"
              className="form-control form-control-sm"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div className="col-auto ms-auto">
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
              onClick={() => {
                setSelectedDock('');
                setSelectedStatus('');
                setSelectedDate('');
              }}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={appointments}
          isLoading={loading}
          emptyMessage="No dock appointments scheduled matching your criteria."
        />
      </div>

      {/* Book Appointment Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">Schedule Dock Operation</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Assign Dock"
                        name="dock"
                        type="select"
                        required
                        value={formData.dock}
                        onChange={(e) => setFormData({ ...formData, dock: e.target.value })}
                        options={docks
                          .filter((d) => d.status === 'Active')
                          .map((d) => ({
                            value: d._id,
                            label: `${d.name} (${d.code} - ${d.dockType})`,
                          }))}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <FormField
                        label="Eligible Vehicle Inside Yard"
                        name="gateVisit"
                        type="select"
                        required
                        value={formData.gateVisit}
                        onChange={(e) => setFormData({ ...formData, gateVisit: e.target.value })}
                        options={activeVisits.map((v) => ({
                          value: v._id,
                          label: `${v.vehicle?.registrationNumber} (Pass: ${v.gatePassNumber} - ${v.driver?.fullName})`,
                        }))}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <FormField
                        label="Appointment Date"
                        name="appointmentDate"
                        type="date"
                        required
                        value={formData.appointmentDate}
                        onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <FormField
                        label="Start Time (HH:mm)"
                        name="startTime"
                        required
                        placeholder="09:00"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <FormField
                        label="End Time (HH:mm)"
                        name="endTime"
                        required
                        placeholder="10:30"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <FormField
                        label="Operation Type"
                        name="operationType"
                        type="select"
                        value={formData.operationType}
                        onChange={(e) => setFormData({ ...formData, operationType: e.target.value })}
                        options={['Loading', 'Unloading']}
                      />
                    </div>

                    <div className="col-12 col-md-8">
                      <FormField
                        label="Notes / Special Instructions"
                        name="notes"
                        placeholder="e.g. Hazardous cargo precautions or pallet handling"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                    {actionLoading ? 'Verifying & Booking...' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppt && (
        <ConfirmDialog
          isOpen={showCancelModal}
          title="Cancel Dock Appointment"
          message={
            <div>
              <p>
                Are you sure you want to cancel the appointment at dock{' '}
                <strong>{selectedAppt.dock?.code}</strong> for vehicle{' '}
                <strong>{selectedAppt.gateVisit?.vehicle?.registrationNumber}</strong>?
              </p>
              <div className="mt-3">
                <label className="form-label small fw-semibold text-secondary">Cancellation Reason</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Reason for cancellation..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
          }
          confirmText="Confirm Cancellation"
          confirmVariant="danger"
          onConfirm={handleCancelConfirm}
          onCancel={() => {
            setShowCancelModal(false);
            setSelectedAppt(null);
          }}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default DockAppointments;
