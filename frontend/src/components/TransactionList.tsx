import React, { memo, useCallback, useState } from 'react';
import {
	View,
	StyleSheet,
	FlatList,
	Alert,
	TouchableOpacity,
} from 'react-native';
import {
	Card,
	IconButton,
	Text,
	FAB,
} from 'react-native-paper';
import { ScreenList, Transaction } from '../types';
import { MonthNavigation } from '../utils/monthNavigation';


interface TransactionListProps {
	transactions: Transaction[];
	currentMonth: string;
	onEditTransaction: (transaction: Transaction) => void;
	onDeleteTransaction: (transactionId: number) => void;
	onAddTransaction: () => void;
	onScreenChange: (targetScreen: ScreenList) => void;
	onEditBudget: () => void;
	isLoading?: boolean;
}


// Memoized TransactionItem component for better performance
const TransactionItem = memo(({
	item,
	onEdit,
	onDelete,
	isExpanded,
	onToggleExpanded
}: {
	item: Transaction;
	onEdit: (transaction: Transaction) => void;
	onDelete: (transaction: Transaction) => void;
	isExpanded: boolean;
	onToggleExpanded: () => void;
}) => {
	const formatAmount = (amount: number, type: string) => {
		const formattedAmount = Math.abs(amount).toFixed(2);
		const prefix = type === 'deposit' ? '+' : '-';
		return `${prefix}$${formattedAmount}`;
	};

	const formatDate = (timestamp: string) => {
		return new Date(timestamp).toLocaleDateString('en-CA', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const handleDelete = useCallback(() => {
		Alert.alert(
			'Delete Transaction',
			`Are you sure you want to delete "${item.name}"?`,
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => onDelete(item),
				},
			]
		);
	}, [item, onDelete]);

	return (
		<Card style={styles.transactionCard}>
			<Card.Content style={styles.cardContent}>
				<View style={styles.transactionHeader}>
					<TouchableOpacity
						style={styles.topRow}
						onPress={onToggleExpanded}
						activeOpacity={0.7}
					>
						<View style={styles.topRowLeft}>
							<IconButton
								icon={isExpanded ? 'chevron-up' : 'chevron-down'}
								size={16}
								iconColor="#666"
							/>
							<Text variant='titleLarge' style={styles.transactionName} numberOfLines={1}>
								{item.name}
							</Text>
						</View>
						<Text
							style={[
								styles.amountText,
								{
									color: item.type === 'deposit' ? '#4CAF50' : '#F44336',
								},
							]}
						>
							{formatAmount(item.amount, item.type)}
						</Text>
					</TouchableOpacity>

					{isExpanded && (
						<View style={styles.bottomRow}>
							<View style={styles.actionButtons}>
								<IconButton
									icon="delete"
									size={20}
									onPress={handleDelete}
								/>
								<IconButton
									icon="pencil"
									size={20}
									onPress={() => onEdit(item)}
								/>
							</View>
							<View style={styles.transactionMeta}>
								<Text variant='bodyMedium' style={styles.transactionDate}>
									{formatDate(item.timestamp)}
								</Text>
								{item.username && (
									<Text variant='bodyMedium' style={styles.transactionUser}>
										by {item.username}
									</Text>
								)}
							</View>
						</View>
					)}
				</View>
			</Card.Content>
		</Card>
	);
});


export const TransactionList: React.FC<TransactionListProps> = ({
	transactions,
	currentMonth,
	onEditTransaction,
	onDeleteTransaction,
	onAddTransaction,
	onScreenChange,
	onEditBudget,
	isLoading = false
}) => {
	const [expandedTransactions, setExpandedTransactions] = useState<Set<number>>(new Set());

	const toggleTransactionExpanded = useCallback((transactionId: number) => {
		setExpandedTransactions(prev => {
			const newSet = new Set(prev);
			if (newSet.has(transactionId)) {
				newSet.delete(transactionId);
			} else {
				newSet.add(transactionId);
			}
			return newSet;
		});
	}, []);

	// Filter transactions for the current month
	const currentMonthTransactions = transactions.filter(transaction => {
		const transactionDate = new Date(transaction.timestamp);
		const [year, month] = currentMonth.split('-');
		const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
		const endDate = new Date(parseInt(year), parseInt(month), 1);

		return transactionDate >= startDate && transactionDate < endDate;
	});

	// Memoized render function for better performance
	const renderTransaction = useCallback(({ item }: { item: Transaction }) => (
		<TransactionItem
			item={item}
			onEdit={onEditTransaction}
			onDelete={(transaction) => onDeleteTransaction(transaction.id)}
			isExpanded={expandedTransactions.has(item.id)}
			onToggleExpanded={() => toggleTransactionExpanded(item.id)}
		/>
	), [onEditTransaction, onDeleteTransaction, expandedTransactions, toggleTransactionExpanded]);

	// Optimized keyExtractor
	const keyExtractor = useCallback((item: Transaction) => item.id.toString(), []);

	// Optimized getItemLayout for better performance
	const getItemLayout = useCallback((data: any, index: number) => ({
		length: 120, // Approximate height of each transaction card
		offset: 120 * index,
		index,
	}), []);

	// Calculate FAB position based on current month
	const isCurrentMonth = MonthNavigation.isCurrentMonth(currentMonth);

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<Text style={styles.emptyStateTitle}>No transactions yet</Text>
			<Text style={styles.emptyStateSubtitle}>
				Tap the + button to add your first transaction
			</Text>
		</View>
	);

	return (
		<View style={{ ...styles.container, paddingBottom: isCurrentMonth ? 0 : 58, marginBottom: isCurrentMonth ? -18 : 0 }}>
			<FlatList
				data={currentMonthTransactions}
				renderItem={renderTransaction}
				keyExtractor={keyExtractor}
				getItemLayout={getItemLayout}
				contentContainerStyle={styles.listContainer}
				ListEmptyComponent={renderEmptyState}
				refreshing={isLoading}
				onRefresh={() => { }} // Will be handled by parent
				removeClippedSubviews={true}
				maxToRenderPerBatch={10}
				windowSize={10}
				initialNumToRender={10}
			/>

			<FAB
				icon="pencil"
				style={{ ...styles.fab, backgroundColor: '#FFFFFF', bottom: isCurrentMonth ? 20 : 80, right: 65 }}
				onPress={onEditBudget}
				disabled={isLoading}
				color="#2196F3"
			/>

			<FAB
				icon="cog"
				style={{ ...styles.fab, backgroundColor: '#FFFFFF', bottom: isCurrentMonth ? 85 : 145 }}
				onPress={() => onScreenChange('settings')}
				disabled={isLoading}
				color="#2196F3"
			/>

			<FAB
				icon="plus"
				style={{ ...styles.fab, backgroundColor: '#2196F3', bottom: isCurrentMonth ? 20 : 80 }}
				onPress={onAddTransaction}
				disabled={isLoading}
				color="#FFFFFF"
			/>
		</View>
	);
};


const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
		marginTop: -25
	},
	listContainer: {
		padding: 20,
		flexGrow: 1,
	},
	transactionCard: {
		marginBottom: 3,
		elevation: 2,
	},
	cardContent: {
		paddingVertical: 2,
		paddingLeft: 2,
		paddingRight: 16,
	},
	transactionHeader: {
		flexDirection: 'column',
	},
	topRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 2,
		paddingVertical: 0,
	},
	topRowLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	bottomRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	transactionName: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
		marginLeft: 4,
	},
	amountText: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	actionButtons: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	transactionMeta: {
		alignItems: 'flex-end',
	},
	transactionDate: {
		fontSize: 12,
		color: '#666',
	},
	transactionUser: {
		fontSize: 11,
		color: '#888',
		fontStyle: 'italic',
		marginTop: 2,
	},
	transactionFooter: {
		marginTop: 12,
	},
	typeChip: {
		alignSelf: 'flex-start',
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: 64,
	},
	emptyStateTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#666',
		marginBottom: 8,
	},
	emptyStateSubtitle: {
		fontSize: 14,
		color: '#999',
		textAlign: 'center',
	},
	fab: {
		position: 'absolute',
		margin: 16,
		right: 0,
	},
});
