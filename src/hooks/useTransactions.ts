import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Period, TransactionInput } from '@/types';
import { fetchTransactionsPage } from '@/lib/transactions';
import { useTransactionsStore } from '@/store/useTransactionsStore';

const PAGE_SIZE = 25;

export function useInfiniteTransactions(period: Period) {
  const qc = useQueryClient();
  return useInfiniteQuery({
    queryKey: ['transactions', period],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      fetchTransactionsPage({ period, cursor: pageParam, pageSize: PAGE_SIZE }),
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['transactions'] });
  qc.invalidateQueries({ queryKey: ['report'] });
}

export function useAddTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) =>
      Promise.resolve(useTransactionsStore.getState().addTransaction(input)),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<TransactionInput> }) => {
      useTransactionsStore.getState().updateTransaction(id, patch);
      return Promise.resolve();
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      useTransactionsStore.getState().removeTransaction(id);
      return Promise.resolve();
    },
    onSuccess: () => invalidateAll(qc),
  });
}
