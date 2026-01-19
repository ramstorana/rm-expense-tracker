import { Router } from 'express';
import { supabase, toCamelCase, toSnakeCase } from '../db/supabase.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { getYearMonth, getWIBNowISO } from '../utils/time.js';
import { assertMonthUnlocked } from '../services/lockService.js';

const router = Router();

// Validation schemas
const createIncomeSchema = z.object({
    dateISO: z.string(),
    sourceId: z.string().uuid(),
    description: z.string().min(1),
    amountRp: z.number().int().min(0)
});

const updateIncomeSchema = z.object({
    dateISO: z.string().optional(),
    sourceId: z.string().uuid().optional(),
    description: z.string().min(1).optional(),
    amountRp: z.number().int().min(0).optional()
});

// GET /income - List income entries with optional filters
router.get('/', async (req, res) => {
    try {
        const { month, sourceId } = req.query;

        let query = supabase
            .from('income')
            .select('*')
            .order('date_iso', { ascending: false });

        if (month) query = query.eq('year_month', month);
        if (sourceId) query = query.eq('source_id', sourceId);

        const { data, error } = await query;

        if (error) throw error;

        res.json(toCamelCase(data));
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// POST /income - Create a new income entry
router.post('/', async (req, res) => {
    try {
        const data = createIncomeSchema.parse(req.body);

        // Derive year-month in WIB context
        const yearMonth = getYearMonth(data.dateISO);

        // Check if month is locked
        await assertMonthUnlocked(yearMonth);

        const now = getWIBNowISO();
        const newIncome = {
            id: uuidv4(),
            dateISO: data.dateISO,
            yearMonth: yearMonth,
            sourceId: data.sourceId,
            description: data.description,
            amountRp: data.amountRp,
            createdAtISO: now,
            updatedAtISO: now
        };

        const { error } = await supabase
            .from('income')
            .insert(toSnakeCase(newIncome));

        if (error) throw error;

        res.status(201).json(newIncome);
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

// PATCH /income/:id - Update an income entry
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateIncomeSchema.parse(req.body);

        // Get existing income entry
        const { data: existing, error: fetchError } = await supabase
            .from('income')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Income entry not found' } });
        }

        const existingCamel = toCamelCase(existing);

        // Check if current month is locked
        await assertMonthUnlocked(existingCamel.yearMonth);

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
        if (data.sourceId) updates.sourceId = data.sourceId;
        if (data.description) updates.description = data.description;
        if (data.amountRp !== undefined) updates.amountRp = data.amountRp;

        const { data: updated, error: updateError } = await supabase
            .from('income')
            .update(toSnakeCase(updates))
            .eq('id', id)
            .select()
            .single();

        if (updateError) throw updateError;

        res.json(toCamelCase(updated));
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

// DELETE /income/:id - Delete an income entry
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get existing income entry
        const { data: existing, error: fetchError } = await supabase
            .from('income')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !existing) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Income entry not found' } });
        }

        const existingCamel = toCamelCase(existing);

        // Check if month is locked
        await assertMonthUnlocked(existingCamel.yearMonth);

        const { error: deleteError } = await supabase
            .from('income')
            .delete()
            .eq('id', id);

        if (deleteError) throw deleteError;

        res.status(204).send();
    } catch (error: any) {
        if (error.message?.startsWith('MONTH_LOCKED')) {
            return res.status(403).json({ error: { code: 'MONTH_LOCKED', message: error.message } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

export default router;
