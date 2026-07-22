import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useStore } from './store/useStore';
import ThemeApplicator from './components/ThemeApplicator';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import GlobalGoalNotifier from './components/GlobalGoalNotifier';

import Login from './components/Login';
import Transactions from './components/Transactions';
import Dashboard from './components/Dashboard';
import Investments from './components/Investments';
import Loans from './components/Loans';
import Attendance from './components/Attendance';
import Settings from './components/Settings';
import GrabDetails from './components/GrabDetails';
import SavingsTarget from './components/SavingsTarget';
import ImageAnalysis from './components/ImageAnalysis';
import AiTrading from './components/AiTrading';

const LoadingFallback = () => (
  <div className="flex flex-col w-full h-full p-4 md:p-8 animate-pulse">
    <div className="w-full flex items-center justify-between mb-8">
      <div className="w-32 h-8 bg-app-card rounded-lg" />
      <div className="w-10 h-10 bg-app-card rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="col-span-1 h-32 bg-app-card rounded-[18px]" />
      <div className="col-span-1 h-32 bg-app-card rounded-[18px]" />
      <div className="col-span-1 h-32 bg-app-card rounded-[18px]" />
    </div>
    <div className="w-full h-64 bg-app-card rounded-[18px]" />
  </div>
);

export default function App() {
  const { user, authChecked, setUser, setAuthChecked, setThemeId, setLanguage, setGrabAccounts, setMonthlySavingsTargets, setMonthlyExpenseBudget, setDailyIncomeTargets, setDailyExpenseLimits, setHiddenTabs, setWorkSchedule, setAttendancePeriodStart, setAttendancePeriodEnd, setSalarySettings } = useStore();

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
            if (data.hiddenTabs) {
                setHiddenTabs(data.hiddenTabs);
            } else {
                setHiddenTabs([]);
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
                  
                  if (d.hiddenTabs !== undefined) {
                      setHiddenTabs(d.hiddenTabs);
                  } else {
                      setHiddenTabs([]);
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
  }, [setUser, setAuthChecked, setThemeId, setLanguage, setGrabAccounts, setMonthlySavingsTargets, setMonthlyExpenseBudget, setDailyIncomeTargets, setDailyExpenseLimits, setHiddenTabs, setSalarySettings]);

  if (!authChecked) {
    return (
      <div className="flex h-screen w-full bg-app-bg text-app-text overflow-hidden select-none font-sans">
        {/* Sidebar Skeleton (Default collapsed style: w-[72px] on desktop, hidden on mobile) */}
        <aside className="hidden md:flex flex-col w-[72px] border-r border-app-border bg-app-bg h-full shrink-0">
          <div className="h-16 flex items-center justify-center border-b border-app-border px-3">
            <div className="w-8 h-8 rounded-xl bg-app-card relative overflow-hidden border border-app-border">
              <div className="absolute inset-0 shimmer-bg" />
            </div>
          </div>
          <div className="flex-1 px-3 py-4 flex flex-col gap-3 items-center mt-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-lg bg-app-card relative overflow-hidden border border-app-border">
                <div className="absolute inset-0 shimmer-bg" />
              </div>
            ))}
          </div>
        </aside>

        {/* Content Area Skeleton */}
        <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-6 w-full shrink-0">
            <div className="flex flex-col gap-2">
              <div className="w-40 h-6 bg-app-card rounded-lg relative overflow-hidden border border-app-border">
                <div className="absolute inset-0 shimmer-bg" />
              </div>
              <div className="w-24 h-3 bg-app-card rounded-md relative overflow-hidden border border-app-border">
                <div className="absolute inset-0 shimmer-bg" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-app-card relative overflow-hidden border border-app-border">
                <div className="absolute inset-0 shimmer-bg" />
              </div>
              <div className="w-9 h-9 rounded-full bg-app-card relative overflow-hidden border border-app-border">
                <div className="absolute inset-0 shimmer-bg" />
              </div>
            </div>
          </div>

          {/* Desktop/Mobile Bento Top Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shrink-0 w-full">
            {/* Hero Card Skeleton (spans 2) */}
            <div className="col-span-1 md:col-span-2 h-[160px] bg-app-card rounded-[18px] border border-app-border relative overflow-hidden p-6 flex flex-col justify-between">
              <div className="absolute inset-0 shimmer-bg" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-app-bg" />
                <div className="w-24 h-4 bg-app-bg rounded" />
              </div>
              <div className="w-48 h-8 bg-app-bg rounded-lg mt-4" />
            </div>

            {/* Side 2x2 grid / Mobile widgets (spans 1) */}
            <div className="grid grid-cols-2 gap-4 h-[160px]">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-app-card rounded-[18px] border border-app-border relative overflow-hidden p-4 flex flex-col justify-between">
                  <div className="absolute inset-0 shimmer-bg" />
                  <div className="w-12 h-3 bg-app-bg rounded" />
                  <div className="w-20 h-5 bg-app-bg rounded mt-2" />
                </div>
              ))}
            </div>
          </div>

          {/* Middle Section: Dompet Saya (1/3) & Alur Kas Chart (2/3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 w-full">
            {/* Dompet Saya Skeleton */}
            <div className="md:col-span-1 h-[340px] bg-app-card rounded-[18px] border border-app-border relative overflow-hidden p-6 flex flex-col gap-4">
              <div className="absolute inset-0 shimmer-bg" />
              <div className="w-28 h-5 bg-app-bg rounded mb-2" />
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 w-full h-14 bg-app-bg/50 rounded-2xl p-3">
                  <div className="w-8 h-8 rounded-full bg-app-card shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="w-20 h-3 bg-app-card rounded" />
                    <div className="w-14 h-2.5 bg-app-card rounded" />
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Skeleton */}
            <div className="md:col-span-2 h-[340px] bg-app-card rounded-[18px] border border-app-border relative overflow-hidden p-6 flex flex-col justify-between">
              <div className="absolute inset-0 shimmer-bg" />
              <div className="flex justify-between items-center">
                <div className="w-24 h-5 bg-app-bg rounded" />
                <div className="w-32 h-6 bg-app-bg rounded-lg" />
              </div>
              <div className="flex-1 w-full border-b border-app-border my-6 relative flex items-end gap-3 justify-around px-4">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-8 bg-app-bg/30 rounded-t-md" 
                    style={{ height: `${20 + i * 12}%` }}
                  />
                ))}
              </div>
              <div className="w-full flex justify-between">
                <div className="w-16 h-3 bg-app-bg rounded" />
                <div className="w-24 h-4 bg-app-bg rounded" />
              </div>
            </div>
          </div>

          {/* Bottom Section: Transaksi Terakhir Skeleton */}
          <div className="h-[280px] bg-app-card rounded-[18px] border border-app-border relative overflow-hidden p-6 flex flex-col gap-4 w-full">
            <div className="absolute inset-0 shimmer-bg" />
            <div className="w-36 h-5 bg-app-bg rounded mb-2" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between w-full h-12 border-b border-app-border pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-app-bg" />
                  <div className="flex flex-col gap-1.5">
                    <div className="w-24 h-3 bg-app-bg rounded" />
                    <div className="w-16 h-2 bg-app-bg rounded" />
                  </div>
                </div>
                <div className="w-20 h-4 bg-app-bg rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
