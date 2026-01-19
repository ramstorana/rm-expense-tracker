import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
    // In Vercel, this might throw if keys aren't set, but better to log and let createClient fail or return valid client
}

export const supabase: SupabaseClient = createClient(supabaseUrl || '', supabaseKey || '');

// Database types matching Supabase schema (snake_case)
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
    category_id: string | null;
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
    source_id: string | null;
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

// Helper to convert snake_case DB records to camelCase for API responses
export const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(toCamelCase);
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            acc[camelKey] = toCamelCase(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

// Helper to convert camelCase API input to snake_case for DB
export const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(toSnakeCase);
    }
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key
                .replace(/ISO/g, 'Iso')
                .replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            acc[snakeKey] = toSnakeCase(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};
