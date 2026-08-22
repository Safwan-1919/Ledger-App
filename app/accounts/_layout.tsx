import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/theme/tokens';

export default function AccountsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: '#555555',
        tabBarStyle: {
          backgroundColor: colors.black,
          borderTopColor: colors.black,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 24,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Income',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="arrow-down-left" size={focused ? 22 : 18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="expense"
        options={{
          title: 'Expense',
          tabBarIcon: ({ color, focused }) => (
            <Feather name="arrow-up-right" size={focused ? 22 : 18} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="new" options={{ href: null, title: 'Add', tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="edit" options={{ href: null, title: 'Edit', tabBarStyle: { display: 'none' } }} />
    </Tabs>
  );
}
