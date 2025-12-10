import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {
    Text,
    TextInput,
    Button,
    Card,
} from 'react-native-paper';
import { DeviceService } from '../services/device';
import { apiService } from '../services/api';
import { DeviceInfo } from '../types';


interface FirstLaunchScreenProps {
    onComplete: (deviceInfo: DeviceInfo) => void;
}


export const FirstLaunchScreen: React.FC<FirstLaunchScreenProps> = ({ onComplete }) => {
    const [username, setUsername] = useState('');
    const [serverIP, setServerIP] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [securityTextEnabled, setSecurityTextEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const handleComplete = async () => {
        if (!username.trim()) {
            Alert.alert('Error', 'Please enter a username');
            return;
        }

        setIsLoading(true);
        try {
            // Setup BaseURL and API key
            try {
                await apiService.setBaseUrl(serverIP);
                await apiService.updateApiKey(apiKey);
                console.log(`✅ BaseURL '${serverIP}' and apiKey '${apiKey}' saved.`);
            } catch (error) {
                console.warn('⚠️ Failed to save baseURL and/or apiKey: ', error);
            }

            // Generate device ID
            const deviceId = await DeviceService.generateDeviceId();

            console.log('🔑 Setting API key to:', apiKey);

            // Create device info
            const deviceInfo: DeviceInfo = {
                device_id: deviceId,
                username: username.trim(),
                device_name: username.trim(),
                api_key: apiKey,
            };

            // Save device info
            await DeviceService.setDeviceInfo(deviceInfo);

            // Register device with backend
            try {
                await apiService.registerDevice(deviceId, username.trim(), username.trim());
                console.log('✅ Device registered with backend');
            } catch (error) {
                console.warn('⚠️ Failed to register device with backend:', error);
                // Continue anyway - device will be registered when first transaction is made
            }

            console.log('✅ Device setup completed with API key:', apiKey);

            // Complete setup
            onComplete(deviceInfo);
        } catch (error) {
            console.error('Failed to complete setup:', error);
            Alert.alert('Error', 'Failed to complete setup. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputServerIP = async (text: string) => {
        setServerIP(text);
    };

    const handleShowContent = async () => {
        setSecurityTextEnabled(!securityTextEnabled);
    };

    const handleInputAPIKey = async (text: string) => {
        setApiKey(text)
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.content}>
                <Card style={styles.card}>
                    <Card.Content style={styles.cardContent}>
                        <Text variant='titleLarge' style={styles.title}>Welcome to Budget Tracker</Text>
                        <Text variant='bodyMedium' style={styles.subtitle}>
                            Let's set up your device to start tracking your budget
                        </Text>

                        <TextInput
                            label="Enter your username"
                            value={username}
                            onChangeText={setUsername}
                            style={styles.input}
                            mode="outlined"
                            autoCapitalize="none"
                            autoCorrect={false}
                            disabled={isLoading}
                        />

                        <TextInput
                            mode="outlined"
                            label="Server URL"
                            value={serverIP}
                            onChangeText={(text) => handleInputServerIP(text)}
                        />

                        <TextInput
                            secureTextEntry={securityTextEnabled}
                            right={<TextInput.Icon icon="eye" onPress={() => handleShowContent()} />}
                            mode="outlined"
                            label="API Key"
                            value={apiKey}
                            onChangeText={(text) => handleInputAPIKey(text)}
                        />

                        <Button
                            mode="contained"
                            onPress={handleComplete}
                            style={styles.button}
                            disabled={username === "" || apiKey === "" || serverIP === ""}
                            loading={isLoading}
                        >
                            {isLoading ? 'Setting up...' : 'Get Started'}
                        </Button>
                    </Card.Content>
                </Card>
            </View>
        </KeyboardAvoidingView>
    );
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        elevation: 4,
    },
    cardContent: {
        padding: 24,
    },
    title: {
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 24,
        fontWeight: 'bold',
    },
    subtitle: {
        textAlign: 'center',
        marginBottom: 32,
        fontSize: 16,
        color: '#666',
    },
    input: {
        marginBottom: 24,
    },
    button: {
        marginTop: 8,
    },
});
