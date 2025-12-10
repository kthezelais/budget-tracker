import { useState, useEffect } from "react"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList, Setting } from "../types"
import { AppBarSettings } from "../components/AppBarSettings"
import { View, Text, StyleSheet } from "react-native"
import { TextInput } from "react-native-paper";
import { apiService } from "../services/api";


export const ServerConnectSettingsScreen: React.FC = () => {
    const [apiKey, setAPIKey] = useState<string>("");
    const [serverIP, setServerIP] = useState<string>("");
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [securityTextEnabled, setSecurityText] = useState<boolean>(true);


    const initBaseUrl = async () => {
        try {
            const baseURL = await apiService.getBaseUrl()
            if (baseURL) {
                setServerIP(baseURL);
            }
        } catch(error) {
            console.log(error);
        }
    }

    const updateAPIKey = async () => {
        try {
            await apiService.updateApiKey(apiKey);
        } catch(error) {
            setSnackbarMessage('Failed to update API key value.');
            setSnackbarVisible(true);
        }
    };

    const updateServerIP = async () => {
        try {
            await apiService.updateBaseUrl(serverIP);
        } catch (error) {
            throw error;
        }
    };

    const handleSave = () => {
        try {
            if (serverIP) {
                updateServerIP();
            }
    
            if (apiKey) {
                updateAPIKey();
            }
            navigation.navigate("HomeSettings");
        } catch(error) {
            setSnackbarMessage(`${error}`);
            setSnackbarVisible(true);
        }
    };

    const handleInputAPIKey = (text: string) => {
        setAPIKey(text);
    }

    const handleInputServerIP = (text: string) => {
        setServerIP(text);
    }

    const handleShowContent = () => {
        setSecurityText(!securityTextEnabled);
    }


    useEffect(() => {
        initBaseUrl();
    }, [])

    return (
        <View style={{ marginTop: -25, marginBottom: -10 }}>
            <AppBarSettings
                title="Server settings"
                onPressBackAction={() => navigation.navigate("HomeSettings")}
                displaySave={true}
                onSave={() => handleSave()}
            />
            <View style={styles.body}>
                <Text style={styles.textDescription}>
                    This section is used to configure the information used to
                    link the application with the server API:{"\n"}
                </Text>
                <TextInput
                    mode="outlined"
                    label="Server IP address"
                    value={serverIP}
                    onChangeText={(text) => handleInputServerIP(text)}
                />
                <Text style={styles.textDescription}>
                    Server IP address: used to reach the API.
                </Text>
                <TextInput
                    secureTextEntry={securityTextEnabled}
                    right={<TextInput.Icon icon="eye" onPress={() => handleShowContent()} />}
                    mode="outlined"
                    label="API Key"
                    value={apiKey}
                    onChangeText={(text) => handleInputAPIKey(text)}
                />
                <Text style={styles.textDescription}>
                    API Key: used by the application to authenticate the communicate with the API.
                </Text>
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
