-- RM Monthly Finance Tracker - Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Categories
create table if not exists public.categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    archived boolean default false
);

-- 2. Expense Sources
create table if not exists public.expense_sources (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    type text not null check (type in ('bank_account', 'credit_card')),
    archived boolean default false
);

-- 3. Income Sources
create table if not exists public.income_sources (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    archived boolean default false
);

-- 4. Transactions
create table if not exists public.transactions (
    id uuid primary key default uuid_generate_v4(),
    date_iso text not null,
    year_month text not null,
    category_id uuid references public.categories(id) on delete set null,
    source_id uuid references public.expense_sources(id) on delete set null,
    description text not null,
    amount_rp bigint not null,
    created_at_iso text not null,
    updated_at_iso text not null
);

-- 5. Income
create table if not exists public.income (
    id uuid primary key default uuid_generate_v4(),
    date_iso text not null,
    year_month text not null,
    source_id uuid references public.income_sources(id) on delete set null,
    description text not null,
    amount_rp bigint not null,
    created_at_iso text not null,
    updated_at_iso text not null
);

-- 6. Month Locks
create table if not exists public.month_locks (
    year_month text primary key,
    status text not null check (status in ('locked', 'unlocked')),
    locked_at_iso text,
    unlocked_at_iso text,
    last_reconciled_at_iso text
);

-- 7. Audit Log
create table if not exists public.audit_log (
    id uuid primary key default uuid_generate_v4(),
    ts_iso text not null,
    actor text not null,
    action text not null,
    month text not null,
    reason text
);

-- Indexes for performance
create index if not exists idx_transactions_year_month on public.transactions(year_month);
create index if not exists idx_transactions_date_iso on public.transactions(date_iso);
create index if not exists idx_income_year_month on public.income(year_month);

-- Row Level Security (RLS) - Currently disabled for simplicity
-- Enable these if you add authentication later:
-- alter table public.categories enable row level security;
-- alter table public.expense_sources enable row level security;
-- alter table public.income_sources enable row level security;
-- alter table public.transactions enable row level security;
-- alter table public.income enable row level security;
-- alter table public.month_locks enable row level security;
-- alter table public.audit_log enable row level security;
