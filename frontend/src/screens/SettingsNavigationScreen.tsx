import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DefaultBudgetSettingsScreen } from './DefaultBudgetSettingsScreen';
import { DeviceUsernameSettingsScreen } from './DeviceUsernameSettingsScreen';
import { ServerConnectSettingsScreen } from './ServerConnectSettingsScreen';
import { HomeSettingsScreen } from './HomeSettingsScreen';
import {
    RootStackParamList,
    SettingsScreenProps
} from '../types';


const Stack = createNativeStackNavigator<RootStackParamList>();


export const SettingsNavigationScreen: React.FC<SettingsScreenProps> = ({
    onScreenChange
}) => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="HomeSettings" screenOptions={{ headerShown: false }}>
                <Stack.Screen name="HomeSettings">
                    {() => <HomeSettingsScreen
                        onScreenChange={onScreenChange}
                    />}
                </Stack.Screen>
                <Stack.Screen name="DefaultBudgetSettings" component={DefaultBudgetSettingsScreen} />
                <Stack.Screen name="DeviceUsernameSettings" component={DeviceUsernameSettingsScreen} />
                <Stack.Screen name="ServerConnectSettings" component={ServerConnectSettingsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
