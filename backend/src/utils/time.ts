import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const WIB_TIMEZONE = 'Asia/Jakarta';

/**
 * Get current time in WIB timezone
 */
export const getWIBNow = (): dayjs.Dayjs => {
    return dayjs().tz(WIB_TIMEZONE);
};

/**
 * Get WIB now as ISO string with offset
 */
export const getWIBNowISO = (): string => {
    return getWIBNow().format();
};

/**
 * Extract year-month (YYYY-MM) from an ISO date string in WIB context
 */
export const getYearMonth = (dateISO: string): string => {
    return dayjs(dateISO).tz(WIB_TIMEZONE).format('YYYY-MM');
};

/**
 * Get the last completed month in WIB
 * e.g., if today is Jan 17, 2026, returns "2025-12"
 */
export const getLastCompletedMonth = (): string => {
    const now = getWIBNow();
    return now.subtract(1, 'month').format('YYYY-MM');
};

/**
 * Get current month in WIB (YYYY-MM format)
 */
export const getCurrentMonth = (): string => {
    return getWIBNow().format('YYYY-MM');
};

/**
 * Get the previous month given a YYYY-MM string
 */
export const getPreviousMonth = (yearMonth: string): string => {
    return dayjs(`${yearMonth}-01`).tz(WIB_TIMEZONE).subtract(1, 'month').format('YYYY-MM');
};

/**
 * Get the same month from the previous year
 */
export const getSameMonthPriorYear = (yearMonth: string): string => {
    return dayjs(`${yearMonth}-01`).tz(WIB_TIMEZONE).subtract(1, 'year').format('YYYY-MM');
};

/**
 * Check if it's past the lock threshold (00:00:05 on 1st of month) for a given month
 */
export const isPastLockThreshold = (yearMonth: string): boolean => {
    const now = getWIBNow();

    // The month following the target month
    const nextMonth = dayjs(`${yearMonth}-01`).tz(WIB_TIMEZONE).add(1, 'month');

    // Lock threshold: 00:00:05 on the first of next month
    const lockThreshold = nextMonth.startOf('month').add(5, 'second');

    return now.isAfter(lockThreshold);
};

/**
 * Generate array of months from start to end (inclusive)
 */
export const getMonthRange = (startMonth: string, endMonth: string): string[] => {
    const months: string[] = [];
    let current = dayjs(`${startMonth}-01`).tz(WIB_TIMEZONE);
    const end = dayjs(`${endMonth}-01`).tz(WIB_TIMEZONE);

    while (current.isBefore(end) || current.isSame(end, 'month')) {
        months.push(current.format('YYYY-MM'));
        current = current.add(1, 'month');
    }

    return months;
};

/**
 * Generate array of days from start to end (inclusive)
 */
export const getDayRange = (startDate: string, endDate: string): string[] => {
    const days: string[] = [];
    let current = dayjs(startDate).tz(WIB_TIMEZONE);
    const end = dayjs(endDate).tz(WIB_TIMEZONE);

    while (current.isBefore(end) || current.isSame(end, 'day')) {
        days.push(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
    }

    return days;
};

/**
 * Format a month string for display (e.g., "Jan 2026")
 */
export const formatMonthDisplay = (yearMonth: string): string => {
    return dayjs(`${yearMonth}-01`).tz(WIB_TIMEZONE).format('MMM YYYY');
};
