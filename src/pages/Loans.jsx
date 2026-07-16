import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';
import LoanCard from '../components/LoanCard';

const Loans = () => {
  const { loans, getEffectiveStatus } = useLoans();
  const { canIssueLoans } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = loans
    .filter(l => filter === 'all' || getEffectiveStatus(l) === filter)
    .filter(l => l.clientName.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Loans</h1>
        {canIssueLoans() && (
          <Link to="/loans/new">
            <button style={styles.btnPrimary}>➕ New Loan</button>
          </Link>
        )}
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search loans by client name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput2}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {['all', 'active', 'pending', 'overdue', 'completed', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              ...styles.btnSecondary,
              background: filter === status ? '#2563eb' : '#e2e8f0',
              color: filter === status ? 'white' : '#334155'
            }}
          >
            {status === 'all' ? 'All' :
             status === 'active' ? 'Active' :
             status === 'pending' ? 'Pending Approval' :
             status === 'overdue' ? 'Overdue' :
             status === 'completed' ? 'Completed' : 'Rejected'}
          </button>
        ))}
      </div>

      <div>
        {filtered.map(loan => <LoanCard key={loan.id} loan={loan} showActions />)}
        {filtered.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>📭</div>
            <h3 style={styles.emptyTitle}>No Loans</h3>
            <p style={styles.emptyText}>No loans match your selection</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Loans;
