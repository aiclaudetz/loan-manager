import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoanProvider } from './context/LoanContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuditProvider } from './context/AuditContext';
import styles from './styles';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ChangePassword from './pages/ChangePassword';
import Users from './pages/Users';
import AuditLog from './pages/AuditLog';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import NewClient from './pages/NewClient';
import EditClient from './pages/EditClient';
import Loans from './pages/Loans';
import NewLoan from './pages/NewLoan';
import LoanDetails from './pages/LoanDetails';
import EditLoan from './pages/EditLoan';
import Reminders from './pages/Reminders';
import Payments from './pages/Payments';
import NewPayment from './pages/NewPayment';
import EditPayment from './pages/EditPayment';
import Reports from './pages/Reports';

// Page layout with Navbar + Sidebar (used after logging in)
const AppLayout = ({ children, sidebarOpen, setSidebarOpen }) => (
  <div style={styles.app}>
    <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
    <div style={styles.mainWrapper}>
      <Sidebar isOpen={sidebarOpen} />
      <div style={{
        ...styles.contentArea,
        ...(sidebarOpen ? styles.contentExpanded : styles.contentCollapsed)
      }}>
        {children}
      </div>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <LoanProvider>
      <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<NewClient />} />
          <Route path="/clients/:id/edit" element={<EditClient />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/new" element={<NewLoan />} />
          <Route path="/loans/:id" element={<LoanDetails />} />
          <Route path="/loans/:id/edit" element={<EditLoan />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payments/new" element={<NewPayment />} />
          <Route path="/payments/:id/edit" element={<EditPayment />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute roles={['admin', 'manager']}>
                <AuditLog />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppLayout>
    </LoanProvider>
  );
};

const App = () => (
  <AuditProvider>
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
    </AuthProvider>
  </AuditProvider>
);

export default App;
