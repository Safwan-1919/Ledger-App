import React, { useState, useEffect } from 'react';
import { View, Alert, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T, Card, Stat, Row, Button, Divider } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useReportData } from '@/hooks/useReports';
import { useLocalPagination } from '@/hooks/useLocalPagination';
import { computeGroups } from '@/lib/transactions';
import { formatGroupLabel } from '@/lib/dates';
import { generateAndShareReport } from '@/lib/pdf';
import { useMutation } from '@tanstack/react-query';
import { TransactionItem } from '@/components/TransactionItem';
import { SkeletonCard, SkeletonList } from '@/components/Shimmer';
import type { Period, Transaction } from '@/types';

export function ReportView({ period }: { period: Period }) {
  const currency = useSettingsStore((s) => s.currency);
  const { groups, totals, items } = useReportData(period);
  const fullGroups = computeGroups(items, period);
  const { visible, hasMore, loadMore } = useLocalPagination(items, 30);
  const visibleIds = new Set(visible.map((t) => t.id));
  const visibleGroups = fullGroups
    .map((g) => ({ ...g, items: g.items.filter((t) => visibleIds.has(t.id)) }))
    .filter((g) => g.items.length > 0);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setInitialLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const pdf = useMutation({
    mutationFn: () => generateAndShareReport(period, items, currency),
    onError: (e) => Alert.alert('PDF unavailable', (e as Error).message),
  });

  if (initialLoading) {
    return (
      <View style={{ gap: spacing.lg }}>
        <SkeletonCard />
        <SkeletonList rows={3} />
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <Card>
        <Row style={{ gap: spacing.md }}>
          <Stat label="Income" value={formatCurrency(totals.income, currency)} accent="income" compact />
          <Stat label="Expense" value={formatCurrency(totals.expense, currency)} accent="expense" compact />
        </Row>
        <View style={{ height: spacing.sm }} />
        <Stat label="Net Balance" value={formatCurrency(totals.net, currency)} compact />
        <Divider margin={spacing.md} />
        <Row style={{ gap: spacing.md }}>
          <Stat label="Cash" value={formatCurrency(totals.cash, currency)} compact />
          <Stat label="Online" value={formatCurrency(totals.online, currency)} compact />
        </Row>
        <Divider margin={spacing.md} />
        <Button
          label="Download PDF report"
          variant="outline"
          fullWidth
          loading={pdf.isPending}
          onPress={() => pdf.mutate()}
          icon={<Feather name="download" size={16} color={colors.black} />}
        />
      </Card>

      {visibleGroups.length === 0 ? (
        <Card>
          <T variant="small" style={{ textAlign: 'center' }}>No transactions in this period.</T>
        </Card>
      ) : (
        visibleGroups.map((g) => (
          <View key={g.key}>
            <View style={groupHeader}>
              <T variant="label">{formatGroupLabel(g.key, period)}</T>
              <T variant="body" style={{ fontWeight: '800' }}>
                {formatCurrency(g.net, currency)}
              </T>
            </View>
            <T variant="micro" style={{ marginBottom: spacing.sm }}>
              IN {formatCurrency(g.income, currency)} · EX {formatCurrency(g.expense, currency)}
            </T>
            <View style={{ gap: spacing.md }}>
              {g.items.map((tx: Transaction) => (
                <TransactionItem key={tx.id} tx={tx} />
              ))}
            </View>
          </View>
        ))
      )}

      {hasMore && (
        <Button label={`Load more (${items.length - visible.length} left)`} variant="outline" onPress={loadMore} />
      )}
    </View>
  );
}

const groupHeader: ViewStyle = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottomWidth: layout.borderWidth,
  borderBottomColor: colors.black,
  paddingVertical: spacing.sm,
  paddingHorizontal: spacing.md,
};
