import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Screen, T, Row } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { TransactionForm } from '@/components/TransactionForm';
import { useUpdateTransaction } from '@/hooks/useTransactions';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import type { TransactionInput } from '@/types';

export default function EditTransaction() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const update = useUpdateTransaction();
  const tx = useTransactionsStore((s) => s.items.find((t) => t.id === params.id));

  if (!tx) {
    return (
      <Screen>
        <T variant="h3">Transaction not found</T>
      </Screen>
    );
  }

  const handleSubmit = (input: TransactionInput) => {
    update.mutate({ id: tx.id, patch: input }, {
      onSuccess: () => {
        router.replace('/accounts');
      },
      onError: (e) => Alert.alert('Error', (e as Error).message),
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen contentContainerStyle={{ paddingBottom: 200 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Feather name="chevron-left" size={22} color={colors.black} />
            <T variant="h3" style={{ fontWeight: '800' }}>
              Edit {tx.type === 'income' ? 'Income' : 'Expense'}
            </T>
          </Pressable>
        </Row>
        <TransactionForm
          type={tx.type}
          initial={tx}
          submitLabel="Update"
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
