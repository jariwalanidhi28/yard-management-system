import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchFilterBar from '../components/SearchFilterBar';
import StatusBadge from '../components/StatusBadge';
import FormField from '../components/FormField';
import toast from 'react-hot-toast';
import {
  Package,
  PlusCircle,
  Eye,
  Clock,
  Printer,
  MapPin,
  CheckCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const ALLOWED_NEXT_STATUS = {
  Created: ['Arrived', 'Loading', 'Cancelled'],
  Arrived: ['Loading', 'Unloading', 'Cancelled'],
  Loading: ['In Transit', 'Cancelled'],
  'In Transit': ['Arrived', 'Unloading', 'Delivered', 'Cancelled'],
  Unloading: ['Delivered', 'Cancelled'],
  Delivered: [],
  Cancelled: [],
};

const Shipments = () => {
  const [shipments, setShipments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Active gate visits for linkage
  const [activeVisits, setActiveVisits] = useState([]);

  // Create Form State
  const [formData, setFormData] = useState({
    orderNumber: '',
    consignee: '',
    origin: '',
    destination: '',
    description: '',
    weight: 1000,
    weightUnit: 'Kg',
    quantity: 1,
    gateVisit: '',
    currentStatus: 'Created',
  });

  // New Event Form State
  const [eventForm, setEventForm] = useState({
    status: '',
    location: '',
    notes: '',
  });

  const fetchShipments = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, search, status };
      const [sRes, vRes] = await Promise.all([
        api.get('/shipments', { params }),
        api.get('/gate-visits?status=Inside Yard&limit=100'),
      ]);
      setShipments(sRes.data.shipments || []);
      setPagination(sRes.data.pagination || { page: 1, totalPages: 1, total: 0 });
      setActiveVisits(vRes.data.visits || []);
    } catch (err) {
      toast.error('Failed to load shipments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments(1);
  }, [search, status]);

  const handleOpenCreate = () => {
    setFormData({
      orderNumber: '',
      consignee: '',
      origin: '',
      destination: '',
      description: '',
      weight: 1000,
      weightUnit: 'Kg',
      quantity: 1,
      gateVisit: '',
      currentStatus: 'Created',
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/shipments', formData);
      if (res.data.success) {
        toast.success(res.data.message);
        setShowCreateModal(false);
        fetchShipments(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create shipment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = async (shipment) => {
    try {
      const res = await api.get(`/shipments/${shipment._id}`);
      setSelectedShipment(res.data.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load shipment details.');
    }
  };

  const handleOpenAddEvent = () => {
    const nextAllowed = ALLOWED_NEXT_STATUS[selectedShipment.currentStatus] || [];
    setEventForm({
      status: nextAllowed[0] || '',
      location: 'Yard Operations Bay',
      notes: '',
    });
    setShowEventModal(true);
  };

  const handleAddEventSubmit = async (e) => {
    e.preventDefault();
    if (!eventForm.status) {
      toast.error('Please select valid target status.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/shipments/${selectedShipment._id}/events`, eventForm);
      if (res.data.success) {
        toast.success('Shipment event recorded.');
        setShowEventModal(false);
        // Refresh details modal
        const refreshed = await api.get(`/shipments/${selectedShipment._id}`);
        setSelectedShipment(refreshed.data.data);
        fetchShipments(pagination.page);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Tracking #',
      key: 'trackingNumber',
      render: (row) => (
        <div>
          <span className="fw-bold font-monospace text-primary">{row.trackingNumber}</span>
          <div className="small text-muted font-monospace">{row.orderNumber}</div>
        </div>
      ),
    },
    {
      header: 'Consignee / Customer',
      key: 'consignee',
      render: (row) => <span className="fw-semibold text-dark">{row.consignee}</span>,
    },
    {
      header: 'Route (Origin → Dest)',
      key: 'route',
      render: (row) => (
        <span className="small">
          {row.origin} <ArrowRight size={12} className="inline text-muted" /> {row.destination}
        </span>
      ),
    },
    {
      header: 'Weight / Qty',
      key: 'weight',
      render: (row) => (
        <span className="small">
          {row.weight} {row.weightUnit} ({row.quantity} units)
        </span>
      ),
    },
    {
      header: 'Current Status',
      key: 'currentStatus',
      render: (row) => <StatusBadge status={row.currentStatus} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          className="btn btn-outline-info btn-sm px-2 py-1 d-flex align-items-center gap-1"
          onClick={() => handleViewDetails(row)}
        >
          <Eye size={14} />
          <span>Timeline</span>
        </button>
      ),
    },
  ];

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Shipment Management & Real-Time Tracking"
        subtitle="Manage logistics orders, track status milestones, and maintain tamper-proof event logs."
        actions={
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenCreate}
          >
            <PlusCircle size={16} />
            <span>Create Shipment</span>
          </button>
        }
      />

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by Tracking #, Order #, Consignee, or City..."
        filters={[
          {
            key: 'status',
            label: 'All Shipment Statuses',
            options: ['Created', 'Arrived', 'Loading', 'In Transit', 'Unloading', 'Delivered', 'Cancelled'],
          },
        ]}
        activeFilters={{ status }}
        onFilterChange={(key, val) => setStatus(val)}
        onReset={() => {
          setSearch('');
          setStatus('');
        }}
      />

      <div className="card border-0 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={shipments}
          isLoading={loading}
          emptyMessage="No shipments found matching your search."
        />
        <div className="p-3">
          <Pagination pagination={pagination} onPageChange={(p) => fetchShipments(p)} />
        </div>
      </div>

      {/* Create Shipment Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">Register Shipment</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Order / Reference #"
                        name="orderNumber"
                        required
                        placeholder="e.g. ORD-99214"
                        value={formData.orderNumber}
                        onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Consignee / Client Name"
                        name="consignee"
                        required
                        placeholder="e.g. Northstar Retail Distribution"
                        value={formData.consignee}
                        onChange={(e) => setFormData({ ...formData, consignee: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <FormField
                        label="Origin Location"
                        name="origin"
                        required
                        placeholder="e.g. Chicago Freight Hub, IL"
                        value={formData.origin}
                        onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Destination Location"
                        name="destination"
                        required
                        placeholder="e.g. Dallas Logistics Yard, TX"
                        value={formData.destination}
                        onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      />
                    </div>

                    <div className="col-6 col-md-4">
                      <FormField
                        label="Cargo Weight"
                        name="weight"
                        type="number"
                        required
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <FormField
                        label="Weight Unit"
                        name="weightUnit"
                        type="select"
                        value={formData.weightUnit}
                        onChange={(e) => setFormData({ ...formData, weightUnit: e.target.value })}
                        options={['Kg', 'Tons', 'Lbs']}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <FormField
                        label="Package / Pallet Quantity"
                        name="quantity"
                        type="number"
                        required
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <FormField
                        label="Link to Active Yard Vehicle (Optional)"
                        name="gateVisit"
                        type="select"
                        placeholder="Select active visit or leave unassigned..."
                        value={formData.gateVisit}
                        onChange={(e) => setFormData({ ...formData, gateVisit: e.target.value })}
                        options={activeVisits.map((v) => ({
                          value: v._id,
                          label: `${v.vehicle?.registrationNumber} (Gate Pass: ${v.gatePassNumber})`,
                        }))}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Initial Status"
                        name="currentStatus"
                        type="select"
                        value={formData.currentStatus}
                        onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value })}
                        options={['Created', 'Arrived', 'Loading', 'In Transit']}
                      />
                    </div>

                    <div className="col-12">
                      <FormField
                        label="Description of Cargo"
                        name="description"
                        type="textarea"
                        rows={2}
                        placeholder="Contents, fragile flags, or seal numbers"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                    {actionLoading ? 'Creating...' : 'Create Shipment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Shipment Timeline & Details Modal */}
      {showDetailModal && selectedShipment && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold text-dark font-monospace">
                    {selectedShipment.trackingNumber}
                  </h5>
                  <span className="text-muted small">Order: {selectedShipment.orderNumber} | Consignee: {selectedShipment.consignee}</span>
                </div>
                <button type="button" className="btn-close no-print" onClick={() => setShowDetailModal(false)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 p-3 bg-light rounded-3 border mb-4 small">
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Origin:</span>
                    <div className="fw-semibold text-dark">{selectedShipment.origin}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Destination:</span>
                    <div className="fw-semibold text-dark">{selectedShipment.destination}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Weight & Quantity:</span>
                    <div className="fw-semibold text-dark">{selectedShipment.weight} {selectedShipment.weightUnit} ({selectedShipment.quantity} units)</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Current Status:</span>
                    <div><StatusBadge status={selectedShipment.currentStatus} /></div>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1">
                    <Clock size={16} />
                    <span>Chronological Tracking Timeline</span>
                  </h6>

                  {selectedShipment.currentStatus !== 'Delivered' && selectedShipment.currentStatus !== 'Cancelled' && (
                    <button
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 no-print"
                      onClick={handleOpenAddEvent}
                    >
                      <PlusCircle size={14} />
                      <span>Update Status</span>
                    </button>
                  )}
                </div>

                {/* Timeline */}
                <div className="tracking-timeline mt-3">
                  {selectedShipment.timeline?.map((evt, idx) => (
                    <div key={idx} className="tracking-timeline-item">
                      <div className="tracking-timeline-point"></div>
                      <div className="d-flex justify-content-between align-items-baseline">
                        <span className="fw-bold text-dark fs-6">{evt.status}</span>
                        <small className="text-muted">
                          {new Date(evt.timestamp).toLocaleString()}
                        </small>
                      </div>
                      <div className="small text-secondary mt-1">
                        <MapPin size={12} className="inline me-1 text-muted" />
                        {evt.location}
                      </div>
                      {evt.notes && <div className="small text-muted mt-1 bg-white p-2 rounded border">{evt.notes}</div>}
                      {evt.updatedBy && (
                        <div className="text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                          Updated by: {evt.updatedBy.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer bg-light border-0 no-print">
                <button
                  type="button"
                  className="btn btn-outline-secondary d-flex align-items-center gap-2"
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  <span>Print Receipt</span>
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Event / Transition Modal */}
      {showEventModal && selectedShipment && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.7)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">Record Status Milestone</h5>
                <button type="button" className="btn-close" onClick={() => setShowEventModal(false)}></button>
              </div>
              <form onSubmit={handleAddEventSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3 small">
                    Current Status: <StatusBadge status={selectedShipment.currentStatus} />
                  </div>

                  <FormField
                    label="Permitted Target Status"
                    name="status"
                    type="select"
                    required
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    options={ALLOWED_NEXT_STATUS[selectedShipment.currentStatus] || []}
                  />

                  <FormField
                    label="Checkpoint / Facility Location"
                    name="location"
                    required
                    placeholder="e.g. Dallas Yard - Bay 3"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  />

                  <FormField
                    label="Event Observations & Notes"
                    name="notes"
                    type="textarea"
                    rows={2}
                    placeholder="Notes regarding seal inspection, carrier handoff, etc."
                    value={eventForm.notes}
                    onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                  />
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEventModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                    {actionLoading ? 'Logging Event...' : 'Record Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shipments;
