import React, { useState } from 'react';
import styles from '../styles';
import { useAuth } from '../context/AuthContext';

const ChangePassword = () => {
  const { changePassword } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.current || !form.next || !form.confirm) {
      setError('Please fill in all fields');
      return;
    }
    if (form.next !== form.confirm) {
      setError('New password and confirmation do not match');
      return;
    }

    const result = changePassword(form.current, form.next);
    if (!result.success) {
      setError(result.message);
      return;
    }
    setSuccess(result.message);
    setForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div style={{ ...styles.formContainer, maxWidth: '440px' }}>
      <h1 style={{ marginBottom: '24px' }}>Change Password</h1>

      {error && <div style={{ ...styles.alert, ...styles.alertDanger }}>{error}</div>}
      {success && <div style={{ ...styles.alert, ...styles.alertSuccess }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.formLabel}>Current Password</label>
          <input
            type="password"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={{ ...styles.formGroup, marginTop: '16px' }}>
          <label style={styles.formLabel}>New Password</label>
          <input
            type="password"
            value={form.next}
            onChange={(e) => setForm({ ...form, next: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={{ ...styles.formGroup, marginTop: '16px' }}>
          <label style={styles.formLabel}>Confirm New Password</label>
          <input
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            style={styles.formInput}
          />
        </div>
        <div style={styles.formActions}>
          <button type="submit" style={styles.btnPrimary}>Save New Password</button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
