import { Router } from 'express';
import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { eq, sql, like } from 'drizzle-orm';
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
    const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${transactions.amountRp}), 0)` })
        .from(transactions)
        .where(eq(transactions.yearMonth, yearMonth));

    return result[0]?.total ?? 0;
};

/**
 * Get total expenses for a given day
 */
const getDayTotal = async (date: string): Promise<number> => {
    const result = await db
        .select({ total: sql<number>`COALESCE(SUM(${transactions.amountRp}), 0)` })
        .from(transactions)
        .where(like(transactions.dateISO, `${date}%`));

    return result[0]?.total ?? 0;
};

// GET /metrics/summary - Get MoM, YoY, and totals
router.get('/summary', async (req, res) => {
    try {
        const month = (req.query.month as string) || getCurrentMonth();

        // Current month total
        const totalCurrent = await getMonthTotal(month);

        // Previous month total (for MoM)
        const prevMonth = getPreviousMonth(month);
        const totalPrev = await getMonthTotal(prevMonth);

        // Calculate MoM percentage
        let momPct: number | null = null;
        if (totalPrev > 0) {
            momPct = ((totalCurrent - totalPrev) / totalPrev) * 100;
        }

        // YoY: last completed month vs same month prior year
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
            totalCurrent,
            totalPrev,
            momPct,
            yoyMonth: lastCompleted,
            yoyPriorYearMonth,
            yoyCurrentTotal,
            yoyPrevYearTotal,
            yoyPct
        });
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// GET /metrics/trend - Get totals for trend chart
router.get('/trend', async (req, res) => {
    try {
        const granularity = (req.query.type as string) || 'monthly';
        const from = (req.query.from as string) || '2025-01';
        const to = (req.query.to as string) || getCurrentMonth();

        let trend;

        if (granularity === 'daily') {
            // For daily, we presume from/to are YYYY-MM-DD or compatible
            // If checking fails, we might get empty results
            const dates = getDayRange(from, to);

            trend = await Promise.all(
                dates.map(async (date) => ({
                    month: date, // Using 'month' key for compatibility, but it holds date
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

// GET /metrics/breakdown - Get category breakdown for a month
router.get('/breakdown', async (req, res) => {
    try {
        const month = (req.query.month as string) || getCurrentMonth();

        const result = await db
            .select({
                categoryId: transactions.categoryId,
                total: sql<number>`SUM(${transactions.amountRp})`
            })
            .from(transactions)
            .where(eq(transactions.yearMonth, month))
            .groupBy(transactions.categoryId);

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

export default router;
