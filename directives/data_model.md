# Data Model

## Database: SQLite
**File:** `./data/expenses.db`

---

## Tables

### transactions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID | Primary key |
| date_iso | TEXT | NOT NULL | ISO 8601 with offset |
| year_month | TEXT | NOT NULL, INDEX | Derived "YYYY-MM" in WIB |
| category_id | TEXT | FK → categories.id | Category reference |
| description | TEXT | NOT NULL | Transaction description |
| amount_rp | INTEGER | NOT NULL, >= 0 | Amount in rupiah |
| created_at_iso | TEXT | NOT NULL | Creation timestamp |
| updated_at_iso | TEXT | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_transactions_year_month` on `year_month`
- `idx_transactions_category` on `category_id`

---

### categories
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID | Primary key |
| name | TEXT | NOT NULL, UNIQUE | Category name |
| archived | INTEGER | DEFAULT 0 | Boolean (0/1) |

**Default Categories:**
1. Food
2. Transport
3. Housing
4. Utilities
5. Health
6. Entertainment
7. Shopping
8. Education
9. Travel
10. Other

---

### month_locks
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| year_month | TEXT | PK | "YYYY-MM" format |
| status | TEXT | NOT NULL | "locked" or "unlocked" |
| locked_at_iso | TEXT | | When status became locked |
| unlocked_at_iso | TEXT | | If currently unlocked |
| last_reconciled_at_iso | TEXT | | Last reconciliation check |

---

### audit_log
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, UUID | Primary key |
| ts_iso | TEXT | NOT NULL | Event timestamp |
| actor | TEXT | NOT NULL | "system" or "RMT" |
| action | TEXT | NOT NULL | "lock", "unlock", "relock" |
| month | TEXT | NOT NULL | Target "YYYY-MM" |
| reason | TEXT | | Reason (for unlock) |

---

## Drizzle Schema

```typescript
// schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  dateISO: text('date_iso').notNull(),
  yearMonth: text('year_month').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  description: text('description').notNull(),
  amountRp: integer('amount_rp').notNull(),
  createdAtISO: text('created_at_iso').notNull(),
  updatedAtISO: text('updated_at_iso').notNull(),
});

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  archived: integer('archived', { mode: 'boolean' }).default(false),
});

export const monthLocks = sqliteTable('month_locks', {
  yearMonth: text('year_month').primaryKey(),
  status: text('status').notNull(),
  lockedAtISO: text('locked_at_iso'),
  unlockedAtISO: text('unlocked_at_iso'),
  lastReconciledAtISO: text('last_reconciled_at_iso'),
});

export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  tsISO: text('ts_iso').notNull(),
  actor: text('actor').notNull(),
  action: text('action').notNull(),
  month: text('month').notNull(),
  reason: text('reason'),
});
```
