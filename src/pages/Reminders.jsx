import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { formatPhoneForWaMe } from '../utils/utils';

const Reminders = () => {
  const { getLoansNeedingReminder, getDueDate, clients } = useLoans();
  const [sentIds, setSentIds] = useState([]);
  const reminders = getLoansNeedingReminder();

  const buildMessage = (loan) => {
    const dueDateStr = getDueDate(loan).toLocaleDateString('en-GB');
    if (loan.daysUntilDue < 0) {
      return `Hello ${loan.clientName}, your loan of TSh ${loan.amount.toLocaleString()} has passed its due date (${dueDateStr}). Amount owed: TSh ${loan.remaining.toLocaleString()}. Please contact us as soon as possible to settle your debt. Thank you - LoanManager.`;
    }
    if (loan.daysUntilDue === 0) {
      return `Hello ${loan.clientName}, reminder: your loan of TSh ${loan.amount.toLocaleString()} is due TODAY (${dueDateStr}). Remaining amount: TSh ${loan.remaining.toLocaleString()}. Please make your payment. Thank you - LoanManager.`;
    }
    return `Hello ${loan.clientName}, reminder: your loan of TSh ${loan.amount.toLocaleString()} is due by ${dueDateStr} (in ${loan.daysUntilDue} days). Remaining amount: TSh ${loan.remaining.toLocaleString()}. Please make your payment on time. Thank you - LoanManager.`;
  };

  const handleWhatsApp = (loan) => {
    const client = clients.find(c => c.id === loan.clientId);
    const phone = formatPhoneForWaMe(client?.phone);
    const message = buildMessage(loan);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    setSentIds(prev => (prev.includes(loan.id) ? prev : [...prev, loan.id]));
  };

  const handleCopy = async (loan) => {
    const message = buildMessage(loan);
    try {
      await navigator.clipboard.writeText(message);
    } catch (e) {
      window.prompt('Copy this message:', message);
    }
    setSentIds(prev => (prev.includes(loan.id) ? prev : [...prev, loan.id]));
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Payment Reminders</h1>
      </div>

      {reminders.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🔔</div>
          <h3 style={styles.emptyTitle}>No Reminders</h3>
          <p style={styles.emptyText}>No loans currently need a reminder</p>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h3>Loans Needing a Reminder ({reminders.length})</h3>
          </div>
          <div style={{ padding: '16px 24px' }}>
            {reminders.map(loan => {
              const client = clients.find(c => c.id === loan.clientId);
              const isOverdue = loan.daysUntilDue < 0;
              const isToday = loan.daysUntilDue === 0;
              return (
                <div key={loan.id} style={{
                  background: 'white',
                  padding: '16px',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  marginBottom: '12px',
                  borderLeft: isOverdue ? '4px solid #dc2626' : '4px solid #f59e0b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{loan.clientName}</div>
                    <div style={{ fontSize: '14px', color: '#64748b' }}>{client?.phone || 'No phone number'}</div>
                    <div style={{
                      fontSize: '13px', fontWeight: '600', marginTop: '4px',
                      color: isOverdue ? '#dc2626' : '#d97706'
                    }}>
                      {isOverdue
                        ? `⚠️ Overdue by ${Math.abs(loan.daysUntilDue)} days`
                        : isToday
                          ? '⏰ Due today'
                          : `⏳ ${loan.daysUntilDue} days remaining`}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                      Remaining: TSh {loan.remaining.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {sentIds.includes(loan.id) && (
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>✓ Handled</span>
                    )}
                    <button
                      style={{ ...styles.btnPrimary, background: '#25D366' }}
                      onClick={() => handleWhatsApp(loan)}
                      disabled={!client?.phone}
                    >
                      💬 WhatsApp
                    </button>
                    <button style={styles.btnSecondary} onClick={() => handleCopy(loan)}>
                      📋 Copy SMS
                    </button>
                    <Link to={`/loans/${loan.id}`}>
                      <button style={styles.btnSecondary}>👁️</button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reminders;
