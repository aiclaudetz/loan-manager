import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import styles from '../styles';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, loginError, currentUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (currentUser) return <Navigate to="/" replace />;

  const handleSubmit = (e) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f1f5f9',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{ ...styles.formContainer, maxWidth: '380px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px' }}>🏦</div>
          <h1 style={{ margin: '8px 0 4px', fontSize: '22px' }}>LoanManager</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Sign in to your account</p>
        </div>

        {loginError && <div style={{ ...styles.alert, ...styles.alertDanger }}>{loginError}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Username</label>
            <input
              type="text"
              required
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.formInput}
              placeholder="e.g. admin"
            />
          </div>
          <div style={{ ...styles.formGroup, marginTop: '16px' }}>
            <label style={styles.formLabel}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.formInput}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', marginTop: '24px' }}>
            Login
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '12px', color: '#64748b' }}>
          <strong>Test accounts:</strong><br />
          Admin: admin / admin123<br />
          Manager: meneja / meneja123<br />
          Officer: ofisi1 / ofisi123
        </div>
      </div>
    </div>
  );
};

export default Login;
