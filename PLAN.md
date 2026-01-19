# Project Plan

## Phase 1: Supabase Migration (Backend)
- [x] Refactor `transactions` route to Supabase
- [x] Refactor `categories` route to Supabase
- [x] Refactor `income` route to Supabase
- [x] Refactor `metrics` route to Supabase
- [x] Refactor `lockService` to Supabase
- [x] Verify `seed` script uses Supabase
- [x] Remove local SQLite dependencies and files
- [x] Verify data flow with `verify-supabase-data-flow.ts`

## Phase 2: Frontend & UI Quality
- [x] Verify UI functionality with backend (requires server restart)
- [ ] Run Visual Quality Audit (`/audit`)
- [ ] Fix any visual regressions

## Phase 3: Deployment
- [x] Ensure Vercel environment variables are set
- [x] Deploy to Vercel
- [ ] Verify functionality on production URL
