import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { LoanProvider } from './context/LoanContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuditProvider } from './context/AuditContext';
import { useIsMobile } from './hooks/useIsMobile';
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
import ClientDetails from './pages/ClientDetails';
import NewClient from './pages/NewClient';
import EditClient from './pages/EditClient';
import Loans from './pages/Loans';
import NewLoan from './pages/NewLoan';
import LoanDetails from './pages/LoanDetails';
import EditLoan from './pages/EditLoan';
import Reminders from './pages/Reminders';
import Payments from './pages/Payments';
import PaymentDetails from './pages/PaymentDetails';
import NewPayment from './pages/NewPayment';
import EditPayment from './pages/EditPayment';
import Reports from './pages/Reports';

// Page layout with Navbar + Sidebar (used after logging in)
const AppLayout = ({ children, sidebarOpen, setSidebarOpen, isMobile }) => (
  <div style={styles.app}>
    <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} isMobile={isMobile} />
    <div style={styles.mainWrapper}>
      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onNavigate={() => isMobile && setSidebarOpen(false)}
      />
      {/* On mobile the sidebar overlays the content, so tapping outside it closes it */}
      {isMobile && sidebarOpen && (
        <div style={styles.sidebarBackdrop} onClick={() => setSidebarOpen(false)} />
      )}
      <div style={{
        ...styles.contentArea,
        ...(isMobile ? styles.contentMobile : (sidebarOpen ? styles.contentExpanded : styles.contentCollapsed))
      }}>
        {children}
      </div>
    </div>
  </div>
);

const AuthenticatedApp = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 900 : true);
  const { currentUser } = useAuth();
  const location = useLocation();

  // Close the drawer automatically after navigating to a new page on mobile
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  if (!currentUser) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <LoanProvider>
      <AppLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<NewClient />} />
          <Route path="/clients/:id" element={<ClientDetails />} />
          <Route path="/clients/:id/edit" element={<EditClient />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/new" element={<NewLoan />} />
          <Route path="/loans/:id" element={<LoanDetails />} />
          <Route path="/loans/:id/edit" element={<EditLoan />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/payments/new" element={<NewPayment />} />
          <Route path="/payments/:id" element={<PaymentDetails />} />
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
