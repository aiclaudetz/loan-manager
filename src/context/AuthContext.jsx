import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase, usernameToEmail } from '../supabaseClient';
import { useAudit } from './AuditContext';

const AuthContext = createContext();

export const ROLE_LABELS = {
  admin: 'Administrator (Admin)',
  manager: 'Manager',
  officer: 'Office Officer',
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const { logAction } = useAudit();

  const loadProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      role: data.role,
      canIssueLoans: data.can_issue_loans,
      active: data.active,
    };
  };

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('username');
    if (data) {
      setUsers(data.map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.full_name,
        role: u.role,
        canIssueLoans: u.can_issue_loans,
        active: u.active,
      })));
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setCurrentUser(profile);
        if (profile) loadUsers();
      }
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (username, password) => {
    const email = usernameToEmail(username);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      setLoginError('Incorrect username or password');
      logAction('login_failed', `Failed login attempt for username: ${username}`, null);
      return false;
    }

    const profile = await loadProfile(data.user.id);
    if (!profile) {
      setLoginError('Account found but has no profile. Contact the administrator.');
      await supabase.auth.signOut();
      return false;
    }
    if (!profile.active) {
      setLoginError('This account has been disabled. Contact the administrator.');
      logAction('login_failed', `Login attempt on a disabled account: ${profile.username}`, profile);
      await supabase.auth.signOut();
      return false;
    }

    setLoginError('');
    setCurrentUser(profile);
    loadUsers();
    logAction('login', 'Logged into the system', profile);
    return true;
  };

  const logout = async () => {
    if (currentUser) logAction('logout', 'Logged out of the system', currentUser);
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const canIssueLoans = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.role === 'officer' && currentUser.canIssueLoans;
  };

  const canApproveLoans = () => {
    if (!currentUser) return false;
    return currentUser.role === 'manager' || currentUser.role === 'admin';
  };

  const isAdmin = () => currentUser?.role === 'admin';

  const addUser = async (userData) => {
    const { data, error: err } = await supabase.functions.invoke('create-user', {
      body: {
        username: userData.username,
        password: userData.password,
        fullName: userData.fullName,
        role: userData.role,
        canIssueLoans: userData.canIssueLoans,
      },
    });
    if (err) {
      let message = err.message;
      try {
        const body = await err.context.json();
        if (body?.error) message = body.error;
      } catch (_) { /* ignore parse issues */ }
      throw new Error(message);
    }
    if (data?.error) throw new Error(data.error);

    logAction('user_created', `Added a new user: ${userData.username} (${userData.role})`, currentUser);
    await loadUsers();
    return data;
  };

  const updateUser = async (id, updates, silent) => {
    const target = users.find(u => u.id === id);
    const payload = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.canIssueLoans !== undefined) payload.can_issue_loans = updates.canIssueLoans;
    if (updates.active !== undefined) payload.active = updates.active;

    const { error } = await supabase.from('profiles').update(payload).eq('id', id);
    if (error) return { success: false, message: error.message };

    await loadUsers();
    if (currentUser?.id === id) {
      const profile = await loadProfile(id);
      setCurrentUser(profile);
    }
    if (target && !silent) logAction('user_updated', `Updated user: ${target.username}`, currentUser);
    return { success: true };
  };

  const deleteUser = async (id) => {
    const target = users.find(u => u.id === id);
    const { error } = await supabase.from('profiles').update({ active: false }).eq('id', id);
    if (error) return { success: false, message: error.message };
    await loadUsers();
    if (target) logAction('user_deleted', `Deactivated user: ${target.username}`, currentUser);
    return { success: true };
  };

  const changePassword = async (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters' };
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(currentUser.username),
      password: currentPassword,
    });
    if (verifyError) return { success: false, message: 'Current password is incorrect' };

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, message: error.message };

    logAction('password_changed', 'Changed their password', currentUser);
    return { success: true, message: 'Password changed successfully' };
  };

  return (
    <AuthContext.Provider value={{
      users,
      currentUser,
      loginError,
      authLoading,
      login,
      logout,
      canIssueLoans,
      canApproveLoans,
      isAdmin,
      addUser,
      updateUser,
      deleteUser,
      changePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
