import { useState } from 'react';
import type { Transaction, Category, ExpenseSource } from '../api/client';
import { api } from '../api/client';
import { formatRupiah, formatDate } from '../utils/format';
import { useToast } from './Toast';

interface TransactionsTableProps {
    transactions: Transaction[];
    categories: Category[];
    expenseSources: ExpenseSource[];
    isLocked: boolean;
    onUpdate: () => void;
    onDelete: () => void;
}

export default function TransactionsTable({ transactions, categories, expenseSources, isLocked, onUpdate, onDelete }: TransactionsTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [editSourceId, setEditSourceId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const { showToast } = useToast();

    // Sorting state
    type SortKey = 'date' | 'category' | 'description' | 'amount';
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: 'asc' | 'desc' }>({
        key: null,
        direction: 'asc'
    });

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || 'Unknown';
    };

    const getSourceName = (sourceId: string | null) => {
        if (!sourceId) return '-';
        return expenseSources.find(s => s.id === sourceId)?.name || 'Unknown';
    };

    const handleSort = (key: SortKey) => {
        setSortConfig(current => {
            if (current.key === key) {
                // Toggle direction
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            // New key, default direction
            // Amount defaults to high-to-low (desc), others low-to-high (asc)
            const defaultDirection = key === 'amount' ? 'desc' : 'asc';
            return { key, direction: defaultDirection };
        });
    };

    // Sort transactions
    const sortedTransactions = [...transactions].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let valA: any, valB: any;

        switch (sortConfig.key) {
            case 'date':
                valA = a.dateISO;
                valB = b.dateISO;
                break;
            case 'category':
                valA = getCategoryName(a.categoryId).toLowerCase();
                valB = getCategoryName(b.categoryId).toLowerCase();
                break;
            case 'description':
                valA = a.description.toLowerCase();
                valB = b.description.toLowerCase();
                break;
            case 'amount':
                valA = a.amountRp;
                valB = b.amountRp;
                break;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const startEdit = (tx: Transaction) => {
        setEditingId(tx.id);
        setEditDescription(tx.description);
        setEditAmount(tx.amountRp.toString());
        setEditSourceId(tx.sourceId);
        setError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditDescription('');
        setEditAmount('');
        setEditSourceId(null);
        setError(null);
    };

    const saveEdit = async (id: string) => {
        try {
            const amountRp = parseInt(editAmount.replace(/\D/g, ''), 10);
            if (isNaN(amountRp) || amountRp < 0) {
                setError('Invalid amount');
                return;
            }

            await api.updateTransaction(id, {
                description: editDescription.trim(),
                amountRp,
                sourceId: editSourceId
            });

            cancelEdit();
            showToast('success', 'Transaction updated successfully!');
            onUpdate();
        } catch (err: any) {
            const errorMessage = err.error?.message || 'Failed to update';
            setError(errorMessage);
            showToast('error', errorMessage);
        }
    };

    const confirmDelete = async (id: string) => {
        try {
            await api.deleteTransaction(id);
            setDeleteConfirmId(null);
            showToast('success', 'Transaction deleted successfully!');
            onDelete();
        } catch (err: any) {
            const errorMessage = err.error?.message || 'Failed to delete';
            setError(errorMessage);
            showToast('error', errorMessage);
        }
    };

    // Helper for rendering sort chevron
    const SortChevron = ({ column }: { column: SortKey }) => {
        const isActive = sortConfig.key === column;
        const isUp = isActive && sortConfig.direction === 'asc';
        const isDown = isActive && sortConfig.direction === 'desc';

        return (
            <span className="ml-1 inline-flex flex-col space-y-[2px]">
                <svg className={`w-2 h-2 ${isUp ? 'text-primary-600 font-bold' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 10 10">
                    <path d="M5 0L10 10H0L5 0Z" />
                </svg>
                <svg className={`w-2 h-2 ${isDown ? 'text-primary-600 font-bold' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 10 10">
                    <path d="M5 10L0 0H10L5 10Z" />
                </svg>
            </span>
        );
    };

    if (transactions.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                <p className="text-lg">No transactions yet</p>
                <p className="text-sm mt-1">Add your first expense above</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            {error && (
                <div className="p-3 m-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none group"
                            onClick={() => handleSort('date')}
                            role="button"
                            aria-sort={sortConfig.key === 'date' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center">
                                Date
                                <SortChevron column="date" />
                            </div>
                        </th>
                        <th
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none group"
                            onClick={() => handleSort('category')}
                            role="button"
                            aria-sort={sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center">
                                Category
                                <SortChevron column="category" />
                            </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                        <th
                            className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none group"
                            onClick={() => handleSort('description')}
                            role="button"
                            aria-sort={sortConfig.key === 'description' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center">
                                Description
                                <SortChevron column="description" />
                            </div>
                        </th>
                        <th
                            className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none group"
                            onClick={() => handleSort('amount')}
                            role="button"
                            aria-sort={sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                            <div className="flex items-center justify-end">
                                Amount
                                <SortChevron column="amount" />
                            </div>
                        </th>
                        {!isLocked && (
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sortedTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(tx.dateISO)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                    {getCategoryName(tx.categoryId)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {editingId === tx.id ? (
                                    <select
                                        value={editSourceId || ''}
                                        onChange={(e) => setEditSourceId(e.target.value || null)}
                                        className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-primary-500 text-sm"
                                    >
                                        <option value="">-</option>
                                        {expenseSources.map(src => (
                                            <option key={src.id} value={src.id}>{src.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    getSourceName(tx.sourceId)
                                )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800">
                                {editingId === tx.id ? (
                                    <input
                                        type="text"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    tx.description
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-800">
                                {editingId === tx.id ? (
                                    <input
                                        type="text"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ''))}
                                        className="w-28 px-2 py-1 border border-gray-200 rounded text-right focus:ring-2 focus:ring-primary-500"
                                    />
                                ) : (
                                    formatRupiah(tx.amountRp)
                                )}
                            </td>
                            {!isLocked && (
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {editingId === tx.id ? (
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => saveEdit(tx.id)}
                                                className="text-green-600 hover:text-green-800 font-medium"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={cancelEdit}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : deleteConfirmId === tx.id ? (
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => confirmDelete(tx.id)}
                                                className="text-red-700 hover:text-red-900 font-bold"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(null)}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => startEdit(tx)}
                                                className="text-primary-600 hover:text-primary-800 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(tx.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

