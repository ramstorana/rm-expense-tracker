import { db } from './index.js';
import { categories } from './schema.js';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_CATEGORIES = [
    'Food',
    'Transport',
    'Housing',
    'Utilities',
    'Health',
    'Entertainment',
    'Shopping',
    'Education',
    'Travel',
    'Other'
];

const seedCategories = async () => {
    console.log('🌱 Seeding default categories...');

    for (const name of DEFAULT_CATEGORIES) {
        try {
            await db.insert(categories).values({
                id: uuidv4(),
                name,
                archived: false
            }).onConflictDoNothing();
        } catch (error) {
            // Category already exists, skip
            console.log(`  Category "${name}" already exists, skipping`);
        }
    }

    console.log('✅ Default categories seeded');
};

seedCategories();
