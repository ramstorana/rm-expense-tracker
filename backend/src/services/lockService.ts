import { db } from '../db/index.js';
import { monthLocks, auditLog } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
    getWIBNowISO,
    getLastCompletedMonth,
    isPastLockThreshold,
    getMonthRange,
    getCurrentMonth
} from '../utils/time.js';

// Track last reconciliation date
let lastReconciliationDate: string | null = null;

/**
 * Check if a month is locked
 */
export const isMonthLocked = async (yearMonth: string): Promise<boolean> => {
    const lock = await db.query.monthLocks.findFirst({
        where: eq(monthLocks.yearMonth, yearMonth)
    });

    return lock?.status === 'locked';
};

/**
 * Assert that a month is unlocked, throw error if locked
 */
export const assertMonthUnlocked = async (yearMonth: string): Promise<void> => {
    const locked = await isMonthLocked(yearMonth);
    if (locked) {
        throw new Error(`MONTH_LOCKED: Cannot modify transactions for locked month ${yearMonth}`);
    }
};

/**
 * Get all month locks
 */
export const getAllLocks = async () => {
    return await db.select().from(monthLocks);
};

/**
 * Lock a specific month
 */
const lockMonth = async (yearMonth: string, actor: 'system' | 'RMT'): Promise<void> => {
    const now = getWIBNowISO();

    // Insert or update month lock
    const existing = await db.query.monthLocks.findFirst({
        where: eq(monthLocks.yearMonth, yearMonth)
    });

    if (existing) {
        await db.update(monthLocks)
            .set({
                status: 'locked',
                lockedAtISO: now,
                lastReconciledAtISO: now
            })
            .where(eq(monthLocks.yearMonth, yearMonth));
    } else {
        await db.insert(monthLocks).values({
            yearMonth,
            status: 'locked',
            lockedAtISO: now,
            lastReconciledAtISO: now
        });
    }

    // Write to audit log
    await db.insert(auditLog).values({
        id: uuidv4(),
        tsISO: now,
        actor,
        action: 'lock',
        month: yearMonth,
        reason: null
    });

    console.log(`🔒 Locked month ${yearMonth} by ${actor}`);
};

/**
 * Unlock a month for backfill
 */
export const unlockMonth = async (
    yearMonth: string,
    reason: string,
    initials: string
): Promise<void> => {
    const now = getWIBNowISO();

    await db.update(monthLocks)
        .set({
            status: 'unlocked',
            unlockedAtISO: now
        })
        .where(eq(monthLocks.yearMonth, yearMonth));

    // Write to audit log
    await db.insert(auditLog).values({
        id: uuidv4(),
        tsISO: now,
        actor: initials,
        action: 'unlock',
        month: yearMonth,
        reason
    });

    console.log(`🔓 Unlocked month ${yearMonth} by ${initials}: ${reason}`);
};

/**
 * Relock a previously unlocked month
 */
export const relockMonth = async (yearMonth: string): Promise<void> => {
    const now = getWIBNowISO();

    await db.update(monthLocks)
        .set({
            status: 'locked',
            lockedAtISO: now
        })
        .where(eq(monthLocks.yearMonth, yearMonth));

    // Write to audit log
    await db.insert(auditLog).values({
        id: uuidv4(),
        tsISO: now,
        actor: 'RMT',
        action: 'relock',
        month: yearMonth,
        reason: null
    });

    console.log(`🔒 Relocked month ${yearMonth}`);
};

/**
 * Reconcile locks - ensure all past months that should be locked are locked
 * Called on server start and on first API call of each new day
 */
export const reconcileLocks = async (): Promise<{ reconciled: string[], newlyLocked: number }> => {
    const now = getWIBNowISO();
    const lastCompletedMonth = getLastCompletedMonth();
    const currentMonth = getCurrentMonth();

    console.log(`🔄 Reconciling locks...`);
    console.log(`   Current WIB time: ${now}`);
    console.log(`   Last completed month: ${lastCompletedMonth}`);

    // Get all months from Jan 2025 to last completed month
    const monthsToCheck = getMonthRange('2025-01', lastCompletedMonth);

    const reconciled: string[] = [];
    let newlyLocked = 0;

    for (const month of monthsToCheck) {
        // Check if this month should be locked
        if (isPastLockThreshold(month)) {
            const lock = await db.query.monthLocks.findFirst({
                where: eq(monthLocks.yearMonth, month)
            });

            // If no lock exists or status is not 'locked', lock it
            if (!lock || lock.status !== 'locked') {
                await lockMonth(month, 'system');
                newlyLocked++;
            }

            reconciled.push(month);
        }
    }

    console.log(`✅ Reconciliation complete. Checked ${reconciled.length} months, locked ${newlyLocked} new.`);

    return { reconciled, newlyLocked };
};

/**
 * Check if we need to run daily reconciliation
 */
export const checkDailyReconciliation = async (): Promise<void> => {
    const today = getCurrentMonth().split('-').join('') + new Date().getDate().toString().padStart(2, '0');

    if (lastReconciliationDate !== today) {
        await reconcileLocks();
        lastReconciliationDate = today;
    }
};
