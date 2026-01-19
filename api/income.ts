import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, toCamelCase } from './_lib/supabase';
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

    // Extract ID from path for PATCH/DELETE
    const pathParts = (req.url || '').split('/').filter(Boolean);
    const incomeId = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

    try {
        if (req.method === 'GET') {
            const { month, sourceId } = req.query;

            let query = supabase.from('income').select('*');

            if (month) {
                query = query.eq('year_month', month);
            }
            if (sourceId) {
                query = query.eq('source_id', sourceId);
            }

            const { data, error } = await query.order('date_iso', { ascending: false });
            if (error) throw error;

            return res.status(200).json(toCamelCase(data));
        }

        if (req.method === 'POST') {
            const { dateISO, sourceId, description, amountRp } = req.body;

            if (!dateISO || !sourceId || !description || amountRp === undefined) {
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
                return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: `Cannot modify income for locked month ${yearMonth}` } });
            }

            const newIncome = {
                id: uuidv4(),
                date_iso: dateISO,
                year_month: yearMonth,
                source_id: sourceId,
                description,
                amount_rp: amountRp,
                created_at_iso: now,
                updated_at_iso: now
            };

            const { data, error } = await supabase
                .from('income')
                .insert(newIncome)
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(toCamelCase(data));
        }

        if (req.method === 'PATCH' && incomeId) {
            const { dateISO, sourceId, description, amountRp } = req.body;
            const now = getWIBNowISO();

            // Get existing income to check lock
            const { data: existing } = await supabase
                .from('income')
                .select('year_month')
                .eq('id', incomeId)
                .single();

            if (!existing) {
                return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Income not found' } });
            }

            // Check if month is locked
            const { data: lock } = await supabase
                .from('month_locks')
                .select('status')
                .eq('year_month', existing.year_month)
                .single();

            if (lock?.status === 'locked') {
                return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: `Cannot modify income for locked month ${existing.year_month}` } });
            }

            const updateData: any = { updated_at_iso: now };
            if (dateISO !== undefined) {
                updateData.date_iso = dateISO;
                updateData.year_month = dateISO.substring(0, 7);
            }
            if (sourceId !== undefined) updateData.source_id = sourceId;
            if (description !== undefined) updateData.description = description;
            if (amountRp !== undefined) updateData.amount_rp = amountRp;

            const { data, error } = await supabase
                .from('income')
                .update(updateData)
                .eq('id', incomeId)
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json(toCamelCase(data));
        }

        if (req.method === 'DELETE' && incomeId) {
            // Get existing income to check lock
            const { data: existing } = await supabase
                .from('income')
                .select('year_month')
                .eq('id', incomeId)
                .single();

            if (!existing) {
                return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Income not found' } });
            }

            // Check if month is locked
            const { data: lock } = await supabase
                .from('month_locks')
                .select('status')
                .eq('year_month', existing.year_month)
                .single();

            if (lock?.status === 'locked') {
                return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: `Cannot modify income for locked month ${existing.year_month}` } });
            }

            const { error } = await supabase
                .from('income')
                .delete()
                .eq('id', incomeId);

            if (error) throw error;
            return res.status(204).end();
        }

        return res.status(405).json({ error: { message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Income API Error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
}
