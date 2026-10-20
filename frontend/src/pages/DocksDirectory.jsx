import React, { useState, useEffect } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import FormField from '../components/FormField';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Anchor, PlusCircle, Edit2, Trash2, Wrench } from 'lucide-react';

const DocksDirectory = () => {
  const { isAdmin } = useAuth();
  const [docks, setDocks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingDock, setEditingDock] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    dockType: 'Dual',
    location: '',
    status: 'Active',
    notes: '',
  });

  const fetchDocks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/docks');
      setDocks(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load docks directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocks();
  }, []);

  const handleOpenCreate = () => {
    setEditingDock(null);
    setFormData({
      name: '',
      code: '',
      dockType: 'Dual',
      location: '',
      status: 'Active',
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (dock) => {
    setEditingDock(dock);
    setFormData({
      name: dock.name,
      code: dock.code,
      dockType: dock.dockType,
      location: dock.location || '',
      status: dock.status,
      notes: dock.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingDock) {
        await api.patch(`/docks/${editingDock._id}`, formData);
        toast.success('Dock updated successfully.');
      } else {
        await api.post('/docks', formData);
        toast.success('Dock created successfully.');
      }
      setShowModal(false);
      fetchDocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save dock.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.delete(`/docks/${deleteTarget._id}`);
      toast.success('Dock removed successfully.');
      setDeleteTarget(null);
      fetchDocks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete dock.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      header: 'Dock Code',
      key: 'code',
      render: (row) => <span className="fw-bold font-monospace text-primary">{row.code}</span>,
    },
    {
      header: 'Dock Name',
      key: 'name',
      render: (row) => <span className="fw-semibold text-dark">{row.name}</span>,
    },
    {
      header: 'Type',
      key: 'dockType',
      render: (row) => <span className="badge bg-light text-dark border">{row.dockType}</span>,
    },
    {
      header: 'Physical Location',
      key: 'location',
      render: (row) => <span className="small text-muted">{row.location || 'Terminal Area'}</span>,
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
                  onClick={() => handleOpenEdit(row)}
                  title="Edit Dock"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  className="btn btn-outline-danger btn-sm p-1"
                  onClick={() => setDeleteTarget(row)}
                  title="Delete Dock"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="container-fluid p-0">
      <PageHeader
        title="Docks Directory"
        subtitle="Manage loading and unloading dock infrastructure and operational maintenance."
        actions={
          isAdmin && (
            <button
              className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
              onClick={handleOpenCreate}
            >
              <PlusCircle size={16} />
              <span>Add Dock</span>
            </button>
          )
        }
      />

      <div className="card border-0 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={docks}
          isLoading={loading}
          emptyMessage="No docks registered in system."
        />
      </div>

      {/* Dock Form Modal */}
      {showModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <h5 className="modal-title fw-bold text-dark">{editingDock ? 'Edit Dock' : 'Add New Dock'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <FormField
                    label="Dock Code (e.g. DCK-01)"
                    name="code"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                  <FormField
                    label="Dock Name"
                    name="name"
                    required
                    placeholder="e.g. East Inbound Bay 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <FormField
                    label="Dock Type"
                    name="dockType"
                    type="select"
                    value={formData.dockType}
                    onChange={(e) => setFormData({ ...formData, dockType: e.target.value })}
                    options={['Loading', 'Unloading', 'Dual']}
                  />
                  <FormField
                    label="Physical Location"
                    name="location"
                    placeholder="e.g. Terminal B - Bay 1-4"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                  <FormField
                    label="Operating Status"
                    name="status"
                    type="select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={['Active', 'Maintenance']}
                  />
                </div>
                <div className="modal-footer bg-light border-0">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Dock'}
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
          title="Delete Dock"
          message={`Are you sure you want to delete dock '${deleteTarget.name} (${deleteTarget.code})'? Active appointments will prevent deletion.`}
          confirmText="Delete Dock"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default DocksDirectory;
