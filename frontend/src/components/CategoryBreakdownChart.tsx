import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import type { CategoryBreakdown as BreakdownData, Category } from '../api/client';
import { formatRupiah } from '../utils/format';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryBreakdownChartProps {
    data: BreakdownData[];
    categories: Category[];
}

const COLORS = [
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

export default function CategoryBreakdownChart({ data, categories }: CategoryBreakdownChartProps) {
    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                No expenses this month
            </div>
        );
    }

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || 'Unknown';
    };

    // Sort by total descending
    const sortedData = [...data].sort((a, b) => b.total - a.total);

    const chartData = {
        labels: sortedData.map(d => getCategoryName(d.categoryId)),
        datasets: [
            {
                data: sortedData.map(d => d.total),
                backgroundColor: COLORS.slice(0, sortedData.length),
                borderColor: '#fff',
                borderWidth: 2,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                labels: {
                    usePointStyle: true,
                    padding: 16,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${formatRupiah(value)} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <div className="h-64">
            <Doughnut data={chartData} options={options} />
        </div>
    );
}
