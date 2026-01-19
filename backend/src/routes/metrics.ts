import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import {
    getCurrentMonth,
    getPreviousMonth,
    getLastCompletedMonth,
    getSameMonthPriorYear,
    getMonthRange,
    getDayRange
} from '../utils/time.js';

const router = Router();

/**
 * Get total expenses for a given month
 */
const getMonthTotal = async (yearMonth: string): Promise<number> => {
    const { data } = await supabase
        .from('transactions')
        .select('amount_rp')
        .eq('year_month', yearMonth);

    return data?.reduce((sum, t) => sum + t.amount_rp, 0) ?? 0;
};

/**
 * Get total expenses for a given day
 */
const getDayTotal = async (date: string): Promise<number> => {
    // date here is YYYY-MM-DD
    const { data } = await supabase
        .from('transactions')
        .select('amount_rp')
        .eq('date_iso', date);

    return data?.reduce((sum, t) => sum + t.amount_rp, 0) ?? 0;
};

/**
 * Get total income for a given month
 */
const getIncomeTotal = async (yearMonth: string): Promise<number> => {
    const { data } = await supabase
        .from('income')
        .select('amount_rp')
        .eq('year_month', yearMonth);

    return data?.reduce((sum, i) => sum + i.amount_rp, 0) ?? 0;
};

/**
 * Get total expenses for a given category and day
 */
const getCategoryDayTotal = async (date: string, categoryId: string): Promise<number> => {
    const { data } = await supabase
        .from('transactions')
        .select('amount_rp')
        .eq('date_iso', date)
        .eq('category_id', categoryId);

    return data?.reduce((sum, t) => sum + t.amount_rp, 0) ?? 0;
};

/**
 * Get total expenses for a given category and month
 */
const getCategoryMonthTotal = async (yearMonth: string, categoryId: string): Promise<number> => {
    const { data } = await supabase
        .from('transactions')
        .select('amount_rp')
        .eq('year_month', yearMonth)
        .eq('category_id', categoryId);

    return data?.reduce((sum, t) => sum + t.amount_rp, 0) ?? 0;
};


// GET /metrics/summary - Get MoM, YoY, and totals (Expenses & Income)
router.get('/summary', async (req, res) => {
    try {
        const month = (req.query.month as string) || getCurrentMonth();
        const prevMonth = getPreviousMonth(month);

        // 1. Expenses Logic
        // -----------------
        const totalCurrent = await getMonthTotal(month);
        const totalPrev = await getMonthTotal(prevMonth);

        let momPct: number | null = null;
        if (totalPrev > 0) {
            momPct = ((totalCurrent - totalPrev) / totalPrev) * 100;
        }

        // 2. Income Logic
        // ---------------
        const totalIncome = await getIncomeTotal(month);
        const totalIncomePrev = await getIncomeTotal(prevMonth);

        let incomeMomPct: number | null = null;
        if (totalIncomePrev > 0) {
            incomeMomPct = ((totalIncome - totalIncomePrev) / totalIncomePrev) * 100;
        }

        // 3. Savings Logic
        // ----------------
        const netSavings = totalIncome - totalCurrent;
        let savingsMomPct: number | null = null;
        // Calculate savings for prev month for MoM
        const netSavingsPrev = totalIncomePrev - totalPrev;

        if (netSavingsPrev !== 0) {
            savingsMomPct = ((netSavings - netSavingsPrev) / Math.abs(netSavingsPrev)) * 100;
        }

        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        // 4. YoY Logic (Expenses Only for now, based on original req)
        // -----------------------------------------------------------
        const lastCompleted = getLastCompletedMonth();
        const yoyPriorYearMonth = getSameMonthPriorYear(lastCompleted);
        const yoyCurrentTotal = await getMonthTotal(lastCompleted);
        const yoyPrevYearTotal = await getMonthTotal(yoyPriorYearMonth);

        let yoyPct: number | null = null;
        if (yoyPrevYearTotal > 0) {
            yoyPct = ((yoyCurrentTotal - yoyPrevYearTotal) / yoyPrevYearTotal) * 100;
        }

        res.json({
            month,
            // Expenses
            totalCurrent,
            totalPrev,
            momPct,
            // Income & Savings
            totalIncome,
            incomeMomPct,
            netSavings,
            savingsMomPct,
            savingsRate,
            // YoY
            yoyMonth: lastCompleted,
            yoyPriorYearMonth,
            yoyCurrentTotal,
            yoyPrevYearTotal,
            yoyPct
        });
    } catch (error: any) {
        console.error('Metrics summary error:', error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// GET /metrics/trend - Get expense totals for trend chart
router.get('/trend', async (req, res) => {
    try {
        const granularity = (req.query.type as string) || 'monthly';
        const from = (req.query.from as string) || '2025-01';
        const to = (req.query.to as string) || getCurrentMonth();

        let trend;

        if (granularity === 'daily') {
            const dates = getDayRange(from, to);
            trend = await Promise.all(
                dates.map(async (date) => ({
                    month: date,
                    total: await getDayTotal(date)
                }))
            );
        } else {
            const months = getMonthRange(from, to);
            trend = await Promise.all(
                months.map(async (month) => ({
                    month,
                    total: await getMonthTotal(month)
                }))
            );
        }

        res.json(trend);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// GET /metrics/breakdown - Get expense category breakdown for a month
router.get('/breakdown', async (req, res) => {
    try {
        const month = (req.query.month as string) || getCurrentMonth();

        const { data } = await supabase
            .from('transactions')
            .select('category_id, amount_rp')
            .eq('year_month', month);

        // Group and sum in memory
        const totals: Record<string, number> = {};
        if (data) {
            for (const t of data) {
                if (!t.category_id) continue;
                totals[t.category_id] = (totals[t.category_id] || 0) + t.amount_rp;
            }
        }

        const result = Object.entries(totals).map(([categoryId, total]) => ({
            categoryId,
            total
        }));

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// GET /metrics/income-trend - Get income totals for trend chart
router.get('/income-trend', async (req, res) => {
    try {
        const from = (req.query.from as string) || '2025-01';
        const to = (req.query.to as string) || getCurrentMonth();

        const months = getMonthRange(from, to);
        const trend = await Promise.all(
            months.map(async (month) => ({
                month,
                total: await getIncomeTotal(month)
            }))
        );

        res.json(trend);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// GET /metrics/income-breakdown - Get income source breakdown for a month
router.get('/income-breakdown', async (req, res) => {
    try {
        const month = (req.query.month as string) || getCurrentMonth();

        const { data } = await supabase
            .from('income')
            .select('source_id, amount_rp')
            .eq('year_month', month);

        // Group and sum in memory
        const totals: Record<string, number> = {};
        if (data) {
            for (const i of data) {
                if (!i.source_id) continue;
                totals[i.source_id] = (totals[i.source_id] || 0) + i.amount_rp;
            }
        }

        const result = Object.entries(totals).map(([sourceId, total]) => ({
            sourceId,
            total
        }));

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// GET /metrics/trend/category - Get expense totals for a specific category
router.get('/trend/category', async (req, res) => {
    try {
        const categoryId = req.query.categoryId as string;
        const granularity = (req.query.type as string) || 'monthly';
        const from = (req.query.from as string) || '2025-01';
        const to = (req.query.to as string) || getCurrentMonth();

        if (!categoryId) {
            return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'categoryId is required' } });
        }

        let trend;

        if (granularity === 'daily') {
            const dates = getDayRange(from, to);
            trend = await Promise.all(
                dates.map(async (date) => ({
                    month: date,
                    total: await getCategoryDayTotal(date, categoryId)
                }))
            );
        } else {
            const months = getMonthRange(from, to);
            trend = await Promise.all(
                months.map(async (month) => ({
                    month,
                    total: await getCategoryMonthTotal(month, categoryId)
                }))
            );
        }

        res.json(trend);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

export default router;
