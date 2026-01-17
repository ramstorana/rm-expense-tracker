# Test Plan

## Unit Tests (Vitest)

### Time Utilities
- `getWIBNow()` returns correct WIB time
- `getYearMonth(dateISO)` extracts correct YYYY-MM in WIB
- `getLastCompletedMonth()` returns previous month in WIB
- Month boundary edge cases (e.g., 23:59 Dec 31 vs 00:00 Jan 1)

### Aggregation Queries
- Monthly totals sum correctly
- Category breakdown groups correctly
- Empty months return 0

### Metrics Math
- MoM: (5000 - 4000) / 4000 = 25%
- MoM: division by zero returns null
- YoY: (4500 - 4000) / 4000 = 12.5%
- YoY: no prior year data returns null

### Lock Gate
- `isMonthLocked("2025-12")` returns true after lock
- `canWriteToMonth("2025-12")` returns false when locked
- Transaction insert rejects locked month
- Transaction update rejects locked month
- Transaction delete rejects locked month

---

## E2E Tests (Playwright)

### Test 1: Add Expenses and View Totals
1. Navigate to transactions page
2. Add 3 expenses with different categories
3. Verify totals update in dashboard tile
4. Verify chart updates to show new data

### Test 2: Lock Reconciliation on Startup
1. Set system time to Dec 15, 2025
2. Add an expense for Dec 2025
3. Advance clock to Jan 2, 2026 00:01 WIB
4. Restart server
5. Verify Dec 2025 is now locked
6. Attempt to add expense for Dec 2025 → expect blocked message

### Test 3: Edit Blocked on Locked Month
1. Ensure Dec 2025 is locked
2. Navigate to Dec 2025 transactions
3. Click edit on a transaction
4. Attempt to save → expect error message "Month is locked"

### Test 4: Unlock → Edit → Relock Flow
1. Dec 2025 is locked
2. Click "Unlock Month" button
3. Enter reason: "Missing receipt"
4. Verify unlock succeeds, audit log updated
5. Edit a transaction → succeeds
6. Click "Relock Month"
7. Attempt edit again → blocked

### Test 5: YoY Tile Verification
1. Seed data: Dec 2024 = 4,000,000 IDR, Dec 2025 = 4,500,000 IDR
2. Set current date to Jan 16, 2026
3. Navigate to dashboard
4. Verify YoY tile shows "12.5%" and label "Dec 2025 vs Dec 2024"

---

## Test Commands

```bash
# Run unit tests
npm run test

# Run E2E tests
npm run e2e

# Run specific test file
npm run test -- time-utils.test.ts

# Run tests with coverage
npm run test -- --coverage
```

---

## Test Data Fixtures

```typescript
// fixtures/test-data.ts
export const testCategories = [
  { id: 'cat-food', name: 'Food', archived: false },
  { id: 'cat-transport', name: 'Transport', archived: false },
];

export const testTransactions = [
  {
    id: 'tx-1',
    dateISO: '2025-12-15T12:00:00+07:00',
    yearMonth: '2025-12',
    categoryId: 'cat-food',
    description: 'Lunch',
    amountRp: 50000,
  },
  {
    id: 'tx-2',
    dateISO: '2025-12-16T14:00:00+07:00',
    yearMonth: '2025-12',
    categoryId: 'cat-transport',
    description: 'Taxi',
    amountRp: 75000,
  },
];
```
