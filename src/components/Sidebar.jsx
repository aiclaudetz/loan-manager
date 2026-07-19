import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../styles';
import { useLoans } from '../context/LoanContext';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, isMobile, onNavigate }) => {
  const { getLoansNeedingReminder, loans } = useLoans();
  const { canApproveLoans, isAdmin } = useAuth();
  const reminderCount = getLoansNeedingReminder().length;
  const pendingCount = loans.filter(l => l.status === 'pending').length;

  const items = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/clients', icon: '👤', label: 'Clients' },
    { path: '/loans', icon: '💰', label: 'Loans', badge: canApproveLoans() ? pendingCount : 0 },
    { path: '/payments', icon: '💳', label: 'Payments' },
    { path: '/reminders', icon: '🔔', label: 'Reminders', badge: reminderCount },
    { path: '/reports', icon: '📈', label: 'Reports' },
    ...(canApproveLoans() ? [{ path: '/audit-log', icon: '📝', label: 'Audit Log' }] : []),
    ...(isAdmin() ? [{ path: '/users', icon: '🛠️', label: 'Users' }] : []),
  ];

  // On mobile the sidebar is always full-width, either off-screen or slid in.
  // On desktop it stays as the icon-rail-that-expands behavior it always had.
  const wrapperStyle = isMobile
    ? { ...styles.sidebar, ...(isOpen ? styles.sidebarMobile : styles.sidebarMobileClosed) }
    : { ...styles.sidebar, ...(isOpen ? {} : styles.sidebarClosed) };
  const showLabels = isMobile ? isOpen : isOpen;

  return (
    <div style={wrapperStyle}>
      <nav style={styles.sidebarNav}>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            style={({ isActive }) => ({
              ...styles.sidebarLink,
              ...(isActive ? styles.sidebarLinkActive : {})
            })}
          >
            <span style={styles.sidebarIcon}>{item.icon}</span>
            {showLabels && <span style={{ flex: 1 }}>{item.label}</span>}
            {showLabels && !!item.badge && (
              <span style={{
                background: '#dc2626', color: 'white', borderRadius: '999px',
                fontSize: '11px', padding: '2px 7px', fontWeight: 700
              }}>{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
