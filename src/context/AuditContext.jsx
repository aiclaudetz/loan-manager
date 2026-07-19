import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuditContext = createContext();

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

  const loadLogs = async () => {
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(500);
    if (data) {
      setLogs(data.map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        userId: l.user_id,
        username: l.username,
        fullName: l.full_name,
        role: l.role,
        action: l.action,
        details: l.details,
      })));
    }
  };

  useEffect(() => { loadLogs(); }, []);

  // actor: profile object kutoka AuthContext (currentUser), inaweza kuwa null
  const logAction = async (action, details, actor) => {
    const entry = {
      user_id: actor?.id ?? null,
      username: actor?.username ?? 'Unknown',
      full_name: actor?.fullName ?? '-',
      role: actor?.role ?? '-',
      action,
      details: details || '',
    };
    const { data } = await supabase.from('audit_logs').insert(entry).select().single();
    if (data) {
      setLogs(prev => [{
        id: data.id,
        timestamp: data.timestamp,
        userId: data.user_id,
        username: data.username,
        fullName: data.full_name,
        role: data.role,
        action: data.action,
        details: data.details,
      }, ...prev]);
    }
    return data;
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
