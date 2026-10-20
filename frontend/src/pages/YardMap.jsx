import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';
import {
  Grid,
  MapPin,
  Truck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  LogOut,
  Info,
} from 'lucide-react';

const YardMap = () => {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Selected slot details drawer/modal
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  // Active unassigned gate visits inside yard
  const [activeVisits, setActiveVisits] = useState([]);
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [reassignSlotId, setReassignSlotId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [allAvailableSlots, setAllAvailableSlots] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchYardMap = async () => {
    try {
      setLoading(true);
      const res = await api.get('/yard-map');
      if (res.data.success) {
        setZones(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load visual yard map.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYardMap();
  }, []);

  const handleSlotClick = (slot) => {
    setSelectedSlot(slot);
  };

  // Open Allocate Modal (when clicking an Available slot)
  const handleOpenAllocate = async (slot) => {
    setSelectedSlot(slot);
    try {
      const res = await api.get('/gate-visits?status=Inside Yard&limit=100');
      // Filter visits that do not currently have a slot or can be assigned
      setActiveVisits(res.data.visits || []);
      setSelectedVisitId('');
      setShowAllocateModal(true);
    } catch (err) {
      toast.error('Failed to fetch vehicles inside yard.');
    }
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVisitId) {
      toast.error('Please select a vehicle to allocate to this slot.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/yard-slots/${selectedSlot._id}/allocate`, {
        visitId: selectedVisitId,
      });
      if (res.data.success) {
        toast.success(res.data.message);
        setShowAllocateModal(false);
        setSelectedSlot(null);
        fetchYardMap();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Slot allocation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Reassign Modal (when clicking an Occupied slot)
  const handleOpenReassign = async (slot) => {
    setSelectedSlot(slot);
    try {
      const res = await api.get('/yard-slots?status=Available');
      setAllAvailableSlots(res.data.data || []);
      setReassignSlotId('');
      setReassignReason('Traffic optimization');
      setShowReassignModal(true);
    } catch (err) {
      toast.error('Failed to load available slots for reassignment.');
    }
  };

  const handleReassignSubmit = async (e) => {
    e.preventDefault();
    if (!reassignSlotId) {
      toast.error('Please select target parking slot.');
      return;
    }

    const visitId = selectedSlot.currentVisit?._id || selectedSlot.currentVisit;
    if (!visitId) {
      toast.error('No active visit attached to this slot.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/gate-visits/${visitId}/reassign-slot`, {
        newSlotId: reassignSlotId,
        reason: reassignReason,
      });
      if (res.data.success) {
        toast.success('Slot reassigned successfully.');
        setShowReassignModal(false);
        setSelectedSlot(null);
        fetchYardMap();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reassignment failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Release Slot
  const handleReleaseConfirm = async () => {
    if (!selectedSlot) return;

    setActionLoading(true);
    try {
      const res = await api.post(`/yard-slots/${selectedSlot._id}/release`, {
        reason: 'Manual yard operator release',
      });
      if (res.data.success) {
        toast.success('Slot released to Available status.');
        setShowReleaseModal(false);
        setSelectedSlot(null);
        fetchYardMap();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release slot.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Rendering visual yard layout..." />;
  }

  // Filter zones and slots
  const filteredZones = zones
    .filter((z) => !selectedZoneFilter || z._id === selectedZoneFilter)
    .map((z) => {
      const filteredSlots = z.slots.filter(
        (s) => !selectedStatusFilter || s.status === selectedStatusFilter
      );
      return { ...z, slots: filteredSlots };
    });

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Visual Yard Parking Grid"
        subtitle="Live layout map of yard zones, parking slots, and real-time vehicle allocation."
        actions={
          <button
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 shadow-sm"
            onClick={fetchYardMap}
          >
            <RotateCcw size={14} />
            <span>Refresh Yard Grid</span>
          </button>
        }
      />

      {/* Yard Controls & Legend */}
      <div className="card border-0 shadow-sm p-3 mb-4">
        <div className="row g-3 align-items-center justify-content-between">
          <div className="col-12 col-md-6 d-flex flex-wrap gap-2">
            <select
              className="form-select form-select-sm"
              style={{ width: '180px' }}
              value={selectedZoneFilter}
              onChange={(e) => setSelectedZoneFilter(e.target.value)}
            >
              <option value="">All Yard Zones</option>
              {zones.map((z) => (
                <option key={z._id} value={z._id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>

            <select
              className="form-select form-select-sm"
              style={{ width: '160px' }}
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Available">Available Only</option>
              <option value="Occupied">Occupied Only</option>
              <option value="Blocked">Blocked Only</option>
            </select>
          </div>

          {/* Color Legend */}
          <div className="col-12 col-md-6 d-flex justify-content-md-end gap-3 flex-wrap small">
            <div className="d-flex align-items-center gap-1">
              <span className="badge bg-success p-1 rounded-circle" style={{ width: '10px', height: '10px' }}></span>
              <span className="text-secondary">Available</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="badge bg-warning p-1 rounded-circle" style={{ width: '10px', height: '10px' }}></span>
              <span className="text-secondary">Occupied</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="badge bg-danger p-1 rounded-circle" style={{ width: '10px', height: '10px' }}></span>
              <span className="text-secondary">Blocked / Maintenance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Zones Grid */}
      {filteredZones.map((zone) => (
        <div key={zone._id} className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-white py-3 border-bottom d-flex flex-column flex-sm-row justify-content-between align-items-sm-center">
            <div>
              <span className="fw-bold fs-6 text-dark me-2">{zone.name}</span>
              <span className="badge bg-light text-primary border font-monospace">{zone.code}</span>
              {zone.description && <div className="text-muted small mt-1">{zone.description}</div>}
            </div>
            <div className="mt-2 mt-sm-0 text-muted small d-flex gap-3">
              <span>Total: <strong>{zone.stats.total}</strong></span>
              <span className="text-success">Available: <strong>{zone.stats.available}</strong></span>
              <span className="text-warning">Occupied: <strong>{zone.stats.occupied}</strong></span>
              {zone.stats.blocked > 0 && <span className="text-danger">Blocked: <strong>{zone.stats.blocked}</strong></span>}
              <span className="badge bg-primary-subtle text-primary">Util: {zone.stats.utilization}%</span>
            </div>
          </div>

          <div className="card-body p-4">
            {zone.slots.length === 0 ? (
              <div className="text-center text-muted py-4 small">No slots configured in this zone matching filters.</div>
            ) : (
              <div className="yard-grid">
                {zone.slots.map((slot) => {
                  const statusClass =
                    slot.status === 'Available'
                      ? 'slot-available'
                      : slot.status === 'Occupied'
                      ? 'slot-occupied'
                      : 'slot-blocked';

                  return (
                    <div
                      key={slot._id}
                      className={`slot-box ${statusClass}`}
                      onClick={() => handleSlotClick(slot)}
                    >
                      <div className="fw-bold font-monospace fs-6">{slot.slotCode}</div>
                      <div className="small fw-semibold mt-1" style={{ fontSize: '0.72rem' }}>
                        {slot.status}
                      </div>
                      {slot.currentVehicle && (
                        <div className="small text-truncate text-dark fw-bold mt-1" style={{ fontSize: '0.7rem' }}>
                          <Truck size={12} className="me-1 inline" />
                          {slot.currentVehicle.registrationNumber}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Slot Details Modal */}
      {selectedSlot && !showAllocateModal && !showReassignModal && !showReleaseModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold text-dark">Slot {selectedSlot.slotCode}</h5>
                  <span className="text-muted small">{selectedSlot.zone?.name || 'Yard Facility'}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedSlot(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <span className="text-secondary small fw-semibold">Current Status</span>
                  <StatusBadge status={selectedSlot.status} />
                </div>

                <div className="mb-3">
                  <span className="text-secondary small fw-semibold">Slot Type:</span>
                  <div className="fw-medium text-dark">{selectedSlot.slotType || 'Standard'}</div>
                </div>

                {selectedSlot.notes && (
                  <div className="mb-3">
                    <span className="text-secondary small fw-semibold">Slot Notes:</span>
                    <div className="small text-muted">{selectedSlot.notes}</div>
                  </div>
                )}

                {selectedSlot.status === 'Occupied' && (
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-1">
                      <Truck size={16} />
                      <span>Assigned Vehicle & Visit</span>
                    </h6>
                    <div className="small mb-1">
                      Registration:{' '}
                      <strong>{selectedSlot.currentVehicle?.registrationNumber || 'N/A'}</strong> (
                      {selectedSlot.currentVehicle?.vehicleType || ''})
                    </div>
                    {selectedSlot.currentVisit && (
                      <>
                        <div className="small mb-1">
                          Gate Pass: <strong className="text-primary font-monospace">{selectedSlot.currentVisit.gatePassNumber}</strong>
                        </div>
                        {selectedSlot.currentVisit.driver && (
                          <div className="small mb-1">
                            Driver: <strong>{selectedSlot.currentVisit.driver.fullName}</strong>
                          </div>
                        )}
                        <div className="small text-muted">
                          Occupied Since: {new Date(selectedSlot.currentVisit.entryTime || selectedSlot.updatedAt).toLocaleTimeString()}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setSelectedSlot(null)}>
                  Close
                </button>

                {selectedSlot.status === 'Available' && (
                  <button
                    type="button"
                    className="btn btn-primary d-flex align-items-center gap-1"
                    onClick={() => handleOpenAllocate(selectedSlot)}
                  >
                    <MapPin size={16} />
                    <span>Allocate Vehicle</span>
                  </button>
                )}

                {selectedSlot.status === 'Occupied' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-outline-primary d-flex align-items-center gap-1"
                      onClick={() => handleOpenReassign(selectedSlot)}
                    >
                      <ArrowRightLeft size={16} />
                      <span>Reassign Slot</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger d-flex align-items-center gap-1"
                      onClick={() => setShowReleaseModal(true)}
                    >
                      <LogOut size={16} />
                      <span>Release Slot</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && selectedSlot && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">Allocate Slot {selectedSlot.slotCode}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAllocateModal(false)}></button>
              </div>
              <form onSubmit={handleAllocateSubmit}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Select a vehicle currently inside the yard to allocate to parking slot{' '}
                    <strong>{selectedSlot.slotCode}</strong>.
                  </p>

                  <FormField
                    label="Active Vehicle / Gate Visit"
                    name="visitId"
                    type="select"
                    required
                    placeholder="Select Vehicle inside yard..."
                    value={selectedVisitId}
                    onChange={(e) => setSelectedVisitId(e.target.value)}
                    options={activeVisits.map((v) => ({
                      value: v._id,
                      label: `${v.vehicle?.registrationNumber} (Pass: ${v.gatePassNumber} - Driver: ${v.driver?.fullName})`,
                    }))}
                  />
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowAllocateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                    {actionLoading ? 'Allocating...' : 'Confirm Allocation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      {showReassignModal && selectedSlot && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">
                  Reassign Vehicle from Slot {selectedSlot.slotCode}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowReassignModal(false)}></button>
              </div>
              <form onSubmit={handleReassignSubmit}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Vehicle <strong>{selectedSlot.currentVehicle?.registrationNumber}</strong> will be moved to
                    the new target parking slot, and slot {selectedSlot.slotCode} will become Available.
                  </p>

                  <FormField
                    label="Destination Parking Slot"
                    name="newSlotId"
                    type="select"
                    required
                    placeholder="Select Available Target Slot..."
                    value={reassignSlotId}
                    onChange={(e) => setReassignSlotId(e.target.value)}
                    options={allAvailableSlots.map((s) => ({
                      value: s._id,
                      label: `Slot ${s.slotCode} (${s.zone?.name || 'General'})`,
                    }))}
                  />

                  <FormField
                    label="Reason for Reassignment"
                    name="reassignReason"
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="e.g. Traffic staging or dock proximity"
                  />
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowReassignModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                    {actionLoading ? 'Reassigning...' : 'Confirm Reassignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Release Confirmation Dialog */}
      {showReleaseModal && selectedSlot && (
        <ConfirmDialog
          isOpen={showReleaseModal}
          title={`Release Parking Slot ${selectedSlot.slotCode}`}
          message={`Are you sure you want to release slot ${selectedSlot.slotCode}? The vehicle ${selectedSlot.currentVehicle?.registrationNumber || ''} will no longer have an assigned parking slot.`}
          confirmText="Confirm Release"
          confirmVariant="warning"
          onConfirm={handleReleaseConfirm}
          onCancel={() => setShowReleaseModal(false)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default YardMap;
