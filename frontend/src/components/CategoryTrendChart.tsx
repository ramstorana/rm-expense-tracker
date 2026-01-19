import { useState, useEffect, useCallback } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { api, type TrendDataPoint, type Category } from '../api/client';
import { formatMonth, formatDate, getWIBToday, getCurrentMonth } from '../utils/format';
import dayjs from 'dayjs';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Category color palette (same as CategoryBreakdownChart)
const CATEGORY_COLORS: Record<string, string> = {};
const COLOR_PALETTE = [
    '#0ea5e9', // primary-500
    '#8b5cf6', // accent-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#ec4899', // pink-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
    '#f97316', // orange-500
    '#84cc16', // lime-500
];

const getCategoryColor = (categoryId: string, index: number): string => {
    if (!CATEGORY_COLORS[categoryId]) {
        CATEGORY_COLORS[categoryId] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    }
    return CATEGORY_COLORS[categoryId];
};

interface CategoryTrendChartProps {
    categories: Category[];
}

type TimeRange = '1W' | '1M' | '3M' | '6M' | 'YTD';

export default function CategoryTrendChart({ categories }: CategoryTrendChartProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [timeRange, setTimeRange] = useState<TimeRange>('1M');
    const [data, setData] = useState<TrendDataPoint[]>([]);
    const [loading, setLoading] = useState(false);

    const loadCategoryTrend = useCallback(async () => {
        if (!selectedCategory) {
            setData([]);
            return;
        }

        try {
            setLoading(true);
            let from, to;
            let type: 'monthly' | 'daily' = 'monthly';
            const today = getWIBToday();

            switch (timeRange) {
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

            const trendData = await api.getCategoryTrend(selectedCategory, from, to, type);
            setData(trendData);
        } catch (err) {
            console.error('Failed to load category trend:', err);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedCategory, timeRange]);

    useEffect(() => {
        loadCategoryTrend();
    }, [loadCategoryTrend]);

    const activeCategories = categories.filter(c => !c.archived);
    const selectedCategoryIndex = activeCategories.findIndex(c => c.id === selectedCategory);
    const categoryColor = selectedCategory ? getCategoryColor(selectedCategory, selectedCategoryIndex) : '#0ea5e9';
    const categoryName = categories.find(c => c.id === selectedCategory)?.name || 'Category';

    const granularity = timeRange === '1W' || timeRange === '1M' ? 'daily' : 'monthly';

    const chartData = {
        labels: data.map(d => granularity === 'daily' ? formatDate(d.month) : formatMonth(d.month)),
        datasets: [
            {
                label: `${categoryName} Expenses`,
                data: data.map(d => d.total),
                borderColor: categoryColor,
                backgroundColor: `${categoryColor}20`,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: categoryColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw;
                        return `Rp ${value.toLocaleString('id-ID')}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: any) => {
                        if (value >= 1000000) {
                            return `${(value / 1000000).toFixed(1)}M`;
                        } else if (value >= 1000) {
                            return `${(value / 1000).toFixed(0)}K`;
                        }
                        return value;
                    }
                }
            }
        }
    };

    return (
        <div>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition text-sm"
                >
                    <option value="">Select a category</option>
                    {activeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                            {cat.name}
                        </option>
                    ))}
                </select>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(['1W', '1M', '3M', '6M', 'YTD'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeRange === range
                                ? 'bg-white text-primary-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <div className="h-64">
                {!selectedCategory ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                            <p>Select a category to view spending trends</p>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        <div className="animate-pulse">Loading...</div>
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                        No data for this category in the selected period
                    </div>
                ) : (
                    <Line data={chartData} options={options} />
                )}
            </div>
        </div>
    );
}
