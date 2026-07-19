-- ============================================================
-- Loan Manager — Restrict Loan Approval/Rejection at the DB level
-- ============================================================
-- WHY: The "loans_update" RLS policy currently allows ANY active,
-- logged-in user to update ANY column on ANY loan (including `status`).
-- The app only stops an officer from approving/rejecting a loan on the
-- *frontend* (canApproveLoans() in AuthContext). A user who called the
-- Supabase API directly (e.g. from the browser console) could bypass
-- that check and self-approve a loan.
--
-- This migration adds a BEFORE UPDATE trigger that blocks the specific
-- transition pending -> active/rejected unless the user is a manager
-- or admin. It does NOT touch any other behavior: officers can still
-- record payments, edit loan terms, and the automatic "completed" status
-- change when a loan is fully paid off continues to work for everyone,
-- exactly as before.
-- ============================================================

create or replace function enforce_loan_approval() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'pending'
     and new.status in ('active', 'rejected')
     and my_role() not in ('admin', 'manager') then
    raise exception 'Only a manager or admin can approve or reject a loan.'
      using errcode = '42501'; -- insufficient_privilege
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_loan_approval on loans;
create trigger trg_enforce_loan_approval
  before update on loans
  for each row
  execute function enforce_loan_approval();
