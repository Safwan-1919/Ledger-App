import type { Period, Transaction } from '@/types';
import { getTransactions } from '@/store/useTransactionsStore';
import { isFirebaseConfigured, getFirebase, OWNER_ID } from '@/lib/firebase';
import { periodRange } from '@/lib/dates';
import {
  collection,
  query,
  where,
  orderBy,
  limit as qLimit,
  startAfter,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';

export interface PageParams {
  period: Period;
  cursor?: string | null;
  pageSize?: number;
}

export interface PageResult {
  items: Transaction[];
  nextCursor: string | null;
}

function inPeriod(t: Transaction, period: Period): boolean {
  if (period === 'all') return true;
  const { start, end } = periodRange(period);
  const d = new Date(t.date + 'T00:00:00');
  return d >= start && d <= end;
}

function sortTx(a: Transaction, b: Transaction): number {
  if (a.date !== b.date) return b.date.localeCompare(a.date);
  return b.createdAt - a.createdAt;
}

function fetchFromLocal({ period, cursor, pageSize = 25 }: PageParams): PageResult {
  const all = getTransactions().filter((t) => inPeriod(t, period)).sort(sortTx);
  const startIdx = cursor ? Number(cursor) : 0;
  const slice = all.slice(startIdx, startIdx + pageSize);
  const next = startIdx + pageSize < all.length ? String(startIdx + pageSize) : null;
  return { items: slice, nextCursor: next };
}

async function fetchFromFirestore({ period, cursor, pageSize = 25 }: PageParams): Promise<PageResult> {
  const { db } = getFirebase();
  if (!db) return fetchFromLocal({ period, cursor, pageSize });
  const colRef = collection(db, 'owners', OWNER_ID, 'transactions');
  const { start, end } = periodRange(period);
  const startISO = period === 'all' ? '0000-00-00' : toISO(start);
  const endISO = period === 'all' ? '9999-12-31' : toISO(end);
  let q = query(
    colRef,
    where('date', '>=', startISO),
    where('date', '<=', endISO),
    orderBy('date', 'desc'),
    qLimit(pageSize + 1)
  );
  if (cursor) {
    q = query(q, startAfter(cursor));
  }
  const snap = await getDocs(q);
  const docs = snap.docs.slice(0, pageSize).map((d) => ({ id: d.id, ...d.data() } as Transaction));
  const hasMore = snap.docs.length > pageSize;
  const nextCursor = hasMore ? snap.docs[pageSize - 1].data().date : null;
  return { items: docs, nextCursor: hasMore ? nextCursor : null };
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function fetchTransactionsPage(params: PageParams): Promise<PageResult> {
  if (isFirebaseConfigured()) {
    try {
      return await fetchFromFirestore(params);
    } catch (e) {
      console.warn('[transactions] Firestore read failed, falling back to local', e);
      return fetchFromLocal(params);
    }
  }
  return fetchFromLocal(params);
}

/** Aggregate report groups (income/expense/net) for a period from local store. */
export function computeGroups(items: Transaction[], period: Period) {
  const groups: Record<string, ReturnType<typeof emptyGroup>> = {};
  for (const t of items) {
    const key = groupKey(t.date, period);
    if (!groups[key]) groups[key] = emptyGroup(key);
    groups[key].items.push(t);
    if (t.type === 'income') groups[key].income += t.amount;
    else groups[key].expense += t.amount;
    groups[key].net = groups[key].income - groups[key].expense;
    groups[key].count += 1;
  }
  return Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
}

function emptyGroup(key: string) {
  return { key, label: key, items: [] as Transaction[], income: 0, expense: 0, net: 0, count: 0 };
}

function groupKey(iso: string, period: Period): string {
  // reuse dates helper logic inline to avoid extra import cycle
  const d = new Date(iso + 'T00:00:00');
  if (period === 'today') return 'today';
  if (period === 'all') return 'all';
  if (period === 'yearly') return `${d.getFullYear()}`;
  if (period === 'monthly') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  // weekly (ISO week)
  const dt = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((dt.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}
