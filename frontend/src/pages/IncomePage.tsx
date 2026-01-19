import { useState, useEffect, useCallback } from 'react';
import { api, type Income, type IncomeSource, type MonthLock, type MetricsSummary, type TrendDataPoint, type IncomeBreakdown } from '../api/client';
import IncomeForm from '../components/IncomeForm';
import IncomeTable from '../components/IncomeTable';
import MetricTile from '../components/MetricTile';
import TrendChart from '../components/TrendChart';
import IncomeBreakdownChart from '../components/IncomeBreakdownChart';
import ExportPDFButton from '../components/ExportPDFButton';
import LockManager from '../components/LockManager';
import { useToast } from '../components/Toast';
import dayjs from 'dayjs';

export default function IncomePage() {
    const [selectedMonth, setSelectedMonth] = useState(() => dayjs().format('YYYY-MM'));
    const [incomeEntries, setIncomeEntries] = useState<Income[]>([]);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const [locks, setLocks] = useState<MonthLock[]>([]);
    const [expensesSummary, setExpensesSummary] = useState<MetricsSummary | null>(null);
    const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
    const [breakdownData, setBreakdownData] = useState<IncomeBreakdown[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    const isLocked = locks.find(l => l.yearMonth === selectedMonth)?.status === 'locked';

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [
                incomeData,
                sourcesData,
                locksData,
                summaryData,
                trendRes,
                breakdownRes
            ] = await Promise.all([
                api.getIncome(selectedMonth),
                api.getIncomeSources(),
                api.getLocks(),
                api.getSummary(selectedMonth),
                api.getIncomeTrend(),
                api.getIncomeBreakdown(selectedMonth)
            ]);
            setIncomeEntries(incomeData);
            setIncomeSources(sourcesData);
            setLocks(locksData);
            setExpensesSummary(summaryData);
            setTrendData(trendRes);
            setBreakdownData(breakdownRes);
        } catch (err: any) {
            const errorMessage = err?.error?.message || err?.message || 'Failed to load income data';
            setError(errorMessage);
            showToast('error', errorMessage);
            console.error('Failed to load income data:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedMonth, showToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleLockChange = () => {
        loadData();
    };

    const totalIncome = expensesSummary?.totalIncome || 0;
    const totalExpenses = expensesSummary?.totalCurrent || 0;
    const savings = expensesSummary?.netSavings || 0;
    const savingsRate = expensesSummary?.savingsRate || 0;

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatMonth = (month: string) => {
        return dayjs(month).format('MMM YYYY');
    };

    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        const month = dayjs().subtract(i, 'month');
        monthOptions.push({
            value: month.format('YYYY-MM'),
            label: month.format('MMM YYYY')
        });
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            Monthly Income
                        </h1>
                        <p className="text-gray-500 mt-1">Track your income and savings rate</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <LockManager
                            month={selectedMonth}
                            isLocked={isLocked}
                            onLockChange={handleLockChange}
                        />
                        <ExportPDFButton selectedMonth={selectedMonth} />
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {/* Locked Month Warning */}
                {isLocked && (
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                        <span className="text-2xl">🔒</span>
                        <div>
                            <p className="font-medium text-amber-800">Month is Locked</p>
                            <p className="text-sm text-amber-600">Use the unlock button above to enable editing.</p>
                        </div>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <MetricTile
                        title="Total Income"
                        value={formatRupiah(totalIncome)}
                        subtitle={formatMonth(selectedMonth)}
                        isPositive={true}
                        className="bg-white"
                    />
                    <MetricTile
                        title="Total Expenses"
                        value={formatRupiah(totalExpenses)}
                        subtitle={formatMonth(selectedMonth)}
                        isPositive={false}
                        className="bg-white"
                    />
                    <MetricTile
                        title="Net Savings"
                        value={formatRupiah(savings)}
                        subtitle={savings >= 0 ? 'Surplus' : 'Deficit'}
                        isPositive={savings >= 0}
                        className="bg-white"
                    />
                    <MetricTile
                        title="Savings Rate"
                        value={`${savingsRate.toFixed(1)}%`}
                        subtitle="of income saved"
                        isPositive={savingsRate >= 20 ? true : savingsRate >= 0 ? null : false}
                        className="bg-white"
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-green-50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                                Income Trend
                            </h3>
                        </div>
                        <TrendChart
                            data={trendData}
                            currentMonth={selectedMonth}
                            type="income"
                        />
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg border border-green-50">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                                Source Breakdown
                            </h3>
                        </div>
                        <IncomeBreakdownChart
                            data={breakdownData}
                            sources={incomeSources}
                        />
                    </div>
                </div>

                {/* Add Income Form */}
                {!isLocked && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-green-50">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                            Add Income
                        </h2>
                        <IncomeForm selectedMonth={selectedMonth} onSubmit={loadData} />
                    </div>
                )}

                {/* Income List */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-50">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                            Income Entries
                            <span className="ml-2 text-sm font-normal text-gray-500">
                                ({incomeEntries.length} {incomeEntries.length === 1 ? 'entry' : 'entries'})
                            </span>
                        </h2>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading...</div>
                    ) : (
                        <IncomeTable
                            incomeEntries={incomeEntries}
                            incomeSources={incomeSources}
                            isLocked={isLocked}
                            onUpdate={loadData}
                            onDelete={loadData}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

