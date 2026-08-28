import React, { useState } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { T, Card, Stat, Row, Button } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { storeCloseAccountReport } from '@/lib/reports';

export default function CloseAccountScreen() {
  const router = useRouter();
  const currency = useSettingsStore((s) => s.currency);
  const carryForward = useSettingsStore((s) => s.carryForward);
  const setCarryForward = useSettingsStore((s) => s.setCarryForward);
  const items = useTransactionsStore((s) => s.items);
  const clearAll = useTransactionsStore((s) => s.clearAll);
  const [busy, setBusy] = useState(false);

  const income = items.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = items.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const balance = carryForward + income - expense;

  const dates = items.map((t) => t.date).sort();
  const from = dates[0] ?? '—';
  const to = dates[dates.length - 1] ?? '—';

  async function handleClose() {
    if (items.length === 0) {
      Alert.alert('No transactions', 'Nothing to close.');
      return;
    }

    Alert.alert(
      'Close Account',
      `This will generate a report from ${from} to ${to}.\n\nCarry forward: ${formatCurrency(balance, currency)}\n\nAll current transactions will be cleared. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await storeCloseAccountReport(items, carryForward);
              setCarryForward(balance);
              clearAll();
              Alert.alert('Done', `Account closed. Carry forward: ${formatCurrency(balance, currency)}`, [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }} contentContainerStyle={{ padding: spacing.lg }}>
      <Card>
        <T variant="micro">Carried Forward</T>
        <T variant="h2" style={{ marginTop: spacing.xs }}>{formatCurrency(carryForward, currency)}</T>
      </Card>

      <View style={{ height: spacing.md }} />

      <Card>
        <Row style={{ gap: spacing.md }}>
          <Stat label="Income" value={formatCurrency(income, currency)} accent="income" compact />
          <Stat label="Expense" value={formatCurrency(expense, currency)} accent="expense" compact />
        </Row>
        <View style={{ height: spacing.sm }} />
        <Stat label="Balance" value={formatCurrency(balance, currency)} compact />
      </Card>

      {items.length > 0 && (
        <>
          <View style={{ height: spacing.md }} />
          <Card>
            <T variant="small">Period: {from} to {to}</T>
            <T variant="small" style={{ marginTop: spacing.xs }}>{items.length} transaction(s)</T>
          </Card>
        </>
      )}

      <View style={{ height: spacing.lg }} />

      <Button
        label={busy ? 'Closing...' : 'Close Account'}
        variant="outline"
        fullWidth
        loading={busy}
        disabled={busy || items.length === 0}
        onPress={handleClose}
        icon={<Feather name="file-text" size={16} color={colors.black} />}
      />
    </ScrollView>
  );
}
