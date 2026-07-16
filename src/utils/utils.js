// Calculate the payment due date (deadline) from the start date + duration (days)
export const getDueDate = (loan) => {
  const start = new Date(loan.date);
  start.setDate(start.getDate() + (parseInt(loan.duration) || 0));
  return start;
};

// Determine if a loan is overdue: not completed, not 'pending' (not yet started), and the due date has passed
export const isLoanOverdue = (loan) => {
  if (loan.status === 'completed' || loan.status === 'pending' || loan.status === 'rejected') return false;
  if (loan.remaining <= 0) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return getDueDate(loan) < today;
};

// The loan's effective status accounting for automatic overdue detection (doesn't require changing the stored status)
export const getEffectiveStatus = (loan) => (isLoanOverdue(loan) ? 'overdue' : loan.status);

// Number of days the loan is overdue (0 if not overdue)
export const getOverdueDays = (loan) => {
  if (!isLoanOverdue(loan)) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = getDueDate(loan);
  return Math.max(0, Math.round((today - due) / (1000 * 60 * 60 * 24)));
};

// Calculate the late penalty: percentage (per day) of the remaining amount, times the number of overdue days.
// penaltyRatePerDay is a number like 1 meaning 1% per day. A loan may have its own custom rate
// (loan.penaltyRate) which overrides the system-wide default.
export const getPenaltyAmount = (loan, defaultPenaltyRatePerDay) => {
  const days = getOverdueDays(loan);
  if (days <= 0) return 0;
  const rate = loan.penaltyRate !== undefined && loan.penaltyRate !== null ? loan.penaltyRate : defaultPenaltyRatePerDay;
  if (!rate || rate <= 0) return 0;
  return loan.remaining * (rate / 100) * days;
};

// Total amount currently owed including the late penalty (if any)
export const getTotalOwed = (loan, defaultPenaltyRatePerDay) => {
  return loan.remaining + getPenaltyAmount(loan, defaultPenaltyRatePerDay);
};

// Penalty not yet collected: currently accrued penalty minus what has already been paid
export const getOutstandingPenalty = (loan, defaultPenaltyRatePerDay) => {
  const accrued = getPenaltyAmount(loan, defaultPenaltyRatePerDay);
  const paid = loan.penaltyPaid || 0;
  return Math.max(0, accrued - paid);
};

// Number of days before sending a reminder for an upcoming payment
export const REMINDER_WINDOW_DAYS = 3;

// Convert a local phone number (07...) to international format for a WhatsApp link
export const formatPhoneForWaMe = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('255')) return digits;
  if (digits.startsWith('0')) return '255' + digits.slice(1);
  return digits;
};

// Make a single value CSV-safe: wrap in "" if it contains a comma, quote mark, or newline
const csvEscape = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

// Convert a list of objects into CSV text.
// columns: [{ key: 'fullName', label: 'Name' }, ...] — if not provided, the first object's keys will be used
export const arrayToCSV = (rows, columns) => {
  if (!rows || rows.length === 0) return '';
  const cols = columns || Object.keys(rows[0]).map((key) => ({ key, label: key }));
  const header = cols.map((c) => csvEscape(c.label)).join(',');
  const body = rows
    .map((row) => cols.map((c) => csvEscape(row[c.key])).join(','))
    .join('\n');
  return header + '\n' + body;
};

// Download the CSV text as a file in the user's browser.
// Adds a BOM (\uFEFF) so Excel reads special characters correctly (e.g. "ç", "ñ")
// and also helps Excel detect UTF-8 correctly instead of corrupting numbers like "0712345678".
export const downloadCSV = (filename, csvContent) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Today's date in YYYY-MM-DD format, for use in a downloaded file's name
export const todayStamp = () => new Date().toISOString().slice(0, 10);

// ============================================
// FORM VALIDATION
// ============================================

// Tanzanian phone number: 07XXXXXXXX / 06XXXXXXXX, or 2557XXXXXXXX / 2556XXXXXXXX, or +255...
export const isValidTZPhone = (phone) => {
  if (!phone) return false;
  const digits = phone.replace(/[\s-]/g, '').replace(/^\+/, '');
  return /^0[67]\d{8}$/.test(digits) || /^255[67]\d{8}$/.test(digits);
};

// ID number (National ID or Driver's License) - letters/digits, standard length (optional - only used if filled in)
export const isValidIdNumber = (value) => {
  const cleaned = (value || '').trim();
  if (!cleaned) return true;
  return /^[A-Za-z0-9-]{5,25}$/.test(cleaned);
};

// Find another client with a matching phone number (to prevent adding a duplicate client)
export const findDuplicatePhone = (clients, phone, excludeId) => {
  const target = (phone || '').replace(/[\s-]/g, '').replace(/^\+/, '');
  return clients.find(
    (c) => c.id !== excludeId && (c.phone || '').replace(/[\s-]/g, '').replace(/^\+/, '') === target
  );
};

// Find another client with a matching National ID
export const findDuplicateNationalId = (clients, nationalId, excludeId) => {
  const cleaned = (nationalId || '').trim();
  if (!cleaned) return null;
  return clients.find((c) => c.id !== excludeId && (c.nationalId || '').trim() === cleaned);
};
