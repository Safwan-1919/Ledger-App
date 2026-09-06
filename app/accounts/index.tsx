import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Alert, Pressable, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen, T, TextField } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionList } from '@/components/TransactionList';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import { syncNow } from '@/lib/sync';
import { SkeletonCard, SkeletonList } from '@/components/Shimmer';
import type { Transaction, TxType, PaymentMethod } from '@/types';

export default function AccountsScreen() {
  const router = useRouter();
  const items = useTransactionsStore((s) => s.items);
  const del = useDeleteTransaction();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TxType>('income');
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      syncNow().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      syncNow().catch(() => undefined);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  const filtered = useMemo(() => {
    let result = items.filter((t) => t.type === activeTab);
    if (payFilter) {
      result = result.filter((t) => t.paymentMethod === payFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => t.reason.toLowerCase().includes(q));
    }
    return result.sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : b.createdAt - a.createdAt));
  }, [items, activeTab, search, payFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await syncNow(); } catch {}
    setRefreshing(false);
  }, []);

  const add = () => router.push({ pathname: '/accounts/new', params: { type: activeTab } });

  const openEntry = (tx: Transaction) => {
    router.push({ pathname: '/accounts/edit', params: { id: tx.id } });
  };

  const confirmDelete = (tx: Transaction) => {
    Alert.alert('Delete transaction', `Delete "${tx.reason || (tx.type === 'income' ? 'Income' : 'Expense')}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => del.mutate(tx.id) },
    ]);
  };

  if (initialLoading) {
    return (
      <Screen>
        <SkeletonCard />
        <View style={{ height: spacing.lg }} />
        <SkeletonList rows={4} />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <BalanceCard activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSearch(''); setPayFilter(null); }} />
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

      <TransactionList items={filtered} onDelete={confirmDelete} onPress={openEntry} />
    </Screen>
  );
}

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
