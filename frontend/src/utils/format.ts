import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Get current date in WIB as YYYY-MM-DD
 */
export const getWIBToday = (): string => {
    return dayjs().tz(WIB_TIMEZONE).format('YYYY-MM-DD');
};

/**
 * Get current month in WIB as YYYY-MM
 */
export const getCurrentMonth = (): string => {
    return dayjs().tz(WIB_TIMEZONE).format('YYYY-MM');
};

/**
 * Format amount as Indonesian Rupiah
 */
export const formatRupiah = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Format percentage with sign
 */
export const formatPercent = (value: number | null): string => {
    if (value === null) return '—';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

/**
 * Format month for display (e.g., "Jan 2026")
 */
export const formatMonth = (yearMonth: string): string => {
    return dayjs(`${yearMonth}-01`).tz(WIB_TIMEZONE).format('MMM YYYY');
};

/**
 * Format full date for display
 */
export const formatDate = (dateISO: string): string => {
    return dayjs(dateISO).tz(WIB_TIMEZONE).format('DD MMM YYYY');
};

/**
 * Convert YYYY-MM-DD to ISO with WIB offset
 */
export const toWIBISO = (dateStr: string): string => {
    return dayjs.tz(dateStr, WIB_TIMEZONE).format();
};
