import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import IdPhotoUpload from '../components/IdPhotoUpload';
import { isValidTZPhone, isValidIdNumber, findDuplicatePhone, findDuplicateNationalId } from '../utils/utils';

const EditClient = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, updateClient } = useLoans();
  const client = clients.find(c => c.id === parseInt(id));
  const [form, setForm] = useState(
    client
      ? { fullName: client.fullName, phone: client.phone, nationalId: client.nationalId, address: client.address || '', idPhoto: client.idPhoto || '' }
      : { fullName: '', phone: '', nationalId: '', address: '', idPhoto: '' }
  );
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!client) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🔍</div>
        <h3 style={styles.emptyTitle}>Client Not Found</h3>
        <p style={styles.emptyText}>The requested client does not exist</p>
        <Link to="/clients">
          <button style={styles.btnPrimary}>Back to Clients</button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (form.fullName.trim().length < 3) {
      setError('Full name must have at least 3 characters');
      return;
    }
    if (!isValidTZPhone(form.phone)) {
      setError('Invalid phone number. Use the format 07XXXXXXXX or 06XXXXXXXX');
      return;
    }
    if (findDuplicatePhone(clients, form.phone, client.id)) {
      setError('This phone number is already used by another client');
      return;
    }
    if (!isValidIdNumber(form.nationalId)) {
      setError('Invalid National ID number (5-25 letters/digits)');
      return;
    }
    if (findDuplicateNationalId(clients, form.nationalId, client.id)) {
      setError('This National ID is already registered to another client');
      return;
    }

    updateClient(client.id, form);
    setSuccess('Client information updated!');
    setTimeout(() => navigate('/clients'), 1200);
  };

  return (
    <div style={styles.formContainer}>
      <h1 style={{ marginBottom: '24px' }}>Edit Client</h1>

      {error && <div style={{ ...styles.alert, ...styles.alertDanger }}>{error}</div>}
      {success && <div style={{ ...styles.alert, ...styles.alertSuccess }}>{success}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Full Name *</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={(e) => setForm({...form, fullName: e.target.value})}
              style={styles.formInput}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Phone *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({...form, phone: e.target.value})}
              style={styles.formInput}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>National ID</label>
            <input
              type="text"
              value={form.nationalId}
              onChange={(e) => setForm({...form, nationalId: e.target.value})}
              style={styles.formInput}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({...form, address: e.target.value})}
              style={styles.formInput}
            />
          </div>
          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <IdPhotoUpload
              label="ID Photo (National ID/Driver's License)"
              value={form.idPhoto}
              onChange={(val) => setForm({...form, idPhoto: val})}
            />
          </div>
        </div>
        <div style={styles.formActions}>
          <button type="button" onClick={() => navigate('/clients')} style={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" style={styles.btnPrimary}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditClient;
