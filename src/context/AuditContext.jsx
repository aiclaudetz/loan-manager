import React, { useState, useRef, createContext, useContext } from 'react';

const AuditContext = createContext();

// Action display names, for showing on the Audit Log page
export const ACTION_LABELS = {
  login: 'Logged In',
  login_failed: 'Login Failed',
  logout: 'Logged Out',
  password_changed: 'Password Changed',
  user_created: 'User Added',
  user_updated: 'User Updated',
  user_deleted: 'User Deleted',
  client_created: 'Client Added',
  client_updated: 'Client Updated',
  client_deleted: 'Client Deleted',
  loan_created: 'Loan Requested',
  loan_approved: 'Loan Approved',
  loan_rejected: 'Loan Rejected',
  loan_updated: 'Loan Updated',
  loan_deleted: 'Loan Deleted',
  payment_added: 'Payment Added',
  payment_updated: 'Payment Updated',
  payment_deleted: 'Payment Deleted',
  settings_updated: 'Settings Updated',
};

export const AuditProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  // ID counter that always increases - even after deleting old records (if that gets added later)
  const idCounter = useRef(1);

  // actor: the current user object (from useAuth -> currentUser), can be null (e.g. a failed login attempt)
  const logAction = (action, details, actor) => {
    const entry = {
      id: idCounter.current++,
      timestamp: new Date().toISOString(),
      userId: actor?.id ?? null,
      username: actor?.username ?? 'Unknown',
      fullName: actor?.fullName ?? '-',
      role: actor?.role ?? '-',
      action,
      details: details || '',
    };
    setLogs(prev => [entry, ...prev]);
    return entry;
  };

  return (
    <AuditContext.Provider value={{ logs, logAction }}>
      {children}
    </AuditContext.Provider>
  );
};

export const useAudit = () => {
  const context = useContext(AuditContext);
  if (!context) throw new Error('useAudit must be used within AuditProvider');
  return context;
};
