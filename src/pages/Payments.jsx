import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';

const Payments = () => {
  const { payments, loans, deletePayment } = useLoans();

  const rows = payments.map(p => {
    const loan = loans.find(l => l.id === p.loanId);
    return { ...p, clientName: loan ? loan.clientName : '—' };
  });

  const handleDelete = (payment) => {
    if (window.confirm(`Are you sure you want to delete the payment of TSh ${payment.amount.toLocaleString()} for "${payment.clientName}"?`)) {
      deletePayment(payment.id);
    }
  };

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Payments</h1>
        <Link to="/payments/new">
          <button style={styles.btnPrimary}>➕ Record Payment</button>
        </Link>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableTh}>#</th>
              <th style={styles.tableTh}>Client</th>
              <th style={styles.tableTh}>Amount</th>
              <th style={styles.tableTh}>Method</th>
              <th style={styles.tableTh}>Date</th>
              <th style={styles.tableTh}>Status</th>
              <th style={styles.tableTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr key={p.id}>
                <td style={styles.tableTd}>{i + 1}</td>
                <td style={styles.tableTd}>{p.clientName}</td>
                <td style={styles.tableTd}>
                  TSh {p.amount.toLocaleString()}
                  {p.penaltyAmount > 0 && (
                    <div style={{ fontSize: '12px', color: '#dc2626' }}>
                      + Penalty TSh {p.penaltyAmount.toLocaleString()}
                    </div>
                  )}
                </td>
                <td style={styles.tableTd}>{p.method}</td>
                <td style={styles.tableTd}>{p.date}</td>
                <td style={styles.tableTd}>
                  <span style={{ ...styles.badge, ...styles.badgeCompleted }}>Paid</span>
                </td>
                <td style={styles.tableTd}>
                  <Link to={`/payments/${p.id}/edit`}>
                    <button style={styles.actionIcon} title="Edit">✏️</button>
                  </Link>
                  <button style={styles.actionIcon} title="Delete" onClick={() => handleDelete(p)}>🗑️</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="7" style={{ ...styles.tableTd, textAlign: 'center' }}>
                  No payments recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
