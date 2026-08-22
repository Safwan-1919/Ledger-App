import 'react-native-gesture-handler';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AppDrawerContent } from '@/components/AppDrawerContent';
import { colors, typography } from '@/theme/tokens';

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
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Drawer
          initialRouteName="accounts"
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
