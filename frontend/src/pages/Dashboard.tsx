import { useState, useEffect, useCallback } from 'react';
import { api, type Transaction, type Category, type MetricsSummary, type TrendDataPoint, type CategoryBreakdown, type MonthLock } from '../api/client';
import { getCurrentMonth, formatRupiah, formatPercent, formatMonth, getWIBToday } from '../utils/format';
import dayjs from 'dayjs';
import TransactionForm from '../components/TransactionForm';
import TransactionsTable from '../components/TransactionsTable';
import MetricTile from '../components/MetricTile';
import TrendChart from '../components/TrendChart';
import CategoryBreakdownChart from '../components/CategoryBreakdownChart';
import LockManager from '../components/LockManager';

export default function Dashboard() {
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [trendRange, setTrendRange] = useState<'1W' | '1M' | '3M' | '6M' | 'YTD'>('1W');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [summary, setSummary] = useState<MetricsSummary | null>(null);
    const [trend, setTrend] = useState<TrendDataPoint[]>([]);
    const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
    const [locks, setLocks] = useState<MonthLock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if selected month is locked
    const isMonthLocked = locks.find(l => l.yearMonth === selectedMonth)?.status === 'locked';

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [txns, cats, sum, brk, lks] = await Promise.all([
                api.getTransactions(selectedMonth),
                api.getCategories(),
                api.getSummary(selectedMonth),
                api.getBreakdown(selectedMonth),
                api.getLocks()
            ]);

            setTransactions(txns);
            setCategories(cats);
            setSummary(sum);
            setBreakdown(brk);
            setLocks(lks);
        } catch (err: any) {
            setError(err.error?.message || 'Failed to load data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadTrend = useCallback(async () => {
        try {
            let from, to;
            let type: 'monthly' | 'daily' = 'monthly';
            const today = getWIBToday();

            switch (trendRange) {
                case '1W':
                    type = 'daily';
                    to = today;
                    from = dayjs(today).subtract(6, 'day').format('YYYY-MM-DD');
                    break;
                case '1M':
                    type = 'daily';
                    to = today;
                    from = dayjs(today).subtract(29, 'day').format('YYYY-MM-DD');
                    break;
                case '3M':
                    type = 'monthly';
                    to = getCurrentMonth();
                    from = dayjs(to + '-01').subtract(2, 'month').format('YYYY-MM');
                    break;
                case '6M':
                    type = 'monthly';
                    to = getCurrentMonth();
                    from = dayjs(to + '-01').subtract(5, 'month').format('YYYY-MM');
                    break;
                case 'YTD':
                    type = 'monthly';
                    to = getCurrentMonth();
                    from = dayjs().format('YYYY') + '-01';
                    break;
            }

            const data = await api.getTrend(from, to, type);
            setTrend(data);
        } catch (err) {
            console.error('Failed to load trend:', err);
        }
    }, [trendRange]);

    useEffect(() => {
        loadTrend();
    }, [loadTrend]);

    const handleTransactionCreated = () => {
        loadData();
    };

    const handleTransactionUpdated = () => {
        loadData();
    };

    const handleTransactionDeleted = () => {
        loadData();
    };

    const handleLockChange = () => {
        loadData();
    };

    // Generate month options (Jan 2025 to current month)
    const monthOptions = [];
    const current = new Date();
    const currentYear = current.getFullYear();
    const currentMonthNum = current.getMonth();

    for (let year = 2025; year <= currentYear; year++) {
        const maxMonth = year === currentYear ? currentMonthNum : 11;
        for (let month = 0; month <= maxMonth; month++) {
            const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
            monthOptions.push(monthStr);
        }
    }

    if (loading && !transactions.length) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse-subtle text-lg text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Header */}
            <header className="glass-card sticky top-0 z-50 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                                RM Expense Tracker
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">Track your expenses in IDR • All times in WIB</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-4 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                            >
                                {monthOptions.map(m => (
                                    <option key={m} value={m}>{formatMonth(m)}</option>
                                ))}
                            </select>

                            <LockManager
                                month={selectedMonth}
                                isLocked={isMonthLocked}
                                onLockChange={handleLockChange}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Metrics Tiles */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <MetricTile
                        title="Total This Month"
                        value={formatRupiah(summary?.totalCurrent ?? 0)}
                        subtitle={formatMonth(selectedMonth)}
                        className="bg-gradient-to-br from-primary-500 to-primary-600 text-white"
                    />

                    <MetricTile
                        title="Month over Month"
                        value={formatPercent(summary?.momPct ?? null)}
                        subtitle={`vs ${formatMonth(summary?.month ? `${summary.month.slice(0, 5)}${String(parseInt(summary.month.slice(5)) - 1).padStart(2, '0')}` : '')}`}
                        isPositive={summary?.momPct != null ? (summary.momPct ?? 0) <= 0 : null}
                        className="bg-white"
                    />

                    <MetricTile
                        title="Year over Year"
                        value={formatPercent(summary?.yoyPct ?? null)}
                        subtitle={`${formatMonth(summary?.yoyMonth ?? '')} vs ${formatMonth(summary?.yoyPriorYearMonth ?? '')}`}
                        isPositive={summary?.yoyPct != null ? (summary.yoyPct ?? 0) <= 0 : null}
                        className="bg-white"
                    />

                    <MetricTile
                        title="Transactions"
                        value={transactions.length.toString()}
                        subtitle="this month"
                        className="bg-white"
                    />
                </section>

                {/* Charts Section */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="glass-card rounded-2xl p-6 shadow-lg animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">Trend</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {(['1W', '1M', '3M', '6M', 'YTD'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTrendRange(range)}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${trendRange === range
                                            ? 'bg-white text-primary-600 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <TrendChart
                            data={trend}
                            currentMonth={selectedMonth}
                            granularity={trendRange === '1W' || trendRange === '1M' ? 'daily' : 'monthly'}
                        />
                    </div>

                    <div className="glass-card rounded-2xl p-6 shadow-lg animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Category Breakdown</h2>
                        <CategoryBreakdownChart data={breakdown} categories={categories} />
                    </div>
                </section>

                {/* Transaction Entry Form */}
                {!isMonthLocked && (
                    <section className="glass-card rounded-2xl p-6 shadow-lg mb-8 animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Add Expense</h2>
                        <TransactionForm
                            categories={categories.filter(c => !c.archived)}
                            selectedMonth={selectedMonth}
                            onSubmit={handleTransactionCreated}
                        />
                    </section>
                )}

                {isMonthLocked && (
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <p className="font-medium text-amber-800">Month is Locked</p>
                            <p className="text-sm text-amber-600">Use the unlock button above to enable editing.</p>
                        </div>
                    </div>
                )}

                {/* Transactions Table */}
                <section className="glass-card rounded-2xl shadow-lg overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Transactions</h2>
                    </div>
                    <TransactionsTable
                        transactions={transactions}
                        categories={categories}
                        isLocked={isMonthLocked}
                        onUpdate={handleTransactionUpdated}
                        onDelete={handleTransactionDeleted}
                    />
                </section>
            </main>
        </div>
    );
}
