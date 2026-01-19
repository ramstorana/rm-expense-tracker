# RM Financial Tracker

A single-user monthly finance tracker focused on income and expenses, with WIB (Asia/Jakarta) timezone support.

## Features

- 💰 Transaction entry with date, category, description, and amount (IDR)
- 📊 Dashboard with MoM, YoY metrics and trend charts
- 🔒 Auto-locking of past months with controlled unlock for backfill
- 📈 Category breakdown visualization
- 🕐 All date/time logic in WIB timezone

## Quick Start

```bash
# Install all dependencies
npm run setup

# Start development servers
npm run dev
```

This will start:
- Backend: http://localhost:5174
- Frontend: http://localhost:5173

## Project Structure

```
EXPENSE TRACKER/
├── backend/           # Express + TypeScript + Drizzle + SQLite
├── frontend/          # React + Vite + Tailwind + Chart.js
├── data/              # SQLite database file
└── directives/        # Project documentation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run setup` | Install deps + migrate + seed |
| `npm run db:migrate` | Create database tables |
| `npm run db:seed` | Insert default categories |
| `npm run test` | Run backend unit tests |

## Default Categories

Food, Transport, Housing, Utilities, Health, Entertainment, Shopping, Education, Travel, Other

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Chart.js
- **Backend**: Node.js, Express, TypeScript, Zod
- **Database**: Supabase (PostgreSQL)
- **Time**: dayjs with timezone support
- **Migration**: Fully migrated from SQLite to Supabase

## Vercel Environment Variables
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
