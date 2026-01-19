import { Router } from 'express';
import { supabase, toCamelCase, toSnakeCase } from '../db/supabase.js';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Validation schemas
const createCategorySchema = z.object({
    name: z.string().min(1).max(50)
});

const updateCategorySchema = z.object({
    name: z.string().min(1).max(50).optional(),
    archived: z.boolean().optional()
});

// GET /categories - List all categories
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (error) throw error;

        res.json(toCamelCase(data));
    } catch (error: any) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// POST /categories - Create a new category
router.post('/', async (req, res) => {
    try {
        const data = createCategorySchema.parse(req.body);

        const newCategory = {
            id: uuidv4(),
            name: data.name,
            archived: false
        };

        const { data: inserted, error } = await supabase
            .from('categories')
            .insert(newCategory)
            .select()
            .single();

        if (error) {
            // Check for unique constraint violation
            if (error.code === '23505') { // Postgres unique violation code
                return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Category name already exists' } });
            }
            throw error;
        }

        res.status(201).json(toCamelCase(inserted));
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// PATCH /categories/:id - Update a category
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateCategorySchema.parse(req.body);

        // Update directly
        const { data: updated, error } = await supabase
            .from('categories')
            .update(toSnakeCase(data))
            .eq('id', id)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Category name already exists' } });
            }
            throw error;
        }

        if (!updated) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found' } });
        }

        res.json(toCamelCase(updated));
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

export default router;
