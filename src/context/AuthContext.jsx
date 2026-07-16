import React, { useState, createContext, useContext } from 'react';
import { useAudit } from './AuditContext';

const AuthContext = createContext();

const nextId = (items) => items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

// Mock users. In a real system this would come from a backend/database.
const INITIAL_USERS = [
  { id: 1, username: 'admin', password: 'admin123', fullName: 'Chief Administrator', role: 'admin', canIssueLoans: true, active: true },
  { id: 2, username: 'meneja', password: 'meneja123', fullName: 'Loan Manager', role: 'manager', canIssueLoans: false, active: true },
  { id: 3, username: 'ofisi1', password: 'ofisi123', fullName: 'Office Officer', role: 'officer', canIssueLoans: true, active: true },
];

// Role display names
export const ROLE_LABELS = {
  admin: 'Administrator (Admin)',
  manager: 'Manager',
  officer: 'Office Officer',
};

export const AuthProvider = ({ children }) => {
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const { logAction } = useAudit();

  const login = (username, password) => {
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    if (!user) {
      setLoginError('Incorrect username or password');
      logAction('login_failed', `Failed login attempt for username: ${username}`, null);
      return false;
    }
    if (!user.active) {
      setLoginError('This account has been disabled. Contact the administrator.');
      logAction('login_failed', `Login attempt on a disabled account: ${user.username}`, user);
      return false;
    }
    setLoginError('');
    setCurrentUser(user);
    logAction('login', 'Logged into the system', user);
    return true;
  };

  const logout = () => {
    if (currentUser) logAction('logout', 'Logged out of the system', currentUser);
    setCurrentUser(null);
  };

  // Is the current user allowed to issue/create a loan?
  // Only Admin and an Officer with permission (canIssueLoans) are allowed
  const canIssueLoans = () => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.role === 'officer' && currentUser.canIssueLoans;
  };

  // Only Manager and Admin are allowed to approve/reject loans
  const canApproveLoans = () => {
    if (!currentUser) return false;
    return currentUser.role === 'manager' || currentUser.role === 'admin';
  };

  const isAdmin = () => currentUser?.role === 'admin';

  const addUser = (userData) => {
    const newUser = {
      id: nextId(users),
      active: true,
      canIssueLoans: userData.role === 'officer' ? !!userData.canIssueLoans : userData.role === 'admin',
      ...userData,
    };
    setUsers(prev => [newUser, ...prev]);
    logAction('user_created', `Added user: ${newUser.username} (${ROLE_LABELS[newUser.role] || newUser.role})`, currentUser);
    return newUser;
  };

  const updateUser = (id, updates, silent) => {
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
    if (currentUser?.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    if (target && !silent) logAction('user_updated', `Updated user: ${target.username}`, currentUser);
  };

  const deleteUser = (id) => {
    const target = users.find(u => u.id === id);
    setUsers(prev => prev.filter(u => u.id !== id));
    if (target) logAction('user_deleted', `Deleted user: ${target.username}`, currentUser);
  };

  // The user changes their own password
  const changePassword = (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, message: 'Not logged in' };
    if (currentUser.password !== currentPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }
    if (!newPassword || newPassword.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters/digits' };
    }
    updateUser(currentUser.id, { password: newPassword }, true);
    logAction('password_changed', 'Changed their password', currentUser);
    return { success: true, message: 'Password changed successfully' };
  };

  return (
    <AuthContext.Provider value={{
      users,
      currentUser,
      loginError,
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
