import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableWithoutFeedback,
    Dimensions,
    Keyboard,
    BackHandler
} from 'react-native';
import {
    TextInput,
    Button,
    Text,
    SegmentedButtons,
    HelperText,
    Surface,
} from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Transaction, TransactionCreate } from '../types';


type AndroidMode = 'date' | 'time';
type TransactionType = 'withdraw' | 'deposit';


const { width, height } = Dimensions.get('window');


interface TransactionFormProps {
    onSubmit: (transaction: TransactionCreate) => void;
    onCancel: () => void;
    initialTransaction?: Transaction;
    isLoading?: boolean;
}


export const TransactionForm: React.FC<TransactionFormProps> = ({
    onSubmit,
    onCancel,
    initialTransaction,
    isLoading = false,
}) => {
    const [name, setName] = useState(initialTransaction?.name || '');
    const [amount, setAmount] = useState(initialTransaction?.amount?.toString() || '');
    const [errors, setErrors] = useState({ name: '', amount: '' });
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [type, setType] = useState<TransactionType>(initialTransaction?.type || 'withdraw');
    const [mode, setMode] = useState<AndroidMode>('date');
    const [show, setShow] = useState(false);
    const [date, setDate] = useState<Date>(initialTransaction?.timestamp ? new Date(initialTransaction?.timestamp) : new Date());
    
    const onChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (selectedDate) {
            const currentDate = selectedDate;
            
            setShow(false);
            setDate(currentDate);
        }
    };

    const showMode = (currentMode: AndroidMode) => {
        setShow(true);
        setMode(currentMode);
    };

    const showDatepicker = () => {
        showMode('date');
    };

    const showTimepicker = () => {
        showMode('time');
    };

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

        if (!name.trim()) {
            newErrors.name = 'Transaction name is required';
        }

        if (!amount.trim()) {
            newErrors.amount = 'Amount is required';
        } else {
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                newErrors.amount = 'Amount must be a positive number';
            } else if (numAmount > 999999.99) {
                newErrors.amount = 'Amount cannot exceed $999,999.99';
            } else {
                // Check if amount has more than 2 decimal places
                const decimalPlaces = (amount.split('.')[1] || '').length;
                if (decimalPlaces > 2) {
                    newErrors.amount = 'Amount cannot have more than 2 decimal places';
                }
            }
        }

        setErrors(newErrors);
        return !newErrors.name && !newErrors.amount;
    };

    const handleSubmit = () => {
        console.log('📝 Form submission attempt:', { name, amount, type });

        // Handle Winter/Summer time difference.
        const timeDifferenceMinutes = date.getTimezoneOffset() - new Date().getTimezoneOffset();            
        const currentDate = new Date(date.getTime() - timeDifferenceMinutes * 60000);

        if (!validateForm()) {
            console.error('❌ Form validation failed');
            return;
        }

        const transaction: TransactionCreate = {
            device_id: '', // Will be set by the parent component
            name: name.trim(),
            amount: parseFloat(amount),
            timestamp: currentDate.toISOString(),
            type: type,
        };

        console.log('✅ Form validated, submitting:', transaction);
        console.log('💰 Amount formatting check:', {
            input: amount,
            parsed: parseFloat(amount),
            formatted: formatAmountAsCurrency(amount)
        });
        onSubmit(transaction);
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

            <View style={[styles.keyboardAvoidingView, { bottom: keyboardHeight > 0 ? height * 0.3 : 0 }]}>
                <Surface style={styles.formContainer}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text variant="headlineSmall" style={styles.title}>
                            {initialTransaction ? 'Edit Transaction' : 'Add Transaction'}
                        </Text>

                        <TextInput
                            label="Transaction Name"
                            value={name}
                            onChangeText={(text) => {
                                console.log('📝 Name changed:', text);
                                setName(text);
                            }}
                            style={{ ...styles.input, marginBottom: !!errors.amount || (!errors.amount && amount || (!errors.name && amount == '')) ? 0 : -15 }}
                            mode="outlined"
                            error={!!errors.name}
                            disabled={isLoading}
                            autoFocus={true}
                        />
                        <HelperText type="error" visible={!!errors.name}>
                            {errors.name}
                        </HelperText>

                        <TextInput
                            label="Amount (CAD)"
                            value={amount}
                            onChangeText={(text) => {
                                const formatted = formatAmount(text);
                                console.log('💰 Amount changed:', text, '->', formatted);
                                setAmount(formatted);
                            }}
                            onBlur={() => {
                                // Format to 2 decimal places when user finishes editing
                                if (amount && amount !== '') {
                                    const formatted = formatAmountForDisplay(amount);
                                    console.log('💰 Amount formatted on blur:', amount, '->', formatted);
                                    setAmount(formatted);
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
                        <HelperText type="info" visible={!errors.amount && amount !== ''}>
                            {amount ? `Will be saved as: ${formatAmountAsCurrency(amount)}` : 'Enter amount (e.g., 15.00)'}
                        </HelperText>

                        <View style={styles.datetimeContainer}>
                            <Text variant='labelLarge'>Transaction date </Text>
                            <Button onPress={showDatepicker}>{`${date.getDate() < 10 ? "0" + date.getDate() : date.getDate()}/${date.getMonth() + 1 < 10 ? "0" + (date.getMonth() + 1) : date.getMonth() + 1}/${date.getFullYear()}`}</Button>
                            <Button onPress={showTimepicker} style={styles.time}>{`${date.getHours() < 10 ? "0" + date.getHours() : date.getHours()}:${date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()}`}</Button>
                        </View>

                        {show && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={date}
                                mode={mode}
                                is24Hour={true}
                                onChange={onChange}
                                maximumDate={new Date(Date.now())}
                            />
                        )}

                        <View style={styles.segmentedContainer}>
                            <SegmentedButtons
                                value={type}
                                onValueChange={(value) => {
                                    console.log('🔄 Type changed:', value);
                                    setType(value as 'withdraw' | 'deposit');
                                }}
                                buttons={[
                                    {
                                        value: 'withdraw',
                                        label: 'Withdraw',
                                        icon: 'minus',
                                        checkedColor: '#FFFFFF',
                                        uncheckedColor: '#2196F3',
                                        style: {
                                            backgroundColor: type === 'withdraw' ? '#2195f3e0' : '#FFFFFF',
                                        },
                                    },
                                    {
                                        value: 'deposit',
                                        label: 'Deposit',
                                        icon: 'plus',
                                        checkedColor: '#FFFFFF',
                                        uncheckedColor: '#2196F3',
                                        style: {
                                            backgroundColor: type === 'deposit' ? '#2195f3e0' : '#FFFFFF',
                                        },
                                    },
                                ]}
                                style={styles.segmentedButtons}
                            />
                        </View>

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
                                {initialTransaction ? 'Update' : 'Add'}
                            </Button>
                        </View>
                    </ScrollView>
                </Surface>
            </View>
        </View>
    );
};


const styles = StyleSheet.create({
    datetimeContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: -10,
        marginBottom: -10,
    },
    time: {
        marginLeft: -10,
    },
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
        minHeight: height * 0.3,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 15,
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
        marginTop: 20,
        gap: 16,
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
