# Debug Strategy

## 1. Locking Misfires

**Symptom:** Month not locked when expected, or locked too early.

**Debug Steps:**
1. Add logging in `reconcileLocks()` that prints:
   - Server `now()` in both WIB and UTC
   - Computed `lastCompletedMonth`
   - Current lock statuses from DB
2. Check if `/admin/reconcile-locks` is being called on boot
3. Verify daily first-call trigger is firing

**Fix:**
- Ensure lock check runs on server start in `index.ts`
- Add middleware to check date change on each request

---

## 2. Timezone Drift

**Symptom:** Transactions appearing in wrong month, metrics mismatch.

**Debug Steps:**
1. Inject logging before month math:
   ```typescript
   console.log('Server now (UTC):', dayjs.utc().format());
   console.log('Server now (WIB):', dayjs().tz('Asia/Jakarta').format());
   console.log('yearMonth:', getYearMonth(dateISO));
   ```
2. Check if `dayjs.tz` is properly initialized with timezone plugin
3. Verify stored `date_iso` has correct offset (+07:00)

**Fix:**
- Ensure all date operations use `dayjs().tz('Asia/Jakarta')`
- Never use `new Date()` directly; always go through dayjs

---

## 3. Chart vs Tile Mismatch

**Symptom:** Dashboard tile shows different total than chart tooltip.

**Debug Steps:**
1. Log the aggregation query result
2. Compare tile query vs chart data endpoint
3. Check for off-by-one in month range

**Fix:**
- Create single aggregation function `getMonthlyTotals(from, to)`
- Reuse in both tile component and chart data endpoint
- Add unit test comparing outputs

---

## 4. Transaction CRUD Failures

**Symptom:** Create/Update/Delete silently fails or returns wrong error.

**Debug Steps:**
1. Check lock status for target month before operation
2. Log Zod validation result
3. Verify category exists and is not archived

**Fix:**
- Add explicit lock check in each CRUD handler
- Return specific error codes (MONTH_LOCKED, CATEGORY_ARCHIVED)

---

## 5. SQLite Connection Issues

**Symptom:** "Database is locked" or "SQLITE_BUSY" errors.

**Debug Steps:**
1. Check if multiple connections are open
2. Verify WAL mode is enabled
3. Check for long-running transactions

**Fix:**
- Use single database instance via singleton
- Enable WAL: `PRAGMA journal_mode=WAL`
- Add connection pool timeout

---

## Self-Annealing Rule

When any bug is fixed:
1. Add a rule in `system_rules.md` describing the constraint
2. Add a unit test that would catch the regression
3. Document the root cause here with date

### Log
| Date | Bug | Root Cause | Rule Added |
|------|-----|------------|------------|
| (template) | Description | Why it happened | system_rules.md #X |
