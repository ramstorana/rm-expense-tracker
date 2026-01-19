const API_BASE = '/api';

// Types
export interface Transaction {
    id: string;
    dateISO: string;
    yearMonth: string;
    categoryId: string;
    sourceId: string | null;
    description: string;
    amountRp: number;
    createdAtISO: string;
    updatedAtISO: string;
}

export interface Category {
    id: string;
    name: string;
    archived: boolean;
}

export interface ExpenseSource {
    id: string;
    name: string;
    type: 'bank_account' | 'credit_card';
    archived: boolean;
}

export interface IncomeSource {
    id: string;
    name: string;
    archived: boolean;
}

export interface Income {
    id: string;
    dateISO: string;
    yearMonth: string;
    sourceId: string;
    description: string;
    amountRp: number;
    createdAtISO: string;
    updatedAtISO: string;
}

export interface MonthLock {
    yearMonth: string;
    status: 'locked' | 'unlocked';
    lockedAtISO: string | null;
    unlockedAtISO: string | null;
}

export interface MetricsSummary {
    month: string;
    totalCurrent: number;
    totalPrev: number;
    momPct: number | null;
    // Income & Savings
    totalIncome: number;
    incomeMomPct: number | null;
    netSavings: number;
    savingsMomPct: number | null;
    savingsRate: number;
    // YoY
    yoyMonth: string;
    yoyPriorYearMonth: string;
    yoyCurrentTotal: number;
    yoyPrevYearTotal: number;
    yoyPct: number | null;
}

export interface TrendDataPoint {
    month: string;
    total: number;
}

export interface CategoryBreakdown {
    categoryId: string;
    total: number;
}

export interface IncomeBreakdown {
    sourceId: string;
    total: number;
}

// Helper to handle responses and avoid JSON parse errors on backend failures
async function handleResponse<T>(res: Response): Promise<T> {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        if (!res.ok) throw data;
        return data as T;
    }
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`Server Error: ${res.status} ${res.statusText}. Response: ${text.slice(0, 200)}`);
    }
    // If ok but not json? (e.g. void)
    return undefined as unknown as T;
}

export const api = {
    // ========================================
    // Transactions
    // ========================================
    async getTransactions(month?: string, categoryId?: string): Promise<Transaction[]> {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (categoryId) params.append('categoryId', categoryId);

        const res = await fetch(`${API_BASE}/transactions?${params}`);
        return handleResponse<Transaction[]>(res);
    },

    async createTransaction(data: {
        dateISO: string;
        categoryId: string;
        sourceId?: string;
        description: string;
        amountRp: number;
    }): Promise<Transaction> {
        const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<Transaction>(res);
    },

    async updateTransaction(id: string, data: Partial<{
        dateISO: string;
        categoryId: string;
        sourceId: string | null;
        description: string;
        amountRp: number;
    }>): Promise<Transaction> {
        const res = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<Transaction>(res);
    },

    async deleteTransaction(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'DELETE'
        });
        return handleResponse<void>(res);
    },

    // ========================================
    // Categories
    // ========================================
    async getCategories(): Promise<Category[]> {
        const res = await fetch(`${API_BASE}/categories`);
        return handleResponse<Category[]>(res);
    },

    async createCategory(name: string): Promise<Category> {
        const res = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        return handleResponse<Category>(res);
    },

    async updateCategory(id: string, data: { name?: string; archived?: boolean }): Promise<Category> {
        const res = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<Category>(res);
    },

    // ========================================
    // Expense Sources
    // ========================================
    async getExpenseSources(): Promise<ExpenseSource[]> {
        const res = await fetch(`${API_BASE}/expense-sources`);
        return handleResponse<ExpenseSource[]>(res);
    },

    // ========================================
    // Income Sources
    // ========================================
    async getIncomeSources(): Promise<IncomeSource[]> {
        const res = await fetch(`${API_BASE}/income-sources`);
        return handleResponse<IncomeSource[]>(res);
    },

    // ========================================
    // Income
    // ========================================
    async getIncome(month?: string, sourceId?: string): Promise<Income[]> {
        const params = new URLSearchParams();
        if (month) params.append('month', month);
        if (sourceId) params.append('sourceId', sourceId);

        const res = await fetch(`${API_BASE}/income?${params}`);
        return handleResponse<Income[]>(res);
    },

    async createIncome(data: {
        dateISO: string;
        sourceId: string;
        description: string;
        amountRp: number;
    }): Promise<Income> {
        const res = await fetch(`${API_BASE}/income`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<Income>(res);
    },

    async updateIncome(id: string, data: Partial<{
        dateISO: string;
        sourceId: string;
        description: string;
        amountRp: number;
    }>): Promise<Income> {
        const res = await fetch(`${API_BASE}/income/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<Income>(res);
    },

    async deleteIncome(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/income/${id}`, {
            method: 'DELETE'
        });
        return handleResponse<void>(res);
    },

    // ========================================
    // Metrics
    // ========================================
    async getSummary(month?: string): Promise<MetricsSummary> {
        const params = month ? `?month=${month}` : '';
        const res = await fetch(`${API_BASE}/metrics/summary${params}`);
        return handleResponse<MetricsSummary>(res);
    },

    async getTrend(from?: string, to?: string, type: 'monthly' | 'daily' = 'monthly'): Promise<TrendDataPoint[]> {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (type) params.set('type', type);
        const res = await fetch(`${API_BASE}/metrics/trend?${params}`);
        return handleResponse<TrendDataPoint[]>(res);
    },

    async getBreakdown(month?: string): Promise<CategoryBreakdown[]> {
        const params = month ? `?month=${month}` : '';
        const res = await fetch(`${API_BASE}/metrics/breakdown${params}`);
        return handleResponse<CategoryBreakdown[]>(res);
    },

    async getCategoryTrend(categoryId: string, from?: string, to?: string, type: 'monthly' | 'daily' = 'monthly'): Promise<TrendDataPoint[]> {
        const params = new URLSearchParams();
        params.set('categoryId', categoryId);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (type) params.set('type', type);
        const res = await fetch(`${API_BASE}/metrics/trend/category?${params}`);
        return handleResponse<TrendDataPoint[]>(res);
    },

    async getIncomeTrend(from?: string, to?: string): Promise<TrendDataPoint[]> {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const res = await fetch(`${API_BASE}/metrics/income-trend?${params}`);
        return handleResponse<TrendDataPoint[]>(res);
    },

    async getIncomeBreakdown(month?: string): Promise<IncomeBreakdown[]> {
        const params = month ? `?month=${month}` : '';
        const res = await fetch(`${API_BASE}/metrics/income-breakdown${params}`);
        return handleResponse<IncomeBreakdown[]>(res);
    },

    // ========================================
    // Locks
    // ========================================
    async getLocks(): Promise<MonthLock[]> {
        const res = await fetch(`${API_BASE}/locks`);
        return handleResponse<MonthLock[]>(res);
    },

    async unlockMonth(month: string, reason: string, initials: string): Promise<void> {
        const res = await fetch(`${API_BASE}/locks/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, reason, initials })
        });
        return handleResponse<void>(res);
    },

    async relockMonth(month: string): Promise<void> {
        const res = await fetch(`${API_BASE}/locks/relock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month })
        });
        return handleResponse<void>(res);
    }
};
