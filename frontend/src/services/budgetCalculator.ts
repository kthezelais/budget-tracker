import { Transaction, MonthlyBudget, BudgetSummary } from '../types';

export class BudgetCalculator {
    /**
     * Calculate the previous month from a given month-year string
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
     * Calculate the next month from a given month-year string
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
     * Filter transactions for a specific month
     */
    static getTransactionsForMonth(transactions: Transaction[], monthYear: string): Transaction[] {
        const [year, month] = monthYear.split('-');
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 1);

        console.log(`📅 Filtering transactions for ${monthYear}:`, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalTransactions: transactions.length
        });

        const filteredTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.timestamp);
            const isInRange = transactionDate >= startDate && transactionDate < endDate;
            if (isInRange) {
                console.log(`✅ Transaction in range:`, {
                  name: transaction.name,
                  amount: transaction.amount,
                  type: transaction.type,
                  date: transaction.timestamp
                });
            }
            return isInRange;
        });

        console.log(`📊 Found ${filteredTransactions.length} transactions for ${monthYear}`);
        return filteredTransactions;
    }

    /**
     * Calculate total amount for transactions in a month (withdrawals increase spent, deposits decrease spent)
     */
    static calculateTotalForMonth(transactions: Transaction[], monthYear: string): number {
        const monthTransactions = this.getTransactionsForMonth(transactions, monthYear);
        return monthTransactions.reduce((total, transaction) => {
            if (transaction.type === 'withdraw') {
                return total + transaction.amount;
            } else if (transaction.type === 'deposit') {
                return total - transaction.amount;
            }
            return total;
        }, 0);
    }

    /**
     * Calculate rollover amount from previous month
     */
    static calculateRolloverAmount(
        transactions: Transaction[],
        budgets: MonthlyBudget[],
        currentMonth: string
    ): number {
        const previousMonth = this.getPreviousMonth(currentMonth);

        // Find previous month's budget
        let prevBudget = budgets.find(b => b.month_year === previousMonth);

        // If no previous budget or rollover disabled, no rollover
        if (!prevBudget) {
            return 0;
        }

        let rolloverAmount = 0;
        if (prevBudget.rollover_enabled) {
            rolloverAmount = this.calculateRolloverAmount(transactions, budgets, previousMonth);
        }

        // Calculate previous month's total transactions (withdrawals increase spent, deposits decrease spent)
        const prevMonthTransactions = this.getTransactionsForMonth(transactions, previousMonth);
        const prevMonthSumTransactions = prevMonthTransactions.reduce((total, transaction) => {
            if (transaction.type === 'withdraw') {
                return total + transaction.amount;
            } else if (transaction.type === 'deposit') {
                return total - transaction.amount;
            }
            return total;
        }, 0);

        // Calculate difference (positive = under budget, negative = over budget)
        const difference = prevBudget.budget_amount + rolloverAmount - prevMonthSumTransactions;
        return difference;
    }

    /**
     * Calculate budget summary for a given month
     */
    static calculateBudgetSummary(
        monthYear: string,
        transactions: Transaction[],
        budgets: MonthlyBudget[],
        defaultBudgetAmount: number
    ): BudgetSummary {
        // Find or create budget for this month
        let budget = budgets.find(b => b.month_year === monthYear);

        if (!budget) {
            // Create a new budget entry
            const rolloverAmount = this.calculateRolloverAmount(transactions, budgets, monthYear);
            budget = {
                id: 0, // Temporary ID for new budgets
                month_year: monthYear,
                budget_amount: defaultBudgetAmount + rolloverAmount,
                rollover_enabled: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
        } else {
            // Recalculate budget amount based on current rollover setting
            if (budget.rollover_enabled) {
                const rolloverAmount = this.calculateRolloverAmount(transactions, budgets, monthYear);
                console.log(`💰 Budget calculation: ${defaultBudgetAmount} + ${rolloverAmount} = ${defaultBudgetAmount + rolloverAmount}`);
                budget = {
                    ...budget,
                    budget_amount: defaultBudgetAmount + rolloverAmount,
                };
            } else {
                console.log(`💰 Budget calculation: ${defaultBudgetAmount} (no rollover)`);
                budget = {
                    ...budget,
                    budget_amount: defaultBudgetAmount,
                };
            }
        }

        // Calculate current month's total transactions
        const totalTransactions = this.calculateTotalForMonth(transactions, monthYear);

        // Calculate remaining budget
        const remainingBudget = budget.budget_amount - totalTransactions;

        // Determine if over budget
        const isOverBudget = remainingBudget < 0;

        return {
            month_year: monthYear,
            budget_amount: budget.budget_amount,
            total_transactions: totalTransactions,
            remaining_budget: remainingBudget,
            is_over_budget: isOverBudget,
            rollover_enabled: budget.rollover_enabled,
        };
    }

    /**
     * Recalculate budget summary when rollover setting changes
     */
    static recalculateWithRolloverChange(
        monthYear: string,
        transactions: Transaction[],
        budgets: MonthlyBudget[],
        newRolloverEnabled: boolean,
        defaultBudgetAmount: number
    ): BudgetSummary {
        // Update the budget's rollover setting
        const updatedBudgets = budgets.map(budget =>
            budget.month_year === monthYear
                ? { ...budget, rollover_enabled: newRolloverEnabled }
                : budget
        );

        // Recalculate the budget summary
        return this.calculateBudgetSummary(monthYear, transactions, updatedBudgets, defaultBudgetAmount);
    }

    /**
     * Debug method to test rollover calculation
     */
    static debugRolloverCalculation(
        transactions: Transaction[],
        budgets: MonthlyBudget[],
        currentMonth: string = '2025-10'
    ): void {
        console.log('🔍 DEBUG: Rollover Calculation Test');
        console.log('📊 Total transactions:', transactions.length);
        console.log('📊 Total budgets:', budgets.length);

        const previousMonth = this.getPreviousMonth(currentMonth);
        console.log('📅 Previous month:', previousMonth);

        const prevBudget = budgets.find(b => b.month_year === previousMonth);
        console.log('💰 Previous budget:', prevBudget);

        const prevTransactions = this.getTransactionsForMonth(transactions, previousMonth);
        console.log('📝 Previous month transactions:', prevTransactions.length);

        const prevSpent = prevTransactions
            .filter(t => t.type === 'withdraw')
            .reduce((total, t) => total + t.amount, 0);
        console.log('💸 Previous month spent:', prevSpent);

        if (prevBudget) {
            const rolloverAmount = prevBudget.budget_amount - prevSpent;
            console.log('🔄 Rollover amount:', rolloverAmount);
            console.log('🎯 Expected October budget:', 2000 + rolloverAmount);
        }
    }
}
