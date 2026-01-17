# System Rules

## 1) Scope Enforcement
- Expenses only. Reject any income/asset/budget endpoints or UI.

## 2) Timezone and Locking
- All month boundaries and timestamps use Asia/Jakarta (WIB).
- Auto-lock occurs at 00:00:05 WIB on the first of each month for the prior month.
- On server start or first API call of a day, perform a lock-reconciliation pass.

## 3) Backfill
- Unlock past month only by explicit action with reason and initials "RMT".
- Record unlock/lock events in audit log with ISO timestamp (WIB context noted).
- While unlocked, edits allowed; relock must be explicit.

## 4) Data Constraints
- Amount is integer rupiah; no negatives.
- Date must be within the month when adding to a locked month (blocked unless unlocked).
- Category must exist and be active.

## 5) UI Constraints
- No export features.
- Charts show on screen only.

## 6) Security
- Localhost only. Sanitize inputs for XSS. Parameterized queries only.

## 7) Self-Annealing
- If we fix a recurring bug, add a new rule here to prevent regressions.
