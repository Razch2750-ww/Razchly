export interface Account {
  id: string;
  name: string;
  balance: number;
  icon?: string;
  createdAt: number;
  isPrimary?: boolean;
  excludeFromTotal?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  createdAt: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Loan {
  id: string;
  name: string;
  amount: number;
  hasInterest: boolean;
  interestType?: 'percentage' | 'nominal';
  interestValue?: number;
  tenorUnit: 'hari' | 'minggu' | 'bulan';
  tenorDuration: number;
  paymentMethod: 'harian' | 'mingguan' | 'bulanan';
  paymentDay?: string; // e.g. "Senin", "Selasa"
  paymentDate?: number; // 1-31
  depositToAccount: boolean;
  accountId?: string;
  autoDebit: boolean;
  autoDebitAccountId?: string;
  createdAt: number;
  status: 'active' | 'paid';
  paidAmount?: number;
  paidPaymentsCount?: number;
}

export interface Transaction {
  type: TransactionType;
  amount: number;
  accountId?: string; // For income/expense
  fromAccountId?: string; // For transfer
  toAccountId?: string; // For transfer
  adminFee?: number; // Optional admin fee
  adminFeeChargeTo?: 'origin' | 'destination'; // Which account bears the admin fee
  date: number; // timestamp
  note: string;
  categoryId?: string;
  categoryName?: string;
  categoryIcon?: string;
}
