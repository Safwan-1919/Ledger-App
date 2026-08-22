import React from 'react';
import { View, FlatList } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T, Button } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { TransactionItem } from '@/components/TransactionItem';
import { useLocalPagination } from '@/hooks/useLocalPagination';
import type { Transaction } from '@/types';

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.xxl }}>
      <Feather name="inbox" size={40} color={colors.muted} />
      <T variant="h3" style={{ marginTop: spacing.md }}>{title}</T>
      {subtitle && <T variant="small" style={{ marginTop: spacing.xs, textAlign: 'center' }}>{subtitle}</T>}
    </View>
  );
}

export function TransactionList({
  items,
  onDelete,
  onPress,
}: {
  items: Transaction[];
  onDelete?: (tx: Transaction) => void;
  onPress?: (tx: Transaction) => void;
}) {
  const { visible, hasMore, loadMore } = useLocalPagination(items, 25);

  if (items.length === 0) {
    return <EmptyState title="Nothing here yet" subtitle="Add an income or expense to get started." />;
  }

  return (
    <View style={{ gap: spacing.md }}>
      <FlatList
        data={visible}
        keyExtractor={(t) => t.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item }) => (
          <TransactionItem tx={item} onDelete={onDelete} onPress={onPress} />
        )}
      />
      {hasMore && (
        <Button label={`Load more (${items.length - visible.length} left)`} variant="outline" onPress={loadMore} />
      )}
    </View>
  );
}
