import { Router } from 'express';
import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getYearMonth, getWIBNowISO } from '../utils/time.js';
import { assertMonthUnlocked } from '../services/lockService.js';

const router = Router();

// Validation schemas
const createTransactionSchema = z.object({
    dateISO: z.string(),
    categoryId: z.string().uuid(),
    description: z.string().min(1),
    amountRp: z.number().int().min(0)
});

const updateTransactionSchema = z.object({
    dateISO: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    description: z.string().min(1).optional(),
    amountRp: z.number().int().min(0).optional()
});

// GET /transactions - List transactions with optional filters
router.get('/', async (req, res) => {
    try {
        const { month, categoryId } = req.query;

        let query = db.select().from(transactions).orderBy(desc(transactions.dateISO));

        const results = await query;

        // Filter in memory for simplicity (could optimize with proper WHERE clauses)
        let filtered = results;

        if (month) {
            filtered = filtered.filter(t => t.yearMonth === month);
        }

        if (categoryId) {
            filtered = filtered.filter(t => t.categoryId === categoryId);
        }

        res.json(filtered);
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// POST /transactions - Create a new transaction
router.post('/', async (req, res) => {
    try {
        const data = createTransactionSchema.parse(req.body);

        // Derive year-month in WIB context
        const yearMonth = getYearMonth(data.dateISO);

        // Check if month is locked
        await assertMonthUnlocked(yearMonth);

        const now = getWIBNowISO();
        const newTransaction = {
            id: uuidv4(),
            dateISO: data.dateISO,
            yearMonth,
            categoryId: data.categoryId,
            description: data.description,
            amountRp: data.amountRp,
            createdAtISO: now,
            updatedAtISO: now
        };

        await db.insert(transactions).values(newTransaction);

        res.status(201).json(newTransaction);
    } catch (error: any) {
        if (error.message?.startsWith('MONTH_LOCKED')) {
            return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: error.message } });
        }
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// PATCH /transactions/:id - Update a transaction
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateTransactionSchema.parse(req.body);

        // Get existing transaction
        const existing = await db.query.transactions.findFirst({
            where: eq(transactions.id, id)
        });

        if (!existing) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
        }

        // Check if current month is locked
        await assertMonthUnlocked(existing.yearMonth);

        // If date is changing, check the new month too
        if (data.dateISO) {
            const newYearMonth = getYearMonth(data.dateISO);
            await assertMonthUnlocked(newYearMonth);
        }

        const now = getWIBNowISO();
        const updates: any = { updatedAtISO: now };

        if (data.dateISO) {
            updates.dateISO = data.dateISO;
            updates.yearMonth = getYearMonth(data.dateISO);
        }
        if (data.categoryId) updates.categoryId = data.categoryId;
        if (data.description) updates.description = data.description;
        if (data.amountRp !== undefined) updates.amountRp = data.amountRp;

        await db.update(transactions).set(updates).where(eq(transactions.id, id));

        const updated = await db.query.transactions.findFirst({
            where: eq(transactions.id, id)
        });

        res.json(updated);
    } catch (error: any) {
        if (error.message?.startsWith('MONTH_LOCKED')) {
            return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: error.message } });
        }
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// DELETE /transactions/:id - Delete a transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get existing transaction
        const existing = await db.query.transactions.findFirst({
            where: eq(transactions.id, id)
        });

        if (!existing) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Transaction not found' } });
        }

        // Check if month is locked
        await assertMonthUnlocked(existing.yearMonth);

        await db.delete(transactions).where(eq(transactions.id, id));

        res.status(204).send();
    } catch (error: any) {
        if (error.message?.startsWith('MONTH_LOCKED')) {
            return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: error.message } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

export default router;
