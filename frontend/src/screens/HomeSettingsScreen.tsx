import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, SettingsScreenProps } from "../types";
import { AppBarSettings } from "../components/AppBarSettings";
import {
    PressableAndroidRippleConfig,
    View,
    StyleSheet,
    BackHandler
 } from "react-native";
import {
    Divider,
    Icon,
    TouchableRipple,
    Text
} from "react-native-paper";


interface HomeSettingsScreenProps extends SettingsScreenProps {}


export const HomeSettingsScreen: React.FC<HomeSettingsScreenProps> = ({
    onScreenChange
}) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handleBackAction = () => {
        onScreenChange('home');
        return true;
    };

    BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackAction
    );

    return (
        <View style={{ marginTop: -25, marginBottom: -10 }}>
            <AppBarSettings
                title="Settings"
                onPressBackAction={() => {onScreenChange('home')}}
            />
            <View>
                
                <TouchableRipple
                    background={
                        {
                            color: "rgba(107, 107, 107, 0.05)'",
                            foreground: true
                        } as PressableAndroidRippleConfig
                    }
                    style={styles.buttonContainer}
                    onPress={() => navigation.navigate("DefaultBudgetSettings")}
                >
                    <View style={styles.textRow}>
                        <Text variant="bodyLarge">
                            Default budget
                        </Text>
                        <Icon size={20} source="arrow-right" />
                    </View>
                </TouchableRipple>

                <Divider horizontalInset />
                
                <TouchableRipple
                    background={
                        {
                            color: "rgba(107, 107, 107, 0.05)'",
                            foreground: true
                        } as PressableAndroidRippleConfig
                    }
                    style={styles.buttonContainer}
                    onPress={() => navigation.navigate("DeviceUsernameSettings")}
                >
                    <View style={styles.textRow}>
                        <Text variant="bodyLarge">
                            Device username
                        </Text>
                        <Icon size={20} source="arrow-right" />
                    </View>
                </TouchableRipple>

                <Divider horizontalInset />

                <TouchableRipple
                    background={
                        {
                            color: "rgba(107, 107, 107, 0.05)'",
                            foreground: true
                        } as PressableAndroidRippleConfig
                    }
                    style={styles.buttonContainer}
                    onPress={() => navigation.navigate("ServerConnectSettings")}
                >
                    <View style={styles.textRow}>
                        <Text variant="bodyLarge">
                            Configure server connection 
                        </Text>
                        <Icon size={20} source="arrow-right" />
                    </View>
                </TouchableRipple>

                <Divider horizontalInset />
            </View>
        </View>
    );
}


const styles = StyleSheet.create({
  buttonContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
