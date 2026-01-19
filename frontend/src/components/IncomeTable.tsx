import { useState } from 'react';
import type { Income, IncomeSource } from '../api/client';
import { api } from '../api/client';
import { formatRupiah, formatDate } from '../utils/format';
import { useToast } from './Toast';

interface IncomeTableProps {
    incomeEntries: Income[];
    incomeSources: IncomeSource[];
    isLocked: boolean;
    onUpdate: () => void;
    onDelete: () => void;
}

export default function IncomeTable({ incomeEntries, incomeSources, isLocked, onUpdate, onDelete }: IncomeTableProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDescription, setEditDescription] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const { showToast } = useToast();

    const getSourceName = (sourceId: string) => {
        return incomeSources.find(s => s.id === sourceId)?.name || 'Unknown';
    };

    const startEdit = (entry: Income) => {
        setEditingId(entry.id);
        setEditDescription(entry.description);
        setEditAmount(entry.amountRp.toString());
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

            await api.updateIncome(id, {
                description: editDescription.trim(),
                amountRp
            });

            cancelEdit();
            showToast('success', 'Income updated successfully!');
            onUpdate();
        } catch (err: any) {
            const errorMessage = err.error?.message || 'Failed to update';
            setError(errorMessage);
            showToast('error', errorMessage);
        }
    };

    const confirmDelete = async (id: string) => {
        try {
            await api.deleteIncome(id);
            setDeleteConfirmId(null);
            showToast('success', 'Income deleted successfully!');
            onDelete();
        } catch (err: any) {
            const errorMessage = err.error?.message || 'Failed to delete';
            setError(errorMessage);
            showToast('error', errorMessage);
        }
    };

    if (incomeEntries.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                <p className="text-lg">No income entries yet</p>
                <p className="text-sm mt-1">Add your first income above</p>
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                        {!isLocked && (
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        )}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {incomeEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(entry.dateISO)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {getSourceName(entry.sourceId)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800">
                                {editingId === entry.id ? (
                                    <input
                                        type="text"
                                        value={editDescription}
                                        onChange={(e) => setEditDescription(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                ) : (
                                    entry.description
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                {editingId === entry.id ? (
                                    <input
                                        type="text"
                                        value={editAmount}
                                        onChange={(e) => setEditAmount(e.target.value.replace(/\D/g, ''))}
                                        className="w-28 px-2 py-1 border border-gray-200 rounded text-right focus:ring-2 focus:ring-green-500"
                                    />
                                ) : (
                                    formatRupiah(entry.amountRp)
                                )}
                            </td>
                            {!isLocked && (
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    {editingId === entry.id ? (
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => saveEdit(entry.id)}
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
                                    ) : deleteConfirmId === entry.id ? (
                                        <div className="space-x-2">
                                            <button
                                                onClick={() => confirmDelete(entry.id)}
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
                                                onClick={() => startEdit(entry)}
                                                className="text-green-600 hover:text-green-800 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirmId(entry.id)}
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
