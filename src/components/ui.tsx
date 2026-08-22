import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  ActivityIndicator,
} from 'react-native';
import { colors, radii, spacing, typography, layout } from '@/theme/tokens';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'micro' | 'label' | 'mono';

export function T({
  children,
  variant = 'body',
  style,
  numberOfLines,
  color,
}: {
  children: React.ReactNode;
  variant?: TextVariant;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  color?: string;
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        baseText,
        textVariants[variant],
        color ? { color } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const baseText: TextStyle = {
  color: colors.ink,
  fontFamily: typography.sans,
};

const textVariants: Record<TextVariant, TextStyle> = {
  h1: { fontSize: typography.h1, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: typography.h2, fontWeight: '800', letterSpacing: -0.3 },
  h3: { fontSize: typography.h3, fontWeight: '700' },
  body: { fontSize: typography.body },
  small: { fontSize: typography.small, color: colors.muted },
  micro: { fontSize: typography.micro, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  label: { fontSize: typography.small, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  mono: { fontSize: typography.body, fontFamily: typography.mono },
};

export function Screen({
  children,
  style,
  contentContainerStyle,
  scroll = true,
  onRefresh,
  refreshing = false,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scroll?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  const containerStyle = [screenInner, contentContainerStyle];
  const content = <View style={[screenInner, style]}>{children}</View>;
  if (!scroll) return <View style={screenOuter}>{content}</View>;
  return (
    <ScrollView
      style={screenOuter}
      contentContainerStyle={containerStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.black} colors={[colors.black]} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const screenOuter: ViewStyle = { flex: 1, backgroundColor: colors.paper };
const screenInner: ViewStyle = {
  flexGrow: 1,
  padding: spacing.lg,
  maxWidth: layout.maxWidth,
  width: '100%',
  alignSelf: 'center',
};

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[rowBase, style]}>{children}</View>;
}

const rowBase: ViewStyle = { flexDirection: 'row', alignItems: 'center' };

export function Card({ children, style, padded = true }: { children: React.ReactNode; style?: ViewStyle; padded?: boolean }) {
  return <View style={[cardBase, padded && cardPadded, style]}>{children}</View>;
}

const cardBase: ViewStyle = {
  backgroundColor: colors.white,
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
  borderRadius: radii.none,
};
const cardPadded: ViewStyle = { padding: spacing.lg };

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  fullWidth,
  icon,
  loading,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  const bg = variant === 'primary' || variant === 'danger' ? colors.black : colors.white;
  const fg = variant === 'primary' || variant === 'danger' ? colors.white : colors.black;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        btnBase,
        fullWidth && { alignSelf: 'stretch' },
        { backgroundColor: bg, borderColor: colors.black },
        pressed && !disabled && { opacity: 0.7 },
        disabled && { opacity: 0.35 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Row style={{ justifyContent: 'center', gap: spacing.sm }}>
          {icon}
          <T style={[btnText, { color: fg }]}>{label}</T>
        </Row>
      )}
    </Pressable>
  );
}

const btnBase: ViewStyle = {
  borderWidth: layout.borderWidth,
  borderRadius: radii.none,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
  minHeight: 48,
  justifyContent: 'center',
};
const btnText: TextStyle = { fontWeight: '700', fontSize: typography.body, letterSpacing: 0.5 };

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  autoCapitalize,
  error,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  error?: string;
}) {
  return (
    <View style={fieldWrap}>
      {label && <T variant="label" style={fieldLabel}>{label}</T>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        style={[inputBase, multiline && inputMultiline, error && inputError]}
      />
      {error && <T variant="small" color={colors.black} style={{ marginTop: spacing.xs }}>{error}</T>}
    </View>
  );
}

const fieldWrap: ViewStyle = { marginBottom: spacing.lg };
const fieldLabel: TextStyle = { marginBottom: spacing.xs };
const inputBase: TextStyle = {
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
  borderRadius: radii.none,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  fontSize: typography.body,
  color: colors.ink,
  backgroundColor: colors.white,
};
const inputMultiline: TextStyle = { minHeight: 88, textAlignVertical: 'top' };
const inputError: TextStyle = { borderColor: colors.black, borderWidth: 2 };

export function Divider({ margin = spacing.lg }: { margin?: number }) {
  return <View style={{ height: layout.borderWidth, backgroundColor: colors.line, marginVertical: margin }} />;
}

export function Stat({
  label,
  value,
  accent,
  compact,
}: {
  label: string;
  value: string;
  accent?: 'income' | 'expense' | 'neutral';
  compact?: boolean;
}) {
  const color = accent === 'income' ? colors.black : accent === 'expense' ? colors.muted : colors.ink;
  return (
    <View style={compact ? statBoxCompact : statBox}>
      <T variant="micro">{label}</T>
      <T variant={compact ? 'small' : 'h3'} style={[compact ? { fontWeight: '800', color } : statValue, { color }]}>{value}</T>
    </View>
  );
}

const statBox: ViewStyle = { flex: 1, padding: spacing.md, borderWidth: layout.borderWidth, borderColor: colors.line };
const statBoxCompact: ViewStyle = { flex: 1, padding: spacing.sm, borderWidth: layout.borderWidth, borderColor: colors.line };
const statValue: TextStyle = { marginTop: spacing.xs, fontWeight: '800' };

export function Tag({ children, inverse }: { children: React.ReactNode; inverse?: boolean }) {
  return (
    <View style={[tagBase, inverse && tagInverse]}>
      <T variant="micro" style={[tagText, inverse && tagTextInverse]}>{children}</T>
    </View>
  );
}

const tagBase: ViewStyle = { borderWidth: layout.borderWidth, borderColor: colors.line, paddingVertical: 2, paddingHorizontal: spacing.sm };
const tagInverse: ViewStyle = { backgroundColor: colors.black };
const tagText: TextStyle = { fontWeight: '700' };
const tagTextInverse: TextStyle = { color: colors.white };

export { StyleSheet };
