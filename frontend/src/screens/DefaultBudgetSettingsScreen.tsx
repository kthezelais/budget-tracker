import { useState, useEffect } from "react"
import { useNavigation } from "@react-navigation/native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { RootStackParamList } from "../types"
import { AppBarSettings } from "../components/AppBarSettings"
import { View, Text, StyleSheet } from "react-native"
import { TextInput } from "react-native-paper";
import { apiService } from "../services/api";
import { StorageService } from "../services/storage"


export const DefaultBudgetSettingsScreen: React.FC = () => {
    const [defaultBudget, setDefaultBudget] = useState<string | undefined>("0.00");
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');


    const initTextInput = async () => {
        try {
            // Load transactions, budget summary, and monthly budgets
            const settings = await apiService.getSettings();
            const currentDefaultBudget = settings.find((setting) => setting.key == 'default_budget_amount')?.value

            setDefaultBudget(currentDefaultBudget);

            // Save to local storage
            await StorageService.saveSettings(settings);
        } catch(error) {
            console.error('Failed to load data from API:', error);

            // Try to load from local storage as fallback
            try {
                const localSettings = await StorageService.getSettings();

                setDefaultBudget(
                    localSettings.find((setting) => setting.key == 'default_budget_amount')?.value);
                setSnackbarMessage('Using offline data');
                setSnackbarVisible(true);
            } catch (localError) {
                console.error('Failed to load local data:', localError);
                setSnackbarMessage('Failed to load data');
                setSnackbarVisible(true);
            }
        }
    };

    const updateDefaultBudget = async () => {
        try {
            // Load transactions, budget summary, and monthly budgets
            const settings = await apiService.getSettings();
            const currentDefaultBudget = settings.find((setting) => setting.key == 'default_budget_amount')?.value

            try {
                if (currentDefaultBudget != defaultBudget) {
                    await apiService.updateSetting('default_budget_amount', defaultBudget)
                    
                    // Save to local storage
                    await StorageService.saveSettings(settings);
                }
            } catch(error) {
                console.error('Failed to update setting:', error);
                setSnackbarMessage('Failed to update default budget');
                setSnackbarVisible(true);
            }
        } catch(error) {
            console.error('Failed to load data from API:', error);
            setSnackbarMessage('Failed to load data from API');
            setSnackbarVisible(true);
        }
    };

    const handleSave = () => {
        updateDefaultBudget();
        navigation.navigate("HomeSettings");
    };

    const handleInputBudget = (text: string) => {
        const decimalPattern = /^\d*\.?\d{0,2}$/;
        if (decimalPattern.test(text)) {
            setDefaultBudget(text);
        }
    }


    useEffect(() => {
        initTextInput();
    }, []);


    return (
        <View style={{ marginTop: -25, marginBottom: -10 }}>
            <AppBarSettings
                title="Default Budget"
                onPressBackAction={() => navigation.navigate("HomeSettings")}
                displaySave={true}
                onSave={() => handleSave()}
            />
            <View style={styles.body}>
                <Text style={styles.textDescription}>
                    The default budget value set at the beginning of each month.
                </Text>
                <TextInput
                    mode="outlined"
                    label="Default Budget"
                    value={defaultBudget}
                    left={<TextInput.Affix text="$" />}
                    onChangeText={(text) => handleInputBudget(text)}
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
