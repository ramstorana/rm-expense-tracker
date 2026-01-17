import { Router } from 'express';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
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
        const allCategories = await db.select().from(categories);
        res.json(allCategories);
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

        await db.insert(categories).values(newCategory);

        res.status(201).json(newCategory);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        // Check for unique constraint violation
        if (error.message?.includes('UNIQUE')) {
            return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Category name already exists' } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

// PATCH /categories/:id - Update a category
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = updateCategorySchema.parse(req.body);

        // Get existing category
        const existing = await db.query.categories.findFirst({
            where: eq(categories.id, id)
        });

        if (!existing) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found' } });
        }

        const updates: any = {};
        if (data.name !== undefined) updates.name = data.name;
        if (data.archived !== undefined) updates.archived = data.archived;

        await db.update(categories).set(updates).where(eq(categories.id, id));

        const updated = await db.query.categories.findFirst({
            where: eq(categories.id, id)
        });

        res.json(updated);
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.errors } });
        }
        if (error.message?.includes('UNIQUE')) {
            return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Category name already exists' } });
        }
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
});

export default router;
