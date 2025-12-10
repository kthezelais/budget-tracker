/**
 * Utility functions for month navigation
 */

export class MonthNavigation {
    /**
     * Get the current month in YYYY-MM format
     */
    static getCurrentMonth(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        return `${year}-${month}`;
    }

    /**
     * Get the previous month from a given month
     */
    static getPreviousMonth(monthYear: string): string {
        const [year, month] = monthYear.split('-');
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (monthNum === 1) {
            return `${yearNum - 1}-12`;
        } else {
            return `${year}-${(monthNum - 1).toString().padStart(2, '0')}`;
        }
    }

    /**
     * Get the next month from a given month
     */
    static getNextMonth(monthYear: string): string {
        const [year, month] = monthYear.split('-');
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);

        if (monthNum === 12) {
            return `${yearNum + 1}-01`;
        } else {
            return `${year}-${(monthNum + 1).toString().padStart(2, '0')}`;
        }
    }

    /**
     * Format month for display (e.g., "2025-10" -> "October 2025")
     */
    static formatMonthForDisplay(monthYear: string): string {
        const [year, month] = monthYear.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'long',
        });
    }

    /**
     * Check if a month is the current month
     */
    static isCurrentMonth(monthYear: string): boolean {
        return monthYear === this.getCurrentMonth();
    }

    /**
     * Get a list of months between two dates
     */
    static getMonthsBetween(startMonth: string, endMonth: string): string[] {
        const months: string[] = [];
        let current = startMonth;

        while (current <= endMonth) {
            months.push(current);
            current = this.getNextMonth(current);
        }

        return months;
    }

    /**
     * Get the last N months from a given month
     */
    static getLastNMonths(fromMonth: string, count: number): string[] {
        const months: string[] = [];
        let current = fromMonth;

        for (let i = 0; i < count; i++) {
            months.unshift(current);
            current = this.getPreviousMonth(current);
        }

        return months;
    }

    /**
     * Get the next N months from a given month
     */
    static getNextNMonths(fromMonth: string, count: number): string[] {
        const months: string[] = [];
        let current = fromMonth;

        for (let i = 0; i < count; i++) {
            months.push(current);
            current = this.getNextMonth(current);
        }

        return months;
    }

    /**
     * Find the first month that has transactions
     */
    static getFirstTrackedMonth(transactions: any[]): string {
        const currentDate = new Date(Date.now());
        let year = currentDate.getFullYear();
        let month = (currentDate.getMonth() + 1).toString().padStart(2, '0');

        if (transactions && transactions.length > 0) {
            // Sort transactions by timestamp to find the earliest one
            const sortedTransactions = [...transactions].sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
    
            const firstTransaction = sortedTransactions[0];
            const firstTransactionDate = new Date(firstTransaction.timestamp);
    
            year = firstTransactionDate.getFullYear();
            month = (firstTransactionDate.getMonth() + 1).toString().padStart(2, '0');
        }

        return `${year}-${month}`;
    }
}
