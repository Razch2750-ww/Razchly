import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useStore } from './store/useStore';
import ThemeApplicator from './components/ThemeApplicator';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import GlobalGoalNotifier from './components/GlobalGoalNotifier';

// Lazy loaded components for code splitting
const Login = lazy(() => import('./components/Login'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Transactions = lazy(() => import('./components/Transactions'));
const Investments = lazy(() => import('./components/Investments'));
const Loans = lazy(() => import('./components/Loans'));
const Attendance = lazy(() => import('./components/Attendance'));
const Settings = lazy(() => import('./components/Settings'));
const GrabDetails = lazy(() => import('./components/GrabDetails'));
const SavingsTarget = lazy(() => import('./components/SavingsTarget'));
const ImageAnalysis = lazy(() => import('./components/ImageAnalysis'));
const AiTrading = lazy(() => import('./components/AiTrading'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
    <div className="w-8 h-8 rounded-full border-2 border-app-text/20 border-t-app-accent1 animate-spin" />
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
      <div className="flex flex-col h-screen w-full bg-app-bg text-app-text p-6 md:p-12 overflow-hidden select-none">
        {/* Skeleton Header */}
        <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-app-card relative overflow-hidden border border-app-border/40">
              <div className="absolute inset-0 shimmer-bg" />
            </div>
            <div className="w-36 h-6 bg-app-card rounded-md relative overflow-hidden border border-app-border/40">
              <div className="absolute inset-0 shimmer-bg" />
            </div>
          </div>
          <div className="w-28 h-10 bg-app-card rounded-full relative overflow-hidden border border-app-border/40">
            <div className="absolute inset-0 shimmer-bg" />
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 max-w-7xl mx-auto w-full">
          <div className="md:col-span-2 flex flex-col gap-6 h-full">
            <div className="h-44 bg-app-card rounded-[1.5rem] border border-app-border/40 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 shimmer-bg" />
            </div>
            <div className="flex-1 bg-app-card rounded-[1.5rem] border border-app-border/40 relative overflow-hidden">
              <div className="absolute inset-0 shimmer-bg" />
            </div>
          </div>
          <div className="flex flex-col gap-6 h-full">
            <div className="h-60 bg-app-card rounded-[1.5rem] border border-app-border/40 relative overflow-hidden shrink-0">
              <div className="absolute inset-0 shimmer-bg" />
            </div>
            <div className="flex-1 bg-app-card rounded-[1.5rem] border border-app-border/40 relative overflow-hidden">
              <div className="absolute inset-0 shimmer-bg" />
            </div>
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
      <Suspense fallback={<LoadingFallback />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
