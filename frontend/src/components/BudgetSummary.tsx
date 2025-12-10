import {
	View,
	StyleSheet,
	TouchableOpacity,
} from 'react-native';
import {
	Card,
	Chip,
	Text,
	ProgressBar,
	Switch,
	IconButton,
	Icon
} from 'react-native-paper';
import { BudgetSummary as BudgetSummaryType } from '../types';
import { useCallback } from 'react';
import { apiService } from '../services/api';


interface BudgetSummaryProps {
	budgetSummary: BudgetSummaryType;
	currentMonth: string;
	onToggleRollover: (enabled: boolean) => void;
	isExpanded: boolean;
	onToggleExpanded: () => void;
	noTransaction: boolean;
	isDisabled: boolean;
}


export const BudgetSummary: React.FC<BudgetSummaryProps> = ({
	budgetSummary,
	currentMonth,
	onToggleRollover,
	isExpanded,
	onToggleExpanded,
	noTransaction,
	isDisabled
}) => {

	const {
		budget_amount,
		total_transactions,
		remaining_budget,
		is_over_budget,
		rollover_enabled,
	} = budgetSummary;

	const formatCurrency = (amount: number) => {
		return `$${Math.abs(amount).toFixed(2)}`;
	};

	const formatMonth = (monthYear: string) => {
		const [year, month] = monthYear.split('-');
		const date = new Date(parseInt(year), parseInt(month) - 1);

		return date.toLocaleDateString('en-CA', {
			year: 'numeric',
			month: 'long',
		});
	};

	const getBudgetStatus = () => {
		if (is_over_budget) {
			return {
				status: 'Over Budget',
				color: '#F44336',
				backgroundColor: '#FFEBEE',
				progress: 1.0,
			};
		} else if (remaining_budget === 0) {
			return {
				status: 'Perfect',
				color: '#4CAF50',
				backgroundColor: '#E8F5E8',
				progress: 1.0,
			};
		} else {
			const progress = total_transactions / budget_amount;
			return {
				status: 'On Track',
				color: '#2196F3',
				backgroundColor: '#E3F2FD',
				progress: Math.min(progress, 1.0),
			};
		}
	};


	const handleToggleButtonDisabling = useCallback(async () => {
		if (noTransaction) {
			if (rollover_enabled) {
				await apiService.updateMonthlyBudget(currentMonth, {"rollover_enabled": false})
			}
		}
	}, [noTransaction, isDisabled]);


	const budgetStatus = getBudgetStatus();
	const spentPercentage = (total_transactions / budget_amount) * 100;

	return (
		<Card style={[styles.card, { position: 'absolute', top: 16, left: 16, right: 16, zIndex: 100 }]}>
			<Card.Content>
				<View style={styles.header}>
					<TouchableOpacity
						style={styles.titleContainer}
						onPress={onToggleExpanded}
						activeOpacity={0.7}
					>
						<Text variant='titleLarge' style={styles.monthTitle}>{formatMonth(currentMonth)}</Text>
						<IconButton
							icon={isExpanded ? 'chevron-up' : 'chevron-down'}
							size={20}
							iconColor="#666"
						/>
					</TouchableOpacity>
					<Chip
						mode="outlined"
						compact
						style={[
							styles.statusChip,
							{ backgroundColor: budgetStatus.backgroundColor },
						]}
						textStyle={{ color: budgetStatus.color }}
					>
						{budgetStatus.status}
					</Chip>
				</View>

				{isExpanded && (
					<>
						<View style={styles.budgetInfo}>
							<View style={styles.budgetRow}>
								<Text style={styles.budgetLabel}>Budget:</Text>
								<Text style={styles.budgetAmount}>{formatCurrency(budget_amount)}</Text>
							</View>

							<View style={styles.budgetRow}>
								<Text style={styles.budgetLabel}>{total_transactions >= 0 ? 'Spent:' : 'Gain:'}</Text>
								<Text style={styles.budgetAmount}>{total_transactions >= 0 ?
									<Icon
										source="arrow-down"
										size={18}
										color="#F44336"
									/>
									:
									<Icon
										source="arrow-up"
										size={18}
										color="#4CAF50"
									/>}<Text style={total_transactions >= 0 ? { color: '#F44336' } : { color: '#4CAF50' }}>{formatCurrency(total_transactions)}</Text>
								</Text>
							</View>

							<View style={styles.budgetRow}>
								<Text style={styles.budgetLabel}>
									{is_over_budget ? 'Over by:' : 'Remaining:'}
								</Text>
								<Text
									style={[
										styles.budgetAmount,
										{
											color: is_over_budget ? '#F44336' : '#4CAF50',
										},
									]}
								>
									{formatCurrency(remaining_budget)}
								</Text>
							</View>
						</View>

						<View style={styles.progressContainer}>
							<ProgressBar
								progress={budgetStatus.progress}
								color={budgetStatus.color}
								style={styles.progressBar}
							/>
							<Text style={styles.progressText}>
								{spentPercentage.toFixed(1)}% of budget used
							</Text>
						</View>

						<View style={styles.footer}>
							<View style={styles.rolloverContainer}>
								<Text style={styles.rolloverLabel}>Budget Rollover:</Text>
								<View style={styles.rolloverToggle}>
									<Text style={styles.rolloverText}>
										{rollover_enabled ? 'Enabled' : 'Disabled'}
									</Text>
									<Switch
										value={rollover_enabled}
										onValueChange={onToggleRollover}
										color="#2196F3"
										disabled={noTransaction || isDisabled}
									/>
								</View>
							</View>
						</View>
					</>
				)}
			</Card.Content>
		</Card>
	);
};


const styles = StyleSheet.create({
	card: {
		elevation: 8,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	monthTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		flex: 1,
	},
	statusChip: {
		marginLeft: 8,
	},
	budgetInfo: {
		marginBottom: 16,
	},
	budgetRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	budgetLabel: {
		fontSize: 16,
		color: '#666',
	},
	budgetAmount: {
		fontSize: 16,
		fontWeight: '600'
	},
	progressContainer: {
		marginBottom: 16,
	},
	progressBar: {
		height: 8,
		borderRadius: 4,
		marginBottom: 8,
	},
	progressText: {
		fontSize: 12,
		color: '#666',
		textAlign: 'center',
	},
	footer: {
		alignItems: 'center',
	},
	rolloverContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		marginTop: 8,
	},
	rolloverLabel: {
		fontSize: 14,
		color: '#666',
		fontWeight: '500',
	},
	rolloverToggle: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	rolloverText: {
		fontSize: 14,
		color: '#2196F3',
		fontWeight: '600',
	},
});
