import React from 'react';
import { View, Image, Pressable, Alert, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, type DrawerContentComponentProps } from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { T, Divider, Card } from '@/components/ui';
import { colors, spacing, layout } from '@/theme/tokens';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingsStore';

const ITEMS = [
  { name: 'today', label: "Today's Report", icon: 'calendar' as const },
  { name: 'weekly', label: 'Weekly Report', icon: 'calendar' as const },
  { name: 'monthly', label: 'Monthly Report', icon: 'calendar' as const },
  { name: 'yearly', label: 'Yearly Report', icon: 'calendar' as const },
  { name: 'accounts', label: 'Accounts', icon: 'book' as const },
  { name: 'history', label: 'History', icon: 'clock' as const },
  { name: 'close-account', label: 'Close Account', icon: 'power' as const },
];

export function AppDrawerContent(props: DrawerContentComponentProps) {
  const items = useTransactionsStore((s) => s.items);
  const currency = useSettingsStore((s) => s.currency);

  const carryForward = useSettingsStore((s) => s.carryForward);

  const income = items.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = items.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const balance = carryForward + income - expense;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={drawerScroll}>
      <View style={brandBlock}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Image source={require('../../assets/logo.png')} style={logo} resizeMode="contain" />
          <T variant="h2">SANA PRINTERS</T>
        </View>
        <T variant="micro">income · expense</T>
      </View>
      <Divider margin={spacing.md} />
      <View style={{ paddingHorizontal: spacing.md }}>
        {ITEMS.map((it) => {
          const active = props.state.routes[props.state.index]?.name === it.name;
          return (
            <Pressable
              key={it.name}
              onPress={() => {
                if (it.name === 'accounts') {
                  props.navigation.dispatch(
                    CommonActions.navigate('accounts', { screen: 'index' })
                  );
                } else {
                  props.navigation.navigate(it.name);
                }
              }}
              style={({ pressed }) => [
                drawerItem,
                active && drawerItemActive,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Feather name={it.icon} size={18} color={active ? colors.white : colors.black} />
              <T variant="body" style={[drawerItemText, active && { color: colors.white }]}>
                {it.label}
              </T>
            </Pressable>
          );
        })}
      </View>
      <Divider margin={spacing.md} />
      <View style={{ paddingHorizontal: spacing.md }}>
        <Card>
          <T variant="micro">Balance</T>
          <T variant="h2" style={{ marginTop: spacing.xs }}>{formatCurrency(balance, currency)}</T>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
            <T variant="small">IN {formatCurrency(income, currency)}</T>
            <T variant="small" style={{ color: colors.muted }}>EX {formatCurrency(expense, currency)}</T>
          </View>
        </Card>
      </View>
    </DrawerContentScrollView>
  );
}

const drawerScroll: ViewStyle = { paddingVertical: spacing.lg, backgroundColor: colors.white, flexGrow: 1 };
const brandBlock: ViewStyle = { paddingHorizontal: spacing.lg, marginBottom: spacing.xs };
const drawerItem: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing.md,
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.md,
  borderWidth: layout.borderWidth,
  borderColor: colors.line,
  marginBottom: spacing.sm,
};
const drawerItemActive: ViewStyle = { backgroundColor: colors.black };
const drawerItemText: TextStyle = { fontWeight: '700' };
const logo: ImageStyle = { width: 40, height: 40 };
