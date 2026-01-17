# Project Brief — WIB Expense Tracker

## Purpose
- Single-user, local-first expense tracker focused purely on expenses.

## Core Features
- Transaction entry: date (WIB), category, description, amount (IDR).
- Category breakdown and totals.
- Metrics:
  - MoM: previous month → current month.
  - YoY: last completed month vs same month prior year (e.g., Dec 2025 vs Dec 2024 as of Jan 16, 2026).
  - Trend: Jan 2025 → current month.
- Auto-lock months at WIB month-end; allow controlled unlock for backfill with audit log.
- No income, no budgets, no assets, no exports.

## Non-Goals
- No syncing, no multi-user, no auth, no mobile app, no PDF/CSV exports.

## UX
- Fast keyboard entry form.
- Transactions table with filters (month, category, search).
- Dashboard tiles: Total this month, MoM %, YoY % (for last completed month), categories breakdown, line chart.

## Assumptions
- Currency: IDR (store integers in rupiah).
- Timezone: Asia/Jakarta for all logic and grouping.

## Success Criteria
- Enter, view, edit expenses quickly.
- Accurate locks by WIB.
- Metrics match formulas precisely.
