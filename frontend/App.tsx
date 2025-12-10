import React, { useState, useEffect } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider as PaperProvider } from 'react-native-paper';
import { lightTheme, darkTheme } from './src/theme';
import { FirstLaunchScreen } from './src/components/FirstLaunchScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { SettingsNavigationScreen } from './src/screens/SettingsNavigationScreen';
import { DeviceService } from './src/services/device';
import { StorageService } from './src/services/storage';
import { DeviceInfo, ScreenList, MonthlyBudgetUpdate } from './src/types';
import { apiService } from './src/services/api';
import { MonthNavigation } from './src/utils/monthNavigation';


export default function App() {
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [currentMonth, setCurrentMonth] = useState('');
    const [currentScreen, setCurrentScreen] = useState<ScreenList>('home');

    useEffect(() => {
        initializeApp();
    }, []);

    const initializeApp = async () => {
        try {
            // Check if this is the first launch
            const firstLaunch = await DeviceService.isFirstLaunch();
            setIsFirstLaunch(firstLaunch);

            if (!firstLaunch) {
                // Load device info and app settings
                const device = await DeviceService.getDeviceInfo();
                const darkMode = await StorageService.getIsDarkMode();
                const month = await StorageService.getCurrentMonth();

                setDeviceInfo(device);
                setIsDarkMode(darkMode);
                setCurrentMonth(month);
            }
        } catch (error) {
            console.error('Failed to initialize app:', error);
            setIsFirstLaunch(true);
        }
    };

    const handleFirstLaunchComplete = (device: DeviceInfo) => {
        setDeviceInfo(device);
        setIsFirstLaunch(false);
        setCurrentMonth(new Date().toISOString().slice(0, 7));
    };

    const handleMonthChange = async (month: string) => {
        try {
            const transaction = await apiService.getOldestTransaction();
            const monthlyBudget = await apiService.getMonthlyBudget(transaction.timestamp.slice(0, 7))
            
            if (month == monthlyBudget.month_year && monthlyBudget.rollover_enabled) {
                const monthlyBudgetUpdated: MonthlyBudgetUpdate = {
                    budget_amount: monthlyBudget.budget_amount,
                    rollover_enabled: false
                };
                await apiService.updateMonthlyBudget(monthlyBudget.month_year, monthlyBudgetUpdated);
            }
        } catch(error) {
            if (error instanceof Error) {
                if (error.message === "Network request failed") {
                    console.warn(error.message);
                } else {
                    month = MonthNavigation.getFirstTrackedMonth([]);
                }
            }
        }

        setCurrentMonth(month);
        await StorageService.setCurrentMonth(month);
    };

    const handleScreenChange = (targetScreen: ScreenList) => {
        setCurrentScreen(targetScreen)
    };

    if (isFirstLaunch === null) {
        // Loading state
        return null;
    }

    if (isFirstLaunch) {
        return (
            <SafeAreaProvider>
                <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
                    <FirstLaunchScreen onComplete={handleFirstLaunchComplete} />
                    <StatusBar style={isDarkMode ? 'light' : 'dark'} />
                </PaperProvider>
            </SafeAreaProvider>
        );
    }

    if (!deviceInfo) {
        // Error state
        return null;
    }

    return (
        <SafeAreaProvider>
            <SafeAreaView style={{ flex: 1 }}>
                <PaperProvider theme={isDarkMode ? darkTheme : lightTheme}>
                    {currentScreen == 'home' ?
                        <HomeScreen
                            deviceInfo={deviceInfo}
                            currentMonth={currentMonth}
                            onMonthChange={handleMonthChange}
                            onScreenChange={handleScreenChange}
                        />
                        :
                        <SettingsNavigationScreen
                            onScreenChange={handleScreenChange}
                        />
                    }
                    <StatusBar />
                </PaperProvider>
            </SafeAreaView>
        </SafeAreaProvider>
    );
};
