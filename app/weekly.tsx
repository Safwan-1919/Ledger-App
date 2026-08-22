import React, { useState, useCallback } from 'react';
import { Screen } from '@/components/ui';
import { ReportView } from '@/components/ReportView';
import { syncNow } from '@/lib/sync';

export default function WeeklyReport() {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await syncNow(); } catch {}
    setRefreshing(false);
  }, []);

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      <ReportView period="weekly" />
    </Screen>
  );
}
