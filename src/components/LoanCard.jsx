import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';

const LoanCard = ({ loan, showActions }) => {
  const { getEffectiveStatus, getDueDate, getLoanOutstandingPenalty, deleteLoan, approveLoan, rejectLoan } = useLoans();
  const { currentUser, canApproveLoans } = useAuth();
  const navigate = useNavigate();
  const effectiveStatus = getEffectiveStatus(loan);

  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the loan for "${loan.clientName}"?`)) {
      deleteLoan(loan.id);
    }
  };

  const handleApprove = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Approve the loan for "${loan.clientName}"? The loan will start immediately.`)) {
      approveLoan(loan.id, currentUser.username);
    }
  };

  const handleReject = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const reason = window.prompt('Reason for rejecting this loan (optional):') || '';
    rejectLoan(loan.id, currentUser.username, reason);
  };

  const getStatusStyle = () => {
    switch(effectiveStatus) {
      case 'active': return styles.badgeActive;
      case 'completed': return styles.badgeCompleted;
      case 'pending': return styles.badgePending;
      case 'overdue': return styles.badgeOverdue;
      case 'rejected': return styles.badgeRejected;
      default: return styles.badgeInactive;
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '12px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderLeft: effectiveStatus === 'overdue' ? '4px solid #dc2626' : 'none'
    }}>
      <div>
        <div style={{ fontWeight: '600' }}>{loan.clientName}</div>
        <div style={{ fontSize: '14px', color: '#64748b' }}>
          TSh {loan.amount.toLocaleString()} • {loan.duration} days
        </div>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Paid: TSh {loan.paid.toLocaleString()} • Remaining: TSh {loan.remaining.toLocaleString()}
        </div>
        {effectiveStatus === 'overdue' && (
          <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', marginTop: '2px' }}>
            ⚠️ Overdue since {getDueDate(loan).toLocaleDateString('en-GB')}
            {getLoanOutstandingPenalty(loan) > 0 && (
              <> • Outstanding penalty: TSh {Math.round(getLoanOutstandingPenalty(loan)).toLocaleString()}</>
            )}
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ ...styles.badge, ...getStatusStyle() }}>
          {effectiveStatus === 'active' ? 'Active' :
           effectiveStatus === 'completed' ? 'Completed' :
           effectiveStatus === 'pending' ? 'Pending Approval' :
           effectiveStatus === 'overdue' ? 'Overdue' :
           effectiveStatus === 'rejected' ? 'Rejected' : 'Inactive'}
        </span>
        <div style={{ fontSize: '14px', marginTop: '4px', color: '#64748b' }}>
          {loan.date}
        </div>
        {loan.status === 'pending' && canApproveLoans() && (
          <div style={{ marginTop: '8px', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
            <button style={{ ...styles.btnSuccess, padding: '6px 12px', fontSize: '12px' }} onClick={handleApprove}>✅ Approve</button>
            <button style={{ ...styles.btnDanger, padding: '6px 12px', fontSize: '12px' }} onClick={handleReject}>❌ Reject</button>
          </div>
        )}
        {showActions && (
          <div style={{ marginTop: '8px' }}>
            <button style={styles.actionIcon} title="View" onClick={() => navigate(`/loans/${loan.id}`)}>👁️</button>
            <button style={styles.actionIcon} title="Edit" onClick={() => navigate(`/loans/${loan.id}/edit`)}>✏️</button>
            <button style={styles.actionIcon} title="Delete" onClick={handleDelete}>🗑️</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanCard;
