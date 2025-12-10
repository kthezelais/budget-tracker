import { API_CONFIG } from '../config/api';
import {
    Transaction,
    TransactionCreate,
    TransactionUpdate,
    MonthlyBudget,
    MonthlyBudgetCreate,
    MonthlyBudgetUpdate,
    BudgetSummary,
    Setting,
    DeviceInfo
} from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';


class ApiService {
    private baseUrl: string | null = null;
    private apiKey: string | null = null;

    constructor() {
        this.loadBaseUrl();
        this.loadApiKey();
    }

    private async loadApiKey() {
        try {
            this.apiKey = await AsyncStorage.getItem(API_CONFIG.API_KEY);
        } catch (error) {
            console.error('Failed to load API key:', error);
        }
    }

    private async loadBaseUrl() {
        try {
            this.baseUrl = await AsyncStorage.getItem(API_CONFIG.BASE_URL);
        } catch (error) {
            console.error('Failed to load base URL:', error);
        }
    }

    private async getHeaders(): Promise<HeadersInit> {
        if (!this.apiKey) {
            await this.loadApiKey();
        }

        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
        };
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = await this.getHeaders();

        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    public async getBaseUrl(): Promise<string | null> {
        return this.baseUrl;
    }

    public async updateApiKey(apiKey: string) {
        if (!this.apiKey) {
            await this.loadApiKey();
        }

        if (this.apiKey != apiKey) {
            this.setApiKey(apiKey);
        }
    }

    public async updateBaseUrl(baseUrl: string) {
        if (!this.baseUrl) {
            await this.loadBaseUrl();
        }

        if (this.baseUrl != baseUrl) {
            const urlPattern = /^(https?:\/\/)?((([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})|((\d{1,3}\.){3}\d{1,3}))(:\d{1,5})?(\/[^\s]*)?$/;

            if (urlPattern.test(baseUrl)) {
                this.setBaseUrl(baseUrl)
            } else {
                throw new Error("Inputed base URL/IP address is incorrect.");
            }
        }
    }

    // Transaction methods
    async getTransactions(timezone: string, monthYear?: string): Promise<Transaction[]> {
        const endpoint = monthYear
            ? `${API_CONFIG.ENDPOINTS.TRANSACTIONS}`
            + `?timezone=${encodeURIComponent(timezone)}&&month_year=${encodeURIComponent(monthYear)}`
            : `${API_CONFIG.ENDPOINTS.TRANSACTIONS}`
            + `?timezone=${encodeURIComponent(timezone)}`;

        return this.makeRequest<Transaction[]>(endpoint);
    }

    async getOldestTransaction(): Promise<Transaction> {
        const endpoint = `${API_CONFIG.ENDPOINTS.TRANSACTIONS}oldest/`
        return this.makeRequest<Transaction>(endpoint);
    }

    async getNextTransaction(transactionId: number): Promise<Transaction> {
        const endpoint = `${API_CONFIG.ENDPOINTS.TRANSACTIONS}next/${transactionId}`
        return this.makeRequest<Transaction>(endpoint);
    }

    async getPreviousTransaction(transactionId: number): Promise<Transaction> {
        const endpoint = `${API_CONFIG.ENDPOINTS.TRANSACTIONS}previous/${transactionId}`
        return this.makeRequest<Transaction>(endpoint);
    }

    async getTransaction(id: number): Promise<Transaction> {
        return this.makeRequest<Transaction>(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}${id}`);
    }

    async createTransaction(transaction: TransactionCreate): Promise<Transaction> {
        return this.makeRequest<Transaction>(API_CONFIG.ENDPOINTS.TRANSACTIONS, {
            method: 'POST',
            body: JSON.stringify(transaction),
        });
    }

    async updateTransaction(id: number, transaction: TransactionUpdate): Promise<Transaction> {
        return this.makeRequest<Transaction>(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}${id}`, {
            method: 'PUT',
            body: JSON.stringify(transaction),
        });
    }

    async deleteTransaction(id: number): Promise<void> {
        await this.makeRequest(`${API_CONFIG.ENDPOINTS.TRANSACTIONS}${id}`, {
            method: 'DELETE',
        });
    }

    // Monthly Budget methods
    async getMonthlyBudgets(): Promise<MonthlyBudget[]> {
        return this.makeRequest<MonthlyBudget[]>(API_CONFIG.ENDPOINTS.MONTHLY_BUDGETS);
    }

    async getMonthlyBudget(monthYear: string): Promise<MonthlyBudget> {
        return this.makeRequest<MonthlyBudget>(`${API_CONFIG.ENDPOINTS.MONTHLY_BUDGETS}${monthYear}`);
    }

    async createMonthlyBudget(budget: MonthlyBudgetCreate): Promise<MonthlyBudget> {
        return this.makeRequest<MonthlyBudget>(API_CONFIG.ENDPOINTS.MONTHLY_BUDGETS, {
            method: 'POST',
            body: JSON.stringify(budget),
        });
    }

    async updateMonthlyBudget(monthYear: string, budget: MonthlyBudgetUpdate): Promise<MonthlyBudget> {
        return this.makeRequest<MonthlyBudget>(`${API_CONFIG.ENDPOINTS.MONTHLY_BUDGETS}${monthYear}`, {
            method: 'PUT',
            body: JSON.stringify(budget),
        });
    }

    // Budget Summary
    async getBudgetSummary(monthYear: string): Promise<BudgetSummary> {
        return this.makeRequest<BudgetSummary>(`${API_CONFIG.ENDPOINTS.BUDGET_SUMMARY}${monthYear}`);
    }

    // Settings methods
    async getSettings(): Promise<Setting[]> {
        return this.makeRequest<Setting[]>(API_CONFIG.ENDPOINTS.SETTINGS);
    }

    async createSetting(key: string, value: string): Promise<Setting> {
        return this.makeRequest<Setting>(API_CONFIG.ENDPOINTS.SETTINGS, {
            method: 'POST',
            body: JSON.stringify({ key, value }),
        });
    }

    async updateSetting(key: string, value: string | undefined): Promise<Setting> {
        return this.makeRequest<Setting>(API_CONFIG.ENDPOINTS.SETTINGS, {
            method: 'PUT',
            body: JSON.stringify({ key, value })
        })
    }

    // Device methods
    async getDeviceInfo(device_id: string | undefined) {
        return this.makeRequest<DeviceInfo>(`${API_CONFIG.ENDPOINTS.DEVICES}${device_id}`, {
            method: 'GET'
        })
    }

    async updateDeviceUsername(device_id: string | undefined, device_username: string | undefined) {
        console.log(`${API_CONFIG.ENDPOINTS.DEVICES}${device_id}?device_username=${device_username}`)
        return this.makeRequest<DeviceInfo>(`${API_CONFIG.ENDPOINTS.DEVICES}${device_id}?device_username=${device_username}`, {
            method: 'PUT'
        })
    }

    // Utility methods
    async setApiKey(apiKey: string): Promise<void> {
        this.apiKey = apiKey;
        await AsyncStorage.setItem(API_CONFIG.API_KEY, apiKey);
        console.log('🔑 API Key updated to:', apiKey);
    }

    async setBaseUrl(baseUrl: string): Promise<void> {
        this.baseUrl = baseUrl;
        await AsyncStorage.setItem(API_CONFIG.BASE_URL, baseUrl);
        console.log('🔑 Base URL updated to:', baseUrl);
    }

    async clearApiKey(): Promise<void> {
        this.apiKey = null;
        await AsyncStorage.removeItem(API_CONFIG.API_KEY);
    }

    async registerDevice(deviceId: string, username: string, deviceName: string): Promise<void> {
        try {
            await this.makeRequest('/devices/', {
                method: 'POST',
                body: JSON.stringify({
                    device_id: deviceId,
                    username: username,
                    device_name: deviceName,
                }),
            });
        } catch (error) {
            console.error('Failed to register device:', error);
            throw error;
        }
    }

    isOnline(): boolean {
        // This is a simple check - in a real app you might want to use NetInfo
        return true;
    }
}

export const apiService = new ApiService();
