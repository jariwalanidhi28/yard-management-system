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
import { Users, PlusCircle, Edit2, Trash2, Eye, AlertTriangle, ShieldCheck, History, Truck } from 'lucide-react';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [expiringSoon, setExpiringSoon] = useState(false);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [selectedDriverDetails, setSelectedDriverDetails] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    address: '',
    emergencyContact: '',
    status: 'Active',
    notes: '',
  });

  const fetchDrivers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, search, status, expiringSoon };
      const res = await api.get('/drivers', { params });
      setDrivers(res.data.drivers || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error('Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers(1);
  }, [search, status, expiringSoon]);

  const handleOpenCreate = () => {
    setEditingDriver(null);
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 2);

    setFormData({
      fullName: '',
      phoneNumber: '',
      email: '',
      licenseNumber: '',
      licenseExpiryDate: nextYear.toISOString().slice(0, 10),
      address: '',
      emergencyContact: '',
      status: 'Active',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      fullName: driver.fullName,
      phoneNumber: driver.phoneNumber,
      email: driver.email || '',
      licenseNumber: driver.licenseNumber,
      licenseExpiryDate: driver.licenseExpiryDate ? new Date(driver.licenseExpiryDate).toISOString().slice(0, 10) : '',
      address: driver.address || '',
      emergencyContact: driver.emergencyContact || '',
      status: driver.status,
      notes: driver.notes || '',
    });
    setShowModal(true);
  };

  const handleViewDetails = async (driver) => {
    try {
      const res = await api.get(`/drivers/${driver._id}`);
      setSelectedDriverDetails(res.data.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Failed to load driver details.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingDriver) {
        await api.patch(`/drivers/${editingDriver._id}`, formData);
        toast.success('Driver profile updated.');
      } else {
        await api.post('/drivers', formData);
        toast.success('Driver registered successfully.');
      }
      setShowModal(false);
      fetchDrivers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save driver.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/drivers/${deleteTarget._id}`);
      toast.success(res.data.message || 'Driver processed.');
      setDeleteTarget(null);
      fetchDrivers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete driver.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Full Name',
      key: 'fullName',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.fullName}</div>
          <small className="text-muted">{row.phoneNumber}</small>
        </div>
      ),
    },
    {
      header: 'License # & Expiry',
      key: 'licenseNumber',
      render: (row) => {
        const isExpired = row.licenseValidity === 'Expired';
        const isExpiring = row.licenseValidity === 'Expiring Soon';

        return (
          <div>
            <div className="font-monospace fw-bold text-dark">{row.licenseNumber}</div>
            <div className="d-flex align-items-center gap-1 mt-1">
              <span className="small text-muted">
                Exp: {new Date(row.licenseExpiryDate).toLocaleDateString()}
              </span>
              {isExpired && (
                <span className="badge bg-danger p-1 small d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
                  <AlertTriangle size={10} /> Expired
                </span>
              )}
              {isExpiring && (
                <span className="badge bg-warning text-dark p-1 small d-inline-flex align-items-center gap-1" style={{ fontSize: '0.68rem' }}>
                  <AlertTriangle size={10} /> Soon
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Email / Contact',
      key: 'email',
      render: (row) => <span className="small text-muted">{row.email || 'N/A'}</span>,
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
            title="View Details"
          >
            <Eye size={14} />
          </button>
          <button
            className="btn btn-outline-secondary btn-sm p-1"
            onClick={() => handleOpenEdit(row)}
            title="Edit Driver"
          >
            <Edit2 size={14} />
          </button>
          <button
            className="btn btn-outline-danger btn-sm p-1"
            onClick={() => setDeleteTarget(row)}
            title="Delete Driver"
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
        title="Driver Management & Licensing"
        subtitle="Maintain verified driver credentials, verify license compliance, and view historical visits."
        actions={
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenCreate}
          >
            <PlusCircle size={16} />
            <span>Register Driver</span>
          </button>
        }
      />

      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by driver name, license number, or phone..."
        filters={[
          {
            key: 'status',
            label: 'All Statuses',
            options: ['Active', 'Inactive'],
          },
        ]}
        activeFilters={{ status }}
        onFilterChange={(key, val) => setStatus(val)}
        onReset={() => {
          setSearch('');
          setStatus('');
          setExpiringSoon(false);
        }}
      />

      {/* Quick filter toggle for expiring licenses */}
      <div className="mb-3 d-flex align-items-center gap-2">
        <div className="form-check form-switch small">
          <input
            className="form-check-input"
            type="checkbox"
            id="expiringSoonSwitch"
            checked={expiringSoon}
            onChange={(e) => setExpiringSoon(e.target.checked)}
          />
          <label className="form-check-label fw-semibold text-secondary" htmlFor="expiringSoonSwitch">
            Show only expiring / expired licenses
          </label>
        </div>
      </div>

      <div className="card border-0 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={drivers}
          isLoading={loading}
          emptyMessage="No drivers found matching your criteria."
        />
        <div className="p-3">
          <Pagination pagination={pagination} onPageChange={(p) => fetchDrivers(p)} />
        </div>
      </div>

      {/* Driver Form Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">{editingDriver ? 'Edit Driver Profile' : 'Register New Driver'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Full Name"
                        name="fullName"
                        required
                        placeholder="e.g. John Doe"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Phone Number"
                        name="phoneNumber"
                        required
                        placeholder="e.g. +1-555-0199"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Commercial Driving License #"
                        name="licenseNumber"
                        required
                        placeholder="e.g. CDL-TX-882211"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="License Expiry Date"
                        name="licenseExpiryDate"
                        type="date"
                        required
                        value={formData.licenseExpiryDate}
                        onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Email Address (Optional)"
                        name="email"
                        type="email"
                        placeholder="driver@company.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Driver Status"
                        name="status"
                        type="select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        options={['Active', 'Inactive']}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Address"
                        name="address"
                        placeholder="City, State"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <FormField
                        label="Emergency Contact"
                        name="emergencyContact"
                        placeholder="Name & Contact Phone"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Driver'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {showDetailModal && selectedDriverDetails && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title fw-bold text-dark">{selectedDriverDetails.driver.fullName}</h5>
                  <span className="text-muted small">License: {selectedDriverDetails.driver.licenseNumber}</span>
                </div>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4 pb-3 border-bottom small">
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Status:</span>
                    <div><StatusBadge status={selectedDriverDetails.driver.status} /></div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">License Expiry:</span>
                    <div className="fw-bold">{new Date(selectedDriverDetails.driver.licenseExpiryDate).toLocaleDateString()}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Phone:</span>
                    <div className="fw-semibold">{selectedDriverDetails.driver.phoneNumber}</div>
                  </div>
                  <div className="col-6 col-md-3">
                    <span className="text-muted">Emergency Contact:</span>
                    <div>{selectedDriverDetails.driver.emergencyContact || 'None'}</div>
                  </div>
                </div>

                <div className="fw-bold text-secondary fs-6 d-flex align-items-center gap-1 mb-2">
                  <History size={16} />
                  <span>Gate Visit History</span>
                </div>
                <div className="table-responsive border rounded-3">
                  <table className="table table-sm table-hover mb-0">
                    <thead className="table-light fs-7 text-uppercase">
                      <tr>
                        <th>Pass #</th>
                        <th>Vehicle</th>
                        <th>Entry Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody className="fs-7">
                      {selectedDriverDetails.visitHistory?.length > 0 ? (
                        selectedDriverDetails.visitHistory.map((v) => (
                          <tr key={v._id}>
                            <td className="fw-semibold text-primary font-monospace">{v.gatePassNumber}</td>
                            <td>{v.vehicle?.registrationNumber || 'N/A'}</td>
                            <td>{new Date(v.entryTime).toLocaleString()}</td>
                            <td><StatusBadge status={v.status} /></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center py-3 text-muted">No gate visits recorded.</td>
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

      {/* Delete / Deactivate Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete or Deactivate Driver"
          message={`Are you sure you want to delete driver '${deleteTarget.fullName}'? If they have existing gate visit logs, their account will be deactivated instead to protect audit trail history.`}
          confirmText="Confirm"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default Drivers;
