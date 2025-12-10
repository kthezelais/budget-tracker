import { useState, useEffect } from "react"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../types"
import { AppBarSettings } from "../components/AppBarSettings"
import { View, Text, StyleSheet } from "react-native"
import { TextInput } from "react-native-paper";
import { apiService } from "../services/api";
import { DeviceService } from "../services/device";


export const DeviceUsernameSettingsScreen: React.FC = () => {
    const [deviceUsername, setDeviceUsername] = useState<string | undefined>("");
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');


    const initTextInput = async () => {
        try {
            const localDeviceInfo = await DeviceService.getDeviceInfo();
            const deviceInfoDB = await apiService.getDeviceInfo(localDeviceInfo?.device_id);


            setDeviceUsername(deviceInfoDB.username);

            // Save to local storage
            await DeviceService.setDeviceInfo(deviceInfoDB);
        } catch(error) {
            console.error('Failed to load data from API:', error);

            // Try to load from local storage as fallback
            try {
                const localDeviceInfo = await DeviceService.getDeviceInfo();

                setDeviceUsername(localDeviceInfo?.username);
                setSnackbarMessage('Using offline data');
                setSnackbarVisible(true);
            } catch (localError) {
                console.error('Failed to load local data:', localError);
                setSnackbarMessage('Failed to load data');
                setSnackbarVisible(true);
            }
        }
    };

    const updateDeviceUsername = async () => {
        try {
            // Retrieve Device info from local storage
            const localDeviceInfo = await DeviceService.getDeviceInfo();
            
            try {
                if (localDeviceInfo && localDeviceInfo?.username != deviceUsername) {
                    const res = await apiService.updateDeviceUsername(localDeviceInfo.device_id, deviceUsername);
                    
                    // Save to local storage
                    await DeviceService.setDeviceInfo(res);
                }
            } catch(error) {
                try {
                    if (deviceUsername && localDeviceInfo) {
                        await apiService.registerDevice(localDeviceInfo.device_id, deviceUsername, localDeviceInfo.device_name);
                    }
                } catch(error) {
                    console.error('Failed to update device username:', error);
                    setSnackbarMessage('Failed to update device username');
                    setSnackbarVisible(true);
                }
            }
        } catch(error) {
            console.error('Failed to load data from API:', error);
            setSnackbarMessage('Failed to load data from API');
            setSnackbarVisible(true);
        }
    };

    const handleSave = () => {
        updateDeviceUsername();
        navigation.navigate("HomeSettings");
    };

    const handleInputText = (text: string) => {
        setDeviceUsername(text);
    }


    useEffect(() => {
        initTextInput();
    }, []);


    return (
        <View style={{ marginTop: -25, marginBottom: -10 }}>
            <AppBarSettings
                title="Device Username"
                onPressBackAction={() => navigation.navigate("HomeSettings")}
                displaySave={true}
                onSave={() => handleSave()}
            />
            <View style={styles.body}>
                <Text style={styles.textDescription}>
                    The username associated to your device.
                    It is used to assign transactions you create to yourself.
                </Text>
                <TextInput
                    mode="outlined"
                    label="Device Username"
                    value={deviceUsername}
                    onChangeText={(text) => handleInputText(text)}
                />
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
    body: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    textDescription: {
        paddingBottom: 15,
        color: "rgba(144, 144, 144, 1)"
    },
    textValue: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    }
});
