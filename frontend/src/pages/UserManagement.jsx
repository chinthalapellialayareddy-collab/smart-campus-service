import React, { useState, useEffect } from 'react';
import { metadataAPI } from '../api/client';
import { Users, UserPlus, Shield, Check, X, Search, Sparkles, Key, AlertCircle } from 'lucide-react';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // New account modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalRole, setModalRole] = useState('student');
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    password: '',
    department_id: '',
    phone: ''
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [createdAccount, setCreatedAccount] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await metadataAPI.getUsers({ search, role: roleFilter || undefined });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    metadataAPI.getCategories().then(res => {
      // Fetch departments via categories or static list
      if (res.data.success) {
        const uniqueDepts = [];
        const seen = new Set();
        res.data.categories.forEach(c => {
          if (c.department_id && !seen.has(c.department_id)) {
            seen.add(c.department_id);
            uniqueDepts.push({ id: c.department_id, name: c.department_name });
          }
        });
        setDepartments(uniqueDepts);
      }
    });
  }, [search, roleFilter]);

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await metadataAPI.updateUserStatus(userId, nextStatus);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  // Helper to generate unique suggested credentials
  const generateSuggestedCredentials = () => {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = modalRole === 'student' ? 'name' : modalRole === 'faculty' ? 'faculty' : 'staff';
    const suggestedEmail = `${prefix}${randNum}@gmail.com`;
    const suggestedPass = 'password123';
    setNewUser(prev => ({
      ...prev,
      email: suggestedEmail,
      password: suggestedPass
    }));
  };

  const handleOpenModal = (role = 'student') => {
    setModalRole(role);
    setFormError('');
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = role === 'student' ? 'name' : role === 'faculty' ? 'faculty' : 'staff';
    setNewUser({
      full_name: '',
      email: `${prefix}${randNum}@gmail.com`,
      password: 'password123',
      department_id: departments[0]?.id || '',
      phone: ''
    });
    setShowAddModal(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);

    try {
      const payload = {
        full_name: newUser.full_name.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        role: modalRole,
        department_id: modalRole === 'staff' ? (newUser.department_id || null) : null,
        phone: newUser.phone || null
      };

      const res = await metadataAPI.createUser(payload);
      if (res.data.success) {
        setCreatedAccount({
          full_name: newUser.full_name.trim(),
          email: newUser.email.trim(),
          password: newUser.password,
          role: modalRole
        });
        setSuccessMsg(`✓ Unique ${modalRole.toUpperCase()} account successfully created: ${newUser.email}`);
        setShowAddModal(false);
        fetchUsers();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create user account.');
    } finally {
      setCreating(false);
    }
  };

  const adminAccount = users.find(u => u.role === 'admin');

  return (
    <div>
      {/* Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Admin Credential & User Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage campus accounts. Create unique email logins and passwords for students, faculty, and maintenance staff.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => handleOpenModal('student')} className="btn btn-primary btn-sm">
            <UserPlus size={15} /> + Student
          </button>
          <button onClick={() => handleOpenModal('faculty')} className="btn btn-primary btn-sm" style={{ background: '#0284c7' }}>
            <UserPlus size={15} /> + Faculty
          </button>
          <button onClick={() => handleOpenModal('staff')} className="btn btn-primary btn-sm" style={{ background: '#d97706' }}>
            <UserPlus size={15} /> + Maintenance Staff
          </button>
        </div>
      </div>

      {createdAccount && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🎉 Account Issued Successfully — Hand Over to User
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: '#166534', marginTop: '0.2rem' }}>
                {createdAccount.full_name} ({createdAccount.role.toUpperCase()})
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', flexWrap: 'wrap', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <span><strong>Login Email:</strong> <span style={{ color: 'var(--primary)', background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{createdAccount.email}</span></span>
                <span><strong>Password:</strong> <span style={{ color: '#0f172a', background: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #e2e8f0' }}>{createdAccount.password}</span></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  const text = `Campus Complaint Portal Login\nName: ${createdAccount.full_name}\nEmail: ${createdAccount.email}\nPassword: ${createdAccount.password}\nRole: ${createdAccount.role}\nLink: http://localhost:5173/login`;
                  navigator.clipboard.writeText(text);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 3000);
                }}
                className="btn btn-primary btn-sm"
                style={{ background: copied ? '#15803d' : 'var(--primary)' }}
              >
                {copied ? '✓ Credentials Copied!' : '📋 Copy Credentials'}
              </button>
              <button
                onClick={() => setCreatedAccount(null)}
                className="btn btn-secondary btn-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Architecture Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: '#fff',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f59e0b', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#fbbf24', fontWeight: '800', letterSpacing: '0.05em' }}>
              System Authority Rule
            </div>
            <div style={{ fontSize: '1rem', fontWeight: '700' }}>
              Unique Administrator: {adminAccount ? adminAccount.full_name : 'Dr. Sarah Mitchell'} ({adminAccount ? adminAccount.email : 'admin@campus.edu'})
            </div>
            <div style={{ fontSize: '0.75rem', color: '#c7d2fe' }}>
              Only one unique administrator controls assignments, SLAs, and issues student, faculty, and staff credentials.
            </div>
          </div>
        </div>

        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: '700' }}>
          1 ADMIN ONLY ENFORCED
        </span>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Search by name, unique email..."
              className="form-input"
              style={{ paddingLeft: '2rem', height: '36px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '180px', height: '36px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All User Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Maintenance Staff</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* Users table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading user directory...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.875rem 1.25rem' }}>User Full Name</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Unique Email ID</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Role</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Assigned Dept</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Active Tasks</th>
                  <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: '600' }}>{u.full_name}</div>
                      {u.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>📞 {u.phone}</div>}
                    </td>

                    <td style={{ padding: '1rem', fontFamily: 'monospace', fontWeight: '600', color: 'var(--primary)' }}>
                      {u.email}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className={`badge badge-${u.role === 'admin' ? 'Emergency' : u.role === 'staff' ? 'IN_PROGRESS' : 'ASSIGNED'}`} style={{ textTransform: 'capitalize' }}>
                        {u.role}
                      </span>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {u.department_name || 'General Campus'}
                    </td>

                    <td style={{ padding: '1rem', fontWeight: '700' }}>
                      {u.active_workload || 0}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        color: u.account_status === 'active' ? '#16a34a' : 'var(--danger)',
                        textTransform: 'uppercase'
                      }}>
                        {u.account_status}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.account_status)}
                          className={`btn ${u.account_status === 'active' ? 'btn-danger' : 'btn-success'} btn-sm`}
                        >
                          {u.account_status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          Primary Admin
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Add User Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2rem', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', textTransform: 'capitalize' }}>
                  Create {modalRole} Account
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Admin generates unique login credentials for campus personnel.
                </p>
              </div>
              <button
                type="button"
                onClick={generateSuggestedCredentials}
                className="btn btn-secondary btn-sm"
                title="Regenerate unique credentials"
              >
                <Sparkles size={14} color="var(--primary)" /> Auto-Suggest
              </button>
            </div>

            {formError && (
              <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                • {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder={modalRole === 'student' ? 'e.g. Jordan Smith' : modalRole === 'faculty' ? 'e.g. Prof. Katherine Bell' : 'e.g. Marcus Vance'}
                  className="form-input"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Unique Campus Email ID *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. name4092@gmail.com"
                  className="form-input"
                  style={{ fontFamily: 'monospace' }}
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    placeholder="Min 6 characters"
                    className="form-input"
                    style={{ fontFamily: 'monospace' }}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  />
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Provide this password to the student, faculty, or staff member.
                </span>
              </div>

              {modalRole === 'staff' && (
                <div className="form-group">
                  <label className="form-label">Specialization Department *</label>
                  <select
                    className="form-select"
                    value={newUser.department_id}
                    onChange={(e) => setNewUser({ ...newUser, department_id: e.target.value })}
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Contact Phone (Optional)</label>
                <input
                  type="text"
                  placeholder="+1 555-0182"
                  className="form-input"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={creating} className="btn btn-primary">
                  {creating ? 'Registering...' : `Create ${modalRole}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
