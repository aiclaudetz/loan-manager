import React, { useState } from 'react';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { arrayToCSV, downloadCSV, todayStamp } from '../utils/utils';
import { BarChart, DonutChart } from '../components/Charts';

const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Loan status badge colors, matching those used on the loan list pages
const STATUS_COLORS = {
  active: '#16a34a',
  completed: '#1e40af',
  overdue: '#dc2626',
  pending: '#d97706',
  rejected: '#64748b',
};

const STATUS_LABELS_EN = {
  active: 'Active',
  completed: 'Completed',
  overdue: 'Overdue',
  pending: 'Pending Approval',
  rejected: 'Rejected',
};

const Reports = () => {
  const { loans, clients, payments, getEffectiveStatus } = useLoans();

  const exportClients = () => {
    const csv = arrayToCSV(clients, [
      { key: 'id', label: 'ID' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'nationalId', label: 'ID Number' },
      { key: 'status', label: 'Status' },
    ]);
    downloadCSV(`clients-${todayStamp()}.csv`, csv);
  };

  const exportLoans = () => {
    const csv = arrayToCSV(
      loans.map((l) => ({ ...l, effectiveStatus: getEffectiveStatus(l) })),
      [
        { key: 'id', label: 'ID' },
        { key: 'clientName', label: 'Client' },
        { key: 'amount', label: 'Loan Amount' },
        { key: 'interestRate', label: 'Interest Rate (%)' },
        { key: 'duration', label: 'Duration (days)' },
        { key: 'date', label: 'Issue Date' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'totalPayable', label: 'Total Payable' },
        { key: 'paid', label: 'Paid' },
        { key: 'remaining', label: 'Remaining' },
        { key: 'effectiveStatus', label: 'Status' },
      ]
    );
    downloadCSV(`loans-${todayStamp()}.csv`, csv);
  };

  const exportPayments = () => {
    const csv = arrayToCSV(payments, [
      { key: 'id', label: 'ID' },
      { key: 'loanId', label: 'Loan ID' },
      { key: 'amount', label: 'Amount' },
      { key: 'date', label: 'Date' },
      { key: 'method', label: 'Payment Method' },
      { key: 'reference', label: 'Reference Number' },
    ]);
    downloadCSV(`payments-${todayStamp()}.csv`, csv);
  };

  const exportAll = () => {
    exportClients();
    exportLoans();
    exportPayments();
  };

  const stats = {
    totalLoans: loans.length,
    totalAmount: loans.reduce((s, l) => s + l.amount, 0),
    totalPaid: loans.reduce((s, l) => s + l.paid, 0),
    totalRemaining: loans.reduce((s, l) => s + l.remaining, 0),
    activeClients: clients.filter(c => c.status === 'active').length,
    completedLoans: loans.filter(l => getEffectiveStatus(l) === 'completed').length,
    overdueLoans: loans.filter(l => getEffectiveStatus(l) === 'overdue').length,
  };

  // Collections for the last 6 months - total payments (excluding penalties) per month
  const monthlyCollections = (() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS_EN[d.getMonth()] });
    }
    const totals = Object.fromEntries(months.map(m => [m.key, 0]));
    payments.forEach(p => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (key in totals) totals[key] += p.amount;
    });
    return months.map(m => ({ label: m.label, value: totals[m.key] }));
  })();

  // Loan count per status (based on effective status - overdue calculated automatically)
  const loanStatusBreakdown = ['active', 'pending', 'overdue', 'completed', 'rejected'].map(status => ({
    label: STATUS_LABELS_EN[status],
    value: loans.filter(l => getEffectiveStatus(l) === status).length,
    color: STATUS_COLORS[status],
  }));

  return (
    <div>
      <h1 style={styles.pageTitle}>Reports</h1>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#dbeafe', color: '#1d4ed8' }}>📊</div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Total Loans</div>
            <div style={styles.statNumber}>{stats.totalLoans}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#dcfce7', color: '#16a34a' }}>💰</div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Total Amount</div>
            <div style={styles.statNumber}>TSh {stats.totalAmount.toLocaleString()}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#fef3c7', color: '#d97706' }}>✅</div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Paid</div>
            <div style={styles.statNumber}>TSh {stats.totalPaid.toLocaleString()}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, background: '#fee2e2', color: '#dc2626' }}>⏳</div>
          <div style={styles.statInfo}>
            <div style={styles.statLabel}>Remaining</div>
            <div style={styles.statNumber}>TSh {stats.totalRemaining.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginTop: '24px' }}>
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h3>Monthly Collections (Last 6 Months)</h3>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <BarChart data={monthlyCollections} color="#2563eb" formatValue={(v) => `${Math.round(v / 1000)}K`} />
          </div>
        </div>
        <div style={styles.tableContainer}>
          <div style={styles.tableHeader}>
            <h3>Loan Status Breakdown</h3>
          </div>
          <div style={{ padding: '20px 24px' }}>
            <DonutChart data={loanStatusBreakdown} />
          </div>
        </div>
      </div>

      <div style={{ ...styles.tableContainer, marginTop: '24px' }}>
        <div style={styles.tableHeader}>
          <h3>Loan Summary</h3>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Active Clients</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.activeClients}</div>
            </div>
            <div style={{ padding: '16px', background: '#dcfce7', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#166534' }}>Completed Loans</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.completedLoans}</div>
            </div>
            <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#991b1b' }}>Overdue Loans</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.overdueLoans}</div>
            </div>
            <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#1e40af' }}>Total Clients</div>
              <div style={{ fontSize: '24px', fontWeight: '700' }}>{clients.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...styles.tableContainer, marginTop: '24px' }}>
        <div style={styles.tableHeader}>
          <h3>Download Data (Backup)</h3>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
            Download the system data as CSV files (they open directly in Excel).
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button style={styles.btnSecondary} onClick={exportClients}>
              ⬇ Clients ({clients.length})
            </button>
            <button style={styles.btnSecondary} onClick={exportLoans}>
              ⬇ Loans ({loans.length})
            </button>
            <button style={styles.btnSecondary} onClick={exportPayments}>
              ⬇ Payments ({payments.length})
            </button>
            <button style={styles.btnPrimary} onClick={exportAll}>
              ⬇ Download All (3 Files)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
