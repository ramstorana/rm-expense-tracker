import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, toCamelCase } from './_lib/supabase';

// Get current month in YYYY-MM format (WIB)
const getCurrentMonth = () => {
    const now = new Date();
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return `${wib.getFullYear()}-${String(wib.getMonth() + 1).padStart(2, '0')}`;
};

// Get previous month
const getPreviousMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number);
    if (month === 1) return `${year - 1}-12`;
    return `${year}-${String(month - 1).padStart(2, '0')}`;
};

// Get month from N months ago
const getMonthsAgo = (n: number) => {
    const now = new Date();
    const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    wib.setMonth(wib.getMonth() - n);
    return `${wib.getFullYear()}-${String(wib.getMonth() + 1).padStart(2, '0')}`;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: { message: 'Method not allowed' } });
    }

    // Parse path: /api/metrics/summary, /api/metrics/trend, /api/metrics/breakdown, etc.
    const pathParts = (req.url || '').split('?')[0].split('/').filter(Boolean);
    const endpoint = pathParts.length > 2 ? pathParts.slice(2).join('/') : 'summary';

    try {
        // === SUMMARY ===
        if (endpoint === 'summary') {
            const month = (req.query.month as string) || getCurrentMonth();
            const prevMonth = getPreviousMonth(month);
            const [yearStr, monthStr] = month.split('-');
            const yoyMonth = `${parseInt(yearStr) - 1}-${monthStr}`;

            // Get current month expenses
            const { data: currentExpenses } = await supabase
                .from('transactions')
                .select('amount_rp')
                .eq('year_month', month);
            const totalCurrent = (currentExpenses || []).reduce((sum, t) => sum + (t.amount_rp || 0), 0);

            // Get previous month expenses
            const { data: prevExpenses } = await supabase
                .from('transactions')
                .select('amount_rp')
                .eq('year_month', prevMonth);
            const totalPrev = (prevExpenses || []).reduce((sum, t) => sum + (t.amount_rp || 0), 0);

            // Get YoY expenses
            const { data: yoyExpenses } = await supabase
                .from('transactions')
                .select('amount_rp')
                .eq('year_month', yoyMonth);
            const yoyPrevYearTotal = (yoyExpenses || []).reduce((sum, t) => sum + (t.amount_rp || 0), 0);

            // Get current month income
            const { data: currentIncome } = await supabase
                .from('income')
                .select('amount_rp')
                .eq('year_month', month);
            const totalIncome = (currentIncome || []).reduce((sum, i) => sum + (i.amount_rp || 0), 0);

            // Get previous month income
            const { data: prevIncome } = await supabase
                .from('income')
                .select('amount_rp')
                .eq('year_month', prevMonth);
            const totalPrevIncome = (prevIncome || []).reduce((sum, i) => sum + (i.amount_rp || 0), 0);

            const momPct = totalPrev > 0 ? ((totalCurrent - totalPrev) / totalPrev) * 100 : null;
            const yoyPct = yoyPrevYearTotal > 0 ? ((totalCurrent - yoyPrevYearTotal) / yoyPrevYearTotal) * 100 : null;
            const incomeMomPct = totalPrevIncome > 0 ? ((totalIncome - totalPrevIncome) / totalPrevIncome) * 100 : null;
            const netSavings = totalIncome - totalCurrent;
            const prevNetSavings = totalPrevIncome - totalPrev;
            const savingsMomPct = prevNetSavings !== 0 ? ((netSavings - prevNetSavings) / Math.abs(prevNetSavings)) * 100 : null;
            const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

            return res.status(200).json({
                month,
                totalCurrent,
                totalPrev,
                momPct,
                totalIncome,
                incomeMomPct,
                netSavings,
                savingsMomPct,
                savingsRate,
                yoyMonth: month,
                yoyPriorYearMonth: yoyMonth,
                yoyCurrentTotal: totalCurrent,
                yoyPrevYearTotal,
                yoyPct
            });
        }

        // === TREND ===
        if (endpoint === 'trend') {
            const { from, to, type } = req.query;
            const isDaily = type === 'daily';

            let query = supabase.from('transactions').select('date_iso, year_month, amount_rp');

            if (from) query = query.gte(isDaily ? 'date_iso' : 'year_month', from);
            if (to) query = query.lte(isDaily ? 'date_iso' : 'year_month', to);

            const { data, error } = await query;
            if (error) throw error;

            // Aggregate by month or day
            const grouped: Record<string, number> = {};
            for (const t of data || []) {
                const key = isDaily ? t.date_iso.substring(0, 10) : t.year_month;
                grouped[key] = (grouped[key] || 0) + (t.amount_rp || 0);
            }

            const trend = Object.entries(grouped)
                .map(([month, total]) => ({ month, total }))
                .sort((a, b) => a.month.localeCompare(b.month));

            return res.status(200).json(trend);
        }

        // === BREAKDOWN ===
        if (endpoint === 'breakdown') {
            const month = (req.query.month as string) || getCurrentMonth();

            const { data, error } = await supabase
                .from('transactions')
                .select('category_id, amount_rp')
                .eq('year_month', month);

            if (error) throw error;

            const grouped: Record<string, number> = {};
            for (const t of data || []) {
                if (t.category_id) {
                    grouped[t.category_id] = (grouped[t.category_id] || 0) + (t.amount_rp || 0);
                }
            }

            const breakdown = Object.entries(grouped).map(([categoryId, total]) => ({ categoryId, total }));
            return res.status(200).json(breakdown);
        }

        // === INCOME TREND ===
        if (endpoint === 'income-trend') {
            const { from, to } = req.query;

            let query = supabase.from('income').select('year_month, amount_rp');
            if (from) query = query.gte('year_month', from);
            if (to) query = query.lte('year_month', to);

            const { data, error } = await query;
            if (error) throw error;

            const grouped: Record<string, number> = {};
            for (const i of data || []) {
                grouped[i.year_month] = (grouped[i.year_month] || 0) + (i.amount_rp || 0);
            }

            const trend = Object.entries(grouped)
                .map(([month, total]) => ({ month, total }))
                .sort((a, b) => a.month.localeCompare(b.month));

            return res.status(200).json(trend);
        }

        // === INCOME BREAKDOWN ===
        if (endpoint === 'income-breakdown') {
            const month = (req.query.month as string) || getCurrentMonth();

            const { data, error } = await supabase
                .from('income')
                .select('source_id, amount_rp')
                .eq('year_month', month);

            if (error) throw error;

            const grouped: Record<string, number> = {};
            for (const i of data || []) {
                if (i.source_id) {
                    grouped[i.source_id] = (grouped[i.source_id] || 0) + (i.amount_rp || 0);
                }
            }

            const breakdown = Object.entries(grouped).map(([sourceId, total]) => ({ sourceId, total }));
            return res.status(200).json(breakdown);
        }

        // === CATEGORY TREND ===
        if (endpoint === 'trend/category') {
            const { categoryId, from, to, type } = req.query;
            const isDaily = type === 'daily';

            if (!categoryId) {
                return res.status(400).json({ error: { message: 'categoryId is required' } });
            }

            let query = supabase
                .from('transactions')
                .select('date_iso, year_month, amount_rp')
                .eq('category_id', categoryId);

            if (from) query = query.gte(isDaily ? 'date_iso' : 'year_month', from);
            if (to) query = query.lte(isDaily ? 'date_iso' : 'year_month', to);

            const { data, error } = await query;
            if (error) throw error;

            const grouped: Record<string, number> = {};
            for (const t of data || []) {
                const key = isDaily ? t.date_iso.substring(0, 10) : t.year_month;
                grouped[key] = (grouped[key] || 0) + (t.amount_rp || 0);
            }

            const trend = Object.entries(grouped)
                .map(([month, total]) => ({ month, total }))
                .sort((a, b) => a.month.localeCompare(b.month));

            return res.status(200).json(trend);
        }

        return res.status(404).json({ error: { message: `Unknown metrics endpoint: ${endpoint}` } });
    } catch (error: any) {
        console.error('Metrics API Error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
}
