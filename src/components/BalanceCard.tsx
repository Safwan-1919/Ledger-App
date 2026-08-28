import React from 'react';
import { View } from 'react-native';
import { T, Stat, Card, Row } from '@/components/ui';
import { spacing } from '@/theme/tokens';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';

export function BalanceCard() {
  const currency = useSettingsStore((s) => s.currency);
  const carryForward = useSettingsStore((s) => s.carryForward);
  const items = useTransactionsStore((s) => s.items);

  const income = items.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = items.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const balance = carryForward + income - expense;

  return (
    <Card>
      <T variant="micro">Balance</T>
      <T variant="h1" style={{ marginTop: spacing.xs, fontWeight: '800' }}>
        {formatCurrency(balance, currency)}
      </T>
      <View style={{ height: spacing.md }} />
      <Row style={{ gap: spacing.md }}>
        <Stat label="Income" value={formatCurrency(income, currency)} accent="income" />
        <Stat label="Expense" value={formatCurrency(expense, currency)} accent="expense" />
      </Row>
    </Card>
  );
}
