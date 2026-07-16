import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';

const EditPayment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { payments, loans, updatePayment, getLoanOutstandingPenalty } = useLoans();
  const payment = payments.find(p => p.id === parseInt(id));
  const loan = payment ? loans.find(l => l.id === payment.loanId) : null;
  const [form, setForm] = useState(
    payment
      ? { amount: payment.amount, method: payment.method, reference: payment.reference || '', penaltyAmount: payment.penaltyAmount || 0 }
      : { amount: '', method: 'M-Pesa', reference: '', penaltyAmount: 0 }
  );
  const [error, setError] = useState('');

  if (!payment) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🔍</div>
        <h3 style={styles.emptyTitle}>Payment Not Found</h3>
        <p style={styles.emptyText}>The requested payment does not exist</p>
        <Link to="/payments">
          <button style={styles.btnPrimary}>Back to Payments</button>
        </Link>
      </div>
    );
  }

  // The amount available to change to: the remaining balance + this current payment
  const maxAmount = loan ? loan.remaining + payment.amount : payment.amount;
  // The penalty available to change to: what's already owed + the penalty set on this payment
  const maxPenalty = loan ? getLoanOutstandingPenalty(loan) + (payment.penaltyAmount || 0) : (payment.penaltyAmount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (parseFloat(form.amount) <= 0 || isNaN(parseFloat(form.amount))) {
      setError('Payment amount must be greater than zero!');
      return;
    }
    if (parseFloat(form.amount) > maxAmount) {
      setError('Amount exceeds the payable balance!');
      return;
    }
    if (parseFloat(form.penaltyAmount) < 0 || isNaN(parseFloat(form.penaltyAmount))) {
      setError('Invalid penalty amount!');
      return;
    }
    if (parseFloat(form.penaltyAmount) > maxPenalty) {
      setError('Penalty amount exceeds the available amount!');
      return;
    }
    updatePayment(payment.id, {
      amount: parseFloat(form.amount),
      method: form.method,
      reference: form.reference,
      penaltyAmount: parseFloat(form.penaltyAmount) || 0
    });
    navigate('/payments');
  };

  return (
    <div style={styles.formContainer}>
      <h1 style={{ marginBottom: '24px' }}>Edit Payment</h1>

      {error && <div style={{ ...styles.alert, ...styles.alertDanger }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Loan</label>
            <input type="text" value={loan ? loan.clientName : '—'} disabled style={{ ...styles.formInput, background: '#f1f5f9', color: '#64748b' }} />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Amount (TSh) *</label>
            <input
              type="number"
              required
              value={form.amount}
              onChange={(e) => setForm({...form, amount: e.target.value})}
              style={styles.formInput}
              max={maxAmount}
              min="0"
            />
            <small style={{ color: '#64748b' }}>Maximum: TSh {maxAmount.toLocaleString()}</small>
          </div>
          {maxPenalty > 0 && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Penalty Amount Paid</label>
              <input
                type="number"
                value={form.penaltyAmount}
                onChange={(e) => setForm({...form, penaltyAmount: e.target.value})}
                style={styles.formInput}
                max={maxPenalty}
                min="0"
              />
              <small style={{ color: '#64748b' }}>Maximum: TSh {maxPenalty.toLocaleString()}</small>
            </div>
          )}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Payment Method</label>
            <select
              value={form.method}
              onChange={(e) => setForm({...form, method: e.target.value})}
              style={styles.formSelect}
            >
              <option value="M-Pesa">M-Pesa</option>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Airtel Money">Airtel Money</option>
              <option value="Tigo Pesa">Tigo Pesa</option>
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Reference</label>
            <input
              type="text"
              value={form.reference}
              onChange={(e) => setForm({...form, reference: e.target.value})}
              style={styles.formInput}
              placeholder="Reference number"
            />
          </div>
        </div>
        <div style={styles.formActions}>
          <button type="button" onClick={() => navigate('/payments')} style={styles.btnSecondary}>
            Cancel
          </button>
          <button type="submit" style={styles.btnSuccess}>
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPayment;
