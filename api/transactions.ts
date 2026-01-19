import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, toCamelCase, toSnakeCase } from './_lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Get current WIB time as ISO string
const getWIBNowISO = () => {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '+07:00';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Extract ID from path for PATCH/DELETE (e.g., /api/transactions/abc-123)
    const pathParts = (req.url || '').split('/').filter(Boolean);
    const transactionId = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

    try {
        if (req.method === 'GET') {
            const { month, categoryId } = req.query;

            let query = supabase.from('transactions').select('*');

            if (month) {
                query = query.eq('year_month', month);
            }
            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            const { data, error } = await query.order('date_iso', { ascending: false });
            if (error) throw error;

            return res.status(200).json(toCamelCase(data));
        }

        if (req.method === 'POST') {
            const { dateISO, categoryId, sourceId, description, amountRp } = req.body;

            if (!dateISO || !categoryId || !description || amountRp === undefined) {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
            }

            const yearMonth = dateISO.substring(0, 7);
            const now = getWIBNowISO();

            // Check if month is locked
            const { data: lock } = await supabase
                .from('month_locks')
                .select('status')
                .eq('year_month', yearMonth)
                .single();

            if (lock?.status === 'locked') {
                return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: `Cannot modify transactions for locked month ${yearMonth}` } });
            }

            const newTransaction = {
                id: uuidv4(),
                date_iso: dateISO,
                year_month: yearMonth,
                category_id: categoryId,
                source_id: sourceId || null,
                description,
                amount_rp: amountRp,
                created_at_iso: now,
                updated_at_iso: now
            };

            const { data, error } = await supabase
                .from('transactions')
                .insert(newTransaction)
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(toCamelCase(data));
        }

        if (req.method === 'PATCH' && transactionId) {
            const { dateISO, categoryId, sourceId, description, amountRp } = req.body;
            const now = getWIBNowISO();

            // Get existing transaction to check lock
            const { data: existing } = await supabase
                .from('transactions')
                .select('year_month')
                .eq('id', transactionId)
                .single();

            if (!existing) {
                return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
            }

            // Check if month is locked
            const { data: lock } = await supabase
                .from('month_locks')
                .select('status')
                .eq('year_month', existing.year_month)
                .single();

            if (lock?.status === 'locked') {
                return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: `Cannot modify transactions for locked month ${existing.year_month}` } });
            }

            const updateData: any = { updated_at_iso: now };
            if (dateISO !== undefined) {
                updateData.date_iso = dateISO;
                updateData.year_month = dateISO.substring(0, 7);
            }
            if (categoryId !== undefined) updateData.category_id = categoryId;
            if (sourceId !== undefined) updateData.source_id = sourceId;
            if (description !== undefined) updateData.description = description;
            if (amountRp !== undefined) updateData.amount_rp = amountRp;

            const { data, error } = await supabase
                .from('transactions')
                .update(updateData)
                .eq('id', transactionId)
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json(toCamelCase(data));
        }

        if (req.method === 'DELETE' && transactionId) {
            // Get existing transaction to check lock
            const { data: existing } = await supabase
                .from('transactions')
                .select('year_month')
                .eq('id', transactionId)
                .single();

            if (!existing) {
                return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
            }

            // Check if month is locked
            const { data: lock } = await supabase
                .from('month_locks')
                .select('status')
                .eq('year_month', existing.year_month)
                .single();

            if (lock?.status === 'locked') {
                return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: `Cannot modify transactions for locked month ${existing.year_month}` } });
            }

            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', transactionId);

            if (error) throw error;
            return res.status(204).end();
        }

        return res.status(405).json({ error: { message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Transactions API Error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
}
