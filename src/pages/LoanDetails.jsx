import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';
import { formatPhoneForWaMe, REMINDER_WINDOW_DAYS } from '../utils/utils';

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loans, clients, payments, getEffectiveStatus, getDueDate, getOverdueDays, getLoanPenalty, getLoanOutstandingPenalty, getLoanTotalOwed, deleteLoan, deletePayment, approveLoan, rejectLoan } = useLoans();
  const { currentUser, canApproveLoans } = useAuth();
  const loan = loans.find(l => l.id === parseInt(id));
  const client = loan ? clients.find(c => c.id === loan.clientId) : null;
  const loanPayments = loan ? payments.filter(p => p.loanId === loan.id).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete this loan?`)) {
      deleteLoan(loan.id);
      navigate('/loans');
    }
  };

  const handleApprove = () => {
    if (window.confirm('Approve this loan? It will start immediately.')) {
      approveLoan(loan.id, currentUser.username);
    }
  };

  const handleReject = () => {
    const reason = window.prompt('Reason for rejecting this loan (optional):') || '';
    rejectLoan(loan.id, currentUser.username, reason);
  };

  const handleDeletePayment = (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      deletePayment(paymentId);
    }
  };

  const buildReminderMessage = (l, daysUntilDue) => {
    const dueDateStr = getDueDate(l).toLocaleDateString('en-GB');
    if (daysUntilDue < 0) {
      return `Hello ${l.clientName}, your loan of TSh ${l.amount.toLocaleString()} has passed its due date (${dueDateStr}). Amount owed: TSh ${l.remaining.toLocaleString()}. Please contact us as soon as possible to settle your debt. Thank you - LoanManager.`;
    }
    if (daysUntilDue === 0) {
      return `Hello ${l.clientName}, reminder: your loan of TSh ${l.amount.toLocaleString()} is due TODAY (${dueDateStr}). Remaining amount: TSh ${l.remaining.toLocaleString()}. Please make your payment. Thank you - LoanManager.`;
    }
    return `Hello ${l.clientName}, reminder: your loan of TSh ${l.amount.toLocaleString()} is due by ${dueDateStr} (in ${daysUntilDue} days). Remaining amount: TSh ${l.remaining.toLocaleString()}. Please make your payment on time. Thank you - LoanManager.`;
  };

  const handleSendReminder = (daysUntilDue) => {
    const phone = formatPhoneForWaMe(client?.phone);
    const message = buildReminderMessage(loan, daysUntilDue);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

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

  const effectiveStatus = getEffectiveStatus(loan);
  const progress = loan.totalPayable > 0 ? (loan.paid / loan.totalPayable) * 100 : 0;

  let daysUntilDue = null;
  if (effectiveStatus !== 'completed' && effectiveStatus !== 'pending' && effectiveStatus !== 'rejected' && loan.remaining > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = getDueDate(loan);
    daysUntilDue = Math.round((due - today) / (1000 * 60 * 60 * 24));
  }
  const showReminder = daysUntilDue !== null && daysUntilDue <= REMINDER_WINDOW_DAYS;

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Loan Details</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => window.history.back()} style={styles.btnSecondary}>
            ← Back
          </button>
          {loan.status === 'pending' && canApproveLoans() && (
            <>
              <button onClick={handleApprove} style={styles.btnSuccess}>✅ Approve</button>
              <button onClick={handleReject} style={styles.btnDanger}>❌ Reject</button>
            </>
          )}
          <Link to={`/loans/${loan.id}/edit`}>
            <button style={styles.btnPrimary}>✏️ Edit</button>
          </Link>
          <button onClick={handleDelete} style={styles.btnDanger}>🗑️ Delete</button>
        </div>
      </div>

      <div style={styles.formContainer}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Client</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{loan.clientName}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Status</div>
            <span style={{ ...styles.badge, ...(effectiveStatus === 'active' ? styles.badgeActive :
              effectiveStatus === 'completed' ? styles.badgeCompleted :
              effectiveStatus === 'pending' ? styles.badgePending :
              effectiveStatus === 'rejected' ? styles.badgeRejected : styles.badgeOverdue) }}>
              {effectiveStatus === 'active' ? 'Active' :
               effectiveStatus === 'completed' ? 'Completed' :
               effectiveStatus === 'pending' ? 'Pending Approval' :
               effectiveStatus === 'rejected' ? 'Rejected' : 'Overdue'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Amount</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>TSh {loan.amount.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Interest Rate</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{loan.interestRate}%</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Duration</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{loan.duration} days</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Start Date</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{loan.date}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Payment Due Date</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: effectiveStatus === 'overdue' ? '#dc2626' : '#1e293b' }}>
              {getDueDate(loan).toLocaleDateString('en-GB')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Total Payable</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>TSh {loan.totalPayable.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Remaining</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>TSh {loan.remaining.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>Payment Progress</div>
          <div style={{ background: '#e2e8f0', borderRadius: '8px', height: '20px', overflow: 'hidden' }}>
            <div style={{
              background: progress > 80 ? '#16a34a' : progress > 50 ? '#f59e0b' : '#2563eb',
              height: '100%',
              width: `${Math.min(progress, 100)}%`,
              transition: 'width 0.5s ease',
              borderRadius: '8px'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '13px', color: '#64748b' }}>{progress.toFixed(0)}% paid</span>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              TSh {loan.paid.toLocaleString()} / TSh {loan.totalPayable.toLocaleString()}
            </span>
          </div>
        </div>

        {effectiveStatus === 'overdue' && getLoanPenalty(loan) > 0 && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', color: '#991b1b', fontWeight: '600', marginBottom: '8px' }}>
              ⏰ Late Penalty
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Overdue Days</div>
                <div style={{ fontWeight: '600' }}>{getOverdueDays(loan)} days</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Outstanding Penalty</div>
                <div style={{ fontWeight: '600', color: '#dc2626' }}>TSh {Math.round(getLoanOutstandingPenalty(loan)).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Total Owed (with Penalty)</div>
                <div style={{ fontWeight: '600', color: '#dc2626' }}>TSh {Math.round(loan.remaining + getLoanOutstandingPenalty(loan)).toLocaleString()}</div>
              </div>
            </div>
            {(loan.penaltyPaid || 0) > 0 && (
              <div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>
                Penalty already paid: <strong>TSh {Math.round(loan.penaltyPaid).toLocaleString()}</strong>
              </div>
            )}
          </div>
        )}

        {loan.purpose && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Loan Purpose</div>
            <div>{loan.purpose}</div>
          </div>
        )}

        {(loan.guarantorName || loan.guarantorPhone || loan.guarantorIdNumber || loan.collateralItem || loan.guarantorIdPhoto || client?.idPhoto) && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>
              Guarantor Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              {loan.guarantorName && (
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Guarantor Name</div>
                  <div>{loan.guarantorName}</div>
                </div>
              )}
              {loan.guarantorPhone && (
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Guarantor Phone Number</div>
                  <div>{loan.guarantorPhone}</div>
                </div>
              )}
              {loan.guarantorIdNumber && (
                <div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>National ID / License Number</div>
                  <div>{loan.guarantorIdNumber}</div>
                </div>
              )}
              {loan.collateralItem && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>Item / Collateral</div>
                  <div>{loan.collateralItem}</div>
                </div>
              )}
            </div>
            {(loan.guarantorIdPhoto || client?.idPhoto) && (
              <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
                {client?.idPhoto && (
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Client ID Photo</div>
                    <a href={client.idPhoto} target="_blank" rel="noopener noreferrer">
                      <img src={client.idPhoto} alt="Client ID Photo" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    </a>
                  </div>
                )}
                {loan.guarantorIdPhoto && (
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Guarantor ID Photo</div>
                    <a href={loan.guarantorIdPhoto} target="_blank" rel="noopener noreferrer">
                      <img src={loan.guarantorIdPhoto} alt="Guarantor ID Photo" style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(loan.requestedBy || loan.approvedBy || loan.rejectedBy) && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
            {loan.requestedBy && <div>Requested by: <strong>{loan.requestedBy}</strong></div>}
            {loan.approvedBy && <div>Approved by: <strong>{loan.approvedBy}</strong> ({loan.approvedDate})</div>}
            {loan.rejectedBy && (
              <div>
                Rejected by: <strong>{loan.rejectedBy}</strong> ({loan.rejectedDate})
                {loan.rejectReason && <div>Reason: {loan.rejectReason}</div>}
              </div>
            )}
          </div>
        )}

        {showReminder && (
          <div style={{ marginTop: '16px', padding: '12px', background: daysUntilDue < 0 ? '#fef2f2' : '#fffbeb', border: `1px solid ${daysUntilDue < 0 ? '#fecaca' : '#fde68a'}`, borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: daysUntilDue < 0 ? '#991b1b' : '#92400e' }}>
                🔔 {daysUntilDue < 0
                  ? `This loan is ${Math.abs(daysUntilDue)} day(s) past due`
                  : daysUntilDue === 0
                  ? 'This loan is due today'
                  : `This loan is due in ${daysUntilDue} day(s)`}
              </div>
              {client?.phone && (
                <button onClick={() => handleSendReminder(daysUntilDue)} style={styles.btnSuccess}>
                  💬 Send Reminder via WhatsApp
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Payments ({loanPayments.length})</h3>
            {loan.remaining > 0 && effectiveStatus !== 'pending' && effectiveStatus !== 'rejected' && (
              <Link to={`/payments/new?loan=${loan.id}`}>
                <button style={styles.btnPrimary}>+ Record Payment</button>
              </Link>
            )}
          </div>

          {loanPayments.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#64748b', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              No payments have been recorded for this loan yet.
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              {loanPayments.map((p, idx) => (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 16px', borderTop: idx === 0 ? 'none' : '1px solid #e2e8f0',
                  background: '#fff'
                }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>TSh {p.amount.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {p.date} · {p.method || '—'}{p.reference ? ` · Ref: ${p.reference}` : ''}
                      {p.penaltyAmount > 0 && ` · Penalty paid: TSh ${p.penaltyAmount.toLocaleString()}`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to={`/payments/${p.id}/edit`}>
                      <button style={styles.btnSecondary}>✏️ Edit</button>
                    </Link>
                    <button onClick={() => handleDeletePayment(p.id)} style={styles.btnDanger}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;
