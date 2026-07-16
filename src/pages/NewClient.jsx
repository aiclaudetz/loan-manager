import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import IdPhotoUpload from '../components/IdPhotoUpload';
import { isValidTZPhone, isValidIdNumber, findDuplicatePhone, findDuplicateNationalId } from '../utils/utils';

const NewClient = () => {
  const navigate = useNavigate();
  const { addClient, clients } = useLoans();
  const [form, setForm] = useState({ fullName: '', phone: '', nationalId: '', address: '', idPhoto: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    if (findDuplicatePhone(clients, form.phone)) {
      setError('This phone number is already used by another client');
      return;
    }
    if (!isValidIdNumber(form.nationalId)) {
      setError('Invalid National ID number (5-25 letters/digits)');
      return;
    }
    if (findDuplicateNationalId(clients, form.nationalId)) {
      setError('This National ID is already registered to another client');
      return;
    }

    addClient(form);
    setSuccess('Client added successfully!');
    setTimeout(() => {
      navigate('/clients');
    }, 1500);
  };

  return (
    <div style={styles.formContainer}>
      <h1 style={{ marginBottom: '24px' }}>New Client</h1>

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
              placeholder="07XXXXXXXX"
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
            Save Client
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewClient;
