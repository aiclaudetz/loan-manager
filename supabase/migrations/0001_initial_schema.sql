-- ============================================================
-- Loan Manager — Initial Schema
-- Inatengeneza jedwali kulingana na muundo wa mock data
-- (LoanContext.jsx, AuthContext.jsx, AuditContext.jsx)
-- ============================================================

-- ---------- 1. PROFILES (staff / users) ----------
-- Hii inaunganishwa na Supabase Auth (auth.users). Kila mtumiaji
-- (admin/manager/officer) ana akaunti ya kweli ya login, na profile
-- yenye role na permissions zake.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text not null,
  role text not null check (role in ('admin', 'manager', 'officer')),
  can_issue_loans boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- 2. CLIENTS ----------
create table if not exists clients (
  id bigint generated always as identity primary key,
  full_name text not null,
  phone text,
  national_id text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

-- ---------- 3. LOANS ----------
create table if not exists loans (
  id bigint generated always as identity primary key,
  client_id bigint not null references clients(id) on delete restrict,
  amount numeric(14,2) not null,
  interest_rate numeric(5,2) not null default 0,
  duration int not null, -- siku
  status text not null default 'pending'
    check (status in ('pending', 'active', 'overdue', 'completed', 'rejected')),
  purpose text,
  date date not null default current_date,
  total_payable numeric(14,2) not null,
  paid numeric(14,2) not null default 0,
  remaining numeric(14,2) not null,
  penalty_rate numeric(5,2), -- overrides system default kama ipo
  penalty_paid numeric(14,2) not null default 0,
  approved_by uuid references profiles(id),
  approved_date date,
  rejected_by uuid references profiles(id),
  reject_reason text,
  rejected_date date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- 4. PAYMENTS ----------
create table if not exists payments (
  id bigint generated always as identity primary key,
  loan_id bigint not null references loans(id) on delete cascade,
  amount numeric(14,2) not null,
  penalty_amount numeric(14,2) not null default 0,
  date date not null default current_date,
  method text,
  reference text,
  recorded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- 5. AUDIT LOGS ----------
create table if not exists audit_logs (
  id bigint generated always as identity primary key,
  "timestamp" timestamptz not null default now(),
  user_id uuid references profiles(id),
  username text,
  full_name text,
  role text,
  action text not null,
  details text
);

-- ---------- 6. SETTINGS (single row) ----------
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  loan_limit_per_client int not null default 3,
  penalty_rate_per_day numeric(5,2) not null default 1
);
insert into settings (id) values (1) on conflict (id) do nothing;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
create or replace function my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select active from profiles where id = auth.uid()), false);
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table clients enable row level security;
alter table loans enable row level security;
alter table payments enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

-- PROFILES: kila mtu aliyeingia anaweza kusoma orodha ya wafanyakazi;
-- admin pekee anaweza kuongeza/kuhariri/kufuta
create policy "profiles_select" on profiles for select
  using (is_active_user());
create policy "profiles_admin_write" on profiles for all
  using (my_role() = 'admin') with check (my_role() = 'admin');

-- CLIENTS: watumiaji wote walioingia (active) wanaweza kusoma na kuandika
create policy "clients_select" on clients for select using (is_active_user());
create policy "clients_write" on clients for insert with check (is_active_user());
create policy "clients_update" on clients for update using (is_active_user());
create policy "clients_delete" on clients for delete using (is_active_user());

-- LOANS: wote wanasoma; kutengeneza mkopo mpya kunahitaji ruhusa maalum;
-- kubadilisha status (approve/reject) ni kwa manager/admin pekee
create policy "loans_select" on loans for select using (is_active_user());
create policy "loans_insert" on loans for insert
  with check (
    is_active_user() and
    (my_role() = 'admin' or (my_role() = 'officer' and
      (select can_issue_loans from profiles where id = auth.uid())))
  );
create policy "loans_update" on loans for update using (is_active_user());
create policy "loans_delete" on loans for delete
  using (my_role() in ('admin', 'manager'));

-- PAYMENTS: wote wanasoma na kuandika (wakiwa wameingia)
create policy "payments_select" on payments for select using (is_active_user());
create policy "payments_write" on payments for insert with check (is_active_user());
create policy "payments_update" on payments for update using (is_active_user());
create policy "payments_delete" on payments for delete using (is_active_user());

-- AUDIT LOGS: wote wanasoma; system pekee (via app) inaandika
create policy "audit_select" on audit_logs for select using (is_active_user());
create policy "audit_insert" on audit_logs for insert with check (is_active_user());

-- SETTINGS: wote wanasoma; admin pekee anabadilisha
create policy "settings_select" on settings for select using (is_active_user());
create policy "settings_update" on settings for update using (my_role() = 'admin');
