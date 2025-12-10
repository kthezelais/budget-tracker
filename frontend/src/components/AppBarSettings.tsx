import { Appbar } from "react-native-paper"
import { StyleSheet } from "react-native"


interface AppBarSettingsProps {
    title: string;
    onPressBackAction: () => void;
    onSave?: () => void;
    displaySave?: boolean;
}

export const AppBarSettings: React.FC<AppBarSettingsProps> = ({
    title,
    onPressBackAction,
    onSave = () => {},
    displaySave = false
}) => {

    return(
        <Appbar.Header>
            <Appbar.BackAction onPress={() => onPressBackAction()} />
            <Appbar.Content title={title} titleStyle={styles.appBarContent} />
            {displaySave &&
                <Appbar.Content title="Save" titleStyle={styles.appBarSave} onPress={() => onSave()} />
            }
        </Appbar.Header>
    ) 
}


const styles = StyleSheet.create({
    appBarContent: {
        fontSize: 18
    },
    appBarSave: {
        textAlign: "right",
        marginRight: "15%",
        fontSize: 18,
        color: "#565656b4"
    }
});
