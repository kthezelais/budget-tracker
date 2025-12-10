import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	StyleSheet,
	BackHandler
} from 'react-native';
import {
	Appbar,
	ActivityIndicator,
	Snackbar,
} from 'react-native-paper';
import { getCalendars } from 'expo-localization';
import { TransactionList } from '../components/TransactionList';
import { BudgetSummary } from '../components/BudgetSummary';
import { TransactionForm } from '../components/TransactionForm';
import { EditBudgetForm } from '../components/EditBudgetForm';
import { MonthNavigator } from '../components/MonthNavigator';
import { apiService } from '../services/api';
import { StorageService } from '../services/storage';
import { BudgetCalculator } from '../services/budgetCalculator';
import { MonthNavigation } from '../utils/monthNavigation';
import { Transaction, TransactionCreate, BudgetSummary as BudgetSummaryType, DeviceInfo, MonthlyBudget, ScreenList, MonthlyBudgetCreate, Setting } from '../types';
import { DEFAULT_VALUES } from '../config/api';


interface HomeScreenProps {
	deviceInfo: DeviceInfo;
	currentMonth: string;
	onMonthChange: (month: string) => void,
	onScreenChange: (targetScreen: ScreenList) => void
}


export const HomeScreen: React.FC<HomeScreenProps> = ({
	deviceInfo,
	currentMonth,
	onMonthChange,
	onScreenChange
}) => {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [budgetSummary, setBudgetSummary] = useState<BudgetSummaryType | null>(null);
	const [monthlyBudgets, setMonthlyBudgets] = useState<MonthlyBudget[]>([]);
	const [firstTrackedMonth, setFirstTrackedMonth] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [showTransactionForm, setShowTransactionForm] = useState(false);
	const [showEditBudgetForm, setShowEditBudgetForm] = useState(false);
	const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
	const [snackbarVisible, setSnackbarVisible] = useState(false);
	const [snackbarMessage, setSnackbarMessage] = useState('');
	const [isBudgetSummaryExpanded, setIsBudgetSummaryExpanded] = useState(true);
	const [isRolloverDisabled, setIsRolloverDisabled] = useState(false);


	const handleBackAction = () => {
		BackHandler.exitApp();
		return true;
	};

	const backHandler = BackHandler.addEventListener(
		'hardwareBackPress',
		handleBackAction
	);

	const loadData = useCallback(async (showLoading = true) => {
		try {
			if (showLoading) {
				setIsLoading(true);
			}

			const calendars = getCalendars();
			const deviceTimeZone = calendars[0].timeZone;


			// Calculate current month BudgetSummary
			let budgetSummaryData: BudgetSummaryType;

			try {
				budgetSummaryData = await apiService.getBudgetSummary(currentMonth);
				
				// Manage Toggle rollover button status
				try {
					const transaction = await apiService.getOldestTransaction();
					const transactionMonthYear = transaction.timestamp.slice(0, 7);
		
					if (transactionMonthYear == currentMonth) {
						if (!isRolloverDisabled) setIsRolloverDisabled(true);

						if (budgetSummaryData.rollover_enabled) {
							await apiService.updateMonthlyBudget(currentMonth, {rollover_enabled: false});
						} 
					} else {
						if (isRolloverDisabled) setIsRolloverDisabled(false);
					}
				} catch(error) {
					if (error instanceof Error && error.message === "API request failed: 404 ") {						
						if (budgetSummaryData.rollover_enabled) {
							await apiService.updateMonthlyBudget(currentMonth, {rollover_enabled: false});
						} 
						setIsRolloverDisabled(true);
					}
				}
			} catch(error) {
				console.log(`Couldn't restrieve budget summary for ${currentMonth}:`, error);
				console.log(`Creating budget summary for month ${currentMonth}`);
				
				let budgetAmount: number;
				const settings: Setting[] = await apiService.getSettings();
				const setting = settings.find(setting => setting.key === "default_budget_amount");

				if (setting) {
					budgetAmount = parseFloat(setting.value);
				} else {
					budgetAmount = DEFAULT_VALUES.BUDGET_AMOUNT;
				}

				const monthlyBudgetCreate: MonthlyBudgetCreate = {
					budget_amount: budgetAmount,
					month_year: currentMonth,
					rollover_enabled: true
				}
				await apiService.createMonthlyBudget(monthlyBudgetCreate);
				budgetSummaryData = await apiService.getBudgetSummary(currentMonth);
			}

			// Load transactions, budget summary, and monthly budgets
			const transactionsData = await apiService.getTransactions(`${deviceTimeZone}`);

			const monthlyBudgetsData = await apiService.getMonthlyBudgets();
			const calculatedSummary = BudgetCalculator.calculateBudgetSummary(
				currentMonth,
				transactionsData,
				monthlyBudgetsData,
				budgetSummaryData.budget_amount
			);

			setTransactions(transactionsData);
			setBudgetSummary(calculatedSummary);
			setMonthlyBudgets(monthlyBudgetsData);

			// Calculate first tracked month
			const firstTracked = MonthNavigation.getFirstTrackedMonth(transactionsData);
			setFirstTrackedMonth(firstTracked);

			// Save to local storage
			await StorageService.saveTransactions(transactionsData);
			await StorageService.saveMonthlyBudgets(monthlyBudgetsData);
			await StorageService.setLastSyncTime(new Date().toISOString());
		} catch (error) {
			console.error('Failed to load data from API:', error);

			// Try to load from local storage as fallback
			try {
				const localTransactions = await StorageService.getTransactions();
				setTransactions(localTransactions);

				// Calculate budget summary using client-side calculator
				const localBudgets = await StorageService.getMonthlyBudgets();
				setMonthlyBudgets(localBudgets);

				let index = 0;
				while (localBudgets[index].month_year != currentMonth) {
					index += 1;
				}

				const localBudgetCurrentMonth: number = localBudgets[index].budget_amount;

				const calculatedSummary = BudgetCalculator.calculateBudgetSummary(
					currentMonth,
					localTransactions,
					localBudgets,
					localBudgetCurrentMonth
				);

				setBudgetSummary(calculatedSummary);

				// Calculate first tracked month from local data
				const firstTracked = MonthNavigation.getFirstTrackedMonth(localTransactions);
				setFirstTrackedMonth(firstTracked);

				setSnackbarMessage('Using offline data');
				setSnackbarVisible(true);
			} catch (localError) {
				console.error('Failed to load local data:', localError);
				setSnackbarMessage('Failed to load data');
				setSnackbarVisible(true);
			}
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, [currentMonth]);

	const handleRefresh = useCallback(async () => {
		setIsRefreshing(true);
		await loadData(false);
	}, [loadData]);

	const handleAddTransaction = useCallback(() => {
		console.log('➕ HomeScreen: Opening transaction form');
		setEditingTransaction(null);
		setShowTransactionForm(true);
	}, []);

	const handleEditTransaction = useCallback((transaction: Transaction) => {
		setEditingTransaction(transaction);
		setShowTransactionForm(true);
	}, []);

	const handleDeleteTransaction = useCallback(async (transactionId: number) => {
		try {
			// Delete the transaction by persisting in DB and local storage
			await apiService.deleteTransaction(transactionId);
			await StorageService.deleteTransaction(transactionId);

			await loadData(false);
			setSnackbarMessage('Transaction deleted successfully');
			setSnackbarVisible(true);
		} catch (error) {
			console.error('Failed to delete transaction:', error);
			setSnackbarMessage('Failed to delete transaction');
			setSnackbarVisible(true);
		}
	}, [loadData]);

	const handleSubmitTransaction = useCallback(async (transactionData: TransactionCreate) => {
		console.log('🚀 HomeScreen: handleSubmitTransaction called with:', transactionData);
		try {
			const transactionWithDevice = {
				...transactionData,
				device_id: deviceInfo.device_id,
			};

			console.log('📤 HomeScreen: Sending transaction to API:', transactionWithDevice);

			let savedTransaction: Transaction;
			if (editingTransaction) {
				savedTransaction = await apiService.updateTransaction(
					editingTransaction.id,
					transactionData
				);
				await StorageService.updateTransaction(savedTransaction);
			} else {
				savedTransaction = await apiService.createTransaction(transactionWithDevice);
				await StorageService.addTransaction(savedTransaction);
			}

			console.log('✅ HomeScreen: Transaction saved successfully:', savedTransaction);

			setShowTransactionForm(false);
			setEditingTransaction(null);
			await loadData(false);

			setSnackbarMessage(
				editingTransaction ? 'Transaction updated successfully' : 'Transaction added successfully'
			);
			setSnackbarVisible(true);
		} catch (error) {
			console.error('❌ HomeScreen: Failed to save transaction:', error);
			setSnackbarMessage('Failed to save transaction');
			setSnackbarVisible(true);
		}
	}, [deviceInfo.device_id, editingTransaction, loadData]);

	const handleCancelTransaction = useCallback(() => {
		console.log('❌ HomeScreen: Transaction form cancelled');
		setShowTransactionForm(false);
		setEditingTransaction(null);
	}, []);

	const handleEditBudget = useCallback(() => {
		setShowEditBudgetForm(true);
	}, []);

	const handleCancelBudget = useCallback(() => {
		console.log('❌ HomeScreen: Edit budget form cancelled.');
		setShowEditBudgetForm(false);
	}, []);

	const handleSubmitBudget = useCallback(async (monthYear: string, budgetAmount: string) => {
		try {
			let monthYearBudget = await apiService.getMonthlyBudget(monthYear);
			if (!monthYearBudget) {
				throw Error(`MonthlyBudget for ${monthYear} doesn't exist.`);
			}

			if (budgetAmount == monthYearBudget.budget_amount.toFixed(2)) {
				setShowEditBudgetForm(false);
				setSnackbarMessage('Same Budget amount');
				setSnackbarVisible(true);
				return;
			}

			// Try to update backend (but don't wait for it)
			await apiService.updateMonthlyBudget(monthYear, {
				budget_amount: parseFloat(budgetAmount) 
			}).catch(error => {
				console.warn('Failed to sync rollover change to backend:', error);
			});

			onMonthChange(monthYear);
			await loadData(false);
			setShowEditBudgetForm(false);
			setSnackbarMessage(`${monthYear} budget successfully updated`);
			setSnackbarVisible(true);
		} catch (error) {
			console.error('❌ HomeScreen: Failed to save updated monthly budget:', error);
			setSnackbarMessage('Failed to save updated monthly budget');
			setSnackbarVisible(true);
		}
	}, [loadData, onMonthChange]);

	const handleToggleRollover = useCallback(async (enabled: boolean) => {
		try {
			if (!budgetSummary) return;

			const transaction = await apiService.getOldestTransaction();
			const transactionMonthYear = transaction.timestamp.slice(0, 7);

			if (transactionMonthYear == currentMonth) return;

			console.log('🔄 Toggling rollover for:', budgetSummary.month_year, 'to:', enabled);
			console.log('📊 Available transactions:', transactions.length);
			console.log('📊 Available budgets:', monthlyBudgets.length);

			// Debug the rollover calculation
			BudgetCalculator.debugRolloverCalculation(transactions, monthlyBudgets, budgetSummary.month_year);

			// Update rollover setting in local state immediately (client-side calculation)
			const updatedBudgets = monthlyBudgets.map(budget =>
				budget.month_year === budgetSummary.month_year
					? { ...budget, rollover_enabled: enabled }
					: budget
			);

			setMonthlyBudgets(updatedBudgets);
			
			// Save updated budgets to local storage
			await StorageService.saveMonthlyBudgets(updatedBudgets);
			
			let budgetAmount = updatedBudgets.find(updatedBudget => updatedBudget.month_year == currentMonth);
			
			if (!budgetAmount) {
				budgetAmount = await apiService.getMonthlyBudget(currentMonth);
			}

			// Recalculate budget summary using client-side calculator
			const recalculatedSummary = BudgetCalculator.recalculateWithRolloverChange(
				budgetSummary.month_year,
				transactions,
				updatedBudgets,
				enabled,
				budgetAmount.budget_amount
			);
			setBudgetSummary(recalculatedSummary);

			// Try to update backend (but don't wait for it)
			await apiService.updateMonthlyBudget(budgetSummary.month_year, {
				rollover_enabled: enabled,
			}).catch(error => {
				console.warn('Failed to sync rollover change to backend:', error);
				// Continue anyway - the change is already applied locally
			});

			await loadData(false);
			setSnackbarMessage(
				`Budget rollover ${enabled ? 'enabled' : 'disabled'} for ${budgetSummary.month_year}`
			);
			setSnackbarVisible(true);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message) {
					
				}
				console.error('Failed to update rollover setting:', error.message);
				setSnackbarMessage('Failed to update rollover setting');
				setSnackbarVisible(true);
			}
		}
	}, [budgetSummary, monthlyBudgets, transactions, loadData]);

	const handleToggleBudgetSummary = useCallback(() => {
		setIsBudgetSummaryExpanded(prev => !prev);
	}, []);
	

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		console.log('🔄 showTransactionForm state changed:', showTransactionForm);
	}, [showTransactionForm]);

	
	if (isLoading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Appbar.Header style={{ marginTop: -25, marginBottom: -10 }}>
				<Appbar.Content title="Budget Tracker" />
				<Appbar.Action icon="refresh" onPress={handleRefresh} />
			</Appbar.Header>

			<View style={styles.content}>
				{budgetSummary && (
					<BudgetSummary
						budgetSummary={budgetSummary}
						currentMonth={currentMonth}
						onToggleRollover={handleToggleRollover}
						isExpanded={isBudgetSummaryExpanded}
						onToggleExpanded={handleToggleBudgetSummary}
						noTransaction={transactions.length === 0}
						isDisabled={isRolloverDisabled}
					/>
				)}

				<TransactionList
					transactions={transactions}
					currentMonth={currentMonth}
					onEditTransaction={handleEditTransaction}
					onDeleteTransaction={handleDeleteTransaction}
					onAddTransaction={handleAddTransaction}
					onScreenChange={onScreenChange}
					isLoading={isRefreshing}
					onEditBudget={handleEditBudget}
				/>
			</View>

			<MonthNavigator
				currentMonth={currentMonth}
				onMonthChange={onMonthChange}
				firstTrackedMonth={firstTrackedMonth}
				canGoPrevious={true}
				canGoNext={true}
			/>

			{showEditBudgetForm && (
				<>
					{console.log('🎨 Rendering EditBudgetForm overlay')}
					<EditBudgetForm
						onSubmit={(budgetAmount: string) => handleSubmitBudget(currentMonth, budgetAmount)}
						onCancel={handleCancelBudget}
						currentMonth={currentMonth}
						isLoading={isLoading}
					/>
				</>
			)}

			{showTransactionForm && (
				<>
					{console.log('🎨 Rendering TransactionForm overlay')}
					<TransactionForm
						onSubmit={handleSubmitTransaction}
						onCancel={handleCancelTransaction}
						initialTransaction={editingTransaction || undefined}
						isLoading={isLoading}
					/>
				</>
			)}

			<Snackbar
				visible={snackbarVisible}
				onDismiss={() => setSnackbarVisible(false)}
				duration={3000}
			>
				{snackbarMessage}
			</Snackbar>
		</View>
	);
};


const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5'
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	content: {
		flex: 1,
		paddingTop: 120,
		paddingBottom: 120,
	},
});
