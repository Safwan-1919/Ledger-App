import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Screen, T, Row } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';
import { TransactionForm } from '@/components/TransactionForm';
import { useAddTransaction } from '@/hooks/useTransactions';
import type { TransactionInput, TxType } from '@/types';

export default function NewTransaction() {
  const params = useLocalSearchParams<{ type?: string; from?: string }>();
  const router = useRouter();
  const add = useAddTransaction();
  const type: TxType = params.type === 'expense' ? 'expense' : 'income';
  const [formKey, setFormKey] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      setFormKey((k) => k + 1);
    }, [])
  );

  const handleSubmit = (input: TransactionInput) => {
    add.mutate(input, {
      onSuccess: () => {
        router.replace(params.from === 'today' ? '/today' : '/accounts');
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
              {type === 'income' ? 'Add Income' : 'Add Expense'}
            </T>
          </Pressable>
        </Row>
        <TransactionForm
          key={formKey}
          type={type}
          submitLabel="Save"
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
