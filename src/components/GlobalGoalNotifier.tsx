import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { isSameMonth, isSameDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { sendDeviceNotification, requestNotificationPermission } from '../utils/notification';
import { Transaction } from '../types';

export default function GlobalGoalNotifier() {
  const { user, monthlySavingsTargets, monthlyExpenseBudget, dailyIncomeTargets, dailyExpenseLimits } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Request browser notification permission once loaded
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Sync/celebrate on other tabs via localStorage storage event
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.newValue) {
        if (e.key === 'goal_trigger_event') {
          try {
            const { message } = JSON.parse(e.newValue);
            toast.success(message, { duration: 5000 });
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#4ade80', '#3b82f6', '#facc15', '#f43f5e']
            });
          } catch (err) {
            console.error("Storage event error", err);
          }
        } else if (e.key === 'goal_warn_event') {
          try {
            const { message } = JSON.parse(e.newValue);
            toast.error(message, { duration: 5000 });
          } catch (err) {
            console.error("Storage event error", err);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Global transaction snapshot listener
  useEffect(() => {
    if (!user) return;
    const tsxQ = query(collection(db, "users", user.uid, "transactions"), orderBy("date", "desc"));
    const unsub = onSnapshot(tsxQ, (snap) => {
      const tsxs: Transaction[] = [];
      snap.forEach((d) => tsxs.push({ id: d.id, ...d.data() } as unknown as Transaction));
      setTransactions(tsxs);
    });
    return () => unsub();
  }, [user]);

  // Evaluate goals and trigger notifications
  useEffect(() => {
    if (!transactions.length) return;

    const currentMonthStr = new Date().toISOString().slice(0, 7);
    const currentDayStr = new Date().toISOString().slice(0, 10);

    const incomeThisMonth = transactions
      .filter((t) => t.type === "income" && isSameMonth(new Date(t.date), new Date()))
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseThisMonth = transactions
      .reduce((sum, t) => {
        if (isSameMonth(new Date(t.date), new Date())) {
          if (t.type === "expense") return sum + t.amount;
          if (t.adminFee) return sum + t.adminFee;
        }
        return sum;
      }, 0);

    const incomeToday = transactions
      .filter((t) => t.type === "income" && isSameDay(new Date(t.date), new Date()))
      .reduce((sum, t) => sum + t.amount, 0);

    const expenseToday = transactions
      .reduce((sum, t) => {
        if (isSameDay(new Date(t.date), new Date())) {
          if (t.type === "expense") return sum + t.amount;
          if (t.adminFee) return sum + t.adminFee;
        }
        return sum;
      }, 0);

    const savingsThisMonth = incomeThisMonth - expenseThisMonth;

    let celebrated = false;

    // 1. Monthly Savings targets
    if (monthlySavingsTargets && monthlySavingsTargets.length > 0) {
      monthlySavingsTargets.forEach((target, idx) => {
        const key = `celebrated_savings_${currentMonthStr}_layer_${idx}`;
        if (target > 0 && savingsThisMonth >= target && !localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          celebrated = true;

          const title = "Target Tabungan Tercapai! 🎉";
          const message = `Selamat! Target Tabungan Layer ${idx + 1} tercapai! (Rp ${target.toLocaleString('id-ID')})`;

          setTimeout(() => {
            toast.success(message, { duration: 5000 });
            sendDeviceNotification(title, message);

            // Notify other tabs
            localStorage.setItem('goal_trigger_event', JSON.stringify({
              type: 'savings',
              layer: idx + 1,
              title,
              message,
              timestamp: Date.now()
            }));
          }, idx * 500);
        }
      });
    }

    // 2. Daily Income targets
    if (dailyIncomeTargets && dailyIncomeTargets.length > 0) {
      dailyIncomeTargets.forEach((target, idx) => {
        const key = `celebrated_income_${currentDayStr}_layer_${idx}`;
        if (target > 0 && incomeToday >= target && !localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          celebrated = true;

          const title = "Target Penghasilan Harian Tercapai! 🚀";
          const message = `Luar Biasa! Penghasilan Harian Layer ${idx + 1} tercapai! (Rp ${target.toLocaleString('id-ID')})`;

          setTimeout(() => {
            toast.success(message, { duration: 5000 });
            sendDeviceNotification(title, message);

            // Notify other tabs
            localStorage.setItem('goal_trigger_event', JSON.stringify({
              type: 'income',
              layer: idx + 1,
              title,
              message,
              timestamp: Date.now()
            }));
          }, idx * 500 + 200);
        }
      });
    }

    // 3. Daily Expense limits
    if (dailyExpenseLimits && dailyExpenseLimits.length > 0) {
      dailyExpenseLimits.forEach((target, idx) => {
        const key = `warned_expense_${currentDayStr}_layer_${idx}`;
        if (target > 0 && expenseToday > target && !localStorage.getItem(key)) {
          localStorage.setItem(key, "true");

          const title = "Batas Pengeluaran Melebihi Batas! 💸";
          const message = `Perhatian: Pengeluaran melebihi Batas Layer ${idx + 1}! (Batas: Rp ${target.toLocaleString('id-ID')})`;

          setTimeout(() => {
            toast.error(message, { duration: 5000 });
            sendDeviceNotification(title, message);

            // Notify other tabs
            localStorage.setItem('goal_warn_event', JSON.stringify({
              type: 'expense',
              layer: idx + 1,
              title,
              message,
              timestamp: Date.now()
            }));
          }, idx * 500 + 400);
        }
      });
    }

    // 4. Predictive Monthly Budget Check
    if (monthlyExpenseBudget && monthlyExpenseBudget > 0) {
      const currentDay = new Date().getDate();
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      
      if (currentDay >= 1) {
        const dailySpendingRate = expenseThisMonth / currentDay;
        const projectedMonthlyExpense = dailySpendingRate * daysInMonth;
        
        if (projectedMonthlyExpense > monthlyExpenseBudget) {
          const key = `warned_predictive_budget_${currentMonthStr}_${currentDayStr}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "true");
            
            const daysUntilRunOut = Math.max(0, Math.floor(monthlyExpenseBudget / dailySpendingRate) - currentDay);
            const runOutDay = Math.floor(monthlyExpenseBudget / dailySpendingRate);
            
            const title = "Peringatan Anggaran PWA! ⚠️";
            const message = `Rata-rata belanja Rp ${Math.round(dailySpendingRate).toLocaleString('id-ID')}/hari diproyeksikan menghabiskan Rp ${Math.round(projectedMonthlyExpense).toLocaleString('id-ID')} bulan ini, melebihi anggaran Rp ${monthlyExpenseBudget.toLocaleString('id-ID')}. Sisa dana diproyeksikan habis dalam ${daysUntilRunOut} hari (pada tanggal ${runOutDay}).`;
            
            setTimeout(() => {
              toast.error(message, { duration: 10000 });
              sendDeviceNotification(title, message);
              
              // Notify other tabs
              localStorage.setItem('goal_warn_event', JSON.stringify({
                type: 'predictive_budget_alert',
                title,
                message,
                timestamp: Date.now()
              }));
            }, 1000);
          }
        }
      }
    }

    if (celebrated) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#3b82f6', '#facc15', '#f43f5e']
      });
    }

  }, [monthlySavingsTargets, monthlyExpenseBudget, dailyIncomeTargets, dailyExpenseLimits, transactions]);

  return null;
}
