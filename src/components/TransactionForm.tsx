import React, { useState } from 'react';
import { View, Platform, Alert, Pressable, type ViewStyle, type ImageStyle } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { T, TextField, Button, Row, Card } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { toISODate, fromISODate } from '@/lib/dates';
import { compressReceipt } from '@/lib/compression';
import type { Transaction, TransactionInput, TxType } from '@/types';

export function TransactionForm({
  type,
  initial,
  submitLabel = 'Save',
  onSubmit,
  onCancel,
}: {
  type: TxType;
  initial?: Transaction;
  submitLabel?: string;
  onSubmit: (input: TransactionInput) => void;
  onCancel?: () => void;
}) {
  const [date, setDate] = useState<Date>(initial ? fromISODate(initial.date) : new Date());
  const [reason, setReason] = useState(initial?.reason ?? '');
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [receiptData, setReceiptData] = useState<string | undefined>(initial?.receiptData);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function pickReceipt() {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission required', 'Photo library access is needed to attach receipts.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.length) return;
      const uri = result.assets[0].uri;
      setBusy(true);
      try {
        const compressed = await compressReceipt(uri);
        setReceiptData(compressed);
      } catch {
        setBusy(false);
        Alert.alert('Could not compress image', 'Please try a different photo.');
      } finally {
        setBusy(false);
      }
    } catch (e) {
      Alert.alert('Could not attach receipt', String(e));
    }
  }

  function handleSubmit() {
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount greater than 0.');
      return;
    }
    onSubmit({
      type,
      amount: value,
      reason: reason.trim(),
      date: toISODate(date),
      note: note.trim() || undefined,
      receiptData,
    });
  }

  return (
    <View>
      <Card>
        <Pressable accessibilityRole="button" onPress={() => setShowPicker(true)}>
          <T variant="label">Date *</T>
          <Row style={[dateRow, { marginTop: spacing.xs }]}>
            <Feather name="calendar" size={18} color={colors.black} />
            <T variant="body" style={{ fontWeight: '700' }}>
              {date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </T>
          </Row>
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(e, selected) => {
              setShowPicker(false);
              if (selected) setDate(selected);
            }}
          />
        )}

        <View style={{ height: spacing.lg }} />

        <TextField
          label="Reason (optional)"
          value={reason}
          onChangeText={setReason}
          placeholder="e.g. Salary, Groceries"
        />
        <TextField
          label="Amount *"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="numeric"
        />
        <TextField
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="Add a note"
          multiline
        />

        {error && <T variant="small" style={{ color: colors.black }}>{error}</T>}

        <Row style={{ justifyContent: 'space-between', marginTop: spacing.md }}>
          <Button
            label={receiptData ? 'Change receipt' : 'Attach receipt'}
            variant="outline"
            onPress={pickReceipt}
            loading={busy}
            icon={<Feather name="camera" size={16} color={colors.black} />}
          />
          {receiptData && (
            <Pressable onPress={() => setReceiptData(undefined)} style={removeReceiptBtn}>
              <Feather name="x" size={16} color={colors.black} />
            </Pressable>
          )}
        </Row>
        {receiptData && <Image source={{ uri: receiptData }} style={receiptPreview} contentFit="contain" />}
      </Card>

      <View style={{ height: spacing.lg }} />

      <Row style={{ gap: spacing.md }}>
        {onCancel && (
          <Button label="Cancel" variant="outline" onPress={onCancel} fullWidth />
        )}
        <Button label={submitLabel} onPress={handleSubmit} fullWidth disabled={busy} loading={busy} />
      </Row>
    </View>
  );
}

const dateRow: ViewStyle = {
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
};
const removeReceiptBtn: ViewStyle = { padding: spacing.md, justifyContent: 'center' };
const receiptPreview: ImageStyle = {
  width: '100%',
  height: 240,
  marginTop: spacing.md,
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
};
