import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, toCamelCase } from './_lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('expense_sources')
                .select('*')
                .eq('archived', false)
                .order('name');

            if (error) throw error;
            return res.status(200).json(toCamelCase(data));
        }

        return res.status(405).json({ error: { message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Expense Sources API Error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
}
