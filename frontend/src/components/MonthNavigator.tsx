import React from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    PanResponder,
    TouchableOpacity,
} from 'react-native';
import {
    Text,
    IconButton,
    Surface,
} from 'react-native-paper';
import { MonthNavigation } from '../utils/monthNavigation';


interface MonthNavigatorProps {
    currentMonth: string;
    onMonthChange: (month: string) => void;
    firstTrackedMonth: string | null;
    canGoPrevious?: boolean;
    canGoNext?: boolean;
}


export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
    currentMonth,
    onMonthChange,
    firstTrackedMonth,
    canGoPrevious = true,
    canGoNext = true,
}) => {
    const { width } = Dimensions.get('window');
    const SWIPE_THRESHOLD = width * 0.2; // 20% of screen width

    // Determine if user can go to previous month
    const canGoToPrevious = canGoPrevious && (!firstTrackedMonth || currentMonth > firstTrackedMonth);

    // Determine if user can go to next month (not beyond current month)
    const currentMonthStr = MonthNavigation.getCurrentMonth();
    const canGoToNext = canGoNext && currentMonth < currentMonthStr;
    // console.error(`currentMonth < currentMonthStr = ${currentMonth} < ${currentMonthStr} = ${currentMonth < currentMonthStr}`)

    const handlePreviousMonth = () => {
        if (canGoToPrevious) {
            const previousMonth = MonthNavigation.getPreviousMonth(currentMonth);
            onMonthChange(previousMonth);
        }
    };

    const handleNextMonth = () => {
        if (canGoToNext) {
            const nextMonth = MonthNavigation.getNextMonth(currentMonth);
            onMonthChange(nextMonth);
        }
    };

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            // Only respond to horizontal swipes
            return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
        },
        onPanResponderRelease: (evt, gestureState) => {
            const { dx } = gestureState;

            if (dx > SWIPE_THRESHOLD && canGoToPrevious) {
                // Swipe right - go to previous month
                handlePreviousMonth();
            } else if (dx < -SWIPE_THRESHOLD && canGoToNext) {
                // Swipe left - go to next month
                handleNextMonth();
            }
        },
    });

    const formatMonth = (monthYear: string) => {
        return MonthNavigation.formatMonthForDisplay(monthYear);
    };

    const isCurrentMonth = MonthNavigation.isCurrentMonth(currentMonth);

    const handleBackToCurrent = () => {
        const currentMonthStr = MonthNavigation.getCurrentMonth();
        onMonthChange(currentMonthStr);
    };

    return (
        <Surface style={styles.container} elevation={2} {...panResponder.panHandlers}>
            <View style={styles.navigator}>
                <IconButton
                    icon="chevron-left"
                    size={24}
                    onPress={handlePreviousMonth}
                    disabled={!canGoToPrevious}
                    style={styles.navButton}
                />

                <View style={styles.monthContainer}>
                    <Text variant="titleMedium" style={styles.monthText}>
                        {formatMonth(currentMonth)}
                    </Text>
                    {isCurrentMonth && (
                        <Text variant="bodySmall" style={styles.currentIndicator}>
                            Current Month
                        </Text>
                    )}
                </View>

                <IconButton
                    icon="chevron-right"
                    size={24}
                    onPress={handleNextMonth}
                    disabled={!canGoToNext}
                    style={styles.navButton}
                />
            </View>

            {!isCurrentMonth && (
                <TouchableOpacity
                    style={styles.backToCurrentContainer}
                    onPress={handleBackToCurrent}
                    activeOpacity={0.7}
                >
                    <IconButton
                        icon="home"
                        size={20}
                        style={styles.backToCurrentButton}
                        iconColor="#2196F3"
                    />
                    <Text variant="bodySmall" style={styles.backToCurrentText}>
                        Back to Current Month
                    </Text>
                </TouchableOpacity>
            )}

            <View style={styles.swipeHint}>
                <Text variant="bodySmall" style={styles.hintText}>
                    Swipe left/right to navigate months
                </Text>
            </View>
        </Surface>
    );
};


const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 20,
        left: 16,
        right: 16,
        margin: 0,
        borderRadius: 16,
        backgroundColor: '#fff',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    navigator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    navButton: {
        margin: 0,
    },
    monthContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    monthText: {
        fontWeight: '600',
        color: '#2196F3',
    },
    currentIndicator: {
        color: '#4CAF50',
        fontStyle: 'italic',
        marginTop: 2,
    },
    backToCurrentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: '#F5F5F5',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    backToCurrentButton: {
        padding: 0,
        margin: 0,
        marginRight: 8,
    },
    backToCurrentText: {
        color: '#2196F3',
        fontSize: 12,
        fontWeight: '500',
    },
    swipeHint: {
        alignItems: 'center',
        paddingBottom: 12,
        paddingHorizontal: 16,
    },
    hintText: {
        color: '#666',
        fontSize: 11,
    },
});
