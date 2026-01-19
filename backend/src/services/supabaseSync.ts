import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env variables
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.warn('⚠️ Supabase credentials missing. Auto-sync disabled.');
}

export const syncUpsert = async (table: string, data: any) => {
    if (!supabase) return;
    try {
        // Fire and forget, but log error if it happens
        const { error } = await supabase.from(table).upsert(data);
        if (error) {
            console.error(`❌ Sync Error (Upsert ${table}):`, error.message);
        }
    } catch (err) {
        console.error(`❌ Sync Exception (Upsert ${table}):`, err);
    }
};

export const syncDelete = async (table: string, id: string) => {
    if (!supabase) return;
    try {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            console.error(`❌ Sync Error (Delete ${table}):`, error.message);
        }
    } catch (err) {
        console.error(`❌ Sync Exception (Delete ${table}):`, err);
    }
};
