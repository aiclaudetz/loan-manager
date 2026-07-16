import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';

const NewPayment = () => {
  const navigate = useNavigate();
  const { loans, addPayment, getEffectiveStatus, getLoanOutstandingPenalty } = useLoans();
  const [form, setForm] = useState({ loanId: '', amount: '', method: 'M-Pesa', reference: '', penaltyAmount: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedLoan = loans.find(l => l.id === parseInt(form.loanId));
  const maxAmount = selectedLoan ? selectedLoan.remaining : 0;
  const outstandingPenalty = selectedLoan ? getLoanOutstandingPenalty(selectedLoan) : 0;
  const isOverdue = selectedLoan && getEffectiveStatus(selectedLoan) === 'overdue';

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.loanId) {
      setError('Please select a loan');
      return;
    }
    if (parseFloat(form.amount) <= 0 || isNaN(parseFloat(form.amount))) {
      setError('Payment amount must be greater than zero');
      return;
    }
    if (parseFloat(form.amount) > maxAmount) {
      setError('Amount exceeds the remaining balance');
      return;
    }
    const penaltyToCollect = parseFloat(form.penaltyAmount) || 0;
    if (penaltyToCollect < 0 || penaltyToCollect > outstandingPenalty) {
      setError('Invalid penalty amount, or it exceeds the outstanding penalty');
      return;
    }
    addPayment({
      loanId: parseInt(form.loanId),
      amount: parseFloat(form.amount),
      method: form.method,
      reference: form.reference,
      penaltyAmount: penaltyToCollect
    });
    setSuccess('Payment recorded successfully!');
    setTimeout(() => navigate('/payments'), 1500);
  };

  return (
    <div style={styles.formContainer}>
      <h1 style={{ marginBottom: '24px' }}>Record Payment</h1>

      {error && <div style={{ ...styles.alert, ...styles.alertDanger }}>{error}</div>}
      {success && <div style={{ ...styles.alert, ...styles.alertSuccess }}>{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Select Loan *</label>
            <select
              required
              value={form.loanId}
              onChange={(e) => setForm({...form, loanId: e.target.value})}
              style={styles.formSelect}
            >
              <option value="">-- Select Loan --</option>
              {loans.filter(l => l.remaining > 0 && l.status !== 'pending' && l.status !== 'rejected').map(l => (
                <option key={l.id} value={l.id}>
                  {l.clientName} - TSh {l.remaining.toLocaleString()} remaining
                </option>
              ))}
            </select>
          </div>
          {isOverdue && outstandingPenalty > 0 && (
            <>
              <div style={{
                gridColumn: '1 / -1', padding: '10px 12px', background: '#fef2f2',
                border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#991b1b'
              }}>
                ⏰ This loan is overdue and has an outstanding penalty of TSh {Math.round(outstandingPenalty).toLocaleString()}
                (not included in the loan amount). You can collect it below as a separate payment.
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Penalty Amount Being Paid</label>
                <input
                  type="number"
                  value={form.penaltyAmount}
                  onChange={(e) => setForm({...form, penaltyAmount: e.target.value})}
                  style={styles.formInput}
                  placeholder="0"
                  max={outstandingPenalty}
                  min="0"
                />
                <small style={{ color: '#64748b' }}>
                  Outstanding penalty: TSh {Math.round(outstandingPenalty).toLocaleString()}
                </small>
              </div>
            </>
          )}
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Amount (TSh) *</label>
            <input
              type="number"
              required
              value={form.amount}
              onChange={(e) => setForm({...form, amount: e.target.value})}
              style={styles.formInput}
              placeholder="0"
              max={maxAmount}
              min="0"
            />
            {selectedLoan && (
              <small style={{ color: '#64748b' }}>
                Remaining balance: TSh {maxAmount.toLocaleString()}
              </small>
            )}
          </div>
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
            Record Payment
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewPayment;
