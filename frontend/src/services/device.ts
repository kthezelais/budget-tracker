import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import { DeviceInfo } from '../types';
import { API_CONFIG } from '../config/api';

const DEVICE_INFO_KEY = 'device_info';

export class DeviceService {
    static async getDeviceInfo(): Promise<DeviceInfo | null> {
        try {
            const deviceInfoString = await AsyncStorage.getItem(DEVICE_INFO_KEY);
            if (deviceInfoString) {
                return JSON.parse(deviceInfoString);
            }
            return null;
        } catch (error) {
            console.error('Failed to get device info:', error);
            return null;
        }
    }

    static async setDeviceInfo(deviceInfo: DeviceInfo): Promise<void> {
        try {
            await AsyncStorage.setItem(DEVICE_INFO_KEY, JSON.stringify(deviceInfo));
        } catch (error) {
            console.error('Failed to save device info:', error);
        }
    }

    static async generateDeviceId(): Promise<string> {
        const deviceName = Device.deviceName || 'Unknown Device';
        const deviceType = Device.deviceType || 'unknown';
        const deviceManufacturer = Device.manufacturer;
        const deviceBrand = Device.brand;

        // Create a unique device ID based on device info and timestamp
        const deviceId = `${deviceType}-${deviceBrand}-${deviceName.replace(/\s+/g, '-')}-${deviceManufacturer}`;
        return deviceId;
    }

    static async isFirstLaunch(): Promise<boolean> {
        try {
            const deviceInfo = await this.getDeviceInfo();
            return deviceInfo === null;
        } catch (error) {
            console.error('Failed to check first launch:', error);
            return true;
        }
    }

    static async clearDeviceInfo(): Promise<void> {
        try {
            await AsyncStorage.removeItem(DEVICE_INFO_KEY);
        } catch (error) {
            console.error('Failed to clear device info:', error);
        }
    }

    static async clearAllData(): Promise<void> {
        try {
            // Clear device info
            await AsyncStorage.removeItem(DEVICE_INFO_KEY);

            // Clear API key
            await AsyncStorage.removeItem(API_CONFIG.API_KEY);

            // Clear other stored data
            const keys = await AsyncStorage.getAllKeys();
            const budgetKeys = keys.filter(key =>
                key.includes('transactions') ||
                key.includes('budget') ||
                key.includes('settings')
            );
            await AsyncStorage.multiRemove(budgetKeys);

            console.log('🧹 All app data cleared');
        } catch (error) {
            console.error('Failed to clear all data:', error);
        }
    }
}
