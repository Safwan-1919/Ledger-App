/** Local-day ISO string (YYYY-MM-DD) without timezone shifts. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Monday-based ISO week key, e.g. "2026-W34". */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function weekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day + 6) % 7;
  const start = startOfDay(new Date(d));
  start.setDate(d.getDate() - diffToMonday);
  const end = endOfDay(new Date(start));
  end.setDate(start.getDate() + 6);
  return { start, end };
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function yearKey(date: Date): string {
  return `${date.getFullYear()}`;
}

export function periodRange(period: 'today' | 'weekly' | 'monthly' | 'yearly' | 'all'): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'weekly':
      return weekRange(now);
    case 'monthly': {
      const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      const end = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return { start, end };
    }
    case 'yearly': {
      const start = startOfDay(new Date(now.getFullYear(), 0, 1));
      const end = endOfDay(new Date(now.getFullYear(), 11, 31));
      return { start, end };
    }
    default:
      return { start: new Date(0), end: new Date(8640000000000000) };
  }
}

export function groupKeyFor(iso: string, period: 'today' | 'weekly' | 'monthly' | 'yearly' | 'all'): string {
  const d = fromISODate(iso);
  switch (period) {
    case 'today':
      return 'today';
    case 'weekly':
      return isoWeekKey(d);
    case 'monthly':
      return monthKey(d);
    case 'yearly':
      return yearKey(d);
    default:
      return 'all';
  }
}

export function formatGroupLabel(key: string, period: 'today' | 'weekly' | 'monthly' | 'yearly' | 'all'): string {
  if (period === 'today') return 'Today';
  if (period === 'all') return 'All time';
  if (period === 'yearly') return key;
  if (period === 'monthly') {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  // weekly
  const [year, wk] = key.split('-W');
  return `Week ${wk}, ${year}`;
}

export function relativeDayLabel(iso: string): string {
  const today = toISODate(new Date());
  const yest = toISODate(new Date(Date.now() - 86400000));
  if (iso === today) return 'Today';
  if (iso === yest) return 'Yesterday';
  return fromISODate(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
