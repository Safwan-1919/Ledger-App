import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AppDrawerContent } from '@/components/AppDrawerContent';
import { SkeletonCard } from '@/components/Shimmer';
import { colors, typography, spacing } from '@/theme/tokens';
import { View } from 'react-native';
import { isStoreHydrated } from '@/store/useTransactionsStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const TITLE_MAP: Record<string, string> = {
  today: "Today's Report",
  weekly: 'Weekly Report',
  monthly: 'Monthly Report',
  yearly: 'Yearly Report',
  accounts: 'Accounts',
  history: 'History',
  'close-account': 'Close Account',
};

export default function RootLayout() {
  const [ready, setReady] = useState(isStoreHydrated());

  useEffect(() => {
    if (!ready) {
      import('@/store/useTransactionsStore').then((m) =>
        m.hydrated.then(() => setReady(true))
      );
    }
  }, []);

  if (!ready) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.white, padding: spacing.lg }}>
        <StatusBar style="dark" />
        <SkeletonCard />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Drawer
          initialRouteName="today"
          drawerContent={(props) => <AppDrawerContent {...props} />}
          screenOptions={({ route }) => {
            const isIndex = route.name === 'index';
            return {
              headerShown: true,
              title: isIndex ? '' : (TITLE_MAP[route.name] ?? route.name),
              drawerItemStyle: isIndex ? { display: 'none' } : undefined,
              swipeEnabled: !isIndex,
              headerStyle: { backgroundColor: colors.white },
              headerTintColor: colors.black,
              headerTitleStyle: { fontWeight: '800', letterSpacing: 0.5, fontFamily: typography.sans },
              drawerStyle: { backgroundColor: colors.white, width: 300 },
              drawerActiveBackgroundColor: colors.black,
              drawerActiveTintColor: colors.white,
              drawerInactiveTintColor: colors.black,
              sceneContainerStyle: { backgroundColor: colors.white },
            };
          }}
        />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
