import React from 'react';
import { View, Pressable, type ViewStyle, type ImageStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { T, Row, Tag } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { formatCurrency } from '@/lib/format';
import { relativeDayLabel } from '@/lib/dates';
import type { Transaction } from '@/types';
import { useSettingsStore } from '@/store/useSettingsStore';

export function TransactionItem({
  tx,
  onDelete,
  onPress,
}: {
  tx: Transaction;
  onDelete?: (tx: Transaction) => void;
  onPress?: (tx: Transaction) => void;
}) {
  const currency = useSettingsStore((s) => s.currency);
  const isIncome = tx.type === 'income';
  const receipt = tx.receiptData;
  const isOnline = tx.paymentMethod === 'online';

  return (
    <Pressable onPress={() => onPress?.(tx)} style={({ pressed }) => [itemWrap, pressed && { opacity: 0.6 }]}>
      <View style={itemLeft}>
        {receipt ? (
          <Image source={{ uri: receipt }} style={thumb} contentFit="cover" />
        ) : (
          <View style={[thumb, thumbPlaceholder]}>
            <Feather name={isIncome ? 'arrow-down-left' : 'arrow-up-right'} size={16} color={colors.black} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
              {tx.reason || (isIncome ? 'Income' : 'Expense')}
            </T>
            <T variant="body" style={{ fontWeight: '800' }}>
              {isIncome ? '+' : '-'}
              {formatCurrency(tx.amount, currency)}
            </T>
          </Row>
          <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
            <Row style={{ gap: spacing.xs, alignItems: 'center' }}>
              <T variant="small">{relativeDayLabel(tx.date)}</T>
              <T variant="micro" style={{ color: colors.muted }}>·</T>
              <Feather name={isOnline ? 'smartphone' : 'dollar-sign'} size={10} color={colors.muted} />
              <T variant="micro" style={{ color: colors.muted }}>{isOnline ? 'Online' : 'Cash'}</T>
            </Row>
            <Tag inverse={isIncome}>{isIncome ? 'IN' : 'EX'}</Tag>
          </Row>
        </View>
      </View>
      {onDelete && (
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={() => onDelete(tx)}
          style={deleteBtn}
        >
          <Feather name="trash-2" size={18} color={colors.black} />
        </Pressable>
      )}
    </Pressable>
  );
}

const itemWrap: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.md,
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
  padding: spacing.md,
  backgroundColor: colors.white,
};
const itemLeft: ViewStyle = { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md };
const thumb: ImageStyle = { width: 40, height: 40, borderWidth: layout.borderWidth, borderColor: colors.line };
const thumbPlaceholder: ViewStyle = { alignItems: 'center', justifyContent: 'center' };
const deleteBtn: ViewStyle = { padding: spacing.sm };
