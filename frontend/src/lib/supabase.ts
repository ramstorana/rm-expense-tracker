import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Check .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (matching Supabase schema)
export interface DbCategory {
    id: string;
    name: string;
    archived: boolean;
}

export interface DbExpenseSource {
    id: string;
    name: string;
    type: 'bank_account' | 'credit_card';
    archived: boolean;
}

export interface DbIncomeSource {
    id: string;
    name: string;
    archived: boolean;
}

export interface DbTransaction {
    id: string;
    date_iso: string;
    year_month: string;
    category_id: string;
    source_id: string | null;
    description: string;
    amount_rp: number;
    created_at_iso: string;
    updated_at_iso: string;
}

export interface DbIncome {
    id: string;
    date_iso: string;
    year_month: string;
    source_id: string;
    description: string;
    amount_rp: number;
    created_at_iso: string;
    updated_at_iso: string;
}

export interface DbMonthLock {
    year_month: string;
    status: 'locked' | 'unlocked';
    locked_at_iso: string | null;
    unlocked_at_iso: string | null;
    last_reconciled_at_iso: string | null;
}

export interface DbAuditLog {
    id: string;
    ts_iso: string;
    actor: string;
    action: string;
    month: string;
    reason: string | null;
}
