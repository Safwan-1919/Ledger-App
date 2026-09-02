import React from 'react';
import { View, Pressable, type ViewStyle } from 'react-native';
import { T, Card, Row } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import type { TxType } from '@/types';
import type { TextStyle } from 'react-native';

export function BalanceCard({ activeTab, onTabChange }: { activeTab?: TxType; onTabChange?: (tab: TxType) => void }) {
  const currency = useSettingsStore((s) => s.currency);
  const carryForward = useSettingsStore((s) => s.carryForward);
  const items = useTransactionsStore((s) => s.items);

  const income = items.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = items.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const balance = carryForward + income - expense;

  const incomeActive = activeTab === 'income';
  const expenseActive = activeTab === 'expense';

  return (
    <Card>
      <T variant="micro">Balance</T>
      <T variant="h1" style={{ marginTop: spacing.xs, fontWeight: '800' }}>
        {formatCurrency(balance, currency)}
      </T>
      <View style={{ height: spacing.md }} />
      <Row style={{ gap: spacing.md }}>
        <Pressable
          onPress={() => onTabChange?.('income')}
          style={({ pressed }) => [statBox, incomeActive && statBoxActive, pressed && { opacity: 0.7 }]}
        >
          <T variant="micro" style={incomeActive ? statLabelActive : undefined}>Income</T>
          <T variant="h3" style={[{ fontWeight: '800' }, incomeActive ? statValueActive : { color: colors.muted }]}>
            {formatCurrency(income, currency)}
          </T>
        </Pressable>
        <Pressable
          onPress={() => onTabChange?.('expense')}
          style={({ pressed }) => [statBox, expenseActive && statBoxActive, pressed && { opacity: 0.7 }]}
        >
          <T variant="micro" style={expenseActive ? statLabelActive : undefined}>Expense</T>
          <T variant="h3" style={[{ fontWeight: '800' }, expenseActive ? statValueActive : { color: colors.muted }]}>
            {formatCurrency(expense, currency)}
          </T>
        </Pressable>
      </Row>
    </Card>
  );
}

const statBox: ViewStyle = {
  flex: 1,
  padding: spacing.md,
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
};
const statBoxActive: ViewStyle = {
  backgroundColor: colors.black,
  borderColor: colors.black,
};
const statLabelActive: TextStyle = { color: colors.white };
const statValueActive: TextStyle = { color: colors.white };
