import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';
import IdPhotoUpload from '../components/IdPhotoUpload';
import { isValidTZPhone, isValidIdNumber, findDuplicatePhone, findDuplicateNationalId } from '../utils/utils';

const NewLoan = () => {
  const navigate = useNavigate();
  const { clients, addLoan, addClient, getClientActiveLoanCount, loanLimitPerClient } = useLoans();
  const { currentUser, canIssueLoans } = useAuth();
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ fullName: '', phone: '', nationalId: '', address: '', idPhoto: '' });
  const [form, setForm] = useState({
    clientId: '',
    amount: '',
    interestRate: '5',
    duration: '30',
    purpose: '',
    guarantorName: '',
    guarantorPhone: '',
    guarantorIdNumber: '',
    guarantorIdPhoto: '',
    collateralItem: ''
  });
  const [error, setError] = useState('');
  const [confirmRisk, setConfirmRisk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const activeLoanCount = form.clientId ? getClientActiveLoanCount(parseInt(form.clientId)) : 0;
  const overLimit = activeLoanCount >= loanLimitPerClient;

  const calculateTotal = () => {
    const amount = parseFloat(form.amount) || 0;
    const rate = parseFloat(form.interestRate) || 0;
    return amount + (amount * rate / 100);
  };

  const calculateMonthly = () => {
    const total = calculateTotal();
    const duration = parseInt(form.duration) || 1;
    return total / duration;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isNewClient) {
      if (newClient.fullName.trim().length < 3) {
        setError('Client full name must have at least 3 characters');
        return;
      }
      if (!isValidTZPhone(newClient.phone)) {
        setError('Invalid client phone number. Use the format 07XXXXXXXX or 06XXXXXXXX');
        return;
      }
      if (findDuplicatePhone(clients, newClient.phone)) {
        setError('This phone number is already used by another client');
        return;
      }
      if (!isValidIdNumber(newClient.nationalId)) {
        setError('Invalid client National ID number (5-25 letters/digits)');
        return;
      }
      if (findDuplicateNationalId(clients, newClient.nationalId)) {
        setError('This National ID is already registered to another client');
        return;
      }
    } else if (!form.clientId) {
      setError('Please select a client');
      return;
    }
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
    if (!isNewClient && overLimit && !confirmRisk) {
      setError('This client already has too many incomplete loans. Confirm the risk warning before proceeding.');
      return;
    }

    setSubmitting(true);
    try {
      let clientId, clientName;
      if (isNewClient) {
        // addClient talks to Supabase and is async — must be awaited, otherwise
        // `created` would be a pending Promise instead of the actual client row.
        const created = await addClient(newClient);
        if (!created) {
          setError('Failed to create the new client. Please try again.');
          return;
        }
        clientId = created.id;
        clientName = created.fullName;
      } else {
        const client = clients.find(c => c.id === parseInt(form.clientId));
        clientId = parseInt(form.clientId);
        clientName = client ? client.fullName : '';
      }

      const loanData = {
        clientId,
        clientName,
        amount: parseFloat(form.amount),
        interestRate: parseFloat(form.interestRate),
        duration: parseInt(form.duration),
        purpose: form.purpose,
        guarantorName: form.guarantorName,
        guarantorPhone: form.guarantorPhone,
        guarantorIdNumber: form.guarantorIdNumber,
        guarantorIdPhoto: form.guarantorIdPhoto,
        collateralItem: form.collateralItem,
        totalPayable: calculateTotal(),
        paid: 0,
        remaining: calculateTotal(),
        requestedBy: currentUser.username
      };

      const created = await addLoan(loanData);
      if (!created) {
        setError('Failed to create the loan. Please try again.');
        return;
      }
      navigate('/loans');
    } finally {
      setSubmitting(false);
    }
  };

  if (!canIssueLoans()) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🚫</div>
        <h3 style={styles.emptyTitle}>Access Denied</h3>
        <p style={styles.emptyText}>You do not have permission to create a new loan. Contact the administrator.</p>
      </div>
    );
  }

  return (
    <div style={styles.formContainer}>
      <h1 style={{ marginBottom: '24px' }}>New Loan</h1>
      <div style={{ ...styles.alert, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
        ℹ️ This loan will wait for manager approval before it officially starts.
      </div>

      {error && <div style={{ ...styles.alert, ...styles.alertDanger }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => { setIsNewClient(false); setError(''); }}
            style={!isNewClient ? styles.btnPrimary : styles.btnSecondary}
          >
            Existing Client
          </button>
          <button
            type="button"
            onClick={() => { setIsNewClient(true); setError(''); setConfirmRisk(false); }}
            style={isNewClient ? styles.btnPrimary : styles.btnSecondary}
          >
            + New Client
          </button>
        </div>

        <div style={styles.formGrid}>
          {!isNewClient ? (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Client *</label>
              <select
                required
                value={form.clientId}
                onChange={(e) => { setForm({...form, clientId: e.target.value}); setConfirmRisk(false); }}
                style={styles.formSelect}
              >
                <option value="">-- Select Client --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} - {c.phone}</option>
                ))}
              </select>
              {form.clientId && overLimit && (
                <div style={{
                  marginTop: '8px', padding: '10px 12px', background: '#fef3c7',
                  border: '1px solid #fbbf24', borderRadius: '8px', fontSize: '13px', color: '#92400e'
                }}>
                  ⚠️ Risk Warning: This client already has <strong>{activeLoanCount}</strong> incomplete
                  loan(s) (limit is {loanLimitPerClient}). Issuing another loan may increase the risk
                  of non-repayment.
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontWeight: '600' }}>
                    <input
                      type="checkbox"
                      checked={confirmRisk}
                      onChange={(e) => setConfirmRisk(e.target.checked)}
                    />
                    I understand the risk and want to proceed
                  </label>
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Client Full Name *</label>
                <input
                  type="text"
                  required
                  value={newClient.fullName}
                  onChange={(e) => setNewClient({...newClient, fullName: e.target.value})}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Client Phone *</label>
                <input
                  type="tel"
                  required
                  value={newClient.phone}
                  onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Client National ID</label>
                <input
                  type="text"
                  value={newClient.nationalId}
                  onChange={(e) => setNewClient({...newClient, nationalId: e.target.value})}
                  style={styles.formInput}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Client Address</label>
                <input
                  type="text"
                  value={newClient.address}
                  onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                  style={styles.formInput}
                />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <IdPhotoUpload
                  label="Client ID Photo (National ID/License)"
                  value={newClient.idPhoto}
                  onChange={(val) => setNewClient({...newClient, idPhoto: val})}
                />
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
              <span style={styles.summaryLabel}>Amount</span>
              <strong style={styles.summaryValue}>TSh {parseFloat(form.amount || 0).toLocaleString()}</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Interest Rate</span>
              <strong style={styles.summaryValue}>{form.interestRate}%</strong>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Duration</span>
              <strong style={styles.summaryValue}>{form.duration} days</strong>
            </div>
            <div style={{ ...styles.summaryItem, ...styles.summaryHighlight }}>
              <span style={styles.summaryLabel}>Total Payable</span>
              <strong style={{ ...styles.summaryValue, color: '#2563eb' }}>
                TSh {calculateTotal().toLocaleString()}
              </strong>
            </div>
            <div style={{ ...styles.summaryItem, ...styles.summaryHighlight }}>
              <span style={styles.summaryLabel}>Monthly Payment</span>
              <strong style={{ ...styles.summaryValue, color: '#2563eb' }}>
                TSh {calculateMonthly().toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        <div style={styles.formActions}>
          <button type="button" onClick={() => navigate('/loans')} style={styles.btnSecondary} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" style={styles.btnPrimary} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit for Manager Approval'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewLoan;
