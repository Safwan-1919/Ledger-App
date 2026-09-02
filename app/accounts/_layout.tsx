import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@/theme/tokens';

export default function AccountsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
