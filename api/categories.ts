import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase, toCamelCase } from './_lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;
            return res.status(200).json(toCamelCase(data));
        }

        if (req.method === 'POST') {
            const { name } = req.body;
            if (!name || typeof name !== 'string') {
                return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name is required' } });
            }

            const newCategory = {
                id: uuidv4(),
                name,
                archived: false
            };

            const { data, error } = await supabase
                .from('categories')
                .insert(newCategory)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Category name already exists' } });
                }
                throw error;
            }

            return res.status(201).json(toCamelCase(data));
        }

        if (req.method === 'PATCH') {
            const { id: pathId } = req.query;
            const id = Array.isArray(pathId) ? pathId[0] : pathId;
            const { name, archived } = req.body;

            const updateData: any = {};
            if (name !== undefined) updateData.name = name;
            if (archived !== undefined) updateData.archived = archived;

            const { data, error } = await supabase
                .from('categories')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Category name already exists' } });
                }
                throw error;
            }

            if (!data) {
                return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Category not found' } });
            }

            return res.status(200).json(toCamelCase(data));
        }

        return res.status(405).json({ error: { message: 'Method not allowed' } });
    } catch (error: any) {
        console.error('Categories API Error:', error);
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message } });
    }
}
