import { useState } from 'react';
import { api } from '../api/client';
import { formatMonth } from '../utils/format';

interface LockManagerProps {
    month: string;
    isLocked: boolean;
    onLockChange: () => void;
}

export default function LockManager({ month, isLocked, onLockChange }: LockManagerProps) {
    const [showModal, setShowModal] = useState(false);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUnlock = async () => {
        if (!reason.trim()) {
            setError('Please provide a reason for unlocking');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await api.unlockMonth(month, reason.trim(), 'RMT');
            setShowModal(false);
            setReason('');
            onLockChange();
        } catch (err: any) {
            setError(err.error?.message || 'Failed to unlock');
        } finally {
            setLoading(false);
        }
    };

    const handleRelock = async () => {
        try {
            setLoading(true);
            await api.relockMonth(month);
            onLockChange();
        } catch (err: any) {
            setError(err.error?.message || 'Failed to relock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {isLocked ? (
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium flex items-center gap-2 hover:bg-amber-200 transition"
                >
                    <span>🔒</span>
                    <span>Unlock {formatMonth(month)}</span>
                </button>
            ) : (
                <button
                    onClick={handleRelock}
                    disabled={loading}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium flex items-center gap-2 hover:bg-green-200 transition disabled:opacity-50"
                >
                    <span>🔓</span>
                    <span>{loading ? 'Relocking...' : `Relock ${formatMonth(month)}`}</span>
                </button>
            )}

            {/* Unlock Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Unlock {formatMonth(month)}
                        </h3>

                        <p className="text-gray-600 mb-4">
                            This will allow you to add, edit, or delete transactions for this month.
                            Please provide a reason for the audit log.
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason for unlocking
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g., Missing restaurant receipt"
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition resize-none"
                            />
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-500">
                                Actor: <strong>RMT</strong>
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setReason('');
                                    setError(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUnlock}
                                disabled={loading}
                                className="px-6 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition disabled:opacity-50"
                            >
                                {loading ? 'Unlocking...' : 'Unlock Month'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
