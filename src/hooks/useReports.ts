import { useMemo } from 'react';
import { useTransactionsStore } from '@/store/useTransactionsStore';
import { computeGroups } from '@/lib/transactions';
import { periodRange } from '@/lib/dates';
import type { Period, GroupSummary, ReportTotals, Transaction } from '@/types';

export function useReportData(period: Period) {
  const items = useTransactionsStore((s) => s.items);
  return useMemo(() => {
    const { start, end } = periodRange(period);
    const inRange = items.filter((t) => {
      const d = new Date(t.date + 'T00:00:00');
      return d >= start && d <= end;
    });
    const groups = computeGroups(inRange, period);
    const totals: ReportTotals = inRange.reduce(
      (acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        acc.count += 1;
        if (t.paymentMethod === 'cash') acc.cash += t.amount;
        else acc.online += t.amount;
        return acc;
      },
      { income: 0, expense: 0, net: 0, count: 0, cash: 0, online: 0 }
    );
    totals.net = totals.income - totals.expense;
    return { groups, totals, items: inRange as Transaction[] };
  }, [items, period]);
}
