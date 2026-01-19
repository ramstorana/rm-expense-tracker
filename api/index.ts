import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';

// Import routes
import categoriesRouter from '../backend/src/routes/categories.js';
import expenseSourcesRouter from '../backend/src/routes/expenseSources.js';
import incomeSourcesRouter from '../backend/src/routes/incomeSources.js';
import transactionsRouter from '../backend/src/routes/transactions.js';
import incomeRouter from '../backend/src/routes/income.js';
import metricsRouter from '../backend/src/routes/metrics.js';
import locksRouter from '../backend/src/routes/locks.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routes
app.use('/api/categories', categoriesRouter);
app.use('/api/expense-sources', expenseSourcesRouter);
app.use('/api/income-sources', incomeSourcesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/income', incomeRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/locks', locksRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vercel serverless handler
export default function handler(req: VercelRequest, res: VercelResponse) {
    return app(req as any, res as any);
}
