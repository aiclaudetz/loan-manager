import React, { useState, useEffect, createContext, useContext } from 'react';
import { getDueDate, isLoanOverdue, getEffectiveStatus, getOverdueDays, getPenaltyAmount, getTotalOwed, getOutstandingPenalty, REMINDER_WINDOW_DAYS } from '../utils/utils';
import { useAudit } from './AuditContext';
import { useAuth } from './AuthContext';

const LoanContext = createContext();

// Generate a new ID that won't collide with existing ones, instead of relying on list length
// (which can cause ID collisions after deleting a record in the middle)
const nextId = (items) => items.reduce((max, item) => Math.max(max, item.id), 0) + 1;

export const LoanProvider = ({ children }) => {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logAction } = useAudit();
  const { currentUser } = useAuth();
  // Limit on active (incomplete) loans per client - admin can change this
  const [loanLimitPerClient, setLoanLimitPerClient] = useState(3);
  // Late penalty rate per day (percentage of remaining amount) - admin can change this
  const [penaltyRatePerDay, setPenaltyRatePerDay] = useState(1);

  // Mock data - in place of an API
  useEffect(() => {
    const mockData = {
      clients: [
        { id: 1, fullName: 'John Doe', phone: '0712345678', nationalId: '123456789', status: 'active' },
        { id: 2, fullName: 'Jane Smith', phone: '0723456789', nationalId: '987654321', status: 'active' },
        { id: 3, fullName: 'Peter Johnson', phone: '0734567890', nationalId: '456789123', status: 'inactive' },
        { id: 4, fullName: 'Mary Williams', phone: '0745678901', nationalId: '789123456', status: 'active' },
      ],
      loans: [
        { id: 1, clientId: 1, clientName: 'John Doe', amount: 1000000, interestRate: 5, duration: 30, status: 'active', purpose: 'Business', date: '2026-01-15', totalPayable: 1050000, paid: 300000, remaining: 750000 },
        { id: 2, clientId: 2, clientName: 'Jane Smith', amount: 500000, interestRate: 4, duration: 15, status: 'active', purpose: 'Education', date: '2026-02-01', totalPayable: 520000, paid: 200000, remaining: 320000 },
        { id: 3, clientId: 3, clientName: 'Peter Johnson', amount: 2000000, interestRate: 6, duration: 45, status: 'overdue', purpose: 'Construction', date: '2025-11-15', totalPayable: 2120000, paid: 500000, remaining: 1620000 },
        { id: 4, clientId: 4, clientName: 'Mary Williams', amount: 750000, interestRate: 5, duration: 20, status: 'completed', purpose: 'Medical', date: '2025-12-01', totalPayable: 787500, paid: 787500, remaining: 0 },
        { id: 5, clientId: 1, clientName: 'John Doe', amount: 1500000, interestRate: 5.5, duration: 30, status: 'pending', purpose: 'Business', date: '2026-03-01', totalPayable: 1582500, paid: 0, remaining: 1582500 },
      ],
      payments: [
        { id: 1, loanId: 1, amount: 300000, date: '2026-01-25', method: 'M-Pesa', reference: 'MP001' },
        { id: 2, loanId: 2, amount: 200000, date: '2026-02-10', method: 'Cash', reference: 'CS001' },
        { id: 3, loanId: 3, amount: 500000, date: '2025-12-01', method: 'Bank', reference: 'BK001' },
        { id: 4, loanId: 4, amount: 787500, date: '2026-01-20', method: 'M-Pesa', reference: 'MP002' },
      ]
    };

    setClients(mockData.clients);
    setLoans(mockData.loans);
    setPayments(mockData.payments);
    setLoading(false);
  }, []);

  // Calculate a client's loan count and debt directly from actual loans
  // (instead of maintaining a separate number that could drift out of sync)
  const getClientLoanStats = (clientId) => {
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const totalLoans = clientLoans.length;
    // Rejected loans aren't counted in the debt because they never became active
    const totalDebt = clientLoans.reduce((sum, l) => sum + (l.status === 'rejected' ? 0 : l.remaining), 0);
    return { totalLoans, totalDebt };
  };

  // Number of a client's loans that are not yet completed (active/pending/overdue)
  // This is used to warn about the risk of too many loans for a single client
  const getClientActiveLoanCount = (clientId) => {
    return loans.filter(l =>
      l.clientId === clientId && ['active', 'pending', 'overdue'].includes(getEffectiveStatus(l))
    ).length;
  };

  const getLoanStats = () => {
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => getEffectiveStatus(l) === 'active').length;
    const totalAmount = loans.reduce((sum, l) => sum + l.amount, 0);
    const overdueLoans = loans.filter(l => getEffectiveStatus(l) === 'overdue').length;
    const recoveredAmount = loans.reduce((sum, l) => sum + l.paid, 0);
    const totalPenalties = loans.reduce((sum, l) => sum + getOutstandingPenalty(l, penaltyRatePerDay), 0);

    return { totalLoans, activeLoans, totalAmount, overdueLoans, recoveredAmount, totalPenalties };
  };

  // Late penalty for a single loan, based on the system-wide rate (or that loan's specific rate)
  const getLoanPenalty = (loan) => getPenaltyAmount(loan, penaltyRatePerDay);

  // Penalty not yet collected (after subtracting what's already been paid)
  const getLoanOutstandingPenalty = (loan) => getOutstandingPenalty(loan, penaltyRatePerDay);

  // Total amount owed on the loan including the late penalty
  const getLoanTotalOwed = (loan) => getTotalOwed(loan, penaltyRatePerDay);

  // Get loans that need a reminder: overdue or approaching the deadline within a few days
  const getLoansNeedingReminder = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return loans
      .filter(l => l.status !== 'completed' && l.status !== 'pending' && l.remaining > 0)
      .map(l => {
        const due = getDueDate(l);
        const daysUntilDue = Math.round((due - today) / (1000 * 60 * 60 * 24));
        return { ...l, daysUntilDue };
      })
      .filter(l => l.daysUntilDue <= REMINDER_WINDOW_DAYS)
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);
  };

  const addLoan = (loanData) => {
    const newLoan = {
      id: nextId(loans),
      ...loanData,
      status: 'pending',
      paid: 0,
      remaining: loanData.amount,
      date: new Date().toISOString().split('T')[0]
    };
    setLoans([newLoan, ...loans]);
    logAction('loan_created', `Requested a loan of TSh ${Number(newLoan.amount).toLocaleString()} for ${newLoan.clientName}`, currentUser);
    return newLoan;
  };

  // Manager/Admin approves a 'pending' loan - this is when the loan officially starts
  const approveLoan = (id, approvedBy) => {
    const loan = loans.find(l => l.id === id);
    setLoans(prev => prev.map(loan =>
      loan.id === id && loan.status === 'pending'
        ? { ...loan, status: 'active', approvedBy, approvedDate: new Date().toISOString().split('T')[0] }
        : loan
    ));
    if (loan) logAction('loan_approved', `Approved loan #${id} for ${loan.clientName} (TSh ${Number(loan.amount).toLocaleString()})`, currentUser);
  };

  // Manager/Admin rejects a 'pending' loan - it never becomes active, it stays 'rejected'
  const rejectLoan = (id, rejectedBy, reason) => {
    const loan = loans.find(l => l.id === id);
    setLoans(prev => prev.map(loan =>
      loan.id === id && loan.status === 'pending'
        ? { ...loan, status: 'rejected', rejectedBy, rejectReason: reason || '', rejectedDate: new Date().toISOString().split('T')[0] }
        : loan
    ));
    if (loan) logAction('loan_rejected', `Rejected loan #${id} for ${loan.clientName}${reason ? ' - Reason: ' + reason : ''}`, currentUser);
  };

  const addClient = (clientData) => {
    const newClient = {
      id: nextId(clients),
      ...clientData,
      status: 'active'
    };
    setClients([newClient, ...clients]);
    logAction('client_created', `Added client: ${newClient.fullName}`, currentUser);
    return newClient;
  };

  const updateClient = (id, updates) => {
    const target = clients.find(c => c.id === id);
    setClients(prev => prev.map(client =>
      client.id === id ? { ...client, ...updates } : client
    ));
    if (target) logAction('client_updated', `Updated client: ${target.fullName}`, currentUser);
  };

  const deleteClient = (id) => {
    const target = clients.find(c => c.id === id);
    const hasLoans = loans.some(l => l.clientId === id);
    if (hasLoans) {
      return { success: false, message: 'You cannot delete a client with loans. Delete their loans first.' };
    }
    setClients(prev => prev.filter(c => c.id !== id));
    if (target) logAction('client_deleted', `Deleted client: ${target.fullName}`, currentUser);
    return { success: true };
  };

  const updateLoan = (id, updates) => {
    const target = loans.find(l => l.id === id);
    setLoans(prev => prev.map(loan => {
      if (loan.id !== id) return loan;
      const amount = updates.amount !== undefined ? updates.amount : loan.amount;
      const interestRate = updates.interestRate !== undefined ? updates.interestRate : loan.interestRate;
      const newTotalPayable = amount + (amount * interestRate / 100);
      const newRemaining = Math.max(0, newTotalPayable - loan.paid);

      return {
        ...loan,
        ...updates,
        amount,
        interestRate,
        totalPayable: newTotalPayable,
        remaining: newRemaining,
        status: newRemaining <= 0 ? 'completed' : (loan.status === 'completed' ? 'active' : loan.status)
      };
    }));
    if (target) logAction('loan_updated', `Updated loan #${id} for ${target.clientName}`, currentUser);
  };

  const deleteLoan = (id) => {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;

    setLoans(prev => prev.filter(l => l.id !== id));
    setPayments(prev => prev.filter(p => p.loanId !== id));
    logAction('loan_deleted', `Deleted loan #${id} for ${loan.clientName}`, currentUser);
  };

  const updatePayment = (id, updates) => {
    const oldPayment = payments.find(p => p.id === id);
    if (!oldPayment) return;
    const newAmount = updates.amount !== undefined ? updates.amount : oldPayment.amount;
    const delta = newAmount - oldPayment.amount;
    const newPenaltyAmount = updates.penaltyAmount !== undefined ? updates.penaltyAmount : (oldPayment.penaltyAmount || 0);
    const penaltyDelta = newPenaltyAmount - (oldPayment.penaltyAmount || 0);

    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updates, amount: newAmount, penaltyAmount: newPenaltyAmount } : p));

    setLoans(prev => prev.map(loan => {
      if (loan.id !== oldPayment.loanId) return loan;
      const newPaid = loan.paid + delta;
      const newRemaining = loan.totalPayable - newPaid;
      const newPenaltyPaid = Math.max(0, (loan.penaltyPaid || 0) + penaltyDelta);
      return {
        ...loan,
        paid: newPaid,
        remaining: newRemaining,
        penaltyPaid: newPenaltyPaid,
        status: newRemaining <= 0 ? 'completed' : (loan.status === 'completed' ? 'active' : loan.status)
      };
    }));
    logAction('payment_updated', `Updated payment #${id} (loan #${oldPayment.loanId}) to TSh ${Number(newAmount).toLocaleString()}`, currentUser);
  };

  const deletePayment = (id) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;

    setPayments(prev => prev.filter(p => p.id !== id));

    setLoans(prev => prev.map(loan => {
      if (loan.id !== payment.loanId) return loan;
      const newPaid = Math.max(0, loan.paid - payment.amount);
      const newRemaining = loan.totalPayable - newPaid;
      const newPenaltyPaid = Math.max(0, (loan.penaltyPaid || 0) - (payment.penaltyAmount || 0));
      return {
        ...loan,
        paid: newPaid,
        remaining: newRemaining,
        penaltyPaid: newPenaltyPaid,
        status: newRemaining <= 0 ? 'completed' : (loan.status === 'completed' ? 'active' : loan.status)
      };
    }));
    logAction('payment_deleted', `Deleted payment #${id} of TSh ${Number(payment.amount).toLocaleString()} (loan #${payment.loanId})`, currentUser);
  };

  const addPayment = (paymentData) => {
    const penaltyAmount = paymentData.penaltyAmount || 0;
    const newPayment = {
      id: nextId(payments),
      ...paymentData,
      penaltyAmount,
      date: new Date().toISOString().split('T')[0]
    };
    setPayments(prev => [newPayment, ...prev]);

    // Update loan paid amount and accrued penalty
    setLoans(prev => prev.map(loan => {
      if (loan.id === paymentData.loanId) {
        const newPaid = loan.paid + paymentData.amount;
        const newRemaining = loan.totalPayable - newPaid;
        return {
          ...loan,
          paid: newPaid,
          remaining: newRemaining,
          penaltyPaid: (loan.penaltyPaid || 0) + penaltyAmount,
          status: newRemaining <= 0 ? 'completed' : loan.status
        };
      }
      return loan;
    }));

    logAction('payment_added', `Added a payment of TSh ${Number(paymentData.amount).toLocaleString()} to loan #${paymentData.loanId}`, currentUser);
    return newPayment;
  };

  // Admin changes the active loan limit per client (and logs it to the audit log)
  const updateLoanLimit = (value) => {
    setLoanLimitPerClient(value);
    logAction('settings_updated', `Changed the loan limit per client to ${value}`, currentUser);
  };

  // Admin changes the daily late penalty rate (and logs it to the audit log)
  const updatePenaltyRate = (value) => {
    setPenaltyRatePerDay(value);
    logAction('settings_updated', `Changed the late penalty rate to ${value}% per day`, currentUser);
  };

  return (
    <LoanContext.Provider value={{
      loans,
      clients,
      payments,
      loading,
      error,
      getLoanStats,
      getClientLoanStats,
      getClientActiveLoanCount,
      loanLimitPerClient,
      setLoanLimitPerClient,
      updateLoanLimit,
      penaltyRatePerDay,
      setPenaltyRatePerDay,
      updatePenaltyRate,
      getEffectiveStatus,
      isLoanOverdue,
      getDueDate,
      getOverdueDays,
      getLoanPenalty,
      getLoanOutstandingPenalty,
      getLoanTotalOwed,
      getLoansNeedingReminder,
      addLoan,
      approveLoan,
      rejectLoan,
      addClient,
      addPayment,
      updateClient,
      deleteClient,
      updateLoan,
      deleteLoan,
      updatePayment,
      deletePayment,
      setLoans,
      setClients
    }}>
      {children}
    </LoanContext.Provider>
  );
};

export const useLoans = () => {
  const context = useContext(LoanContext);
  if (!context) throw new Error('useLoans must be used within LoanProvider');
  return context;
};
