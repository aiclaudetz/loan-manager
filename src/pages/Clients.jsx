import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';

const Clients = () => {
  const navigate = useNavigate();
  const { clients, deleteClient, getClientLoanStats } = useLoans();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (client) => {
    if (!window.confirm(`Are you sure you want to delete client "${client.fullName}"?`)) return;
    // deleteClient talks to Supabase and is async — must be awaited, otherwise
    // `result` would be a pending Promise and `result.success` would always be undefined.
    const result = await deleteClient(client.id);
    if (!result.success) {
      alert(result.message);
    }
  };

  const filtered = clients.filter(c =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.nationalId.includes(searchTerm)
  );

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Clients</h1>
        <Link to="/clients/new">
          <button style={styles.btnPrimary}>➕ New Client</button>
        </Link>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by Name, Phone or National ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput2}
        />
      </div>

      <div style={styles.tableContainer}>
        <div style={styles.tableScroll}>
        <table style={styles.table}>
          <thead style={styles.tableHead}>
            <tr>
              <th style={styles.tableTh}>#</th>
              <th style={styles.tableTh}>Name</th>
              <th style={styles.tableTh}>Phone</th>
              <th style={styles.tableTh}>National ID</th>
              <th style={styles.tableTh}>ID Photo</th>
              <th style={styles.tableTh}>Loans</th>
              <th style={styles.tableTh}>Debt</th>
              <th style={styles.tableTh}>Status</th>
              <th style={styles.tableTh}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((client, i) => {
              const { totalLoans, totalDebt } = getClientLoanStats(client.id);
              return (
              <tr key={client.id} onClick={() => navigate(`/clients/${client.id}`)} style={{ cursor: 'pointer' }}>
                <td style={styles.tableTd}>{i + 1}</td>
                <td style={styles.tableTd}>{client.fullName}</td>
                <td style={styles.tableTd}>{client.phone}</td>
                <td style={styles.tableTd}>{client.nationalId}</td>
                <td style={styles.tableTd}>
                  {client.idPhoto ? (
                    <img src={client.idPhoto} alt="ID Photo" style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>None</span>
                  )}
                </td>
                <td style={styles.tableTd}>{totalLoans}</td>
                <td style={styles.tableTd}>TSh {totalDebt.toLocaleString()}</td>
                <td style={styles.tableTd}>
                  <span style={{ ...styles.badge, ...(client.status === 'active' ? styles.badgeActive : styles.badgeInactive) }}>
                    {client.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={styles.tableTd} onClick={(e) => e.stopPropagation()}>
                  <Link to={`/clients/${client.id}/edit`}>
                    <button style={styles.actionIcon} title="Edit">✏️</button>
                  </Link>
                  <button style={styles.actionIcon} title="Delete" onClick={() => handleDelete(client)}>🗑️</button>
                </td>
              </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="9" style={{ ...styles.tableTd, textAlign: 'center' }}>
                  No clients found
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default Clients;
