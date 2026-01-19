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
import type { TrendDataPoint } from '../api/client';
import { formatMonth, formatDate } from '../utils/format';

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

interface TrendChartProps {
    data: TrendDataPoint[];
    currentMonth: string;
    granularity?: 'monthly' | 'daily';
    type?: 'expense' | 'income';
}

export default function TrendChart({ data, currentMonth, granularity = 'monthly', type = 'expense' }: TrendChartProps) {
    if (data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                No {type} data available
            </div>
        );
    }

    const isIncome = type === 'income';
    const primaryColor = isIncome ? '#10b981' : '#0ea5e9'; // emerald-500 vs primary-500
    const pointColor = isIncome ? '#10b981' : '#8b5cf6'; // emerald-500 vs accent-500
    const bgColor = isIncome ? 'rgba(16, 185, 129, 0.1)' : 'rgba(14, 165, 233, 0.1)';

    const chartData = {
        labels: data.map(d => granularity === 'daily' ? formatDate(d.month) : formatMonth(d.month)),
        datasets: [
            {
                label: granularity === 'daily'
                    ? `Daily ${type === 'income' ? 'Income' : 'Expenses'}`
                    : `Monthly ${type === 'income' ? 'Income' : 'Expenses'}`,
                data: data.map(d => d.total),
                borderColor: primaryColor,
                backgroundColor: bgColor,
                fill: true,
                tension: 0.4,
                pointRadius: data.map(d => (granularity === 'monthly' && d.month === currentMonth) ? 6 : 3),
                pointBackgroundColor: data.map(d => (granularity === 'monthly' && d.month === currentMonth) ? pointColor : primaryColor),
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
                    callback: (value: any) => `${(value / 1000000).toFixed(1)}M`
                }
            }
        }
    };

    return (
        <div className="h-64">
            <Line data={chartData} options={options} />
        </div>
    );
}
