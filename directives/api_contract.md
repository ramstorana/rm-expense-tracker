# API Contract

**Base URL:** `http://localhost:5174/api`

---

## Transactions

### POST /transactions
Create a new expense transaction.
```json
{
  "dateISO": "2026-01-15T10:30:00+07:00",
  "categoryId": "uuid",
  "description": "Lunch at restaurant",
  "amountRp": 150000
}
```
**Behavior:** Rejects if target month is locked.

### GET /transactions
Query transactions with optional filters.
```
GET /transactions?month=2026-01&categoryId=uuid
```
**Response:**
```json
[
  {
    "id": "uuid",
    "dateISO": "2026-01-15T10:30:00+07:00",
    "yearMonth": "2026-01",
    "categoryId": "uuid",
    "categoryName": "Food",
    "description": "Lunch at restaurant",
    "amountRp": 150000,
    "createdAtISO": "...",
    "updatedAtISO": "..."
  }
]
```

### PATCH /transactions/:id
Update an existing transaction.
```json
{
  "description": "Updated description",
  "amountRp": 175000
}
```
**Behavior:** Rejects if target month is locked.

### DELETE /transactions/:id
Delete a transaction.
**Behavior:** Rejects if target month is locked.

---

## Categories

### GET /categories
List all categories (including archived).
```json
[
  { "id": "uuid", "name": "Food", "archived": false },
  { "id": "uuid", "name": "Transport", "archived": false }
]
```

### POST /categories
Create a new category.
```json
{ "name": "New Category" }
```

### PATCH /categories/:id
Update a category.
```json
{ "name": "Renamed Category", "archived": true }
```

---

## Metrics

### GET /metrics/summary
Get summary metrics for a given month.
```
GET /metrics/summary?month=2026-01
```
**Response:**
```json
{
  "totalCurrent": 5000000,
  "totalPrev": 4500000,
  "momPct": 11.11,
  "yoyMonth": "2025-12",
  "yoyPrevYearTotal": 4000000,
  "yoyCurrentTotal": 4500000,
  "yoyPct": 12.5
}
```
**Note:** `yoyMonth` = last completed month in WIB.

### GET /metrics/trend
Get monthly expense totals for a date range.
```
GET /metrics/trend?from=2025-01&to=2026-01
```
**Response:**
```json
[
  { "month": "2025-01", "total": 3500000 },
  { "month": "2025-02", "total": 4000000 },
  ...
]
```

---

## Locks

### GET /locks
Get status of all month locks.
```json
[
  {
    "yearMonth": "2025-12",
    "status": "locked",
    "lockedAtISO": "2026-01-01T00:00:05+07:00"
  }
]
```

### POST /locks/unlock
Unlock a past month for backfill.
```json
{
  "month": "2025-12",
  "reason": "Missing restaurant receipt",
  "initials": "RMT"
}
```

### POST /locks/relock
Relock a previously unlocked month.
```json
{ "month": "2025-12" }
```

---

## Admin

### POST /admin/reconcile-locks
Manually trigger lock reconciliation.
**Response:**
```json
{ "reconciled": ["2025-11", "2025-12"], "newlyLocked": 2 }
```

---

## Error Responses
All endpoints return errors in this format:
```json
{
  "error": {
    "code": "MONTH_LOCKED",
    "message": "Cannot modify transactions for locked month 2025-12"
  }
}
```

**Error Codes:**
- `MONTH_LOCKED` - Attempted write to locked month
- `VALIDATION_ERROR` - Invalid request body
- `NOT_FOUND` - Resource not found
- `CATEGORY_ARCHIVED` - Cannot use archived category
