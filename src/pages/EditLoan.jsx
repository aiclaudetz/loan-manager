import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import IdPhotoUpload from '../components/IdPhotoUpload';
import { isValidTZPhone, isValidIdNumber } from '../utils/utils';

const EditLoan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loans, updateLoan } = useLoans();
  const loan = loans.find(l => l.id === parseInt(id));
  const [form, setForm] = useState(
    loan
      ? {
          amount: loan.amount,
          interestRate: loan.interestRate,
          duration: loan.duration,
          purpose: loan.purpose || '',
          guarantorName: loan.guarantorName || '',
          guarantorPhone: loan.guarantorPhone || '',
          guarantorIdNumber: loan.guarantorIdNumber || '',
          guarantorIdPhoto: loan.guarantorIdPhoto || '',
          collateralItem: loan.collateralItem || ''
        }
      : { amount: '', interestRate: '5', duration: '30', purpose: '', guarantorName: '', guarantorPhone: '', guarantorIdNumber: '', guarantorIdPhoto: '', collateralItem: '' }
  );
  const [error, setError] = useState('');

  if (!loan) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🔍</div>
        <h3 style={styles.emptyTitle}>Loan Not Found</h3>
        <p style={styles.emptyText}>The requested loan does not exist</p>
        <Link to="/loans">
          <button style={styles.btnPrimary}>Back to Loans</button>
        </Link>
      </div>
    );
  }

  const calculateTotal = () => {
    const amount = parseFloat(form.amount) || 0;
    const rate = parseFloat(form.interestRate) || 0;
    return amount + (amount * rate / 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount || isNaN(parseFloat(form.amount))) {
      setError('Please enter the loan amount');
      return;
    }
    if (parseFloat(form.amount) <= 0) {
      setError('Loan amount must be greater than zero');
      return;
    }
    if (parseFloat(form.interestRate) < 0 || isNaN(parseFloat(form.interestRate))) {
      setError('Interest rate cannot be negative');
      return;
    }
    if (parseInt(form.duration) <= 0 || isNaN(parseInt(form.duration))) {
      setError('Duration (days) must be greater than zero');
      return;
    }
    if (form.guarantorPhone && !isValidTZPhone(form.guarantorPhone)) {
      setError('Invalid guarantor phone number. Use the format 07XXXXXXXX or 06XXXXXXXX');
      return;
    }
    if (form.guarantorIdNumber && !isValidIdNumber(form.guarantorIdNumber)) {
      setError('Invalid guarantor National ID/License number (5-25 letters/digits)');
      return;
    }
    updateLoan(loan.id, {
      amount: parseFloat(form.amount),
      interestRate: parseFloat(form.interestRate),
      duration: parseInt(form.duration),
      purpose: form.purpose,
      guarantorName: form.guarantorName,
      guarantorPhone: form.guarantorPhone,
      guarantorIdNumber: form.guarantorIdNumber,
      guarantorIdPhoto: form.guarantorIdPhoto,
      collateralItem: form.collateralItem
    });
    navigate(`/loans/${loan.id}`);
  };

  return (
    <div style={styles.formContainer}>
      <h1 style={{ marginBottom: '24px' }}>Edit Loan</h1>

      {error && <div style={{ ...styles.alert, ...styles.alertDanger }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Client</label>
            <input type="text" value={loan.clientName} disabled style={{ ...styles.formInput, background: '#f1f5f9', color: '#64748b' }} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Amount (TSh) *</label>
            <input
              type="number"
              required
              value={form.amount}
              onChange={(e) => setForm({...form, amount: e.target.value})}
              style={styles.formInput}
              placeholder="0"
              min="0"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Interest Rate (%)</label>
            <input
              type="number"
              value={form.interestRate}
              onChange={(e) => setForm({...form, interestRate: e.target.value})}
              style={styles.formInput}
              step="0.5"
              min="0"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Duration (Days)</label>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => setForm({...form, duration: e.target.value})}
              style={styles.formInput}
              min="1"
            />
          </div>
          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.formLabel}>Loan Purpose</label>
            <textarea
              value={form.purpose}
              onChange={(e) => setForm({...form, purpose: e.target.value})}
              style={{ ...styles.formInput, minHeight: '80px' }}
              placeholder="Describe the purpose of the loan..."
            />
          </div>
        </div>

        <h3 style={{ marginTop: '24px', marginBottom: '4px' }}>Guarantor Information</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          Fill in the guarantor's information and the collateral they are providing for this loan (optional).
        </p>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Guarantor Name</label>
            <input
              type="text"
              value={form.guarantorName}
              onChange={(e) => setForm({...form, guarantorName: e.target.value})}
              style={styles.formInput}
              placeholder="Guarantor's full name"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Guarantor Phone Number</label>
            <input
              type="text"
              value={form.guarantorPhone}
              onChange={(e) => setForm({...form, guarantorPhone: e.target.value})}
              style={styles.formInput}
              placeholder="07XXXXXXXX"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Guarantor National ID / Driver's License Number</label>
            <input
              type="text"
              value={form.guarantorIdNumber}
              onChange={(e) => setForm({...form, guarantorIdNumber: e.target.value})}
              style={styles.formInput}
              placeholder="National ID or Driver's License number"
            />
          </div>
          <div style={styles.formGroup}>
            <IdPhotoUpload
              label="Guarantor ID Photo"
              value={form.guarantorIdPhoto}
              onChange={(val) => setForm({...form, guarantorIdPhoto: val})}
            />
          </div>
          <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
            <label style={styles.formLabel}>Item / Collateral Being Provided</label>
            <textarea
              value={form.collateralItem}
              onChange={(e) => setForm({...form, collateralItem: e.target.value})}
              style={{ ...styles.formInput, minHeight: '60px' }}
              placeholder="Describe the property or item being used as collateral (e.g. motorcycle, TV, farmland, etc.)"
            />
          </div>
        </div>

        <div style={styles.loanSummary}>
          <h3>Loan Summary</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Already Paid</span>
              <strong style={styles.summaryValue}>TSh {loan.paid.toLocaleString()}</strong>
            </div>
            <div style={{ ...styles.summaryItem, ...styles.summaryHighlight }}>
              <span style={styles.summaryLabel}>New Total Payable</span>
              <strong style={{ ...styles.summaryValue, color: '#2563eb' }}>
                TSh {calculateTotal().toLocaleString()}
              </strong>
            </div>
            <div style={{ ...styles.summaryItem, ...styles.summaryHighlight }}>
              <span style={styles.summaryLabel}>Remaining</span>
              <strong style={{ ...styles.summaryValue, color: '#2563eb' }}>
                TSh {Math.max(0, calculateTotal() - loan.paid).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        <div style={styles.formActions}>
          <button type="button" onClick={() => navigate(`/loans/${loan.id}`)} style={styles.btnSecondary}>
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

export default EditLoan;
