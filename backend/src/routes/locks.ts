import { Router } from 'express';
import { z } from 'zod';
import {
    getAllLocks,
    unlockMonth,
    relockMonth,
    reconcileLocks
} from '../services/lockService.js';

const router = Router();

// Validation schemas
const unlockSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/),
    reason: z.string().min(1),
    initials: z.string().min(1)
});

const relockSchema = z.object({
    month: z.string().regex(/^\d{4}-\d{2}$/)
});

// GET /locks - Get all lock statuses
router.get('/', async (req, res) => {
    try {
        const locks = await getAllLocks();
        res.json(locks);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// POST /locks/unlock - Unlock a month for backfill
router.post('/unlock', async (req, res) => {
    try {
        const data = unlockSchema.parse(req.body);

        await unlockMonth(data.month, data.reason, data.initials);

        res.json({ success: true, month: data.month, status: 'unlocked' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// POST /locks/relock - Relock a month
router.post('/relock', async (req, res) => {
    try {
        const data = relockSchema.parse(req.body);

        await relockMonth(data.month);

        res.json({ success: true, month: data.month, status: 'locked' });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// POST /admin/reconcile-locks - Manually trigger lock reconciliation
router.post('/admin/reconcile', async (req, res) => {
    try {
        const result = await reconcileLocks();
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

export default router;
