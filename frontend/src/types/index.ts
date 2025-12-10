export interface Transaction {
    id: number;
    device_id: string;
    name: string;
    amount: number;
    type: 'withdraw' | 'deposit';
    timestamp: string;
    created_at: string;
    updated_at: string;
    username?: string;
}

export interface TransactionCreate {
    device_id: string;
    name: string;
    amount: number;
    timestamp: string;
    type: 'withdraw' | 'deposit';
}

export interface TransactionUpdate {
    name?: string;
    amount?: number;
    type?: 'withdraw' | 'deposit';
}

export interface MonthlyBudget {
    id: number;
    month_year: string;
    budget_amount: number;
    rollover_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface MonthlyBudgetCreate {
    month_year: string;
    budget_amount: number;
    rollover_enabled: boolean;
}

export interface MonthlyBudgetUpdate {
    budget_amount?: number;
    rollover_enabled?: boolean;
}

export interface BudgetSummary {
    month_year: string;
    budget_amount: number;
    total_transactions: number;
    remaining_budget: number;
    is_over_budget: boolean;
    rollover_enabled: boolean;
}

export interface Setting {
    id: number;
    key: string;
    value: string;
    updated_at: string;
}

export interface DeviceInfo {
    device_id: string;
    device_name: string;
    username: string;
    api_key: string;
}

export interface AppState {
    isFirstLaunch: boolean;
    isDarkMode: boolean;
    currentMonth: string;
    deviceInfo: DeviceInfo | null;
    isOnline: boolean;
    lastSyncTime: string | null;
}

export type ScreenList = 'home' | 'settings'

export type RootStackParamList = {
    HomeSettings: undefined;
    DefaultBudgetSettings: undefined;
    DeviceUsernameSettings: undefined;
    ServerConnectSettings: undefined;
};

export interface SettingsScreenProps {
    onScreenChange: (targetScreen: ScreenList) => void;
}
