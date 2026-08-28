import { getFirebase, isFirebaseConfigured, OWNER_ID } from '@/lib/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { generateMonthPdf, generateYearPdf, generateCloseAccountPdf } from '@/lib/pdf';
import { getTransactions } from '@/store/useTransactionsStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export interface StoredReport {
  id: string;
  type: 'monthly' | 'yearly' | 'close-account';
  label: string;
  base64: string;
  generatedAt: number;
  carryForward?: number;
}

function monthId(year: number, month: number): string {
  return `monthly-${year}-${String(month + 1).padStart(2, '0')}`;
}

function yearId(year: number): string {
  return `yearly-${year}`;
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function getUniqueMonths(items: { date: string }[]): { year: number; month: number }[] {
  const seen = new Set<string>();
  const result: { year: number; month: number }[] = [];
  for (const t of items) {
    const [y, m] = t.date.split('-').map(Number);
    const key = `${y}-${m}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ year: y, month: m - 1 });
    }
  }
  return result.sort((a, b) => b.year - a.year || b.month - a.month);
}

function getUniqueYears(items: { date: string }[]): number[] {
  const seen = new Set<number>();
  for (const t of items) {
    seen.add(Number(t.date.split('-')[0]));
  }
  return Array.from(seen).sort((a, b) => b - a);
}

export async function fetchStoredReports(): Promise<StoredReport[]> {
  if (!isFirebaseConfigured()) return [];
  const { db } = getFirebase();
  if (!db) return [];

  const colRef = collection(db, 'owners', OWNER_ID, 'reports');
  const snap = await getDocs(colRef);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as StoredReport))
    .sort((a, b) => b.generatedAt - a.generatedAt);
}

export async function generateMissingReports(): Promise<number> {
  if (!isFirebaseConfigured()) return 0;
  const { db } = getFirebase();
  if (!db) return 0;

  const items = getTransactions();
  if (items.length === 0) return 0;

  const currency = useSettingsStore.getState().currency;
  const colRef = collection(db, 'owners', OWNER_ID, 'reports');
  const existing = await getDocs(colRef);
  const existingIds = new Set(existing.docs.map((d) => d.id));

  let generated = 0;

  for (const { year, month } of getUniqueMonths(items)) {
    const id = monthId(year, month);
    if (existingIds.has(id)) continue;
    try {
      const base64 = await generateMonthPdf(year, month, items, currency);
      await setDoc(doc(colRef, id), {
        id,
        type: 'monthly',
        label: monthLabel(year, month),
        base64,
        generatedAt: Date.now(),
      });
      generated++;
    } catch {
      /* skip failed */
    }
  }

  for (const year of getUniqueYears(items)) {
    const id = yearId(year);
    if (existingIds.has(id)) continue;
    try {
      const base64 = await generateYearPdf(year, items, currency);
      await setDoc(doc(colRef, id), {
        id,
        type: 'yearly',
        label: `${year} Yearly Report`,
        base64,
        generatedAt: Date.now(),
      });
      generated++;
    } catch {
      /* skip failed */
    }
  }

  return generated;
}

export async function deleteStoredReport(id: string): Promise<void> {
  if (!isFirebaseConfigured()) return;
  const { db } = getFirebase();
  if (!db) return;
  await deleteDoc(doc(db, 'owners', OWNER_ID, 'reports', id));
}

export async function storeCloseAccountReport(
  items: ReturnType<typeof getTransactions>,
  carryForward: number,
): Promise<string> {
  if (!isFirebaseConfigured()) throw new Error('Firebase not configured');
  const { db } = getFirebase();
  if (!db) throw new Error('Firestore not available');

  const currency = useSettingsStore.getState().currency;
  const base64 = await generateCloseAccountPdf(items, currency, carryForward);
  const id = `close-account-${Date.now()}`;
  const now = new Date();
  const label = `Close Account (${now.toLocaleDateString()})`;

  const income = items.filter((t) => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const expense = items.filter((t) => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const newCarryForward = carryForward + income - expense;

  await setDoc(doc(db, 'owners', OWNER_ID, 'reports', id), {
    id,
    type: 'close-account',
    label,
    base64,
    generatedAt: Date.now(),
    carryForward: newCarryForward,
  });

  return id;
}
