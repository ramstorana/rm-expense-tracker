import { useState } from 'react';
import Dashboard from './pages/Dashboard';
import IncomePage from './pages/IncomePage';

type Page = 'expenses' | 'income';

function App() {
    const [currentPage, setCurrentPage] = useState<Page>('expenses');

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center space-x-8">
                            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                                RM Financial Tracker
                            </span>
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setCurrentPage('expenses')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === 'expenses'
                                        ? 'bg-primary-100 text-primary-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    💸 Expenses
                                </button>
                                <button
                                    onClick={() => setCurrentPage('income')}
                                    className={`px-4 py-2 rounded-lg font-medium transition ${currentPage === 'income'
                                        ? 'bg-green-100 text-green-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    💰 Income
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Page Content */}
            {currentPage === 'expenses' ? <Dashboard /> : <IncomePage />}
        </div>
    );
}

export default App;

