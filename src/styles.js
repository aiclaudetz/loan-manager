// ============================================
// STYLES - CSS in JSX
// ============================================
const styles = {
  // Global
  app: {
    minHeight: '100vh',
    background: '#f1f5f9',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    color: '#1e293b'
  },
  mainWrapper: {
    display: 'flex',
    marginTop: '70px',
    width: '100%',
    maxWidth: '100vw',
    overflowX: 'hidden'
  },
  contentArea: {
    flex: 1,
    minWidth: 0, // allows flex child to shrink below its content's natural width
    padding: '24px',
    transition: 'all 0.3s ease',
    marginLeft: '0'
  },
  contentExpanded: {
    marginLeft: '250px'
  },
  contentCollapsed: {
    marginLeft: '70px'
  },
  contentMobile: {
    marginLeft: 0,
    padding: '16px'
  },
  // Semi-transparent overlay shown behind the sidebar drawer on mobile
  sidebarBackdrop: {
    position: 'fixed',
    top: '70px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.45)',
    zIndex: 998
  },
  
  // Navbar
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '70px',
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 1000
  },
  navbarMobile: {
    padding: '0 12px'
  },
  navbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    minWidth: 0
  },
  menuBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    fontSize: '20px',
    fontWeight: '700',
    color: '#2563eb',
    whiteSpace: 'nowrap'
  },
  brandMobile: {
    fontSize: '16px'
  },
  brandIcon: {
    fontSize: '28px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: '#f1f5f9',
    borderRadius: '8px',
    padding: '8px 14px',
    gap: '8px',
    flex: 1,
    minWidth: 0,
    maxWidth: '500px',
    margin: '0 24px'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '14px',
    width: '100%',
    color: '#1e293b'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  navIcon: {
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    transition: 'all 0.2s'
  },
  
  // Sidebar
  sidebar: {
    position: 'fixed',
    top: '70px',
    left: 0,
    bottom: 0,
    width: '250px',
    background: 'white',
    boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
    transition: 'all 0.3s ease',
    overflowY: 'auto',
    zIndex: 999
  },
  sidebarClosed: {
    width: '70px'
  },
  // Mobile: sidebar is a full-width drawer that slides in/out over the
  // content (instead of shrinking to an icon rail like on desktop).
  sidebarMobile: {
    width: '250px',
    transform: 'translateX(0)',
    boxShadow: '4px 0 16px rgba(0,0,0,0.15)'
  },
  sidebarMobileClosed: {
    width: '250px',
    transform: 'translateX(-100%)',
    boxShadow: 'none'
  },
  sidebarNav: {
    padding: '16px 0'
  },
  sidebarLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 24px',
    textDecoration: 'none',
    color: '#64748b',
    transition: 'all 0.2s',
    borderRadius: '8px',
    margin: '4px 12px'
  },
  sidebarLinkActive: {
    background: '#dbeafe',
    color: '#2563eb',
    fontWeight: '600'
  },
  sidebarIcon: {
    fontSize: '20px',
    minWidth: '24px'
  },
  
  // Dashboard
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '24px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    background: 'white',
    padding: '20px 24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  statIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    flexShrink: 0
  },
  statInfo: {
    flex: 1
  },
  statLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    marginBottom: '4px'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: '700'
  },
  
  // Table
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    marginTop: '20px'
  },
  tableHeader: {
    padding: '16px 24px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  // Wraps the raw <table> so it scrolls sideways on narrow screens
  // instead of squeezing every column unreadably thin.
  tableScroll: {
    width: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch'
  },
  table: {
    width: '100%',
    minWidth: '640px', // forces horizontal scroll instead of column-crushing on phones
    borderCollapse: 'collapse'
  },
  tableHead: {
    background: '#f1f5f9'
  },
  tableTh: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: '#64748b'
  },
  tableTd: {
    padding: '12px 16px',
    borderTop: '1px solid #e2e8f0',
    fontSize: '14px'
  },
  
  // Buttons
  btnPrimary: {
    background: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px'
  },
  btnSecondary: {
    background: '#e2e8f0',
    color: '#334155',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnSuccess: {
    background: '#16a34a',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnDanger: {
    background: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  
  // Forms
  formContainer: {
    background: 'white',
    padding: '32px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    maxWidth: '800px',
    width: '100%',
    margin: '0 auto'
  },
  formContainerMobile: {
    padding: '20px 16px'
  },
  formGrid: {
    display: 'grid',
    // auto-fit + minmax naturally collapses to a single column once the
    // container is too narrow for two 240px columns — no JS needed.
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569'
  },
  formInput: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    background: 'white',
    color: '#1e293b'
  },
  formSelect: {
    padding: '10px 14px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s',
    background: 'white',
    color: '#1e293b'
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid #e2e8f0',
    flexWrap: 'wrap'
  },
  
  // Status Badge
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    display: 'inline-block'
  },
  badgeActive: {
    background: '#dcfce7',
    color: '#166534'
  },
  badgeInactive: {
    background: '#fee2e2',
    color: '#991b1b'
  },
  badgePending: {
    background: '#fef3c7',
    color: '#92400e'
  },
  badgeCompleted: {
    background: '#dbeafe',
    color: '#1e40af'
  },
  badgeOverdue: {
    background: '#fecaca',
    color: '#991b1b'
  },
  badgeRejected: {
    background: '#f1f5f9',
    color: '#475569'
  },
  
  // Search
  searchContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  searchInput2: {
    flex: 1,
    padding: '10px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white'
  },
  
  // Loan Summary
  loanSummary: {
    margin: '24px 0',
    padding: '20px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginTop: '12px'
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#64748b'
  },
  summaryValue: {
    fontSize: '18px',
    fontWeight: '700'
  },
  summaryHighlight: {
    color: '#2563eb'
  },
  
  // Alert
  alert: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontWeight: '500'
  },
  alertSuccess: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac'
  },
  alertDanger: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5'
  },
  
  // Page Header
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  
  // Action Icons
  actionIcon: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s'
  },
  
  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px'
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '20px',
    marginBottom: '8px'
  },
  emptyText: {
    color: '#64748b',
    marginBottom: '16px'
  },
  
  // Pagination
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '16px'
  },
  pageBtn: {
    padding: '8px 16px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    background: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  pageInfo: {
    fontSize: '14px',
    color: '#64748b'
  }
};


export default styles;
