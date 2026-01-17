const API_BASE = '/api';

// Types
export interface Transaction {
    id: string;
    dateISO: string;
    yearMonth: string;
    categoryId: string;
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

// API Client
export const api = {
    // Transactions
    async getTransactions(month?: string, categoryId?: string): Promise<Transaction[]> {
        const params = new URLSearchParams();
        if (month) params.set('month', month);
        if (categoryId) params.set('categoryId', categoryId);
        const res = await fetch(`${API_BASE}/transactions?${params}`);
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async createTransaction(data: {
        dateISO: string;
        categoryId: string;
        description: string;
        amountRp: number;
    }): Promise<Transaction> {
        const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async updateTransaction(id: string, data: Partial<{
        dateISO: string;
        categoryId: string;
        description: string;
        amountRp: number;
    }>): Promise<Transaction> {
        const res = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async deleteTransaction(id: string): Promise<void> {
        const res = await fetch(`${API_BASE}/transactions/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw await res.json();
    },

    // Categories
    async getCategories(): Promise<Category[]> {
        const res = await fetch(`${API_BASE}/categories`);
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async createCategory(name: string): Promise<Category> {
        const res = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async updateCategory(id: string, data: { name?: string; archived?: boolean }): Promise<Category> {
        const res = await fetch(`${API_BASE}/categories/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    // Metrics
    async getSummary(month?: string): Promise<MetricsSummary> {
        const params = month ? `?month=${month}` : '';
        const res = await fetch(`${API_BASE}/metrics/summary${params}`);
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async getTrend(from?: string, to?: string, type: 'monthly' | 'daily' = 'monthly'): Promise<TrendDataPoint[]> {
        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        params.set('type', type);
        const res = await fetch(`${API_BASE}/metrics/trend?${params}`);
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async getBreakdown(month?: string): Promise<CategoryBreakdown[]> {
        const params = month ? `?month=${month}` : '';
        const res = await fetch(`${API_BASE}/metrics/breakdown${params}`);
        if (!res.ok) throw await res.json();
        return res.json();
    },

    // Locks
    async getLocks(): Promise<MonthLock[]> {
        const res = await fetch(`${API_BASE}/locks`);
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async unlockMonth(month: string, reason: string, initials: string): Promise<void> {
        const res = await fetch(`${API_BASE}/locks/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month, reason, initials })
        });
        if (!res.ok) throw await res.json();
    },

    async relockMonth(month: string): Promise<void> {
        const res = await fetch(`${API_BASE}/locks/relock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ month })
        });
        if (!res.ok) throw await res.json();
    }
};
