import express from 'express';
import cors from 'cors';

// Import routes
import transactionsRouter from './routes/transactions.js';
import categoriesRouter from './routes/categories.js';
import metricsRouter from './routes/metrics.js';
import locksRouter from './routes/locks.js';
import expenseSourcesRouter from './routes/expenseSources.js';
import incomeSourcesRouter from './routes/incomeSources.js';
import incomeRouter from './routes/income.js';

// Import services
import { reconcileLocks, checkDailyReconciliation } from './services/lockService.js';

// Import database to ensure tables are created
// Import database to ensure tables are created (using Supabase now, so no local migration needed on start)
// import './db/migrate.js';

const app = express();
const PORT = process.env.PORT || 5180;

// Middleware
app.use(cors({
    origin: ['http://localhost:5181', 'http://localhost:5175'],
    credentials: true
}));
app.use(express.json());

// Daily reconciliation middleware
app.use(async (req, res, next) => {
    try {
        await checkDailyReconciliation();
    } catch (error) {
        console.error('Daily reconciliation check failed:', error);
    }
    next();
});

// Routes
app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/locks', locksRouter);
app.use('/api/expense-sources', expenseSourcesRouter);
app.use('/api/income-sources', incomeSourcesRouter);
app.use('/api/income', incomeRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
const startServer = async () => {
    try {
        // Run initial lock reconciliation on startup
        console.log('🚀 Starting RM Financial Tracker Backend...');
        await reconcileLocks();

        app.listen(PORT, () => {
            console.log(`✅ Server running on http://localhost:${PORT}`);
            console.log(`   API base: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
