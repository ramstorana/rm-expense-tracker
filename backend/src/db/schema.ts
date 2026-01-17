import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Transactions table
export const transactions = sqliteTable('transactions', {
    id: text('id').primaryKey(),
    dateISO: text('date_iso').notNull(),
    yearMonth: text('year_month').notNull(),
    categoryId: text('category_id').notNull(),
    description: text('description').notNull(),
    amountRp: integer('amount_rp').notNull(),
    createdAtISO: text('created_at_iso').notNull(),
    updatedAtISO: text('updated_at_iso').notNull(),
});

// Categories table
export const categories = sqliteTable('categories', {
    id: text('id').primaryKey(),
    name: text('name').notNull().unique(),
    archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
});

// Month locks table
export const monthLocks = sqliteTable('month_locks', {
    yearMonth: text('year_month').primaryKey(),
    status: text('status').notNull(), // 'locked' | 'unlocked'
    lockedAtISO: text('locked_at_iso'),
    unlockedAtISO: text('unlocked_at_iso'),
    lastReconciledAtISO: text('last_reconciled_at_iso'),
});

// Audit log table
export const auditLog = sqliteTable('audit_log', {
    id: text('id').primaryKey(),
    tsISO: text('ts_iso').notNull(),
    actor: text('actor').notNull(), // 'system' | 'RMT'
    action: text('action').notNull(), // 'lock' | 'unlock' | 'relock'
    month: text('month').notNull(),
    reason: text('reason'),
});

// Type exports
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type MonthLock = typeof monthLocks.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
