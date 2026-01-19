import { supabase } from '../db/supabase.js';

const inspect = async () => {
    console.log('🔍 Inspecting Supabase Data...\n');

    // 1. Expense Sources
    const { data: expenseSources, error: esError } = await supabase
        .from('expense_sources')
        .select('*')
        .eq('archived', false)
        .order('name');

    if (esError) console.error('❌ Error fetching expense sources:', esError.message);
    else {
        console.log('💳 Active Expense Sources:');
        expenseSources?.forEach(s => console.log(`   - ${s.name} (${s.type})`));
    }

    console.log('');

    // 2. Income Sources
    const { data: incomeSources, error: isError } = await supabase
        .from('income_sources')
        .select('*')
        .eq('archived', false)
        .order('name');

    if (isError) console.error('❌ Error fetching income sources:', isError.message);
    else {
        console.log('💰 Active Income Sources:');
        incomeSources?.forEach(s => console.log(`   - ${s.name}`));
    }

    console.log('');

    // 3. Categories (Count & Sample)
    const { data: categories, count: catCount, error: cError } = await supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .order('name');

    if (cError) console.error('❌ Error fetching categories:', cError.message);
    else {
        console.log(`📂 Categories (Total: ${catCount}):`);
        // Show first 5 and last 5 if many
        const toShow = categories && categories.length > 10
            ? [...categories.slice(0, 5), { name: '...' }, ...categories.slice(-5)]
            : categories;

        toShow?.forEach(c => console.log(`   - ${c.name}`));
    }

    console.log('');

    // 4. Transactions
    const { data: transactions, count: txnCount, error: tError } = await supabase
        .from('transactions')
        .select('*, categories(name)', { count: 'exact' })
        .order('date_iso', { ascending: false })
        .limit(5);

    if (tError) console.error('❌ Error fetching transactions:', tError.message);
    else {
        console.log(`📄 Transactions (Total: ${txnCount}):`);
        if (txnCount === 0) {
            console.log('   (No transactions found)');
        } else {
            console.log('   Latest 5 entries:');
            transactions?.forEach(t => {
                const catName = Array.isArray(t.categories) ? t.categories[0]?.name : t.categories?.name;
                console.log(`   - [${t.date_iso}] ${t.description}: Rp ${t.amount_rp.toLocaleString()} (${catName || 'No Category'})`);
            });
        }
    }

    process.exit(0);
};

inspect();
