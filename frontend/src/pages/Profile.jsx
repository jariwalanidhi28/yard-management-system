import React, { useState } from 'react';
import api from '../services/api';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Lock, Shield, KeyRound } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        toast.success(res.data.message || 'Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0" style={{ maxWidth: '850px' }}>
      <PageHeader
        title="Account Profile & Security"
        subtitle="Manage your credentials, role privileges, and authentication security."
      />

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-12 col-md-5">
          <div className="card border-0 shadow-sm p-4 text-center">
            <div className="bg-primary text-white rounded-circle p-3 d-inline-flex mx-auto mb-3 shadow-sm">
              <User size={36} />
            </div>
            <h5 className="fw-bold text-dark mb-1">{user?.name}</h5>
            <div className="text-muted small mb-3">{user?.email}</div>

            <div className="p-3 bg-light rounded-3 border text-start small">
              <div className="mb-2">
                <span className="text-muted">Assigned System Role:</span>
                <div>
                  <span className="badge bg-primary text-capitalize mt-1">
                    <Shield size={12} className="me-1 inline" />
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="mb-2">
                <span className="text-muted">Account Status:</span>
                <div>
                  <span className="badge bg-success mt-1">Active & Verified</span>
                </div>
              </div>
              <div>
                <span className="text-muted">Authentication Mode:</span>
                <div className="fw-semibold text-dark mt-1">HTTP-Only Cookie Session</div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="col-12 col-md-7">
          <div className="card border-0 shadow-sm p-4">
            <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
              <KeyRound size={18} />
              <span>Update Password</span>
            </h6>
            <form onSubmit={handlePasswordChange}>
              <FormField
                label="Current Password"
                name="currentPassword"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <FormField
                label="New Password"
                name="newPassword"
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <FormField
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="submit"
                className="btn btn-primary px-4 py-2 mt-2 d-flex align-items-center gap-2"
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm" role="status"></span>}
                <span>Change Password</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
