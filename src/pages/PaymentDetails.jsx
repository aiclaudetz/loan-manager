import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';

const PaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { payments, loans, clients, deletePayment } = useLoans();

  const payment = payments.find(p => p.id === parseInt(id));
  const loan = payment ? loans.find(l => l.id === payment.loanId) : null;
  const client = loan ? clients.find(c => c.id === loan.clientId) : null;

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

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this payment of TSh ${payment.amount.toLocaleString()}?`)) {
      deletePayment(payment.id);
      navigate('/payments');
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Payment Details</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/payments')} style={styles.btnSecondary}>← Back</button>
          <Link to={`/payments/${payment.id}/edit`}>
            <button style={styles.btnPrimary}>✏️ Edit</button>
          </Link>
          <button onClick={handleDelete} style={styles.btnDanger}>🗑️ Delete</button>
        </div>
      </div>

      <div style={styles.formContainer}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Client</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>
              {loan ? (
                <Link to={`/loans/${loan.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                  {loan.clientName}
                </Link>
              ) : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Amount Paid</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>TSh {payment.amount.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Payment Method</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{payment.method || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Date</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{payment.date}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Reference</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{payment.reference || '—'}</div>
          </div>
          {payment.penaltyAmount > 0 && (
            <div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Penalty Paid</div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: '#dc2626' }}>
                TSh {payment.penaltyAmount.toLocaleString()}
              </div>
            </div>
          )}
        </div>

        {loan && (
          <div style={{ marginTop: '24px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>
              Related Loan
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Loan Amount</div>
                <div style={{ fontWeight: '600' }}>TSh {loan.amount.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Remaining Balance</div>
                <div style={{ fontWeight: '600' }}>TSh {loan.remaining.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Phone</div>
                <div style={{ fontWeight: '600' }}>{client?.phone || '—'}</div>
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <Link to={`/loans/${loan.id}`}>
                <button style={styles.btnSecondary}>View Full Loan →</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetails;
