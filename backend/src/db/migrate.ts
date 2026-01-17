import { sqlite } from './index.js';

// Create tables manually (since we're not using drizzle-kit migrations for simplicity)
const createTables = () => {
    // Transactions table
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date_iso TEXT NOT NULL,
      year_month TEXT NOT NULL,
      category_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount_rp INTEGER NOT NULL CHECK(amount_rp >= 0),
      created_at_iso TEXT NOT NULL,
      updated_at_iso TEXT NOT NULL
    )
  `);

    // Create indexes
    sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_year_month ON transactions(year_month)
  `);
    sqlite.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id)
  `);

    // Categories table
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      archived INTEGER NOT NULL DEFAULT 0
    )
  `);

    // Month locks table
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS month_locks (
      year_month TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      locked_at_iso TEXT,
      unlocked_at_iso TEXT,
      last_reconciled_at_iso TEXT
    )
  `);

    // Audit log table
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      ts_iso TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      month TEXT NOT NULL,
      reason TEXT
    )
  `);

    console.log('✅ Database tables created/verified');
};

createTables();
