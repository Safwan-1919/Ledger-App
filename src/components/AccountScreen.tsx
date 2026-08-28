import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen, Button, T } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { BalanceCard } from '@/components/BalanceCard';
import { TransactionList } from '@/components/TransactionList';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { useDeleteTransaction } from '@/hooks/useTransactions';
import { syncNow } from '@/lib/sync';
import { SkeletonCard, SkeletonList } from '@/components/Shimmer';
import type { Transaction, TxType } from '@/types';

export function AccountScreen({ type }: { type: TxType }) {
  const router = useRouter();
  const items = useTransactionsStore((s) => s.items);
  const del = useDeleteTransaction();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      syncNow().catch(() => undefined);
    }
  }, []);

  const filtered = useMemo(() => {
    return items
      .filter((t) => t.type === type)
      .sort((a, b) => (a.date !== b.date ? b.date.localeCompare(a.date) : b.createdAt - a.createdAt));
  }, [items, type]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await syncNow(); } catch {}
    setRefreshing(false);
  }, []);

  const add = () => router.push({ pathname: '/accounts/new', params: { type } });

  const openEntry = (tx: Transaction) => {
    router.push({ pathname: '/accounts/edit', params: { id: tx.id } });
  };

  const confirmDelete = (tx: Transaction) => {
    Alert.alert('Delete transaction', `Delete "${tx.reason || (type === 'income' ? 'Income' : 'Expense')}"?`, [
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
      <BalanceCard />
      <View style={{ height: spacing.lg }} />
      <Button
        label={type === 'income' ? 'Add Income' : 'Add Expense'}
        fullWidth
        onPress={add}
        icon={<Feather name={type === 'income' ? 'plus' : 'minus'} size={16} color={colors.white} />}
      />
      <View style={{ height: spacing.lg }} />
      <T variant="label">{type === 'income' ? 'Income entries' : 'Expense entries'}</T>
      <View style={{ height: spacing.md }} />
      <TransactionList items={filtered} onDelete={confirmDelete} onPress={openEntry} />
    </Screen>
  );
}
