import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';

const Navbar = ({ toggleSidebar, isMobile }) => {
  const { getLoansNeedingReminder } = useLoans();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const reminderCount = getLoansNeedingReminder().length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ ...styles.navbar, ...(isMobile ? styles.navbarMobile : {}) }}>
      <div style={styles.navbarLeft}>
        <button style={styles.menuBtn} onClick={toggleSidebar}>☰</button>
        <Link to="/" style={{ ...styles.brand, ...(isMobile ? styles.brandMobile : {}) }}>
          <span style={styles.brandIcon}>🏦</span>
          {!isMobile && <span>LoanManager</span>}
        </Link>
      </div>
      {/* Search bar hidden on small screens to keep the header uncluttered */}
      {!isMobile && (
        <div style={styles.searchBox}>
          <span>🔍</span>
          <input type="text" placeholder="Search..." style={styles.searchInput} />
        </div>
      )}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '10px', marginLeft: '4px' }}>
            {/* Name/role text hidden on mobile to save space — still visible via Change Password page */}
            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '13px', fontWeight: '600' }}>{currentUser.fullName}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{ROLE_LABELS[currentUser.role]}</div>
              </div>
            )}
            <Link to="/change-password" title="Change Password">
              <button style={styles.navIcon}>👤</button>
            </Link>
            <button
              title="Logout"
              style={isMobile ? { ...styles.btnSecondary, padding: '8px 12px', fontSize: '13px' } : styles.btnSecondary}
              onClick={handleLogout}
            >
              {isMobile ? '⏻' : 'Logout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
