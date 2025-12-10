// API Configuration
export const API_CONFIG = {
    // For development, use your local IP address
    // For production, use your public domain
    BASE_URL: __DEV__
        ? 'http://127.0.0.1:8000' // Replace with your local IP
        : 'https://budget.example.com', // Replace with your production domain

    ENDPOINTS: {
        TRANSACTIONS: '/transactions/',
        MONTHLY_BUDGETS: '/monthly-budgets/',
        SETTINGS: '/settings/',
        BUDGET_SUMMARY: '/budget-summary/',
        DEVICES: '/devices/'
    },

    // API Key will be stored in AsyncStorage (the key value)
    API_KEY: 'budget-tracker-api-key',

    // Sync configuration
    SYNC_INTERVAL: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};

// Default values
export const DEFAULT_VALUES = {
    BUDGET_AMOUNT: 1000,
    CURRENCY: 'CAD',
    DATE_FORMAT: 'YYYY-MM',
};
