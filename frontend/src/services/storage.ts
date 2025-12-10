import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, MonthlyBudget, Setting } from '../types';


const STORAGE_KEYS = {
    TRANSACTIONS: 'transactions',
    MONTHLY_BUDGETS: 'monthly_budgets',
    SETTINGS: 'settings',
    LAST_SYNC: 'last_sync',
    IS_DARK_MODE: 'is_dark_mode',
    CURRENT_MONTH: 'current_month',
};


export class StorageService {
    // Transaction storage
    static async getTransactions(): Promise<Transaction[]> {
        try {
            const transactions = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
            return transactions ? JSON.parse(transactions) : [];
        } catch (error) {
            console.error('Failed to get transactions:', error);
            return [];
        }
    }

    static async saveTransactions(transactions: Transaction[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
        } catch (error) {
            console.error('Failed to save transactions:', error);
        }
    }

    static async addTransaction(transaction: Transaction): Promise<void> {
        try {
            const transactions = await this.getTransactions();
            transactions.push(transaction);
            await this.saveTransactions(transactions);
        } catch (error) {
            console.error('Failed to add transaction:', error);
        }
    }

    static async updateTransaction(updatedTransaction: Transaction): Promise<void> {
        try {
            const transactions = await this.getTransactions();
            const index = transactions.findIndex(t => t.id === updatedTransaction.id);
            if (index !== -1) {
                transactions[index] = updatedTransaction;
                await this.saveTransactions(transactions);
            }
        } catch (error) {
            console.error('Failed to update transaction:', error);
        }
    }

    static async deleteTransaction(transactionId: number): Promise<void> {
        try {
            const transactions = await this.getTransactions();
            const filteredTransactions = transactions.filter(t => t.id !== transactionId);
            await this.saveTransactions(filteredTransactions);
        } catch (error) {
            console.error('Failed to delete transaction:', error);
        }
    }

    // Monthly Budget storage
    static async getMonthlyBudgets(): Promise<MonthlyBudget[]> {
        try {
            const budgets = await AsyncStorage.getItem(STORAGE_KEYS.MONTHLY_BUDGETS);
            return budgets ? JSON.parse(budgets) : [];
        } catch (error) {
            console.error('Failed to get monthly budgets:', error);
            return [];
        }
    }

    static async saveMonthlyBudgets(budgets: MonthlyBudget[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.MONTHLY_BUDGETS, JSON.stringify(budgets));
        } catch (error) {
            console.error('Failed to save monthly budgets:', error);
        }
    }

    static async getMonthlyBudget(monthYear: string): Promise<MonthlyBudget | null> {
        try {
            const budgets = await this.getMonthlyBudgets();
            return budgets.find(b => b.month_year === monthYear) || null;
        } catch (error) {
            console.error('Failed to get monthly budget:', error);
            return null;
        }
    }

    static async saveMonthlyBudget(budget: MonthlyBudget): Promise<void> {
        try {
            const budgets = await this.getMonthlyBudgets();
            const index = budgets.findIndex(b => b.month_year === budget.month_year);
            if (index !== -1) {
                budgets[index] = budget;
            } else {
                budgets.push(budget);
            }
            await this.saveMonthlyBudgets(budgets);
        } catch (error) {
            console.error('Failed to save monthly budget:', error);
        }
    }

    // Settings storage
    static async getSettings(): Promise<Setting[]> {
        try {
            const settings = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : [];
        } catch (error) {
            console.error('Failed to get settings:', error);
            return [];
        }
    }

    static async saveSettings(settings: Setting[]): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    static async getSetting(key: string): Promise<string | null> {
        try {
            const settings = await this.getSettings();
            const setting = settings.find(s => s.key === key);
            return setting ? setting.value : null;
        } catch (error) {
            console.error('Failed to get setting:', error);
            return null;
        }
    }

    static async setSetting(key: string, value: string): Promise<void> {
        try {
            const settings = await this.getSettings();
            const index = settings.findIndex(s => s.key === key);
            const newSetting: Setting = {
                id: index !== -1 ? settings[index].id : Date.now(),
                key,
                value,
                updated_at: new Date().toISOString(),
            };

            if (index !== -1) {
                settings[index] = newSetting;
            } else {
                settings.push(newSetting);
            }

            await this.saveSettings(settings);
        } catch (error) {
            console.error('Failed to set setting:', error);
        }
    }

    // App state storage
    static async getLastSyncTime(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        } catch (error) {
            console.error('Failed to get last sync time:', error);
            return null;
        }
    }

    static async setLastSyncTime(timestamp: string): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
        } catch (error) {
            console.error('Failed to set last sync time:', error);
        }
    }

    static async getIsDarkMode(): Promise<boolean> {
        try {
            const isDarkMode = await AsyncStorage.getItem(STORAGE_KEYS.IS_DARK_MODE);
            return isDarkMode === 'true';
        } catch (error) {
            console.error('Failed to get dark mode setting:', error);
            return false;
        }
    }

    static async setIsDarkMode(isDarkMode: boolean): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.IS_DARK_MODE, isDarkMode.toString());
        } catch (error) {
            console.error('Failed to set dark mode:', error);
        }
    }

    static async getCurrentMonth(): Promise<string> {
        try {
            const currentMonth = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_MONTH);
            return currentMonth || new Date().toISOString().slice(0, 7);
        } catch (error) {
            console.error('Failed to get current month:', error);
            return new Date().toISOString().slice(0, 7);
        }
    }

    static async setCurrentMonth(month: string): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_MONTH, month);
        } catch (error) {
            console.error('Failed to set current month:', error);
        }
    }

    // Clear all data
    static async clearAllData(): Promise<void> {
        try {
            await AsyncStorage.multiRemove([
                STORAGE_KEYS.TRANSACTIONS,
                STORAGE_KEYS.MONTHLY_BUDGETS,
                STORAGE_KEYS.SETTINGS,
                STORAGE_KEYS.LAST_SYNC,
            ]);
        } catch (error) {
            console.error('Failed to clear all data:', error);
        }
    }
}
