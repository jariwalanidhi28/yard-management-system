import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Pagination from '../components/Pagination';
import SearchFilterBar from '../components/SearchFilterBar';
import StatusBadge from '../components/StatusBadge';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import toast from 'react-hot-toast';
import { Truck, PlusCircle, Edit2, Trash2, Eye, History, Package } from 'lucide-react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [status, setStatus] = useState('');

  // Drivers for dropdown
  const [drivers, setDrivers] = useState([]);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    registrationNumber: '',
    vehicleType: 'Box Truck',
    makeModel: '',
    capacity: 20,
    capacityUnit: 'Tons',
    assignedDriver: '',
    status: 'Active',
    notes: '',
  });

  const fetchVehicles = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, search, vehicleType, status };
      const [vRes, dRes] = await Promise.all([
        api.get('/vehicles', { params }),
        api.get('/drivers?limit=100'),
      ]);
      setVehicles(vRes.data.vehicles || []);
      setPagination(vRes.data.pagination || { page: 1, totalPages: 1, total: 0 });
      setDrivers(dRes.data.drivers || []);
    } catch (err) {
      toast.error('Failed to load vehicles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(1);
  }, [search, vehicleType, status]);

  const handleOpenCreate = () => {
    setEditingVehicle(null);
    setFormData({
      registrationNumber: '',
      vehicleType: 'Box Truck',
      makeModel: '',
      capacity: 20,
      capacityUnit: 'Tons',
      assignedDriver: '',
      status: 'Active',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType,
      makeModel: vehicle.makeModel,
      capacity: vehicle.capacity,
      capacityUnit: vehicle.capacityUnit,
      assignedDriver: vehicle.assignedDriver?._id || vehicle.assignedDriver || '',
      status: vehicle.status,
      notes: vehicle.notes || '',
    });
    setShowModal(true);
  };

  const handleViewDetails = async (vehicle) => {
    try {
      const res = await api.get(`/vehicles/${vehicle._id}`);
      setSelectedVehicleDetails(res.data.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load vehicle history.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingVehicle) {
        await api.patch(`/vehicles/${editingVehicle._id}`, formData);
        toast.success('Vehicle updated successfully.');
      } else {
        await api.post('/vehicles', formData);
        toast.success('Vehicle registered successfully.');
      }
      setShowModal(false);
      fetchVehicles(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save vehicle.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/vehicles/${deleteTarget._id}`);
      toast.success(res.data.message || 'Vehicle processed.');
      setDeleteTarget(null);
      fetchVehicles(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete vehicle.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Registration #',
      key: 'registrationNumber',
      render: (row) => (
        <span className="fw-bold font-monospace text-primary">{row.registrationNumber}</span>
      ),
    },
    {
      header: 'Type & Make',
      key: 'makeModel',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.makeModel}</div>
          <small className="text-muted">{row.vehicleType}</small>
        </div>
      ),
    },
    {
      header: 'Capacity',
      key: 'capacity',
      render: (row) => <span>{row.capacity} {row.capacityUnit}</span>,
    },
    {
      header: 'Assigned Driver',
      key: 'assignedDriver.fullName',
      render: (row) =>
        row.assignedDriver ? (
          <div>
            <div className="fw-medium text-dark">{row.assignedDriver.fullName}</div>
            <small className="text-muted">{row.assignedDriver.phoneNumber}</small>
          </div>
        ) : (
          <span className="text-muted small">Unassigned</span>
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
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-info btn-sm p-1"
            onClick={() => handleViewDetails(row)}
            title="View History"
          >
            <Eye size={14} />
          </button>
          <button
            className="btn btn-outline-secondary btn-sm p-1"
            onClick={() => handleOpenEdit(row)}
            title="Edit Vehicle"
          >
            <Edit2 size={14} />
          </button>
          <button
            className="btn btn-outline-danger btn-sm p-1"
            onClick={() => setDeleteTarget(row)}
            title="Delete / Archive Vehicle"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Vehicle Fleet Management"
        subtitle="Maintain complete registration records, capacity specs, and gate visit track records."
        actions={
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenCreate}
          >
            <PlusCircle size={16} />
            <span>Register Vehicle</span>
          </button>
        }
      />

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by vehicle registration plate..."
        filters={[
          {
            key: 'vehicleType',
            label: 'All Types',
            options: ['Semi-Trailer', 'Flatbed', 'Container Truck', 'Box Truck', 'Tanker', 'Van', 'Other'],
          },
          {
            key: 'status',
            label: 'All Statuses',
            options: ['Active', 'Inactive', 'Maintenance', 'Archived'],
          },
        ]}
        activeFilters={{ vehicleType, status }}
        onFilterChange={(key, val) => (key === 'vehicleType' ? setVehicleType(val) : setStatus(val))}
        onReset={() => {
          setSearch('');
          setVehicleType('');
          setStatus('');
        }}
      />

      <div className="card border-0 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={vehicles}
          isLoading={loading}
          emptyMessage="No vehicles found matching your criteria."
        />
        <div className="p-3">
          <Pagination pagination={pagination} onPageChange={(p) => fetchVehicles(p)} />
        </div>
      </div>

      {/* Vehicle Form Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">{editingVehicle ? 'Edit Vehicle' : 'Register Vehicle'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Registration / License Plate #"
                        name="registrationNumber"
                        required
                        placeholder="e.g. TRK-9901"
                        value={formData.registrationNumber}
                        onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Vehicle Type"
                        name="vehicleType"
                        type="select"
                        required
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        options={['Semi-Trailer', 'Flatbed', 'Container Truck', 'Box Truck', 'Tanker', 'Van', 'Other']}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Make and Model"
                        name="makeModel"
                        required
                        placeholder="e.g. Freightliner Cascadia 2023"
                        value={formData.makeModel}
                        onChange={(e) => setFormData({ ...formData, makeModel: e.target.value })}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <FormField
                        label="Capacity"
                        name="capacity"
                        type="number"
                        required
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      />
                    </div>
                    <div className="col-6 col-md-3">
                      <FormField
                        label="Capacity Unit"
                        name="capacityUnit"
                        type="select"
                        value={formData.capacityUnit}
                        onChange={(e) => setFormData({ ...formData, capacityUnit: e.target.value })}
                        options={['Tons', 'Kg', 'Pallets', 'CBM']}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Default Assigned Driver (Optional)"
                        name="assignedDriver"
                        type="select"
                        placeholder="Select driver or leave unassigned..."
                        value={formData.assignedDriver}
                        onChange={(e) => setFormData({ ...formData, assignedDriver: e.target.value })}
                        options={drivers.map((d) => ({
                          value: d._id,
                          label: `${d.fullName} (${d.licenseNumber})`,
                        }))}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Operational Status"
                        name="status"
                        type="select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        options={['Active', 'Inactive', 'Maintenance', 'Archived']}
                      />
                    </div>
                    <div className="col-12">
                      <FormField
                        label="Vehicle Notes"
                        name="notes"
                        type="textarea"
                        rows={2}
                        placeholder="Fleet maintenance reminders or permits"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details & History Modal */}
      {showDetailModal && selectedVehicleDetails && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold text-dark">
                    {selectedVehicleDetails.vehicle.registrationNumber}
                  </h5>
                  <span className="text-muted small">
                    {selectedVehicleDetails.vehicle.makeModel} ({selectedVehicleDetails.vehicle.vehicleType})
                  </span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold text-secondary fs-6 d-flex align-items-center gap-1">
                    <History size={16} />
                    <span>Recent Gate Visits History</span>
                  </span>
                  <StatusBadge status={selectedVehicleDetails.vehicle.status} />
                </div>

                <div className="table-responsive border rounded-3 mb-4">
                  <table className="table table-sm table-hover mb-0">
                    <thead className="table-light fs-7 text-uppercase">
                      <tr>
                        <th>Pass #</th>
                        <th>Driver</th>
                        <th>Entry Time</th>
                        <th>Exit Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="fs-7">
                      {selectedVehicleDetails.visitHistory?.length > 0 ? (
                        selectedVehicleDetails.visitHistory.map((v) => (
                          <tr key={v._id}>
                            <td className="fw-semibold text-primary font-monospace">{v.gatePassNumber}</td>
                            <td>{v.driver?.fullName || 'N/A'}</td>
                            <td>{new Date(v.entryTime).toLocaleString()}</td>
                            <td>{v.exitTime ? new Date(v.exitTime).toLocaleString() : 'Inside Yard'}</td>
                            <td><StatusBadge status={v.status} /></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-3 text-muted">No gate visit history recorded.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="fw-bold text-secondary fs-6 d-flex align-items-center gap-1 mb-2">
                  <Package size={16} />
                  <span>Associated Shipments</span>
                </div>
                <div className="table-responsive border rounded-3">
                  <table className="table table-sm table-hover mb-0">
                    <thead className="table-light fs-7 text-uppercase">
                      <tr>
                        <th>Tracking #</th>
                        <th>Order #</th>
                        <th>Destination</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="fs-7">
                      {selectedVehicleDetails.shipmentHistory?.length > 0 ? (
                        selectedVehicleDetails.shipmentHistory.map((s) => (
                          <tr key={s._id}>
                            <td className="fw-semibold font-monospace">{s.trackingNumber}</td>
                            <td>{s.orderNumber}</td>
                            <td>{s.destination}</td>
                            <td><StatusBadge status={s.currentStatus} /></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-3 text-muted">No associated shipments.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-light border-0">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowDetailModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete or Archive Vehicle"
          message={`Are you sure you want to delete or archive vehicle '${deleteTarget.registrationNumber}'? If it has historical gate visits, it will be safely archived to preserve visit logs.`}
          confirmText="Confirm"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default Vehicles;
