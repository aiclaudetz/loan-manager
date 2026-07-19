import React, { useState, useEffect, createContext, useContext } from 'react';
import { getDueDate, isLoanOverdue, getEffectiveStatus, getOverdueDays, getPenaltyAmount, getTotalOwed, getOutstandingPenalty, REMINDER_WINDOW_DAYS } from '../utils/utils';
import { useAudit } from './AuditContext';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

const LoanContext = createContext();

// ---------- Mappers: DB (snake_case) <-> App (camelCase) ----------
const mapClient = (c) => ({
  id: c.id,
  fullName: c.full_name,
  phone: c.phone,
  nationalId: c.national_id,
  status: c.status,
  address: c.address,
  idPhoto: c.id_photo,
});

const mapLoan = (l, clientName) => ({
  id: l.id,
  clientId: l.client_id,
  clientName: clientName || l.clients?.full_name || '',
  amount: Number(l.amount),
  interestRate: Number(l.interest_rate),
  duration: l.duration,
  status: l.status,
  purpose: l.purpose,
  date: l.date,
  totalPayable: Number(l.total_payable),
  paid: Number(l.paid),
  remaining: Number(l.remaining),
  penaltyRate: l.penalty_rate !== null ? Number(l.penalty_rate) : undefined,
  penaltyPaid: Number(l.penalty_paid || 0),
  approvedBy: l.approved_by,
  approvedDate: l.approved_date,
  rejectedBy: l.rejected_by,
  rejectReason: l.reject_reason,
  rejectedDate: l.rejected_date,
  guarantorName: l.guarantor_name,
  guarantorPhone: l.guarantor_phone,
  guarantorIdNumber: l.guarantor_id_number,
  guarantorIdPhoto: l.guarantor_id_photo,
  collateralItem: l.collateral_item,
  requestedBy: l.requested_by_name,
});

const mapPayment = (p) => ({
  id: p.id,
  loanId: p.loan_id,
  amount: Number(p.amount),
  penaltyAmount: Number(p.penalty_amount || 0),
  date: p.date,
  method: p.method,
  reference: p.reference,
});

export const LoanProvider = ({ children }) => {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { logAction } = useAudit();
  const { currentUser } = useAuth();
  const [loanLimitPerClient, setLoanLimitPerClient] = useState(3);
  const [penaltyRatePerDay, setPenaltyRatePerDay] = useState(1);

  const refreshAll = async () => {
    setLoading(true);
    try {
      const [clientsRes, loansRes, paymentsRes, settingsRes] = await Promise.all([
        supabase.from('clients').select('*').order('id'),
        supabase.from('loans').select('*, clients(full_name)').order('id'),
        supabase.from('payments').select('*').order('id'),
        supabase.from('settings').select('*').eq('id', 1).single(),
      ]);
      if (clientsRes.error) throw clientsRes.error;
      if (loansRes.error) throw loansRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      setClients(clientsRes.data.map(mapClient));
      setLoans(loansRes.data.map((l) => mapLoan(l)));
      setPayments(paymentsRes.data.map(mapPayment));
      if (settingsRes.data) {
        setLoanLimitPerClient(settingsRes.data.loan_limit_per_client);
        setPenaltyRatePerDay(Number(settingsRes.data.penalty_rate_per_day));
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) refreshAll();
  }, [currentUser]);

  const getClientLoanStats = (clientId) => {
    const clientLoans = loans.filter(l => l.clientId === clientId);
    const totalLoans = clientLoans.length;
    const totalDebt = clientLoans.reduce((sum, l) => sum + (l.status === 'rejected' ? 0 : l.remaining), 0);
    return { totalLoans, totalDebt };
  };

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
    // Profit = interest earned on loans (total payable minus principal amount)
    const totalProfit = loans.reduce((sum, l) => sum + (l.totalPayable - l.amount), 0);
    return { totalLoans, activeLoans, totalAmount, overdueLoans, recoveredAmount, totalPenalties, totalProfit };
  };

  const getLoanPenalty = (loan) => getPenaltyAmount(loan, penaltyRatePerDay);
  const getLoanOutstandingPenalty = (loan) => getOutstandingPenalty(loan, penaltyRatePerDay);
  const getLoanTotalOwed = (loan) => getTotalOwed(loan, penaltyRatePerDay);

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

  // ---------- Mutations (async, talk to Supabase, then refresh) ----------

  const addLoan = async (loanData) => {
    const totalPayable = loanData.amount + (loanData.amount * loanData.interestRate / 100);
    const row = {
      client_id: loanData.clientId,
      amount: loanData.amount,
      interest_rate: loanData.interestRate,
      duration: loanData.duration,
      purpose: loanData.purpose,
      status: 'pending',
      total_payable: totalPayable,
      paid: 0,
      remaining: totalPayable,
      date: new Date().toISOString().split('T')[0],
      guarantor_name: loanData.guarantorName,
      guarantor_phone: loanData.guarantorPhone,
      guarantor_id_number: loanData.guarantorIdNumber,
      guarantor_id_photo: loanData.guarantorIdPhoto,
      collateral_item: loanData.collateralItem,
      requested_by_name: loanData.requestedBy,
      created_by: currentUser?.id,
    };
    const { data, error: err } = await supabase.from('loans').insert(row).select().single();
    if (err) { setError(err.message); return null; }
    logAction('loan_created', `Requested a loan of TSh ${Number(row.amount).toLocaleString()} for ${loanData.clientName || ''}`, currentUser);
    await refreshAll();
    return mapLoan(data);
  };

  const approveLoan = async (id, approvedBy) => {
    const loan = loans.find(l => l.id === id);
    const { error: err } = await supabase.from('loans')
      .update({ status: 'active', approved_by: approvedBy, approved_date: new Date().toISOString().split('T')[0] })
      .eq('id', id).eq('status', 'pending');
    if (err) { setError(err.message); return; }
    if (loan) logAction('loan_approved', `Approved loan #${id} for ${loan.clientName} (TSh ${Number(loan.amount).toLocaleString()})`, currentUser);
    await refreshAll();
  };

  const rejectLoan = async (id, rejectedBy, reason) => {
    const loan = loans.find(l => l.id === id);
    const { error: err } = await supabase.from('loans')
      .update({ status: 'rejected', rejected_by: rejectedBy, reject_reason: reason || '', rejected_date: new Date().toISOString().split('T')[0] })
      .eq('id', id).eq('status', 'pending');
    if (err) { setError(err.message); return; }
    if (loan) logAction('loan_rejected', `Rejected loan #${id} for ${loan.clientName}${reason ? ' - Reason: ' + reason : ''}`, currentUser);
    await refreshAll();
  };

  const addClient = async (clientData) => {
    const row = {
      full_name: clientData.fullName,
      phone: clientData.phone,
      national_id: clientData.nationalId,
      address: clientData.address,
      id_photo: clientData.idPhoto,
      status: 'active',
    };
    const { data, error: err } = await supabase.from('clients').insert(row).select().single();
    if (err) { setError(err.message); return null; }
    logAction('client_created', `Added client: ${row.full_name}`, currentUser);
    await refreshAll();
    return mapClient(data);
  };

  const updateClient = async (id, updates) => {
    const target = clients.find(c => c.id === id);
    const row = {};
    if (updates.fullName !== undefined) row.full_name = updates.fullName;
    if (updates.phone !== undefined) row.phone = updates.phone;
    if (updates.nationalId !== undefined) row.national_id = updates.nationalId;
    if (updates.address !== undefined) row.address = updates.address;
    if (updates.idPhoto !== undefined) row.id_photo = updates.idPhoto;
    if (updates.status !== undefined) row.status = updates.status;

    const { error: err } = await supabase.from('clients').update(row).eq('id', id);
    if (err) { setError(err.message); return; }
    if (target) logAction('client_updated', `Updated client: ${target.fullName}`, currentUser);
    await refreshAll();
  };

  const deleteClient = async (id) => {
    const target = clients.find(c => c.id === id);
    const hasLoans = loans.some(l => l.clientId === id);
    if (hasLoans) {
      return { success: false, message: 'You cannot delete a client with loans. Delete their loans first.' };
    }
    const { error: err } = await supabase.from('clients').delete().eq('id', id);
    if (err) return { success: false, message: err.message };
    if (target) logAction('client_deleted', `Deleted client: ${target.fullName}`, currentUser);
    await refreshAll();
    return { success: true };
  };

  const updateLoan = async (id, updates) => {
    const target = loans.find(l => l.id === id);
    if (!target) return;
    const amount = updates.amount !== undefined ? updates.amount : target.amount;
    const interestRate = updates.interestRate !== undefined ? updates.interestRate : target.interestRate;
    const newTotalPayable = amount + (amount * interestRate / 100);
    const newRemaining = Math.max(0, newTotalPayable - target.paid);

    const row = {
      amount,
      interest_rate: interestRate,
      total_payable: newTotalPayable,
      remaining: newRemaining,
      status: newRemaining <= 0 ? 'completed' : (target.status === 'completed' ? 'active' : target.status),
    };
    if (updates.duration !== undefined) row.duration = updates.duration;
    if (updates.purpose !== undefined) row.purpose = updates.purpose;
    if (updates.guarantorName !== undefined) row.guarantor_name = updates.guarantorName;
    if (updates.guarantorPhone !== undefined) row.guarantor_phone = updates.guarantorPhone;
    if (updates.guarantorIdNumber !== undefined) row.guarantor_id_number = updates.guarantorIdNumber;
    if (updates.guarantorIdPhoto !== undefined) row.guarantor_id_photo = updates.guarantorIdPhoto;
    if (updates.collateralItem !== undefined) row.collateral_item = updates.collateralItem;

    const { error: err } = await supabase.from('loans').update(row).eq('id', id);
    if (err) { setError(err.message); return; }
    logAction('loan_updated', `Updated loan #${id} for ${target.clientName}`, currentUser);
    await refreshAll();
  };

  const deleteLoan = async (id) => {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;
    const { error: err } = await supabase.from('loans').delete().eq('id', id);
    if (err) { setError(err.message); return; }
    logAction('loan_deleted', `Deleted loan #${id} for ${loan.clientName}`, currentUser);
    await refreshAll();
  };

  const updatePayment = async (id, updates) => {
    const oldPayment = payments.find(p => p.id === id);
    if (!oldPayment) return;
    const loan = loans.find(l => l.id === oldPayment.loanId);
    const newAmount = updates.amount !== undefined ? updates.amount : oldPayment.amount;
    const newPenaltyAmount = updates.penaltyAmount !== undefined ? updates.penaltyAmount : oldPayment.penaltyAmount;
    const delta = newAmount - oldPayment.amount;
    const penaltyDelta = newPenaltyAmount - oldPayment.penaltyAmount;

    const { error: err1 } = await supabase.from('payments')
      .update({ amount: newAmount, penalty_amount: newPenaltyAmount, method: updates.method, reference: updates.reference })
      .eq('id', id);
    if (err1) { setError(err1.message); return; }

    if (loan) {
      const newPaid = loan.paid + delta;
      const newRemaining = loan.totalPayable - newPaid;
      const newPenaltyPaid = Math.max(0, (loan.penaltyPaid || 0) + penaltyDelta);
      await supabase.from('loans').update({
        paid: newPaid,
        remaining: newRemaining,
        penalty_paid: newPenaltyPaid,
        status: newRemaining <= 0 ? 'completed' : (loan.status === 'completed' ? 'active' : loan.status),
      }).eq('id', loan.id);
    }
    logAction('payment_updated', `Updated payment #${id} (loan #${oldPayment.loanId}) to TSh ${Number(newAmount).toLocaleString()}`, currentUser);
    await refreshAll();
  };

  const deletePayment = async (id) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    const loan = loans.find(l => l.id === payment.loanId);

    const { error: err } = await supabase.from('payments').delete().eq('id', id);
    if (err) { setError(err.message); return; }

    if (loan) {
      const newPaid = Math.max(0, loan.paid - payment.amount);
      const newRemaining = loan.totalPayable - newPaid;
      const newPenaltyPaid = Math.max(0, (loan.penaltyPaid || 0) - (payment.penaltyAmount || 0));
      await supabase.from('loans').update({
        paid: newPaid,
        remaining: newRemaining,
        penalty_paid: newPenaltyPaid,
        status: newRemaining <= 0 ? 'completed' : (loan.status === 'completed' ? 'active' : loan.status),
      }).eq('id', loan.id);
    }
    logAction('payment_deleted', `Deleted payment #${id} of TSh ${Number(payment.amount).toLocaleString()} (loan #${payment.loanId})`, currentUser);
    await refreshAll();
  };

  const addPayment = async (paymentData) => {
    const penaltyAmount = paymentData.penaltyAmount || 0;
    const row = {
      loan_id: paymentData.loanId,
      amount: paymentData.amount,
      penalty_amount: penaltyAmount,
      method: paymentData.method,
      reference: paymentData.reference,
      date: new Date().toISOString().split('T')[0],
      recorded_by: currentUser?.id,
    };
    const { data, error: err } = await supabase.from('payments').insert(row).select().single();
    if (err) { setError(err.message); return null; }

    const loan = loans.find(l => l.id === paymentData.loanId);
    if (loan) {
      const newPaid = loan.paid + paymentData.amount;
      const newRemaining = loan.totalPayable - newPaid;
      await supabase.from('loans').update({
        paid: newPaid,
        remaining: newRemaining,
        penalty_paid: (loan.penaltyPaid || 0) + penaltyAmount,
        status: newRemaining <= 0 ? 'completed' : loan.status,
      }).eq('id', loan.id);
    }
    logAction('payment_added', `Added a payment of TSh ${Number(paymentData.amount).toLocaleString()} to loan #${paymentData.loanId}`, currentUser);
    await refreshAll();
    return mapPayment(data);
  };

  const updateLoanLimit = async (value) => {
    await supabase.from('settings').update({ loan_limit_per_client: value }).eq('id', 1);
    setLoanLimitPerClient(value);
    logAction('settings_updated', `Changed the loan limit per client to ${value}`, currentUser);
  };

  const updatePenaltyRate = async (value) => {
    await supabase.from('settings').update({ penalty_rate_per_day: value }).eq('id', 1);
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
      refreshAll,
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
