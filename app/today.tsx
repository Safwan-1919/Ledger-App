import React, { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen, T } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { ReportView } from '@/components/ReportView';
import { syncNow } from '@/lib/sync';

export default function TodayReport() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await syncNow(); } catch {}
    setRefreshing(false);
  }, []);

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
        <Pressable
          onPress={() => router.push({ pathname: '/accounts/new', params: { type: 'income' } })}
          style={({ pressed }) => [addBtn, { flex: 1 }, pressed && { opacity: 0.7 }]}
        >
          <Feather name="plus" size={16} color={colors.white} />
          <T variant="body" style={{ fontWeight: '700', color: colors.white }}>Add Income</T>
        </Pressable>
        <Pressable
          onPress={() => router.push({ pathname: '/accounts/new', params: { type: 'expense' } })}
          style={({ pressed }) => [addBtn, { flex: 1, backgroundColor: colors.white, borderColor: colors.black }, pressed && { opacity: 0.7 }]}
        >
          <Feather name="minus" size={16} color={colors.black} />
          <T variant="body" style={{ fontWeight: '700', color: colors.black }}>Add Expense</T>
        </Pressable>
      </View>
      <ReportView period="today" />
    </Screen>
  );
}

const addBtn = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  gap: spacing.sm,
  backgroundColor: colors.black,
  borderWidth: layout.borderWidth,
  borderColor: colors.black,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
};
