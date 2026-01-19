import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import type { IncomeBreakdown, IncomeSource } from '../api/client';
import { formatRupiah } from '../utils/format';

ChartJS.register(ArcElement, Tooltip, Legend);

interface IncomeBreakdownChartProps {
    data: IncomeBreakdown[];
    sources: IncomeSource[];
}

const COLORS = [
    '#10b981', // emerald-500
    '#34d399', // emerald-400
    '#059669', // emerald-600
    '#6ee7b7', // emerald-300
    '#047857', // emerald-700
    '#a7f3d0', // emerald-200
    '#065f46', // emerald-800
    '#d1fae5', // emerald-100
];

export default function IncomeBreakdownChart({ data, sources }: IncomeBreakdownChartProps) {
    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                No income this month
            </div>
        );
    }

    const getSourceName = (sourceId: string) => {
        return sources.find(s => s.id === sourceId)?.name || 'Unknown';
    };

    // Sort by total descending
    const sortedData = [...data].sort((a, b) => b.total - a.total);

    const chartData = {
        labels: sortedData.map(d => getSourceName(d.sourceId)),
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
