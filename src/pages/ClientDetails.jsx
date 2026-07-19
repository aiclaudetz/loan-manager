import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, loans, getClientLoanStats, getEffectiveStatus, deleteClient } = useLoans();

  const client = clients.find(c => c.id === parseInt(id));
  const clientLoans = client ? loans.filter(l => l.clientId === client.id).sort((a, b) => new Date(b.date) - new Date(a.date)) : [];
  const { totalLoans, totalDebt } = client ? getClientLoanStats(client.id) : { totalLoans: 0, totalDebt: 0 };

  if (!client) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🔍</div>
        <h3 style={styles.emptyTitle}>Client Not Found</h3>
        <p style={styles.emptyText}>The requested client does not exist</p>
        <Link to="/clients">
          <button style={styles.btnPrimary}>Back to Clients</button>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete client "${client.fullName}"?`)) return;
    // deleteClient talks to Supabase and is async — must be awaited, otherwise
    // `result` would be a pending Promise and `result.success` would always be undefined.
    const result = await deleteClient(client.id);
    if (!result.success) {
      alert(result.message);
      return;
    }
    navigate('/clients');
  };

  const statusBadge = (status) => (
    <span style={{ ...styles.badge, ...(status === 'active' ? styles.badgeActive :
      status === 'completed' ? styles.badgeCompleted :
      status === 'pending' ? styles.badgePending :
      status === 'rejected' ? styles.badgeRejected : styles.badgeOverdue) }}>
      {status === 'active' ? 'Active' :
       status === 'completed' ? 'Completed' :
       status === 'pending' ? 'Pending Approval' :
       status === 'rejected' ? 'Rejected' : 'Overdue'}
    </span>
  );

  return (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Client Details</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/clients')} style={styles.btnSecondary}>← Back</button>
          <Link to={`/clients/${client.id}/edit`}>
            <button style={styles.btnPrimary}>✏️ Edit</button>
          </Link>
          <button onClick={handleDelete} style={styles.btnDanger}>🗑️ Delete</button>
        </div>
      </div>

      <div style={styles.formContainer}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Full Name</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{client.fullName}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Status</div>
            <span style={{ ...styles.badge, ...(client.status === 'active' ? styles.badgeActive : styles.badgeInactive) }}>
              {client.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Phone</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{client.phone || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>National ID</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{client.nationalId || '—'}</div>
          </div>
          {client.address && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Address</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>{client.address}</div>
            </div>
          )}
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Total Loans</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>{totalLoans}</div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Total Debt</div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>TSh {totalDebt.toLocaleString()}</div>
          </div>
        </div>

        {client.idPhoto && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>ID Photo</div>
            <a href={client.idPhoto} target="_blank" rel="noopener noreferrer">
              <img src={client.idPhoto} alt="Client ID" style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            </a>
          </div>
        )}

        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Loans ({clientLoans.length})</h3>
            <Link to="/loans/new">
              <button style={styles.btnPrimary}>+ New Loan</button>
            </Link>
          </div>

          {clientLoans.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#64748b', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              This client has no loans yet.
            </div>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              {clientLoans.map((l, idx) => (
                <div
                  key={l.id}
                  onClick={() => navigate(`/loans/${l.id}`)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 16px', borderTop: idx === 0 ? 'none' : '1px solid #e2e8f0',
                    background: '#fff', cursor: 'pointer'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600' }}>TSh {l.amount.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>
                      {l.date} · Remaining: TSh {l.remaining.toLocaleString()}
                    </div>
                  </div>
                  {statusBadge(getEffectiveStatus(l))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
