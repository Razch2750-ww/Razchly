import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useStore } from './store/useStore';
import ThemeApplicator from './components/ThemeApplicator';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Investments from './components/Investments';
import Loans from './components/Loans';
import Attendance from './components/Attendance';
import Settings from './components/Settings';
import GrabDetails from './components/GrabDetails';
import SavingsTarget from './components/SavingsTarget';
import ImageAnalysis from './components/ImageAnalysis';
import GlobalGoalNotifier from './components/GlobalGoalNotifier';
import AiTrading from './components/AiTrading';

export default function App() {
  const { user, authChecked, setUser, setAuthChecked, setThemeId, setLanguage, setGrabAccounts, setMonthlySavingsTargets, setMonthlyExpenseBudget, setDailyIncomeTargets, setDailyExpenseLimits, setWorkSchedule, setAttendancePeriodStart, setAttendancePeriodEnd, setSalarySettings } = useStore();

  useEffect(() => {
    let unsubscribeSettings: (() => void) | undefined;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.theme) setThemeId(data.theme);
            if (data.language) setLanguage(data.language);
            if (data.workSchedule) setWorkSchedule(data.workSchedule);
            if (data.attendancePeriodStart) setAttendancePeriodStart(data.attendancePeriodStart);
            if (data.attendancePeriodEnd) setAttendancePeriodEnd(data.attendancePeriodEnd);
            if (data.salarySettings) setSalarySettings(data.salarySettings);
            if (data.grabCashAccount) setGrabAccounts(data.grabCashAccount, data.grabDompetAccount || '', data.grabHematAccount || '');
            if (data.monthlySavingsTargets) {
                setMonthlySavingsTargets(data.monthlySavingsTargets);
            } else if (data.monthlySavingsTarget !== undefined) {
                setMonthlySavingsTargets([data.monthlySavingsTarget]);
            } else {
                setMonthlySavingsTargets([]);
            }
            if (data.monthlyExpenseBudget !== undefined) {
                setMonthlyExpenseBudget(data.monthlyExpenseBudget);
            } else {
                setMonthlyExpenseBudget(0);
            }
            if (data.dailyIncomeTargets) {
                setDailyIncomeTargets(data.dailyIncomeTargets);
            } else if (data.dailyIncomeTarget !== undefined) {
                setDailyIncomeTargets([data.dailyIncomeTarget]);
            } else {
                setDailyIncomeTargets([]);
            }
            if (data.dailyExpenseLimits) {
                setDailyExpenseLimits(data.dailyExpenseLimits);
            } else if (data.dailyExpenseLimit !== undefined) {
                setDailyExpenseLimits([data.dailyExpenseLimit]);
            } else {
                setDailyExpenseLimits([]);
            }
            
            // Auto Hemat Calculation
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayTime = today.getTime();
            const lastCalc = data.lastHematCalculationDate || 0;
            
            if (data.grabHematAccount && lastCalc < todayTime) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStart = new Date(yesterday.setHours(0, 0, 0, 0)).getTime();
                const yesterdayEnd = new Date(yesterday.setHours(23, 59, 59, 999)).getTime();
        
                const q = query(
                    collection(db, 'users', currentUser.uid, 'transactions'),
                    where('date', '>=', yesterdayStart),
                    where('date', '<=', yesterdayEnd)
                );
                
                const snap = await getDocs(q);
                let hematOrderCount = 0;
                snap.forEach(d => {
                  if (d.data().note?.toLowerCase().includes('hemat')) hematOrderCount++;
                });

                let deduction = 0;
                if (hematOrderCount >= 10) deduction = 20000;
                else if (hematOrderCount >= 7) deduction = 18000;
                else if (hematOrderCount >= 5) deduction = 13500;
                else if (hematOrderCount >= 3) deduction = 8500;
                else if (hematOrderCount >= 1) deduction = 3000;

                const batch = writeBatch(db);
                if (hematOrderCount > 0) {
                    const tsxRef = doc(collection(db, 'users', currentUser.uid, 'transactions'));
                    batch.set(tsxRef, {
                        type: 'expense',
                        amount: deduction,
                        date: Date.now(),
                        accountId: data.grabHematAccount,
                        note: `Akses Hemat (${hematOrderCount} order kemarin)`
                    });
                    
                    const accRef = doc(db, 'users', currentUser.uid, 'accounts', data.grabHematAccount);
                    const accDoc = await getDoc(accRef);
                    if (accDoc.exists()) {
                        const currentBal = accDoc.data().balance || 0;
                        batch.update(accRef, { balance: currentBal - deduction });
                    }
                }
                
                batch.update(userDocRef, { lastHematCalculationDate: todayTime });
                await batch.commit();
            }

          } else {
            // init user settings
            await setDoc(userDocRef, {
              theme: 'dracula-soft',
              language: 'id'
            });
          }
          
          unsubscribeSettings = onSnapshot(userDocRef, (docSnap) => {
              if (docSnap.exists()) {
                  const d = docSnap.data();
                  setThemeId(d.theme || 'slate-stone');
                  setLanguage(d.language || 'id');
                  setGrabAccounts(d.grabCashAccount || '', d.grabDompetAccount || '', d.grabHematAccount || '');
                  
                  if (d.monthlySavingsTargets !== undefined) {
                      setMonthlySavingsTargets(d.monthlySavingsTargets);
                  } else if (d.monthlySavingsTarget !== undefined) {
                      setMonthlySavingsTargets([d.monthlySavingsTarget]);
                  }
                  
                  if (d.monthlyExpenseBudget !== undefined) {
                      setMonthlyExpenseBudget(d.monthlyExpenseBudget);
                  } else {
                      setMonthlyExpenseBudget(0);
                  }
                  
                  if (d.dailyIncomeTargets !== undefined) {
                      setDailyIncomeTargets(d.dailyIncomeTargets);
                  } else if (d.dailyIncomeTarget !== undefined) {
                      setDailyIncomeTargets([d.dailyIncomeTarget]);
                  }

                  if (d.dailyExpenseLimits !== undefined) {
                      setDailyExpenseLimits(d.dailyExpenseLimits);
                  } else if (d.dailyExpenseLimit !== undefined) {
                      setDailyExpenseLimits([d.dailyExpenseLimit]);
                  }
                  
                  if (d.workSchedule) setWorkSchedule(d.workSchedule);
                  if (d.attendancePeriodStart) setAttendancePeriodStart(d.attendancePeriodStart);
                  if (d.attendancePeriodEnd) setAttendancePeriodEnd(d.attendancePeriodEnd);
                  if (d.salarySettings) setSalarySettings(d.salarySettings);
              }
          });
        } catch (error) {
          console.error("Error fetching user settings:", error);
        }
      } else {
          if (unsubscribeSettings) unsubscribeSettings();
      }
      setAuthChecked(true);
    });
    return () => {
        unsubscribe();
        if (unsubscribeSettings) unsubscribeSettings();
    };
  }, [setUser, setAuthChecked, setThemeId, setLanguage, setGrabAccounts, setMonthlySavingsTargets, setMonthlyExpenseBudget, setDailyIncomeTargets, setDailyExpenseLimits, setSalarySettings]);

  if (!authChecked) {
    return <div className="flex h-screen w-full items-center justify-center bg-app-bg text-app-accent1">Memuat...</div>;
  }

  return (
    <BrowserRouter>
      <ThemeApplicator />
      <GlobalGoalNotifier />
      <Toaster position="top-center" toastOptions={{
        style: {
          background: 'var(--color-app-card)',
          color: 'var(--color-app-text-bright)',
          border: '1px solid var(--color-app-border)',
        },
      }} />
      <Routes>
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="investments" element={<Investments />} />
            <Route path="ai-trading" element={<AiTrading />} />
            <Route path="loans" element={<Loans />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="grab" element={<GrabDetails />} />
            <Route path="savings" element={<SavingsTarget />} />
            <Route path="analyze" element={<ImageAnalysis />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
