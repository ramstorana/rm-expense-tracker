import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, toCamelCase } from './_lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Get current WIB time as ISO string
const getWIBNowISO = () => {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace(' ', 'T') + '+07:00';
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Parse action from path: /api/locks, /api/locks/unlock, /api/locks/relock
    const pathParts = (req.url || '').split('/').filter(Boolean);
    const action = pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('month_locks')
                .select('*')
                .order('year_month', { ascending: false });

            if (error) throw error;
            return res.status(200).json(toCamelCase(data));
        }

        if (req.method === 'POST' && action === 'unlock') {
            const { month, reason, initials } = req.body;
            const now = getWIBNowISO();

            const { error } = await supabase
                .from('month_locks')
                .update({
                    status: 'unlocked',
                    unlocked_at_iso: now
                })
                .eq('year_month', month);

            if (error) throw error;

            // Write to audit log
            await supabase.from('audit_log').insert({
                id: uuidv4(),
                ts_iso: now,
                actor: initials,
                action: 'unlock',
                month,
                reason
            });

            return res.status(200).json({ success: true });
        }

        if (req.method === 'POST' && action === 'relock') {
            const { month } = req.body;
            const now = getWIBNowISO();

            const { error } = await supabase
                .from('month_locks')
                .update({
                    status: 'locked',
                    locked_at_iso: now
                })
                .eq('year_month', month);

            if (error) throw error;

            // Write to audit log
            await supabase.from('audit_log').insert({
                id: uuidv4(),
                ts_iso: now,
                actor: 'RMT',
                action: 'relock',
                month,
                reason: null
            });

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: { message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Locks API Error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
}
