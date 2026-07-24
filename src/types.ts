export interface Account {
  id: string;
  name: string;
  balance: number;
  icon?: string;
  createdAt: number;
  isPrimary?: boolean;
  excludeFromTotal?: boolean;
  interestEnabled?: boolean;
  interestRate?: number; // Annual rate in percentage (e.g. 2.5)
  interestMethod?: 'daily_compound' | 'monthly' | 'yearly';
  lastInterestCalculationDate?: number; // Timestamp of last calculated date
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  createdAt: number;
}

export interface AttendanceRecord {
  id: string;
  date: number;
  status: 'present' | 'absent' | 'leave' | 'sick';
  notes?: string;
  checkIn?: number;
  checkOut?: number;
  checkInLocation?: { lat: number; lng: number };
  checkOutLocation?: { lat: number; lng: number };
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Loan {
  id: string;
  name: string;
  amount: number;
  hasInterest: boolean;
  hasTenor?: boolean;
  interestType?: 'percentage' | 'nominal';
  interestValue?: number;
  tenorUnit?: 'hari' | 'minggu' | 'bulan';
  tenorDuration?: number;
  paymentMethod?: 'harian' | 'mingguan' | 'bulanan';
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
  type?: 'borrow' | 'lend';
  dueDate?: number;
  deductFromAccount?: boolean;
}

export interface WorkSchedule {
  days: {
    [key: string]: {
      isActive: boolean;
      start: string; // e.g. "08:00"
      end: string;   // e.g. "17:00"
    }
  };
  overrides?: {
    [dateString: string]: {
      isActive: boolean;
      start: string;
      end: string;
    }
  };
}

export interface Transaction {
  id?: string;
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
  isInterest?: boolean;
}
