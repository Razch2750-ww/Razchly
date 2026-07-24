import { db } from '../lib/firebase';
import { collection, doc, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { Account, Transaction } from '../types';

export function calculateDailyInterest(balance: number, annualRate: number): number {
  if (!balance || balance <= 0 || !annualRate || annualRate <= 0) return 0;
  const rawInterest = (balance * (annualRate / 100)) / 365;
  return Number(rawInterest.toFixed(2));
}

export async function processInterestForAccount(
  userId: string,
  account: Account,
  forceToday: boolean = false
): Promise<{ added: boolean; amount: number; daysProcessed: number }> {
  if (!account.interestEnabled || !account.interestRate || account.interestRate <= 0) {
    return { added: false, amount: 0, daysProcessed: 0 };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const method = account.interestMethod || 'daily_compound';

  let lastCalc = account.lastInterestCalculationDate || (todayStart - 86400000);

  const timeDiff = todayStart - lastCalc;
  const daysDiff = Math.floor(timeDiff / 86400000);

  if (daysDiff < 1 && !forceToday) {
    return { added: false, amount: 0, daysProcessed: 0 };
  }

  const daysToProcess = forceToday && daysDiff < 1 ? 1 : Math.max(1, daysDiff);
  let currentBalance = account.balance;
  let totalInterestAdded = 0;
  let actualDaysProcessed = 0;

  for (let i = 1; i <= daysToProcess; i++) {
    const calcDateTimestamp = lastCalc + i * 86400000;

    let interestAmount = 0;
    if (method === 'daily_compound') {
      interestAmount = calculateDailyInterest(currentBalance, account.interestRate);
    } else if (method === 'monthly') {
      // Monthly method: calculate daily or monthly proportion
      interestAmount = calculateDailyInterest(currentBalance, account.interestRate);
    } else if (method === 'yearly') {
      interestAmount = calculateDailyInterest(currentBalance, account.interestRate);
    }

    if (interestAmount > 0) {
      // 1. Create interest income transaction
      const tsxRef = collection(db, 'users', userId, 'transactions');
      await addDoc(tsxRef, {
        type: 'income',
        amount: interestAmount,
        accountId: account.id,
        note: `Bunga Rekening Auto (${account.name})`,
        categoryName: 'Bunga Rekening',
        categoryIcon: 'trending-up',
        isInterest: true,
        date: forceToday ? Date.now() : calcDateTimestamp,
      });

      // 2. Dynamic balance updates with daily interest
      currentBalance = Number((currentBalance + interestAmount).toFixed(2));
      totalInterestAdded += interestAmount;
      actualDaysProcessed++;
    }
  }

  // Update account doc in Firestore
  const accRef = doc(db, 'users', userId, 'accounts', account.id);
  await updateDoc(accRef, {
    balance: currentBalance,
    lastInterestCalculationDate: todayStart,
  });

  return {
    added: totalInterestAdded > 0,
    amount: Number(totalInterestAdded.toFixed(2)),
    daysProcessed: actualDaysProcessed,
  };
}

export async function processAllAccountsInterest(userId: string): Promise<number> {
  try {
    const accSnap = await getDocs(collection(db, 'users', userId, 'accounts'));
    let totalAdded = 0;

    for (const d of accSnap.docs) {
      const acc = { id: d.id, ...d.data() } as Account;
      if (acc.interestEnabled && acc.interestRate && acc.interestRate > 0) {
        const res = await processInterestForAccount(userId, acc, false);
        if (res.added) {
          totalAdded += res.amount;
        }
      }
    }
    return Number(totalAdded.toFixed(2));
  } catch (err) {
    console.error('Error processing auto interest:', err);
    return 0;
  }
}

export interface InterestMetrics {
  bungaHariIni: number;
  bungaBulanIni: number;
  bungaTahunIni: number;
  totalSaldoSetelahBunga: number;
  estimatedBungaHariIni: number;
  riwayatTransaksiBunga: Transaction[];
}

export function calculateInterestMetrics(
  accounts: Account[],
  transactions: Transaction[],
  selectedAccountId?: string
): InterestMetrics {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  // Filter accounts
  const interestAccounts = accounts.filter(
    (a) => a.interestEnabled && (selectedAccountId ? a.id === selectedAccountId : true)
  );

  const interestAccountIds = new Set(interestAccounts.map((a) => a.id));

  // Filter interest transactions
  const riwayatTransaksiBunga = transactions
    .filter((t) => {
      if (selectedAccountId && t.accountId !== selectedAccountId) return false;
      const isNoteInterest = t.note?.toLowerCase().includes('bunga');
      return Boolean(t.isInterest || isNoteInterest);
    })
    .sort((a, b) => b.date - a.date);

  // Bunga hari ini from recorded transactions
  const recordedToday = riwayatTransaksiBunga
    .filter((t) => t.date >= startOfToday && t.date <= endOfToday)
    .reduce((sum, t) => sum + t.amount, 0);

  // Estimated today's interest if not yet processed today
  const estimatedToday = interestAccounts.reduce((sum, acc) => {
    return sum + calculateDailyInterest(acc.balance, acc.interestRate || 0);
  }, 0);

  const bungaHariIni = recordedToday > 0 ? recordedToday : estimatedToday;

  // Bunga bulan ini
  const bungaBulanIni = riwayatTransaksiBunga
    .filter((t) => t.date >= startOfMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  // Bunga tahun ini
  const bungaTahunIni = riwayatTransaksiBunga
    .filter((t) => t.date >= startOfYear)
    .reduce((sum, t) => sum + t.amount, 0);

  // Total saldo setelah bunga for interest accounts
  const totalSaldoSetelahBunga = (selectedAccountId
    ? accounts.filter((a) => a.id === selectedAccountId)
    : accounts
  ).reduce((sum, acc) => sum + acc.balance, 0);

  return {
    bungaHariIni: Number(bungaHariIni.toFixed(2)),
    bungaBulanIni: Number(bungaBulanIni.toFixed(2)),
    bungaTahunIni: Number(bungaTahunIni.toFixed(2)),
    totalSaldoSetelahBunga: Number(totalSaldoSetelahBunga.toFixed(2)),
    estimatedBungaHariIni: Number(estimatedToday.toFixed(2)),
    riwayatTransaksiBunga,
  };
}
