export type TxType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'online';

export type Period = 'today' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  reason: string;
  /** ISO date string, format YYYY-MM-DD (local day). */
  date: string;
  note?: string;
  /** Compressed receipt as base64 data URI (e.g. "data:image/png;base64,..."). */
  receiptData?: string;
  /** Payment method: cash or online. */
  paymentMethod: PaymentMethod;
  createdAt: number;
  updatedAt: number;
}

export interface TransactionInput {
  type: TxType;
  amount: number;
  reason: string;
  date: string;
  note?: string;
  receiptData?: string;
  paymentMethod: PaymentMethod;
}

export interface GroupSummary {
  key: string;
  label: string;
  items: Transaction[];
  income: number;
  expense: number;
  net: number;
}

export interface ReportTotals {
  income: number;
  expense: number;
  net: number;
  count: number;
  incomeCash: number;
  incomeOnline: number;
  expenseCash: number;
  expenseOnline: number;
}
