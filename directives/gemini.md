# gemini.md — Tech Context

## Stack
- Frontend: React + TS + Vite, Tailwind, Chart.js.
- Backend: Node + TS + Express.
- ORM/DB: Drizzle + SQLite (file: ./data/expenses.db).
- Time: dayjs + utc + timezone ("Asia/Jakarta").

## Libraries (pinned versions)
```
# Core
react@18.2.0
react-dom@18.2.0
vite@5.4.0
typescript@5.5.0

# Styling
tailwindcss@3.4.0
postcss@8.4.0
autoprefixer@10.4.0

# Charts
chart.js@4.4.0
chartjs-adapter-dayjs-4@1.0.4

# Time
dayjs@1.11.10

# Backend
express@4.21.0
zod@3.23.0
cors@2.8.5

# ORM/Database
drizzle-orm@0.33.0
drizzle-kit@0.24.0
better-sqlite3@11.3.0

# Dev dependencies
@types/node@20.14.0
@types/express@4.17.21
@types/cors@2.8.17
@types/better-sqlite3@7.6.11
ts-node@10.9.2
nodemon@3.1.0
concurrently@8.2.0

# Testing
vitest@2.0.0
@testing-library/react@16.0.0
playwright@1.47.0
```

## Dev Scripts
- `dev`: concurrently run backend and frontend; backend on 5174, frontend on 5173.
- `test`: unit tests via Vitest.
- `e2e`: Playwright flows.

## Environments
- Local only. No secrets required.
