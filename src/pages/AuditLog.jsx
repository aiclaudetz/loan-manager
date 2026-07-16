import React, { useState } from 'react';
import styles from '../styles';
import { useAudit, ACTION_LABELS } from '../context/AuditContext';
import { arrayToCSV, downloadCSV, todayStamp } from '../utils/utils';

// Badge color for each action type, so it's easy to identify quickly
const ACTION_COLORS = {
  login: { bg: '#dcfce7', color: '#166534' },
  login_failed: { bg: '#fee2e2', color: '#991b1b' },
  logout: { bg: '#f1f5f9', color: '#475569' },
  password_changed: { bg: '#e0e7ff', color: '#3730a3' },
  user_created: { bg: '#dbeafe', color: '#1e40af' },
  user_updated: { bg: '#fef3c7', color: '#92400e' },
  user_deleted: { bg: '#fee2e2', color: '#991b1b' },
  client_created: { bg: '#dbeafe', color: '#1e40af' },
  client_updated: { bg: '#fef3c7', color: '#92400e' },
  client_deleted: { bg: '#fee2e2', color: '#991b1b' },
  loan_created: { bg: '#dbeafe', color: '#1e40af' },
  loan_approved: { bg: '#dcfce7', color: '#166534' },
  loan_rejected: { bg: '#fee2e2', color: '#991b1b' },
  loan_updated: { bg: '#fef3c7', color: '#92400e' },
  loan_deleted: { bg: '#fee2e2', color: '#991b1b' },
  payment_added: { bg: '#dcfce7', color: '#166534' },
  payment_updated: { bg: '#fef3c7', color: '#92400e' },
  payment_deleted: { bg: '#fee2e2', color: '#991b1b' },
  settings_updated: { bg: '#e0e7ff', color: '#3730a3' },
};

const formatTimestamp = (iso) => {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
};

const AuditLog = () => {
  const { logs } = useAudit();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const actionOptions = Object.keys(ACTION_LABELS);

  const filtered = logs.filter((l) => {
    const matchesAction = actionFilter === 'all' || l.action === actionFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      l.username.toLowerCase().includes(term) ||
      l.fullName.toLowerCase().includes(term) ||
      l.details.toLowerCase().includes(term);
    return matchesAction && matchesSearch;
  });

  const exportLogs = () => {
    const csv = arrayToCSV(filtered, [
      { key: 'timestamp', label: 'Date/Time' },
      { key: 'username', label: 'Username' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'role', label: 'Role' },
      { key: 'action', label: 'Action' },
      { key: 'details', label: 'Details' },
    ]);
    downloadCSV(`audit-log-${todayStamp()}.csv`, csv);
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Activity Log (Audit Log)</h1>
        <button style={styles.btnSecondary} onClick={exportLogs}>
          ⬇ Download CSV ({filtered.length})
        </button>
      </div>

      <div style={{ ...styles.searchContainer, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by user or details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...styles.searchInput2, flex: 1, minWidth: '220px' }}
        />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ ...styles.formSelect, maxWidth: '260px' }}
        >
          <option value="all">All Actions</option>
          {actionOptions.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableTh}>Date/Time</th>
              <th style={styles.tableTh}>User</th>
              <th style={styles.tableTh}>Role</th>
              <th style={styles.tableTh}>Action</th>
              <th style={styles.tableTh}>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => {
              const colors = ACTION_COLORS[log.action] || { bg: '#f1f5f9', color: '#475569' };
              return (
                <tr key={log.id}>
                  <td style={{ ...styles.tableTd, whiteSpace: 'nowrap' }}>{formatTimestamp(log.timestamp)}</td>
                  <td style={styles.tableTd}>
                    {log.fullName}
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>@{log.username}</div>
                  </td>
                  <td style={styles.tableTd}>{log.role}</td>
                  <td style={styles.tableTd}>
                    <span style={{ ...styles.badge, background: colors.bg, color: colors.color }}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td style={styles.tableTd}>{log.details}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" style={{ ...styles.tableTd, textAlign: 'center' }}>
                  No matching records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
        These records show activity since you opened the app (not yet stored permanently -
        they will be lost if you close the page until the system is connected to a database).
      </p>
    </div>
  );
};

export default AuditLog;
