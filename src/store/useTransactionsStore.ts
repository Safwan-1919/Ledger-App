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
  clearAll: () => Promise<void>;
  /** Test/reseed helper kept internal. */
  replaceAll: (items: Transaction[]) => void;
  /** Merge server items: for each server item, keep it if local doesn't have it or server is newer. */
  mergeFromServer: (serverItems: Transaction[], lastSyncedAt: number) => void;
}

function notifySync() {
  // Fire-and-forget cloud sync (no-op when Firebase is not configured).
  import('@/lib/sync')
    .then((m) => m.syncNow())
    .catch((e) => console.warn('[sync] notifySync error:', e));
}

let _hydrated = false;
let _onHydrate: (() => void) | null = null;

export const hydrated = new Promise<void>((resolve) => {
  _onHydrate = () => { _hydrated = true; resolve(); };
});

export function isStoreHydrated(): boolean {
  return _hydrated;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      items: [],

      addTransaction: (input) => {
        const now = Date.now();
        const absAmount = Math.abs(input.amount);
        const safeAmount = Number.isFinite(absAmount) && absAmount > 0 ? absAmount : 0;
        const tx: Transaction = {
          id: genId(),
          type: input.type,
          amount: safeAmount,
          reason: input.reason.trim(),
          date: input.date,
          note: input.note?.trim() || undefined,
          receiptData: input.receiptData,
          paymentMethod: input.paymentMethod ?? 'cash',
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
                  amount: patch.amount != null
                    ? (() => { const a = Math.abs(patch.amount); return Number.isFinite(a) && a > 0 ? a : t.amount; })()
                    : t.amount,
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

      clearAll: async () => {
        const currentIds = get().items.map((t) => t.id);
        set({ items: [] });
        if (currentIds.length > 0) {
          const { addPendingDeletionsBulk } = await import('@/lib/sync');
          await addPendingDeletionsBulk(currentIds);
        }
        notifySync();
      },

      replaceAll: (items) => set({ items }),

      mergeFromServer: (serverItems, lastSyncedAt) => {
        set((s) => {
          const serverMap = new Map(serverItems.map((t) => [t.id, t]));
          const localMap = new Map(s.items.map((t) => [t.id, t]));

          // Merge: keep newer version of each item.
          for (const [id, serverTx] of serverMap) {
            const localTx = localMap.get(id);
            if (!localTx || serverTx.updatedAt > localTx.updatedAt) {
              localMap.set(id, serverTx);
            }
          }

          // Remove local items that are NOT on server AND were already synced before.
          // (If they were never synced, they're new local items — keep them.)
          for (const [id, localTx] of localMap) {
            if (!serverMap.has(id) && localTx.updatedAt <= lastSyncedAt) {
              localMap.delete(id);
            }
          }

          return { items: Array.from(localMap.values()) };
        });
      },
    }),
    {
      name: 'ledger-transactions',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
      partialize: (s) => ({ items: s.items }),
    }
  )
);

// Resolve hydration promise when store loads from AsyncStorage.
useTransactionsStore.persist.onFinishHydration(() => {
  _onHydrate?.();
});

/** Non-reactive snapshot for queries / sync. */
export function getTransactions(): Transaction[] {
  return useTransactionsStore.getState().items;
}
