import { useState } from 'react';
import type { Transaction, Category } from '../api/client';
import { api } from '../api/client';
import { formatRupiah, formatDate } from '../utils/format';

interface TransactionsTableProps {
    transactions: Transaction[];
    categories: Category[];
    isLocked: boolean;
    onUpdate: () => void;
    onDelete: () => void;
}

export default function TransactionsTable({ transactions, categories, isLocked, onUpdate, onDelete }: TransactionsTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [error, setError] = useState<string | null>(null);

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || 'Unknown';
    };

    const startEdit = (tx: Transaction) => {
        setEditingId(tx.id);
        setEditDescription(tx.description);
        setEditAmount(tx.amountRp.toString());
        setError(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditDescription('');
        setEditAmount('');
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
                amountRp
            });

            cancelEdit();
            onUpdate();
        } catch (err: any) {
            setError(err.error?.message || 'Failed to update');
        }
    };

    const deleteTransaction = async (id: string) => {
        if (!confirm('Delete this transaction?')) return;

        try {
            await api.deleteTransaction(id);
            onDelete();
        } catch (err: any) {
            setError(err.error?.message || 'Failed to delete');
        }
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        {!isLocked && (
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(tx.dateISO)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                    {getCategoryName(tx.categoryId)}
                                </span>
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
                                    ) : (
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => startEdit(tx)}
                                                className="text-primary-600 hover:text-primary-800 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => deleteTransaction(tx.id)}
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
