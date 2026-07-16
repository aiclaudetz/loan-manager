import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
  const { getLoansNeedingReminder } = useLoans();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const reminderCount = getLoansNeedingReminder().length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={styles.navbar}>
      <div style={styles.navbarLeft}>
        <button style={styles.menuBtn} onClick={toggleSidebar}>☰</button>
        <Link to="/" style={styles.brand}>
          <span style={styles.brandIcon}>🏦</span>
          <span>LoanManager</span>
        </Link>
      </div>
      <div style={styles.searchBox}>
        <span>🔍</span>
        <input type="text" placeholder="Search..." style={styles.searchInput} />
      </div>
      <div style={styles.navRight}>
        <Link to="/reminders" style={{ position: 'relative', textDecoration: 'none' }}>
          <button style={styles.navIcon}>🔔</button>
          {reminderCount > 0 && (
            <span style={{
              position: 'absolute', top: 2, right: 2, background: '#dc2626', color: 'white',
              borderRadius: '999px', fontSize: '10px', padding: '1px 5px', fontWeight: 700,
              lineHeight: '14px', minWidth: '16px', textAlign: 'center'
            }}>{reminderCount}</span>
          )}
        </Link>
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '4px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.fullName}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{ROLE_LABELS[currentUser.role]}</div>
            </div>
            <Link to="/change-password" title="Change Password">
              <button style={styles.navIcon}>👤</button>
            </Link>
            <button style={styles.btnSecondary} onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
