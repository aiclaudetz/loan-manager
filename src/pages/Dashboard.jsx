import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';
import LoanCard from '../components/LoanCard';

const Dashboard = () => {
  const { loans, loading, getLoanStats } = useLoans();
  const { currentUser, canApproveLoans, canIssueLoans } = useAuth();
  const stats = getLoanStats();
  const recentLoans = loans.slice(0, 5);
  const pendingLoans = loans.filter(l => l.status === 'pending');

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const statCards = [
    { icon: '💰', label: 'Total Loans', value: stats.totalLoans, color: '#dbeafe', iconColor: '#1d4ed8' },
    { icon: '✅', label: 'Active Loans', value: stats.activeLoans, color: '#dcfce7', iconColor: '#16a34a' },
    { icon: '⚠️', label: 'Overdue Loans', value: stats.overdueLoans, color: '#fee2e2', iconColor: '#dc2626' },
    { icon: '📊', label: 'Total Amount', value: `TSh ${stats.totalAmount.toLocaleString()}`, color: '#fef3c7', iconColor: '#d97706' },
  ];

  if (stats.totalPenalties > 0) {
    statCards.push({ icon: '⏰', label: 'Total Late Penalties', value: `TSh ${Math.round(stats.totalPenalties).toLocaleString()}`, color: '#fee2e2', iconColor: '#dc2626' });
  }

  return (
    <div>
      <h1 style={styles.pageTitle}>Loans Dashboard</h1>

      {canApproveLoans() && (
        <div style={{
          ...styles.tableContainer,
          marginBottom: '24px',
          borderLeft: pendingLoans.length > 0 ? '4px solid #f59e0b' : '4px solid #16a34a'
        }}>
          <div style={styles.tableHeader}>
            <div>
              <h3>👋 Today's Summary, {currentUser.fullName}</h3>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px', textTransform: 'capitalize' }}>
                {today}
              </div>
            </div>
            {pendingLoans.length > 0 && (
              <span style={{ ...styles.badge, ...styles.badgePending }}>
                {pendingLoans.length} awaiting your approval
              </span>
            )}
          </div>
          <div style={{ padding: '16px 24px' }}>
            {pendingLoans.length === 0 ? (
              <p style={{ color: '#64748b', margin: 0 }}>
                🎉 No loans are currently awaiting your approval. All caught up!
              </p>
            ) : (
              pendingLoans.map(loan => <LoanCard key={loan.id} loan={loan} />)
            )}
          </div>
        </div>
      )}

      <div style={styles.statsGrid}>
        {statCards.map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.statIcon, background: stat.color, color: stat.iconColor }}>
              {stat.icon}
            </div>
            <div style={styles.statInfo}>
              <div style={styles.statLabel}>{stat.label}</div>
              <div style={styles.statNumber}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3>Recent Loans</h3>
          <Link to="/loans">
            <button style={styles.btnSecondary}>View All</button>
          </Link>
        </div>
        <div style={{ padding: '16px 24px' }}>
          {loading ? (
            <p>Loading...</p>
          ) : (
            recentLoans.map(loan => <LoanCard key={loan.id} loan={loan} />)
          )}
        </div>
      </div>

      <div style={{ ...styles.tableContainer, marginTop: '24px' }}>
        <div style={styles.tableHeader}>
          <h3>Quick Actions</h3>
        </div>
        <div style={{ padding: '16px 24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {canIssueLoans() && (
            <Link to="/loans/new">
              <button style={styles.btnPrimary}>➕ New Loan</button>
            </Link>
          )}
          <Link to="/clients/new">
            <button style={styles.btnSuccess}>👤 New Client</button>
          </Link>
          <Link to="/payments/new">
            <button style={{ ...styles.btnPrimary, background: '#7c3aed' }}>💳 Record Payment</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
