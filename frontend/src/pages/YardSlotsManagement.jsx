import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { PlusCircle, Edit2, Trash2, MapPin, Grid, History } from 'lucide-react';

const YardSlotsManagement = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('slots');

  // Zones & Slots Data
  const [zones, setZones] = useState([]);
  const [slots, setSlots] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);

  // Deletion
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'zone' | 'slot'
  const [actionLoading, setActionLoading] = useState(false);

  // Zone form state
  const [zoneForm, setZoneForm] = useState({ name: '', code: '', description: '' });

  // Slot form state
  const [slotForm, setSlotForm] = useState({
    slotCode: '',
    zone: '',
    slotType: 'Standard',
    status: 'Available',
    notes: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zRes, sRes, mRes] = await Promise.all([
        api.get('/yard-zones'),
        api.get('/yard-slots'),
        api.get('/yard-movements?limit=50'),
      ]);
      setZones(zRes.data.data || []);
      setSlots(sRes.data.data || []);
      setMovements(mRes.data.movements || []);
    } catch (err) {
      toast.error('Failed to load yard configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Zone Handlers
  const handleOpenCreateZone = () => {
    setEditingZone(null);
    setZoneForm({ name: '', code: '', description: '' });
    setShowZoneModal(true);
  };

  const handleOpenEditZone = (zone) => {
    setEditingZone(zone);
    setZoneForm({ name: zone.name, code: zone.code, description: zone.description || '' });
    setShowZoneModal(true);
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingZone) {
        await api.patch(`/yard-zones/${editingZone._id}`, zoneForm);
        toast.success('Zone updated successfully.');
      } else {
        await api.post('/yard-zones', zoneForm);
        toast.success('Zone created successfully.');
      }
      setShowZoneModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save zone.');
    } finally {
      setActionLoading(false);
    }
  };

  // Slot Handlers
  const handleOpenCreateSlot = () => {
    setEditingSlot(null);
    setSlotForm({
      slotCode: '',
      zone: zones[0]?._id || '',
      slotType: 'Standard',
      status: 'Available',
      notes: '',
    });
    setShowSlotModal(true);
  };

  const handleOpenEditSlot = (slot) => {
    setEditingSlot(slot);
    setSlotForm({
      slotCode: slot.slotCode,
      zone: slot.zone?._id || slot.zone,
      slotType: slot.slotType,
      status: slot.status,
      notes: slot.notes || '',
    });
    setShowSlotModal(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingSlot) {
        await api.patch(`/yard-slots/${editingSlot._id}`, slotForm);
        toast.success('Slot updated successfully.');
      } else {
        await api.post('/yard-slots', slotForm);
        toast.success('Slot created successfully.');
      }
      setShowSlotModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save slot.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Handlers
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      if (deleteType === 'zone') {
        await api.delete(`/yard-zones/${deleteTarget._id}`);
        toast.success('Zone deleted.');
      } else {
        await api.delete(`/yard-slots/${deleteTarget._id}`);
        toast.success('Slot deleted.');
      }
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deletion failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const slotColumns = [
    {
      header: 'Slot Code',
      key: 'slotCode',
      render: (row) => <span className="fw-bold font-monospace text-primary">{row.slotCode}</span>,
    },
    {
      header: 'Zone',
      key: 'zone.name',
      render: (row) => <span>{row.zone?.name || 'General Zone'}</span>,
    },
    {
      header: 'Slot Type',
      key: 'slotType',
    },
    {
      header: 'Current Vehicle',
      key: 'currentVehicle.registrationNumber',
      render: (row) =>
        row.currentVehicle ? (
          <span className="fw-semibold text-dark">{row.currentVehicle.registrationNumber}</span>
        ) : (
          <span className="text-muted small">None</span>
        ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    ...(isAdmin
      ? [
          {
            header: 'Actions',
            key: 'actions',
            render: (row) => (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm p-1"
                  onClick={() => handleOpenEditSlot(row)}
                  title="Edit Slot"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn btn-outline-danger btn-sm p-1"
                  onClick={() => {
                    setDeleteTarget(row);
                    setDeleteType('slot');
                  }}
                  disabled={row.status === 'Occupied'}
                  title={row.status === 'Occupied' ? 'Cannot delete occupied slot' : 'Delete Slot'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const zoneColumns = [
    {
      header: 'Zone Code',
      key: 'code',
      render: (row) => <span className="fw-bold font-monospace text-dark">{row.code}</span>,
    },
    {
      header: 'Zone Name',
      key: 'name',
      render: (row) => <span className="fw-semibold">{row.name}</span>,
    },
    {
      header: 'Description',
      key: 'description',
    },
    {
      header: 'Status',
      key: 'isActive',
      render: (row) => (
        <span className={`badge ${row.isActive ? 'bg-success' : 'bg-secondary'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            header: 'Actions',
            key: 'actions',
            render: (row) => (
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm p-1"
                  onClick={() => handleOpenEditZone(row)}
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn btn-outline-danger btn-sm p-1"
                  onClick={() => {
                    setDeleteTarget(row);
                    setDeleteType('zone');
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  const movementColumns = [
    {
      header: 'Timestamp',
      key: 'timestamp',
      render: (row) => (
        <span className="small text-muted">
          {new Date(row.timestamp).toLocaleDateString()} {new Date(row.timestamp).toLocaleTimeString()}
        </span>
      ),
    },
    {
      header: 'Vehicle',
      key: 'vehicle.registrationNumber',
      render: (row) => <span className="fw-semibold text-dark">{row.vehicle?.registrationNumber || 'N/A'}</span>,
    },
    {
      header: 'Action',
      key: 'action',
      render: (row) => <StatusBadge status={row.action} />,
    },
    {
      header: 'Movement Path',
      key: 'movementPath',
      render: (row) => (
        <span className="small font-monospace">
          {row.fromSlot ? `Slot ${row.fromSlot.slotCode}` : 'Gate'} →{' '}
          {row.toSlot ? `Slot ${row.toSlot.slotCode}` : 'Exit Gate'}
        </span>
      ),
    },
    {
      header: 'Reason',
      key: 'reason',
      render: (row) => <span className="small text-muted">{row.reason}</span>,
    },
    {
      header: 'Operator',
      key: 'performedBy.name',
      render: (row) => <span className="small">{row.performedBy?.name || 'System'}</span>,
    },
  ];

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Yard Zones & Parking Slots"
        subtitle="Configure physical yard spaces, manage parking slots, and inspect movement audit logs."
        actions={
          isAdmin && (
            <div className="d-flex gap-2">
              <button className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" onClick={handleOpenCreateZone}>
                <PlusCircle size={15} />
                <span>Add Zone</span>
              </button>
              <button className="btn btn-primary btn-sm d-flex align-items-center gap-1" onClick={handleOpenCreateSlot}>
                <PlusCircle size={15} />
                <span>Add Parking Slot</span>
              </button>
            </div>
          )
        }
      />

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 bg-white p-2 rounded-3 shadow-sm border">
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 d-flex align-items-center gap-2 ${activeTab === 'slots' ? 'active' : ''}`}
            onClick={() => setActiveTab('slots')}
          >
            <Grid size={16} />
            <span>Parking Slots ({slots.length})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 d-flex align-items-center gap-2 ${activeTab === 'zones' ? 'active' : ''}`}
            onClick={() => setActiveTab('zones')}
          >
            <MapPin size={16} />
            <span>Yard Zones ({zones.length})</span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link py-2 px-3 d-flex align-items-center gap-2 ${activeTab === 'movements' ? 'active' : ''}`}
            onClick={() => setActiveTab('movements')}
          >
            <History size={16} />
            <span>Movements Audit Trail</span>
          </button>
        </li>
      </ul>

      <div className="card border-0 shadow-sm overflow-hidden">
        {activeTab === 'slots' && (
          <DataTable
            columns={slotColumns}
            data={slots}
            isLoading={loading}
            emptyMessage="No parking slots configured yet."
          />
        )}

        {activeTab === 'zones' && (
          <DataTable
            columns={zoneColumns}
            data={zones}
            isLoading={loading}
            emptyMessage="No yard zones configured yet."
          />
        )}

        {activeTab === 'movements' && (
          <DataTable
            columns={movementColumns}
            data={movements}
            isLoading={loading}
            emptyMessage="No yard movements recorded yet."
          />
        )}
      </div>

      {/* Zone Modal */}
      {showZoneModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">{editingZone ? 'Edit Zone' : 'New Yard Zone'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowZoneModal(false)}></button>
              </div>
              <form onSubmit={handleSaveZone}>
                <div className="modal-body p-4">
                  <FormField
                    label="Zone Code (e.g. ZONE-A)"
                    name="code"
                    required
                    value={zoneForm.code}
                    onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
                  />
                  <FormField
                    label="Zone Name"
                    name="name"
                    required
                    value={zoneForm.name}
                    onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                  />
                  <FormField
                    label="Description"
                    name="description"
                    type="textarea"
                    rows={2}
                    value={zoneForm.description}
                    onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
                  />
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowZoneModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Zone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">{editingSlot ? 'Edit Slot' : 'New Parking Slot'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowSlotModal(false)}></button>
              </div>
              <form onSubmit={handleSaveSlot}>
                <div className="modal-body p-4">
                  <FormField
                    label="Slot Code (e.g. A-01)"
                    name="slotCode"
                    required
                    value={slotForm.slotCode}
                    onChange={(e) => setSlotForm({ ...slotForm, slotCode: e.target.value.toUpperCase() })}
                  />
                  <FormField
                    label="Yard Zone"
                    name="zone"
                    type="select"
                    required
                    value={slotForm.zone}
                    onChange={(e) => setSlotForm({ ...slotForm, zone: e.target.value })}
                    options={zones.map((z) => ({ value: z._id, label: `${z.name} (${z.code})` }))}
                  />
                  <FormField
                    label="Slot Type"
                    name="slotType"
                    type="select"
                    value={slotForm.slotType}
                    onChange={(e) => setSlotForm({ ...slotForm, slotType: e.target.value })}
                    options={['Standard', 'Oversized', 'Reefer', 'Hazmat', 'Staging']}
                  />
                  <FormField
                    label="Availability Status"
                    name="status"
                    type="select"
                    value={slotForm.status}
                    onChange={(e) => setSlotForm({ ...slotForm, status: e.target.value })}
                    options={['Available', 'Blocked']}
                  />
                  <FormField
                    label="Notes"
                    name="notes"
                    value={slotForm.notes}
                    onChange={(e) => setSlotForm({ ...slotForm, notes: e.target.value })}
                  />
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowSlotModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Slot'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title={`Delete ${deleteType === 'zone' ? 'Zone' : 'Slot'}`}
          message={`Are you sure you want to permanently delete this ${deleteType}? This action cannot be reversed.`}
          confirmText="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default YardSlotsManagement;
