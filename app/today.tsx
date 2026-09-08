import React, { useState, useCallback } from 'react';
import { View, Pressable, type ViewStyle, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen, T, Card, Row, Stat, TextField } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { ReportView } from '@/components/ReportView';
import { syncNow } from '@/lib/sync';
import type { TxType, PaymentMethod } from '@/types';

export default function TodayReport() {
  const router = useRouter();
  const currency = useSettingsStore((s) => s.currency);
  const items = useTransactionsStore((s) => s.items);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TxType>('income');
  const [payFilter, setPayFilter] = useState<PaymentMethod | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const todayItems = items.filter((t) => t.date === today);
  const income = todayItems.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = todayItems.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const net = income - expense;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await syncNow(); } catch {}
    setRefreshing(false);
  }, []);

  const add = () => router.push({ pathname: '/accounts/new', params: { type: activeTab, from: 'today' } });

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <Card>
        <T variant="micro">Today</T>
        <T variant="h1" style={{ marginTop: spacing.xs, fontWeight: '800' }}>
          {formatCurrency(net, currency)}
        </T>
        <View style={{ height: spacing.md }} />
        <Row style={{ gap: spacing.md }}>
          <Pressable
            onPress={() => setActiveTab('income')}
            style={({ pressed }) => [statBox, activeTab === 'income' && statBoxIncome, pressed && { opacity: 0.7 }]}
          >
            <T variant="micro" style={activeTab === 'income' ? statLabelActive : undefined}>Income</T>
            <T variant="h3" style={[{ fontWeight: '800' }, activeTab === 'income' ? statValueActive : { color: colors.muted }]}>
              {formatCurrency(income, currency)}
            </T>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('expense')}
            style={({ pressed }) => [statBox, activeTab === 'expense' && statBoxExpense, pressed && { opacity: 0.7 }]}
          >
            <T variant="micro" style={activeTab === 'expense' ? statLabelActive : undefined}>Expense</T>
            <T variant="h3" style={[{ fontWeight: '800' }, activeTab === 'expense' ? statValueActive : { color: colors.muted }]}>
              {formatCurrency(expense, currency)}
            </T>
          </Pressable>
        </Row>
      </Card>

      <View style={{ height: spacing.lg }} />

      <Pressable onPress={add} style={({ pressed }) => [addBtn, pressed && { opacity: 0.7 }]}>
        <Feather name="plus" size={18} color={colors.white} />
        <T variant="body" style={{ fontWeight: '700', color: colors.white }}>
          Add {activeTab === 'income' ? 'Income' : 'Expense'}
        </T>
      </Pressable>

      <View style={{ height: spacing.lg }} />

      <TextField
        value={search}
        onChangeText={setSearch}
        placeholder={`Search ${activeTab} by reason...`}
      />

      <View style={{ height: spacing.md }} />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {([null, 'cash', 'online'] as const).map((pm) => {
          const active = payFilter === pm;
          const label = pm === null ? 'All' : pm === 'cash' ? 'Cash' : 'Online';
          const icon = pm === null ? 'layers' : pm === 'cash' ? 'dollar-sign' : 'smartphone';
          return (
            <Pressable
              key={label}
              onPress={() => setPayFilter(pm)}
              style={({ pressed }) => [payBtn, active && payBtnActive, pressed && { opacity: 0.7 }]}
            >
              <Feather name={icon} size={12} color={active ? colors.white : colors.black} />
              <T variant="micro" style={{ color: active ? colors.white : colors.black, fontWeight: '700' }}>{label}</T>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: spacing.md }} />

      <ReportView period="today" search={search} payFilter={payFilter} cashOnly />
    </Screen>
  );
}

const statBox: ViewStyle = {
  flex: 1,
  padding: spacing.md,
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
};
const statBoxIncome: ViewStyle = {
  backgroundColor: colors.black,
  borderColor: colors.black,
};
const statBoxExpense: ViewStyle = {
  backgroundColor: colors.red,
  borderColor: colors.red,
};
const statLabelActive: TextStyle = { color: colors.white };
const statValueActive: TextStyle = { color: colors.white };

const addBtn: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.sm,
  backgroundColor: colors.black,
  borderWidth: layout.borderWidth,
  borderColor: colors.black,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
};

const payBtn: ViewStyle = {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.xs,
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.sm,
};

const payBtnActive: ViewStyle = {
  backgroundColor: colors.black,
  borderColor: colors.black,
};
