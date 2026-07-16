import React from 'react';
import { Navigate } from 'react-router-dom';
import styles from '../styles';
import { useAuth } from '../context/AuthContext';

// roles: list of roles allowed to view this page (leave empty to allow all logged-in users)
const ProtectedRoute = ({ children, roles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(currentUser.role)) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🚫</div>
        <h3 style={styles.emptyTitle}>Access Denied</h3>
        <p style={styles.emptyText}>You do not have permission to view this page.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
