# Acceptance Criteria

## A1. Transaction Entry
I can add an expense with date, category, description, amount; it appears in the table.

## A2. Category Totals
Category totals and breakdown match transaction data for the selected month (WIB).

## A3. MoM Calculation
MoM = (Total_current - Total_prev) / Total_prev, defined for current month (partial).
- If denominator = 0, display "—"

## A4. YoY Calculation
YoY compares the last completed month vs same month prior year.
- Example: Dec 2025 vs Dec 2024 as of Jan 16, 2026.
- If prior year has no data, display "—"

## A5. Trend Chart
Trend shows monthly totals from Jan 2025 → current month inclusive.
- X-axis: months
- Y-axis: total expenses (IDR)

## A6. Auto-Lock
At 00:00:05 WIB on first of month, prior month becomes locked.
- Edits then fail with a clear message.
- Lock check runs on server start and first API call each day.

## A7. Unlock for Backfill
Unlocking requires:
- Explicit action
- Reason text
- Actor initials "RMT"
- Logs to audit_log with timestamp

## A8. Relock
Relocking works and prevents further edits.
- Actor: "RMT" or "system"
- Logged to audit_log

## A9. No Export
No export buttons exist in the UI.
- No CSV, PDF, or image export functionality.

## A10. WIB Date Handling
All dates shown and grouped in WIB (Asia/Jakarta).
- Unit tests confirm month boundaries are WIB-based.
- No local machine timezone influence.
