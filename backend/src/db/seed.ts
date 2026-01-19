import { supabase } from './supabase.js';
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
    'Other',
    "Baby's needs",
    'Hobby',
    'Charity'
];

const DEFAULT_EXPENSE_SOURCES = [
    { name: "Mar's Account", type: 'bank_account' },
    { name: "Ram's Account", type: 'bank_account' },
    { name: "Mandiri CC", type: 'credit_card' },
    { name: "BCA CC", type: 'credit_card' },
];

const DEFAULT_INCOME_SOURCES = [
    'Paycheck',
    'Bonuses',
    'Side Income',
];

const seedCategories = async () => {
    console.log('🌱 Seeding default categories...');

    for (const name of DEFAULT_CATEGORIES) {
        const { error } = await supabase
            .from('categories')
            .upsert({ id: uuidv4(), name, archived: false }, { onConflict: 'name' });

        if (error && !error.message.includes('duplicate')) {
            console.error(`  Error seeding category "${name}":`, error.message);
        }
    }

    console.log('✅ Default categories seeded');
};

const seedExpenseSources = async () => {
    console.log('🌱 Seeding default expense sources...');

    for (const source of DEFAULT_EXPENSE_SOURCES) {
        const { error } = await supabase
            .from('expense_sources')
            .upsert({ id: uuidv4(), name: source.name, type: source.type, archived: false }, { onConflict: 'name' });

        if (error && !error.message.includes('duplicate')) {
            console.error(`  Error seeding expense source "${source.name}":`, error.message);
        }
    }

    console.log('✅ Default expense sources seeded');
};

const seedIncomeSources = async () => {
    console.log('🌱 Seeding default income sources...');

    for (const name of DEFAULT_INCOME_SOURCES) {
        const { error } = await supabase
            .from('income_sources')
            .upsert({ id: uuidv4(), name, archived: false }, { onConflict: 'name' });

        if (error && !error.message.includes('duplicate')) {
            console.error(`  Error seeding income source "${name}":`, error.message);
        }
    }

    console.log('✅ Default income sources seeded');
};

const seed = async () => {
    console.log('🚀 Starting Supabase seed...');
    await seedCategories();
    await seedExpenseSources();
    await seedIncomeSources();
    console.log('🎉 Seed complete!');
    process.exit(0);
};

seed();
