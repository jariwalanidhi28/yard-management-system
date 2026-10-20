import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { UserCheck, PlusCircle, Edit2, Trash2, Shield, UserX } from 'lucide-react';

const StaffManagement = () => {
  const { user: currentUser } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    isActive: true,
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/staff');
      setStaff(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load staff accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role,
      isActive: member.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingStaff) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't overwrite if blank
        await api.patch(`/staff/${editingStaff._id}`, payload);
        toast.success('Staff account updated successfully.');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new accounts.');
          setActionLoading(false);
          return;
        }
        await api.post('/staff', formData);
        toast.success('Staff account created.');
      }
      setShowModal(false);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/staff/${deleteTarget._id}`);
      toast.success('Account deleted.');
      setDeleteTarget(null);
      fetchStaff();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Staff Member',
      key: 'name',
      render: (row) => (
        <div>
          <div className="fw-bold text-dark">{row.name}</div>
          <small className="text-muted">{row.email}</small>
        </div>
      ),
    },
    {
      header: 'Role',
      key: 'role',
      render: (row) => (
        <span className={`badge ${row.role === 'admin' ? 'bg-primary' : 'bg-secondary'} text-capitalize`}>
          <Shield size={10} className="me-1 inline" />
          {row.role}
        </span>
      ),
    },
    {
      header: 'Account Status',
      key: 'isActive',
      render: (row) => (
        <span className={`badge ${row.isActive ? 'bg-success' : 'bg-danger'}`}>
          {row.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      header: 'Last Login',
      key: 'lastLogin',
      render: (row) => (
        <span className="small text-muted">
          {row.lastLogin ? new Date(row.lastLogin).toLocaleString() : 'Never logged in'}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => {
        const isSelf = currentUser?._id === row._id || currentUser?.id === row._id;
        return (
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm p-1"
              onClick={() => handleOpenEdit(row)}
              title="Edit Account"
            >
              <Edit2 size={14} />
            </button>
            {!isSelf && (
              <button
                className="btn btn-outline-danger btn-sm p-1"
                onClick={() => setDeleteTarget(row)}
                title="Delete Account"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Staff Account Administration"
        subtitle="Manage yard gatekeeper and operator credentials, role privileges, and active statuses."
        actions={
          <button
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenCreate}
          >
            <PlusCircle size={16} />
            <span>Create Staff Account</span>
          </button>
        }
      />

      <div className="card border-0 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={staff}
          isLoading={loading}
          emptyMessage="No staff accounts found."
        />
      </div>

      {/* Staff Form Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">{editingStaff ? 'Edit Staff User' : 'Create Staff User'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <FormField
                    label="Full Name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <FormField
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <FormField
                    label={editingStaff ? 'New Password (Leave blank to keep unchanged)' : 'Initial Password'}
                    name="password"
                    type="password"
                    required={!editingStaff}
                    placeholder={editingStaff ? '••••••••' : 'Min 6 characters'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <FormField
                    label="System Role"
                    name="role"
                    type="select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    options={[
                      { value: 'staff', label: 'Staff (Gate & Yard Operator)' },
                      { value: 'admin', label: 'Administrator (Full Access)' },
                    ]}
                  />
                  <div className="form-check form-switch mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="activeSwitch"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <label className="form-check-label fw-semibold text-secondary" htmlFor="activeSwitch">
                      Account Active & Enabled
                    </label>
                  </div>
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Account'}
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
          title="Delete Staff Account"
          message={`Are you sure you want to delete account for ${deleteTarget.name} (${deleteTarget.email})?`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default StaffManagement;
