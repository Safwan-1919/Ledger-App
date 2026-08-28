import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTransactions } from '@/store/useTransactionsStore';
import { getFirebase, isFirebaseConfigured, OWNER_ID } from '@/lib/firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { generateMonthPdf, generateYearPdf } from '@/lib/pdf';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Transaction } from '@/types';

const META_KEY = 'ledger-sync-meta';
const DELETIONS_KEY = 'ledger-pending-deletions';
const REPORTS_KEY = 'ledger-last-report-gen';
const SYNC_DEBOUNCE_MS = 800;

interface SyncMeta {
  lastSyncedAt: number;
}

let timer: ReturnType<typeof setTimeout> | null = null;
let inFlight: Promise<void> | null = null;

async function readMeta(): Promise<SyncMeta> {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (raw) return JSON.parse(raw) as SyncMeta;
  } catch {}
  return { lastSyncedAt: 0 };
}

async function writeMeta(meta: SyncMeta): Promise<void> {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

async function getPendingDeletions(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(DELETIONS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return [];
}

async function clearPendingDeletions(): Promise<void> {
  await AsyncStorage.setItem(DELETIONS_KEY, '[]');
}

export async function addPendingDeletion(id: string): Promise<void> {
  const existing = await getPendingDeletions();
  if (!existing.includes(id)) {
    await AsyncStorage.setItem(DELETIONS_KEY, JSON.stringify([...existing, id]));
  }
}

export async function addPendingDeletionsBulk(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const existing = await getPendingDeletions();
  const merged = [...new Set([...existing, ...ids])];
  await AsyncStorage.setItem(DELETIONS_KEY, JSON.stringify(merged));
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) clean[k] = v;
  }
  return clean;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

async function generateCompletedReports(items: Transaction[]): Promise<void> {
  if (items.length === 0) return;

  // Only run once per day.
  const lastRun = await AsyncStorage.getItem(REPORTS_KEY);
  if (lastRun === todayKey()) return;

  const { db } = getFirebase();
  if (!db) return;

  const currency = useSettingsStore.getState().currency;
  const reportsCol = collection(db, 'owners', OWNER_ID, 'reports');
  const existing = await getDocs(reportsCol);
  const existingIds = new Set(existing.docs.map((d) => d.id));

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Generate reports for completed months (not current month).
  const seen = new Set<string>();
  for (const t of items) {
    const [y, m] = t.date.split('-').map(Number);
    const monthIndex = m - 1;
    const id = `monthly-${y}-${String(m).padStart(2, '0')}`;

    // Skip current month (still in progress) and already-seen months.
    if ((y === currentYear && monthIndex === currentMonth) || seen.has(id)) continue;
    seen.add(id);

    // For completed months that already have a report, only regenerate once per month.
    if (existingIds.has(id)) {
      const lastGenKey = `report-gen-${id}`;
      const lastGen = await AsyncStorage.getItem(lastGenKey);
      if (lastGen) continue;
    }

    try {
      const label = new Date(y, monthIndex, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const base64 = await generateMonthPdf(y, monthIndex, items, currency);
      await setDoc(doc(reportsCol, id), {
        id, type: 'monthly', label, base64, generatedAt: Date.now(),
      });
      await AsyncStorage.setItem(`report-gen-${id}`, todayKey());
    } catch { /* skip */ }
  }

  // Generate reports for completed years (not current year).
  const seenYears = new Set<number>();
  for (const t of items) {
    const y = Number(t.date.split('-')[0]);
    const id = `yearly-${y}`;
    if (y === currentYear || seenYears.has(y)) continue;
    seenYears.add(y);

    if (existingIds.has(id)) {
      const lastGenKey = `report-gen-${id}`;
      const lastGen = await AsyncStorage.getItem(lastGenKey);
      if (lastGen) continue;
    }

    try {
      const base64 = await generateYearPdf(y, items, currency);
      await setDoc(doc(reportsCol, id), {
        id, type: 'yearly', label: `${y} Yearly Report`, base64, generatedAt: Date.now(),
      });
      await AsyncStorage.setItem(`report-gen-${id}`, todayKey());
    } catch { /* skip */ }
  }

  await AsyncStorage.setItem(REPORTS_KEY, todayKey());
}

export async function syncNow(): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  if (!db) return;

  if (inFlight) return inFlight;

  inFlight = (async () => {
    const items = getTransactions();
    const meta = await readMeta();
    const colRef = collection(db, 'owners', OWNER_ID, 'transactions');

    // Process pending deletions first.
    const pendingDeletions = await getPendingDeletions();
    if (pendingDeletions.length > 0) {
      const batch = writeBatch(db);
      for (const id of pendingDeletions) {
        batch.delete(doc(colRef, id));
      }
      await batch.commit();
      await clearPendingDeletions();
    }

    // If local is empty but server has data, pull from server.
    if (items.length === 0) {
      const snap = await getDocs(colRef);
      if (snap.docs.length > 0) {
        const serverItems = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
        const { useTransactionsStore } = await import('@/store/useTransactionsStore');
        useTransactionsStore.getState().replaceAll(serverItems);
        return;
      }
    }

    // Push changed items to server.
    const changed = items.filter((t) => t.updatedAt > meta.lastSyncedAt);
    if (changed.length > 0) {
      const batch = writeBatch(db);
      for (const t of changed) {
        batch.set(doc(colRef, t.id), stripUndefined(t as unknown as Record<string, unknown>));
      }
      await batch.commit();
    }

    const maxUpdated = items.reduce((m, t) => Math.max(m, t.updatedAt), meta.lastSyncedAt);
    await writeMeta({ lastSyncedAt: maxUpdated });

    // Auto-generate reports for completed months/years (once per day).
    generateCompletedReports(items).catch(() => undefined);
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/** Debounced variant used by the store on every mutation. */
export function scheduleSync(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    syncNow().catch(() => undefined);
  }, SYNC_DEBOUNCE_MS);
}
