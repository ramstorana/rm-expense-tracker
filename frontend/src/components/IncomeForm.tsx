import { useState, useEffect } from 'react';
import type { IncomeSource } from '../api/client';
import { api } from '../api/client';
import { getWIBToday, toWIBISO } from '../utils/format';
import { useToast } from './Toast';

interface IncomeFormProps {
    selectedMonth: string;
    onSubmit: () => void;
}

export default function IncomeForm({ selectedMonth: _selectedMonth, onSubmit }: IncomeFormProps) {
    const [date, setDate] = useState(getWIBToday());
    const [sourceId, setSourceId] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        const loadSources = async () => {
            try {
                const sources = await api.getIncomeSources();
                setIncomeSources(sources);
                if (sources.length > 0) {
                    setSourceId(sources[0].id);
                }
            } catch (err) {
                console.error('Failed to load income sources:', err);
            }
        };
        loadSources();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sourceId || !description.trim() || !amount) {
            setError('Please fill in all fields');
            return;
        }

        const amountRp = parseInt(amount.replace(/\D/g, ''), 10);
        if (isNaN(amountRp) || amountRp < 0) {
            setError('Please enter a valid amount');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await api.createIncome({
                dateISO: toWIBISO(date),
                sourceId,
                description: description.trim(),
                amountRp
            });

            // Reset form
            setDescription('');
            setAmount('');
            showToast('success', 'Income added successfully!');
            onSubmit();
        } catch (err: any) {
            const errorMessage = err.error?.message || 'Failed to create income entry';
            setError(errorMessage);
            showToast('error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Format amount with thousand separators
    const formatAmountInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '';
        return parseInt(digits, 10).toLocaleString('id-ID');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <select
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    >
                        {incomeSources.map(src => (
                            <option key={src.id} value={src.id}>{src.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., January salary"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (IDR)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">Rp</span>
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                            placeholder="0"
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {loading ? 'Adding...' : 'Add Income'}
                </button>
            </div>
        </form>
    );
}
