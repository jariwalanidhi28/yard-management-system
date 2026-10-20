import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchFilterBar from '../components/SearchFilterBar';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import toast from 'react-hot-toast';
import {
  DoorOpen,
  PlusCircle,
  LogOut,
  Printer,
  Clock,
  Eye,
  CheckCircle,
  Truck,
  User,
} from 'lucide-react';

const GateVisits = () => {
  const [visits, setVisits] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [purpose, setPurpose] = useState('');

  // Modals
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [exitNotes, setExitNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form options for check-in
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Check-In Form State
  const [formData, setFormData] = useState({
    vehicleId: '',
    driverId: '',
    purpose: 'Loading',
    assignedSlot: '',
    shipmentReference: '',
    notes: '',
  });

  const fetchVisits = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, search, status, purpose };
      const res = await api.get('/gate-visits', { params });
      if (res.data.success) {
        setVisits(res.data.visits);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load gate visits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits(1);
  }, [search, status, purpose]);

  // Load vehicles, drivers, and slots when opening Check-In modal
  const handleOpenCheckIn = async () => {
    try {
      const [vRes, dRes, sRes] = await Promise.all([
        api.get('/vehicles?status=Active&limit=100'),
        api.get('/drivers?status=Active&limit=100'),
        api.get('/yard-slots?status=Available'),
      ]);
      setVehicles(vRes.data.vehicles || []);
      setDrivers(dRes.data.drivers || []);
      setAvailableSlots(sRes.data.data || []);
      setShowCheckInModal(true);
    } catch (err) {
      toast.error('Failed to load resources for check-in.');
    }
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicleId || !formData.driverId) {
      toast.error('Vehicle and Driver are required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/gate-visits', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowCheckInModal(false);
        setFormData({
          vehicleId: '',
          driverId: '',
          purpose: 'Loading',
          assignedSlot: '',
          shipmentReference: '',
          notes: '',
        });
        fetchVisits(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gate entry failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordExit = async () => {
    if (!selectedVisit) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/gate-visits/${selectedVisit._id}/exit`, { exitNotes });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowExitModal(false);
        setSelectedVisit(null);
        setExitNotes('');
        fetchVisits(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record exit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = (visit) => {
    setSelectedVisit(visit);
    setShowPrintModal(true);
  };

  const columns = [
    {
      header: 'Gate Pass #',
      key: 'gatePassNumber',
      render: (row) => (
        <div>
          <span className="fw-bold text-primary font-monospace">{row.gatePassNumber}</span>
          {row.shipmentReference && (
            <div className="small text-muted">Ref: {row.shipmentReference}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Vehicle',
      key: 'vehicle.registrationNumber',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.vehicle?.registrationNumber || 'N/A'}</div>
          <small className="text-muted">{row.vehicle?.vehicleType || ''}</small>
        </div>
      ),
    },
    {
      header: 'Driver',
      key: 'driver.fullName',
      render: (row) => (
        <div>
          <div className="fw-medium text-dark">{row.driver?.fullName || 'N/A'}</div>
          <small className="text-muted">{row.driver?.phoneNumber || ''}</small>
        </div>
      ),
    },
    {
      header: 'Slot',
      key: 'assignedSlot.slotCode',
      render: (row) =>
        row.assignedSlot ? (
          <span className="badge bg-light text-dark border fw-semibold">
            Slot {row.assignedSlot.slotCode}
          </span>
        ) : (
          <span className="text-muted small">None</span>
        ),
    },
    {
      header: 'Purpose',
      key: 'purpose',
      render: (row) => <span className="small">{row.purpose}</span>,
    },
    {
      header: 'Entry / Duration',
      key: 'entryTime',
      render: (row) => (
        <div>
          <div className="small text-dark">
            {new Date(row.entryTime).toLocaleDateString()} {new Date(row.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-muted small d-flex align-items-center gap-1">
            <Clock size={12} />
            <span>{row.durationMinutes} mins {row.status === 'Inside Yard' ? '(Ongoing)' : ''}</span>
          </div>
        </div>
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
          <button
            className="btn btn-outline-secondary btn-sm p-1"
            title="Print Gate Pass"
            onClick={() => handlePrint(row)}
          >
            <Printer size={15} />
          </button>
          {row.status === 'Inside Yard' && (
            <button
              className="btn btn-outline-danger btn-sm px-2 py-1 d-flex align-items-center gap-1"
              title="Record Gate Exit"
              onClick={() => {
                setSelectedVisit(row);
                setShowExitModal(true);
              }}
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Gate Entry & Exit Management"
        subtitle="Manage arriving and departing freight, verify licenses, and issue gate passes."
        actions={
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenCheckIn}
          >
            <PlusCircle size={16} />
            <span>Vehicle Check-In</span>
          </button>
        }
      />

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by Gate Pass, Plate, Driver, or Shipment Ref..."
        filters={[
          {
            key: 'status',
            label: 'All Statuses',
            options: [
              { value: 'Inside Yard', label: 'Inside Yard' },
              { value: 'Exited', label: 'Exited' },
              { value: 'Cancelled', label: 'Cancelled' },
            ],
          },
          {
            key: 'purpose',
            label: 'All Purposes',
            options: ['Loading', 'Unloading', 'Parking', 'Maintenance', 'Inspection', 'Other'],
          },
        ]}
        activeFilters={{ status, purpose }}
        onFilterChange={(key, val) => (key === 'status' ? setStatus(val) : setPurpose(val))}
        onReset={() => {
          setSearch('');
          setStatus('');
          setPurpose('');
        }}
      />

      <div className="card border-0 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={visits}
          isLoading={loading}
          emptyMessage="No gate visits recorded matching your criteria."
        />
        <div className="p-3">
          <Pagination pagination={pagination} onPageChange={(p) => fetchVisits(p)} />
        </div>
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">Gate Check-In & Entry Pass</h5>
                <button type="button" className="btn-close" onClick={() => setShowCheckInModal(false)}></button>
              </div>
              <form onSubmit={handleCheckInSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Arriving Vehicle"
                        name="vehicleId"
                        type="select"
                        required
                        placeholder="Select Active Vehicle..."
                        value={formData.vehicleId}
                        onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                        options={vehicles.map((v) => ({
                          value: v._id,
                          label: `${v.registrationNumber} (${v.vehicleType} - ${v.makeModel})`,
                        }))}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Designated Driver"
                        name="driverId"
                        type="select"
                        required
                        placeholder="Select Verified Driver..."
                        value={formData.driverId}
                        onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                        options={drivers.map((d) => ({
                          value: d._id,
                          label: `${d.fullName} (License: ${d.licenseNumber})`,
                        }))}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <FormField
                        label="Purpose of Visit"
                        name="purpose"
                        type="select"
                        required
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        options={['Loading', 'Unloading', 'Parking', 'Maintenance', 'Inspection', 'Other']}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <FormField
                        label="Assign Yard Parking Slot (Optional)"
                        name="assignedSlot"
                        type="select"
                        placeholder="Assign later or choose slot..."
                        value={formData.assignedSlot}
                        onChange={(e) => setFormData({ ...formData, assignedSlot: e.target.value })}
                        options={availableSlots.map((s) => ({
                          value: s._id,
                          label: `Slot ${s.slotCode} (${s.zone?.name || 'General'})`,
                        }))}
                      />
                    </div>

                    <div className="col-12 col-md-4">
                      <FormField
                        label="Shipment Reference / PO #"
                        name="shipmentReference"
                        placeholder="e.g. PO-98124"
                        value={formData.shipmentReference}
                        onChange={(e) => setFormData({ ...formData, shipmentReference: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <FormField
                        label="Operational Notes"
                        name="notes"
                        type="textarea"
                        placeholder="Inspection observations, cargo seal integrity, etc."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCheckInModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                    {submitting ? 'Generating Gate Pass...' : 'Confirm Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Record Exit Modal */}
      {showExitModal && selectedVisit && (
        <ConfirmDialog
          isOpen={showExitModal}
          title={`Confirm Gate Departure - Pass ${selectedVisit.gatePassNumber}`}
          message={
            <div>
              <p>
                Are you sure you want to record the exit for vehicle{' '}
                <strong>{selectedVisit.vehicle?.registrationNumber}</strong> driven by{' '}
                <strong>{selectedVisit.driver?.fullName}</strong>?
              </p>
              <p className="text-muted small">
                This will automatically release any assigned parking slot back to Available status.
              </p>
              <div className="mt-3">
                <label className="form-label small fw-semibold text-secondary">Exit Notes (Optional)</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Gate departure inspection notes"
                  value={exitNotes}
                  onChange={(e) => setExitNotes(e.target.value)}
                />
              </div>
            </div>
          }
          confirmText="Confirm Exit"
          confirmVariant="danger"
          onConfirm={handleRecordExit}
          onCancel={() => {
            setShowExitModal(false);
            setSelectedVisit(null);
          }}
          isLoading={submitting}
        />
      )}

      {/* Printable Gate Pass Receipt Modal */}
      {showPrintModal && selectedVisit && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header no-print">
                <h5 className="modal-title fw-bold text-dark">Gate Pass Receipt</h5>
                <button type="button" className="btn-close" onClick={() => setShowPrintModal(false)}></button>
              </div>
              <div className="modal-body p-4 text-center print-section">
                <div className="border border-2 border-dark p-4 rounded-3 text-start bg-white">
                  <div className="text-center pb-3 border-bottom border-dark mb-3">
                    <h5 className="fw-bold mb-0 text-uppercase">Logistics Facility Yard Pass</h5>
                    <div className="small text-muted">Authorized Security Document</div>
                  </div>

                  <div className="text-center my-3 p-2 bg-light border font-monospace fs-4 fw-bold text-dark letter-spacing-1">
                    {selectedVisit.gatePassNumber}
                  </div>

                  <div className="row g-2 small mb-3">
                    <div className="col-6">
                      <span className="text-muted">Vehicle Registration:</span>
                      <div className="fw-bold fs-6">{selectedVisit.vehicle?.registrationNumber || 'N/A'}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Driver Name:</span>
                      <div className="fw-bold fs-6">{selectedVisit.driver?.fullName || 'N/A'}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Driver License:</span>
                      <div className="fw-bold">{selectedVisit.driver?.licenseNumber || 'N/A'}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Purpose:</span>
                      <div className="fw-bold">{selectedVisit.purpose}</div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Assigned Yard Slot:</span>
                      <div className="fw-bold text-primary fs-6">
                        {selectedVisit.assignedSlot ? selectedVisit.assignedSlot.slotCode : 'Unassigned'}
                      </div>
                    </div>
                    <div className="col-6">
                      <span className="text-muted">Status:</span>
                      <div><StatusBadge status={selectedVisit.status} /></div>
                    </div>
                    <div className="col-12">
                      <span className="text-muted">Entry Timestamp:</span>
                      <div className="fw-bold">
                        {new Date(selectedVisit.entryTime).toLocaleString()}
                      </div>
                    </div>
                    {selectedVisit.exitTime && (
                      <div className="col-12">
                        <span className="text-muted">Exit Timestamp:</span>
                        <div className="fw-bold">
                          {new Date(selectedVisit.exitTime).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-center border-top border-dark pt-3 text-muted" style={{ fontSize: '0.72rem' }}>
                    Keep this pass visible on vehicle dashboard while inside the yard facility.
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light border-0 no-print">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPrintModal(false)}>
                  Close
                </button>
                <button type="button" className="btn btn-primary d-flex align-items-center gap-2" onClick={() => window.print()}>
                  <Printer size={16} />
                  Print Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GateVisits;
