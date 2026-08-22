import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Transaction, TransactionInput } from '@/types';

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

interface TransactionsState {
  items: Transaction[];
  addTransaction: (input: TransactionInput) => Transaction;
  updateTransaction: (id: string, patch: Partial<TransactionInput>) => void;
  removeTransaction: (id: string) => void;
  clearAll: () => void;
  /** Test/reseed helper kept internal. */
  replaceAll: (items: Transaction[]) => void;
}

function notifySync() {
  // Fire-and-forget cloud sync (no-op when Firebase is not configured).
  import('@/lib/sync')
    .then((m) => m.syncNow())
    .catch((e) => console.warn('[sync] notifySync error:', e));
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      items: [],

      addTransaction: (input) => {
        const now = Date.now();
        const tx: Transaction = {
          id: genId(),
          type: input.type,
          amount: Math.abs(input.amount),
          reason: input.reason.trim(),
          date: input.date,
          note: input.note?.trim() || undefined,
          receiptData: input.receiptData,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ items: [tx, ...s.items] }));
        notifySync();
        return tx;
      },

      updateTransaction: (id, patch) => {
        set((s) => ({
          items: s.items.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...patch,
                  amount: patch.amount != null ? Math.abs(patch.amount) : t.amount,
                  updatedAt: Date.now(),
                }
              : t
          ),
        }));
        notifySync();
      },

      removeTransaction: (id) => {
        set((s) => ({ items: s.items.filter((t) => t.id !== id) }));
        import('@/lib/sync')
          .then((m) => m.addPendingDeletion(id).then(() => m.syncNow()))
          .catch((e) => console.warn('[sync] delete sync error:', e));
      },

      clearAll: () => {
        set({ items: [] });
        notifySync();
      },

      replaceAll: (items) => set({ items }),
    }),
    {
      name: 'ledger-transactions',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({ items: s.items }),
    }
  )
);

/** Non-reactive snapshot for queries / sync. */
export function getTransactions(): Transaction[] {
  return useTransactionsStore.getState().items;
}
