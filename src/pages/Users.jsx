import React, { useState } from 'react';
import styles from '../styles';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { useLoans } from '../context/LoanContext';

const emptyForm = { username: '', password: '', fullName: '', role: 'officer', canIssueLoans: true };

const Users = () => {
  const { users, currentUser, addUser, updateUser, deleteUser, resetUserPassword } = useAuth();
  const { loanLimitPerClient, updateLoanLimit, penaltyRatePerDay, updatePenaltyRate } = useLoans();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [limitInput, setLimitInput] = useState(loanLimitPerClient);
  const [penaltyInput, setPenaltyInput] = useState(penaltyRatePerDay);

  const handleSaveLimit = (e) => {
    e.preventDefault();
    const value = parseInt(limitInput);
    if (!value || value < 1) return;
    updateLoanLimit(value);
  };

  const handleSavePenalty = (e) => {
    e.preventDefault();
    const value = parseFloat(penaltyInput);
    if (isNaN(value) || value < 0) return;
    updatePenaltyRate(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.username || !form.password || !form.fullName) {
      setError('Please fill in all required fields');
      return;
    }
    if (form.username.trim().length < 3) {
      setError('Username must have at least 3 characters');
      return;
    }
    if (form.password.length < 4) {
      setError('Password must have at least 4 characters/digits');
      return;
    }
    if (users.some(u => u.username.toLowerCase() === form.username.trim().toLowerCase())) {
      setError('This username is already taken');
      return;
    }
    try {
      await addUser({
        username: form.username.trim(),
        password: form.password,
        fullName: form.fullName,
        role: form.role,
        canIssueLoans: form.role === 'officer' ? form.canIssueLoans : form.role === 'admin'
      });
      setSuccess(`Account "${form.username}" has been created`);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message || 'Failed to create the account');
    }
  };

  const togglePermission = (user) => {
    updateUser(user.id, { canIssueLoans: !user.canIssueLoans });
  };

  const toggleActive = (user) => {
    updateUser(user.id, { active: !user.active });
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser.id) return;
    if (window.confirm(`Are you sure you want to permanently delete the account "${user.username}"? This cannot be undone.`)) {
      const result = await deleteUser(user.id);
      if (!result.success) {
        alert(result.message || 'Failed to delete the account');
      }
    }
  };

  const handleResetPassword = async (user) => {
    const newPassword = window.prompt(`Enter a new password for "${user.username}" (at least 6 characters):`);
    if (!newPassword) return;
    const result = await resetUserPassword(user.id, newPassword);
    if (result.success) {
      alert(`Password for "${user.username}" has been changed.`);
    } else {
      alert(result.message || 'Failed to reset the password');
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Users</h1>
      </div>

      <div style={{ ...styles.formContainer, marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '4px' }}>⚠️ Risk Limit</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          The maximum number of incomplete loans allowed per client before a risk warning is shown.
        </p>
        <form onSubmit={handleSaveLimit} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Loan Limit per Client</label>
            <input
              type="number"
              min="1"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              style={{ ...styles.formInput, width: '140px' }}
            />
          </div>
          <button type="submit" style={styles.btnPrimary}>Save</button>
        </form>
      </div>

      <div style={{ ...styles.formContainer, marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '4px' }}>⏰ Late Penalty (Late Fee)</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          Percentage of the remaining debt added as a penalty for each day a loan passes its due date.
          Set to 0 to disable the penalty.
        </p>
        <form onSubmit={handleSavePenalty} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Penalty (% per day)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={penaltyInput}
              onChange={(e) => setPenaltyInput(e.target.value)}
              style={{ ...styles.formInput, width: '140px' }}
            />
          </div>
          <button type="submit" style={styles.btnPrimary}>Save</button>
        </form>
      </div>

      <div style={{ ...styles.formContainer, marginBottom: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>Add New Account</h3>
        {error && <div style={{ ...styles.alert, ...styles.alertDanger }}>{error}</div>}
        {success && <div style={{ ...styles.alert, ...styles.alertSuccess }}>{success}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                style={styles.formInput}
                placeholder="e.g. Asha Juma"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Username *</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={styles.formInput}
                placeholder="e.g. officer2"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Password *</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={styles.formInput}
                placeholder="Enter password"
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Account Type (Role)</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={styles.formSelect}
              >
                <option value="officer">Office Officer</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator (Admin)</option>
              </select>
            </div>
            {form.role === 'officer' && (
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="canIssueLoans"
                  checked={form.canIssueLoans}
                  onChange={(e) => setForm({ ...form, canIssueLoans: e.target.checked })}
                />
                <label htmlFor="canIssueLoans" style={styles.formLabel}>
                  Allow this account to issue/create loans (will still require manager approval)
                </label>
              </div>
            )}
          </div>
          <div style={styles.formActions}>
            <button type="submit" style={styles.btnPrimary}>➕ Create Account</button>
          </div>
        </form>
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3>User List</h3>
        </div>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableTh}>Name</th>
              <th style={styles.tableTh}>Username</th>
              <th style={styles.tableTh}>Role</th>
              <th style={styles.tableTh}>Can Issue Loans</th>
              <th style={styles.tableTh}>Status</th>
              <th style={styles.tableTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={styles.tableTd}>{user.fullName}</td>
                <td style={styles.tableTd}>{user.username}</td>
                <td style={styles.tableTd}>{ROLE_LABELS[user.role] || user.role}</td>
                <td style={styles.tableTd}>
                  {user.role === 'officer' ? (
                    <button
                      onClick={() => togglePermission(user)}
                      style={{
                        ...styles.badge,
                        ...(user.canIssueLoans ? styles.badgeActive : styles.badgeInactive),
                        border: 'none', cursor: 'pointer'
                      }}
                    >
                      {user.canIssueLoans ? 'Yes ✓' : 'No ✗'}
                    </button>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>—</span>
                  )}
                </td>
                <td style={styles.tableTd}>
                  <button
                    onClick={() => toggleActive(user)}
                    disabled={user.id === currentUser.id}
                    style={{
                      ...styles.badge,
                      ...(user.active ? styles.badgeActive : styles.badgeInactive),
                      border: 'none', cursor: user.id === currentUser.id ? 'default' : 'pointer'
                    }}
                  >
                    {user.active ? 'Active' : 'Disabled'}
                  </button>
                </td>
                <td style={styles.tableTd}>
                  <button style={styles.actionIcon} title="Reset Password" onClick={() => handleResetPassword(user)}>🔑</button>
                  {user.id !== currentUser.id && (
                    <button style={styles.actionIcon} title="Delete" onClick={() => handleDelete(user)}>🗑️</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
