import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableWithoutFeedback,
    Dimensions,
    Keyboard,
    BackHandler,
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    HelperText,
    Surface,
} from 'react-native-paper';


const { width, height } = Dimensions.get('window');


interface EditBudgetFormProps {
    onSubmit: (budgetAmount: string) => void;
    onCancel: () => void;
    currentMonth: string;
    isLoading?: boolean;
}


export const EditBudgetForm: React.FC<EditBudgetFormProps> = ({
    onSubmit,
    onCancel,
    currentMonth,
    isLoading = false,
}) => {
    const [errors, setErrors] = useState({ name: '', amount: '' });
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [budgetAmount, setBudgetAmount] = useState("")


    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            console.log('⌨️ Keyboard shown, height:', e.endCoordinates.height);
            setKeyboardHeight(e.endCoordinates.height);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            console.log('⌨️ Keyboard hidden');
            setKeyboardHeight(0);
        });

        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            console.log('🔙 Back button pressed, closing form');
            onCancel();
            return true; // Prevent default back behavior
        });

        return () => {
            keyboardDidShowListener?.remove();
            keyboardDidHideListener?.remove();
            backHandler.remove();
        };
    }, [onCancel]);

    const validateForm = () => {
        const newErrors = {
            name: '',
            amount: '',
        };

        setErrors(newErrors);
        return !newErrors.name && !newErrors.amount;
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            console.log('❌ Form validation failed');
            return;
        }
        onSubmit(budgetAmount);
    };

    const formatAmount = (text: string) => {
        // Remove any non-numeric characters except decimal point
        const cleaned = text.replace(/[^0-9.]/g, '');

        // Ensure only one decimal point
        const parts = cleaned.split('.');
        if (parts.length > 2) {
            return parts[0] + '.' + parts.slice(1).join('');
        }

        // Limit to 2 decimal places
        if (parts.length === 2 && parts[1].length > 2) {
            return parts[0] + '.' + parts[1].substring(0, 2);
        }

        return cleaned;
    };

    const formatAmountForDisplay = (value: string) => {
        if (!value || value === '') return '';

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;

        // Format with exactly 2 decimal places
        return numValue.toFixed(2);
    };

    const formatAmountAsCurrency = (value: string) => {
        if (!value || value === '') return '';

        const numValue = parseFloat(value);
        if (isNaN(numValue)) return value;

        // Format as currency with exactly 2 decimal places
        return `$${numValue.toFixed(2)}`;
    };

    return (
        <View style={styles.overlay}>
            <TouchableWithoutFeedback onPress={onCancel}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>

            <View style={[styles.keyboardAvoidingView, { bottom: keyboardHeight > 0 ? keyboardHeight * 0.4 : 0 }]}>
                <Surface style={styles.formContainer}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text variant="headlineSmall" style={styles.title}>
                            Edit Budget: {currentMonth}
                        </Text>

                        <TextInput
                            label="Amount (CAD)"
                            value={budgetAmount}
                            autoFocus={true}
                            onChangeText={(text) => {
                                const formatted = formatAmount(text);
                                console.log('💰 Amount changed:', text, '->', formatted);
                                setBudgetAmount(formatted);
                            }}
                            onBlur={() => {
                                // Format to 2 decimal places when user finishes editing
                                if (budgetAmount && budgetAmount !== '') {
                                    const formatted = formatAmountForDisplay(budgetAmount);
                                    console.log('💰 Amount formatted on blur:', budgetAmount, '->', formatted);
                                    setBudgetAmount(formatted);
                                }
                            }}
                            style={{ ...styles.input, marginBottom: !!errors.amount ? 0 : -15 }}
                            mode="outlined"
                            keyboardType="numeric"
                            error={!!errors.amount}
                            disabled={isLoading}
                            placeholder="0.00"
                        />
                        <HelperText type="error" visible={!!errors.amount}>
                            {errors.amount}
                        </HelperText>
                        <HelperText type="info" visible={!errors.amount && budgetAmount !== ''}>
                            {budgetAmount ? `Will be saved as: ${formatAmountAsCurrency(budgetAmount)}` : 'Enter amount (e.g., 15.00)'}
                        </HelperText>

                        <View style={styles.buttonContainer}>
                            <Button
                                mode="outlined"
                                onPress={() => {
                                    console.log('❌ Cancel button pressed');
                                    onCancel();
                                }}
                                style={[styles.button, styles.cancelButton]}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => {
                                    console.log('✅ Submit button pressed');
                                    handleSubmit();
                                }}
                                style={[styles.button, styles.submitButton]}
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                Update
                            </Button>
                        </View>
                    </ScrollView>
                </Surface>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    keyboardAvoidingView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    formContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        minHeight: height * 0.2,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 0,
    },
    title: {
        textAlign: 'center',
        marginBottom: 24,
        color: '#2196F3',
    },
    input: {
        backgroundColor: 'white',
    },
    segmentedContainer: {
        marginVertical: 12,
    },
    segmentedButtons: {
        marginHorizontal: 0,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 8,
    },
    cancelButton: {
        marginRight: 8,
    },
    submitButton: {
        marginLeft: 8,
    },
});
