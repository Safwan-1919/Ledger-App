import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function ExpenseRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/accounts');
  }, []);
  return null;
}
