import { Router } from 'express';
import { supabase, toCamelCase } from '../db/supabase.js';

const router = Router();

// GET /income-sources - List all income sources
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('income_sources')
            .select('*')
            .order('name');

        if (error) throw error;

        res.json(toCamelCase(data));
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// GET /income-sources/active - List non-archived income sources
router.get('/active', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('income_sources')
            .select('*')
            .eq('archived', false)
            .order('name');

        if (error) throw error;

        res.json(toCamelCase(data));
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

export default router;
