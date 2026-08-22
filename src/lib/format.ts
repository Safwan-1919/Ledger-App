import { useSettingsStore } from '@/store/useSettingsStore';

export function formatCurrency(amount: number, currency?: string): string {
  const code = currency ?? useSettingsStore.getState().currency;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(amount);
}

export function formatAmount(amount: number, currency?: string): string {
  const sign = amount < 0 ? '-' : '';
  return sign + formatCurrency(Math.abs(amount), currency);
}
