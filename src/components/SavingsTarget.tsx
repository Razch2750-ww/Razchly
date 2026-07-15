import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Target, ArrowUp, ArrowDown, Plus, Car, AlertTriangle, Sparkles, TrendingDown } from 'lucide-react';

import { formatNumberInput, parseNumberInput } from '../utils/numberFormat';
import { Transaction } from '../types';
import { isSameMonth, isSameDay } from 'date-fns';
import confetti from 'canvas-confetti';
import { HoverCard, ScrollReveal, StaggerContainer, StaggerItem, TextReveal } from "./MotionWrappers";

export default function SavingsTarget() {
  const { user, monthlySavingsTargets, setMonthlySavingsTargets, monthlyExpenseBudget, setMonthlyExpenseBudget, dailyIncomeTargets, setDailyIncomeTargets, dailyExpenseLimits, setDailyExpenseLimits, setGlobalAddModalOpen, setGlobalGrabModalOpen } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targetInputs, setTargetInputs] = useState<string[]>(monthlySavingsTargets && monthlySavingsTargets.length > 0 ? monthlySavingsTargets.map(t => formatNumberInput(t.toString())) : ['']);
  const [incomeTargetInputs, setIncomeTargetInputs] = useState<string[]>(dailyIncomeTargets && dailyIncomeTargets.length > 0 ? dailyIncomeTargets.map(t => formatNumberInput(t.toString())) : ['']);
  const [expenseLimitInputs, setExpenseLimitInputs] = useState<string[]>(dailyExpenseLimits && dailyExpenseLimits.length > 0 ? dailyExpenseLimits.map(t => formatNumberInput(t.toString())) : ['']);
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState<string>(monthlyExpenseBudget ? formatNumberInput(monthlyExpenseBudget.toString()) : '');


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

  useEffect(() => {
    setTargetInputs(monthlySavingsTargets && monthlySavingsTargets.length > 0 ? monthlySavingsTargets.map(t => formatNumberInput(t.toString())) : ['']);
    setIncomeTargetInputs(dailyIncomeTargets && dailyIncomeTargets.length > 0 ? dailyIncomeTargets.map(t => formatNumberInput(t.toString())) : ['']);
    setExpenseLimitInputs(dailyExpenseLimits && dailyExpenseLimits.length > 0 ? dailyExpenseLimits.map(t => formatNumberInput(t.toString())) : ['']);
    setMonthlyBudgetInput(monthlyExpenseBudget ? formatNumberInput(monthlyExpenseBudget.toString()) : '');
  }, [monthlySavingsTargets, dailyIncomeTargets, dailyExpenseLimits, monthlyExpenseBudget]);

  const handleTabunganChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
        try {
            const parsedTargets = targetInputs.map(t => parseNumberInput(t)).filter(t => t > 0);
            const parsedIncomeTargets = incomeTargetInputs.map(t => parseNumberInput(t)).filter(t => t > 0);
            const parsedExpenseLimits = expenseLimitInputs.map(t => parseNumberInput(t)).filter(t => t > 0);
            const parsedMonthlyBudget = parseNumberInput(monthlyBudgetInput);
            
            // Cleanup single target field format from legacy if saving array
            await updateDoc(doc(db, 'users', user.uid), { 
                monthlySavingsTargets: parsedTargets.length > 0 ? parsedTargets : [],
                dailyIncomeTargets: parsedIncomeTargets.length > 0 ? parsedIncomeTargets : [],
                dailyExpenseLimits: parsedExpenseLimits.length > 0 ? parsedExpenseLimits : [],
                monthlyExpenseBudget: parsedMonthlyBudget > 0 ? parsedMonthlyBudget : 0
            });
            setMonthlySavingsTargets(parsedTargets);
            setDailyIncomeTargets(parsedIncomeTargets);
            setDailyExpenseLimits(parsedExpenseLimits);
            setMonthlyExpenseBudget(parsedMonthlyBudget > 0 ? parsedMonthlyBudget : 0);
            toast.success("Target berhasil diperbarui!");
        } catch (e) {
            console.error("Error updating tabungan target", e);
            toast.error("Gagal memperbarui target");
        }
    }
  };

  const incomeThisMonth = useMemo(() => transactions
    .filter((t) => t.type === "income" && isSameMonth(new Date(t.date), new Date()))
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    
  const expenseThisMonth = useMemo(() => transactions
    .reduce((sum, t) => {
      if (isSameMonth(new Date(t.date), new Date())) {
        if (t.type === "expense") return sum + t.amount;
        if (t.adminFee) return sum + t.adminFee;
      }
      return sum;
    }, 0), [transactions]);
    
  const incomeToday = useMemo(() => transactions
    .filter((t) => t.type === "income" && isSameDay(new Date(t.date), new Date()))
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    
  const expenseToday = useMemo(() => transactions
    .reduce((sum, t) => {
      if (isSameDay(new Date(t.date), new Date())) {
        if (t.type === "expense") return sum + t.amount;
        if (t.adminFee) return sum + t.adminFee;
      }
      return sum;
    }, 0), [transactions]);
    
  const savingsThisMonth = incomeThisMonth - expenseThisMonth;

  const currentDay = useMemo(() => {
    return new Date().getDate();
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  }, []);

  const dailySpendingRate = useMemo(() => {
    return currentDay >= 1 ? expenseThisMonth / currentDay : 0;
  }, [expenseThisMonth, currentDay]);

  const projectedMonthlyExpense = useMemo(() => {
    return dailySpendingRate * daysInMonth;
  }, [dailySpendingRate, daysInMonth]);

  const isOverBudget = useMemo(() => {
    return monthlyExpenseBudget > 0 && projectedMonthlyExpense > monthlyExpenseBudget;
  }, [projectedMonthlyExpense, monthlyExpenseBudget]);

  const daysUntilRunOut = useMemo(() => {
    if (dailySpendingRate <= 0) return daysInMonth;
    const runOutDay = Math.floor(monthlyExpenseBudget / dailySpendingRate);
    return Math.max(0, runOutDay - currentDay);
  }, [dailySpendingRate, monthlyExpenseBudget, currentDay, daysInMonth]);

  const runOutDayCalculated = useMemo(() => {
    if (dailySpendingRate <= 0) return daysInMonth;
    return Math.floor(monthlyExpenseBudget / dailySpendingRate);
  }, [dailySpendingRate, monthlyExpenseBudget, daysInMonth]);

  const runOutDateStr = useMemo(() => {
    if (dailySpendingRate <= 0) return "";
    const runOutDay = Math.floor(monthlyExpenseBudget / dailySpendingRate);
    if (runOutDay <= 0 || runOutDay > 100) return "";
    return `tanggal ${runOutDay}`;
  }, [dailySpendingRate, monthlyExpenseBudget]);

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1 tracking-tight">
            <TextReveal text="Target Tabungan" />
          </h1>
          <p className="text-app-text/70 text-sm">Kelola dan pantau target keuangan berlapis Anda.</p>
        </div>
        
        <div className="flex items-center gap-4 hidden md:flex">
          <button onClick={() => setGlobalGrabModalOpen(true)} className="w-10 h-10 rounded-full bg-app-success hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm" title="Transaksi Grab">
            <Car className="w-5 h-5" />
          </button>
          <button onClick={() => setGlobalAddModalOpen(true)} className="w-10 h-10 rounded-full bg-app-accent1 hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm" title="Tambah Transaksi">
            <Plus className="w-5 h-5" />
          </button>
          <Link to="/settings" className="px-4 h-10 rounded-full bg-app-card flex items-center justify-center text-sm font-semibold text-app-text-bright border border-app-border gap-2 hover:bg-app-hover cursor-pointer transition-colors">
            <span className="opacity-800">{user?.displayName?.toUpperCase() || "USER"}</span>
            <div className="w-6 h-6 rounded-full bg-app-accent1 text-xs font-bold flex items-center justify-center text-app-bg overflow-hidden flex-shrink-0">
               {user?.photoURL ? (
                 <img src={user?.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 user?.displayName?.substring(0, 2).toUpperCase() || "US"
               )}
            </div>
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ScrollReveal className="lg:col-span-2">
          <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden h-full">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <h2 className="text-app-text-bright font-bold mb-6 flex items-center gap-2 relative z-10">
            <Target className="w-5 h-5 text-app-accent1" /> Atur Target Finansial
          </h2>
          <form onSubmit={handleTabunganChange} className="relative z-10 flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-app-text/70 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-app-success"/> Penghasilan Harian (Berlapis)</label>
                    <button type="button" onClick={() => setIncomeTargetInputs([...incomeTargetInputs, ''])} className="text-[10px] uppercase font-bold text-app-success hover:underline bg-app-success/10 px-2 py-1 rounded">
                        + Tambah Layer
                    </button>
                </div>
                <div className="flex flex-col gap-3 border border-app-border rounded-xl p-4 bg-app-bg/50">
                    {incomeTargetInputs.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="bg-app-success/20 text-app-success px-3 py-1 rounded-lg font-bold text-sm">L{idx + 1}</div>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const newInputs = [...incomeTargetInputs];
                            newInputs[idx] = e.target.value;
                            setIncomeTargetInputs(newInputs);
                          }}
                          className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 focus:border-app-success outline-none text-app-text-bright text-lg font-medium"
                          placeholder="Rp 0"
                        />
                        {incomeTargetInputs.length > 1 && (
                          <button type="button" onClick={() => setIncomeTargetInputs(incomeTargetInputs.filter((_, i) => i !== idx))} className="w-10 h-10 flex items-center justify-center text-app-danger bg-app-danger/10 hover:bg-app-danger/20 rounded-xl transition-colors shrink-0">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-app-text/70 flex items-center gap-1"><ArrowDown className="w-3 h-3 text-app-danger"/> Pengeluaran Harian (Berlapis)</label>
                    <button type="button" onClick={() => setExpenseLimitInputs([...expenseLimitInputs, ''])} className="text-[10px] uppercase font-bold text-app-danger hover:underline bg-app-danger/10 px-2 py-1 rounded">
                        + Tambah Layer
                    </button>
                </div>
                <div className="flex flex-col gap-3 border border-app-border rounded-xl p-4 bg-app-bg/50">
                    {expenseLimitInputs.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="bg-app-danger/20 text-app-danger px-3 py-1 rounded-lg font-bold text-sm">L{idx + 1}</div>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const newInputs = [...expenseLimitInputs];
                            newInputs[idx] = e.target.value;
                            setExpenseLimitInputs(newInputs);
                          }}
                          className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 focus:border-app-danger outline-none text-app-text-bright text-lg font-medium"
                          placeholder="Rp 0"
                        />
                        {expenseLimitInputs.length > 1 && (
                          <button type="button" onClick={() => setExpenseLimitInputs(expenseLimitInputs.filter((_, i) => i !== idx))} className="w-10 h-10 flex items-center justify-center text-app-danger bg-app-danger/10 hover:bg-app-danger/20 rounded-xl transition-colors shrink-0">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tabungan Bulanan (Berlapis) */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-app-text/70 flex items-center gap-1"><Star className="w-3 h-3 text-app-accent1"/> Tabungan Bulanan (Berlapis)</label>
                    <button type="button" onClick={() => setTargetInputs([...targetInputs, ''])} className="text-[10px] uppercase font-bold text-app-accent1 hover:underline bg-app-accent1/10 px-2 py-1 rounded">
                        + Tambah Layer Target
                    </button>
                </div>
                <div className="flex flex-col gap-3 border border-app-border rounded-xl p-4 bg-app-bg/50">
                    {targetInputs.map((val, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="bg-app-accent1/20 text-app-accent1 px-3 py-1 rounded-lg font-bold text-sm">L{idx + 1}</div>
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => {
                            const newInputs = [...targetInputs];
                            newInputs[idx] = e.target.value;
                            setTargetInputs(newInputs);
                          }}
                          className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 focus:border-app-accent1 outline-none text-app-text-bright text-lg font-medium"
                          placeholder="Rp 0"
                        />
                        {targetInputs.length > 1 && (
                          <button type="button" onClick={() => setTargetInputs(targetInputs.filter((_, i) => i !== idx))} className="w-10 h-10 flex items-center justify-center text-app-danger bg-app-danger/10 hover:bg-app-danger/20 rounded-xl transition-colors shrink-0">
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Anggaran Pengeluaran Bulanan */}
              <div className="w-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-app-text/70 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-app-danger"/> Anggaran Pengeluaran Bulanan (PWA Prediktif)
                      </label>
                  </div>
                  <div className="border border-app-border rounded-xl p-4 bg-app-bg/50">
                    <div className="flex items-center gap-3">
                      <div className="bg-app-danger/20 text-app-danger px-3 py-3 rounded-lg font-bold text-sm">TOTAL</div>
                      <input
                        type="text"
                        value={monthlyBudgetInput}
                        onChange={(e) => setMonthlyBudgetInput(e.target.value)}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 focus:border-app-danger outline-none text-app-text-bright text-lg font-medium"
                        placeholder="Rp 0"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-app-text/60 mt-3 leading-relaxed">
                    Tentukan anggaran belanja bulanan Anda. Sistem PWA akan memproyeksikan pengeluaran harian dan mengirimkan notifikasi perangkat jika run-rate harian terdeteksi berisiko melebihi batas sebelum bulan berakhir.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-2">
              <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-app-accent1 text-app-bg font-bold rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
                Simpan Target
              </button>
            </div>
          </form>
          <p className="text-xs text-app-text/50 mt-4 relative z-10">
            Target ini digunakan untuk mengukur kinerja laporan keuangan Anda.
          </p>
        </div>
        </ScrollReveal>

        <StaggerContainer className="lg:col-span-1 flex flex-col gap-6">
          {/* Laba Bersih Card */}
          <StaggerItem className="flex-1">
            <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col justify-center relative overflow-hidden h-full min-h-[140px]">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-success/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="w-16 h-16 text-app-success" />
            </div>
            <p className="text-app-text/70 text-xs font-medium uppercase tracking-wider mb-2 relative z-10">Laba Bersih Bulan Ini</p>
            <h3 className="text-3xl font-bold text-app-text-bright relative z-10">Rp {Math.max(savingsThisMonth, 0).toLocaleString("id-ID")}</h3>
            <p className="text-xs text-app-text/50 mt-2 relative z-10">Masuk akal untuk ditabung</p>
            </div>
          </StaggerItem>

          {/* Predictive analysis card */}
          <StaggerItem className="flex-1">
            <div className={`rounded-3xl p-6 border shadow-sm flex flex-col relative overflow-hidden h-full ${monthlyExpenseBudget > 0 ? (isOverBudget ? 'border-app-danger/30 bg-app-danger/5' : 'border-app-success/30 bg-app-success/5') : 'border-app-border bg-app-card/40'}`}>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-transparent pointer-events-none opacity-80 block" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                {monthlyExpenseBudget > 0 ? (
                  isOverBudget ? (
                    <AlertTriangle className="w-5 h-5 text-app-danger shrink-0 animate-pulse" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-app-success shrink-0" />
                  )
                ) : (
                  <TrendingDown className="w-5 h-5 text-app-text/40 shrink-0" />
                )}
                <h4 className="text-app-text-bright font-bold text-sm">
                  {monthlyExpenseBudget > 0 ? (
                    isOverBudget ? "Prediksi: Peringatan Anggaran! ⚠️" : "Prediksi: Anggaran Aman! ✨"
                  ) : (
                    "Prediksi Pengeluaran PWA"
                  )}
                </h4>
              </div>

              {monthlyExpenseBudget > 0 ? (
                <>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-app-text/50">Anggaran</p>
                        <p className="font-bold text-app-text-bright">Rp {monthlyExpenseBudget.toLocaleString('id-ID')}</p>
                      </div>
                      <div>
                        <p className="text-app-text/50">Proyeksi Bulan Ini</p>
                        <p className={`font-bold ${isOverBudget ? 'text-app-danger' : 'text-app-success'}`}>
                          Rp {Math.round(projectedMonthlyExpense).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-app-bg rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${isOverBudget ? 'bg-app-danger animate-pulse' : 'bg-app-success'}`}
                        style={{ width: `${Math.min(100, (projectedMonthlyExpense / monthlyExpenseBudget) * 100)}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-app-text/80 leading-relaxed">
                      {isOverBudget ? (
                        <>
                          Pengeluaran harian Anda rata-rata <span className="font-bold text-app-danger">Rp {Math.round(dailySpendingRate).toLocaleString('id-ID')}</span>. Anda diproyeksikan melebihi anggaran sebesar <span className="font-bold text-app-danger">Rp {Math.round(projectedMonthlyExpense - monthlyExpenseBudget).toLocaleString('id-ID')}</span> dan kehabisan anggaran dalam <span className="font-bold text-app-danger">{daysUntilRunOut} hari</span> ({runOutDateStr || 'akhir bulan'}).
                        </>
                      ) : (
                        <>
                          Pengeluaran harian rata-rata Anda <span className="font-bold text-app-success">Rp {Math.round(dailySpendingRate).toLocaleString('id-ID')}</span> sangat baik! Jika dipertahankan, Anda diproyeksikan memiliki sisa anggaran <span className="font-bold text-app-success">Rp {Math.round(monthlyExpenseBudget - projectedMonthlyExpense).toLocaleString('id-ID')}</span> di akhir bulan.
                        </>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <div className="py-2 text-center">
                  <p className="text-[11px] text-app-text/60 leading-relaxed">
                    Atur Anggaran Pengeluaran Bulanan di formulir sebelah untuk mengaktifkan Analisis Prediktif PWA pintar!
                  </p>
                </div>
              )}
            </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Tabungan Bulanan Berlayer */}
        <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/5 via-transparent to-transparent pointer-events-none" />
          <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
             <Star className="w-5 h-5 text-app-accent1" /> Tabungan Layered
          </h2>
          
          <div className="relative z-10 w-full flex-1 flex flex-col gap-6">
            {monthlySavingsTargets && monthlySavingsTargets.length > 0 ? (
              monthlySavingsTargets.map((target, idx) => {
                const savingsProgress = target > 0 ? Math.min(Math.max((savingsThisMonth / target) * 100, 0), 100) : 0;
                return (
                  <div key={idx} className="border-b border-app-border/30 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-app-text-bright">Layer {idx + 1}</span>
                      <span className="text-[10px] font-bold text-app-accent1">
                        {savingsProgress.toFixed(0)}% Tercapai
                      </span>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[9px] text-app-text/70 uppercase tracking-wider">Tercapai</p>
                        <p className="text-sm font-bold text-app-accent1">Rp {Math.max(savingsThisMonth, 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-app-text/70 uppercase tracking-wider">Target L{idx + 1}</p>
                        <p className="text-xs font-bold text-app-text-bright">Rp {target.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
     
                    <div className="h-3 w-full bg-app-bg rounded-full border border-app-border overflow-hidden mb-2 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-app-accent1/80 to-app-accent1 transition-all duration-1000 ease-out relative"
                        style={{ width: `${savingsProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
     
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-app-text/50">Status</span>
                      <span className="font-medium text-app-text/70">
                        {savingsThisMonth >= target ? (
                          <span className="text-app-success font-bold">Tercapai! 🎉</span>
                        ) : (
                          `Sisa Rp ${Math.max(target - savingsThisMonth, 0).toLocaleString('id-ID')}`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-app-text/60 font-medium text-sm">Target belum diatur.</p>
              </div>
            )}
          </div>
        </div>

        {/* Penghasilan Harian Berlayer */}
        <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-success/5 via-transparent to-transparent pointer-events-none" />
          <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
             <ArrowUp className="w-5 h-5 text-app-success" /> Penghasilan Layered
          </h2>
          
          <div className="relative z-10 w-full flex-1 flex flex-col gap-6">
            {dailyIncomeTargets && dailyIncomeTargets.length > 0 ? (
              dailyIncomeTargets.map((target, idx) => {
                const incomeProgress = target > 0 ? Math.min((incomeToday / target) * 100, 100) : 0;
                return (
                  <div key={idx} className="border-b border-app-border/30 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-app-text-bright">Layer {idx + 1}</span>
                      <span className="text-[10px] font-bold text-app-success">
                        {incomeProgress.toFixed(0)}% Tercapai
                      </span>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[9px] text-app-text/70 uppercase tracking-wider">Tercapai</p>
                        <p className="text-sm font-bold text-app-success">Rp {Math.max(incomeToday, 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-app-text/70 uppercase tracking-wider">Target L{idx + 1}</p>
                        <p className="text-xs font-bold text-app-text-bright">Rp {target.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
     
                    <div className="h-3 w-full bg-app-bg rounded-full border border-app-border overflow-hidden mb-2 shadow-inner">
                      <div 
                        className="h-full bg-gradient-to-r from-app-success/80 to-app-success transition-all duration-1000 ease-out relative"
                        style={{ width: `${incomeProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
     
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-app-text/50">Status</span>
                      <span className="font-medium text-app-text/70">
                        {incomeToday >= target ? (
                          <span className="text-app-success font-bold">Tercapai! 🎉</span>
                        ) : (
                          `Kurang Rp ${Math.max(target - incomeToday, 0).toLocaleString('id-ID')}`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-app-text/60 font-medium text-sm">Target belum diatur.</p>
              </div>
            )}
          </div>
        </div>

        {/* Pengeluaran Harian Berlayer */}
        <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-danger/5 via-transparent to-transparent pointer-events-none" />
          <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
             <ArrowDown className="w-5 h-5 text-app-danger" /> Pengeluaran Layered
          </h2>
          
          <div className="relative z-10 w-full flex-1 flex flex-col gap-6">
            {dailyExpenseLimits && dailyExpenseLimits.length > 0 ? (
              dailyExpenseLimits.map((target, idx) => {
                const expenseProgress = target > 0 ? Math.min((expenseToday / target) * 100, 100) : 0;
                return (
                  <div key={idx} className="border-b border-app-border/30 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold text-app-text-bright">Layer {idx + 1}</span>
                      <span className="text-[10px] font-bold text-app-danger">
                        {expenseProgress.toFixed(0)}% Terpakai
                      </span>
                    </div>

                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-[9px] text-app-text/70 uppercase tracking-wider">Terpakai</p>
                        <p className="text-sm font-bold text-app-danger">Rp {Math.max(expenseToday, 0).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-app-text/70 uppercase tracking-wider">Batas L{idx + 1}</p>
                        <p className="text-xs font-bold text-app-text-bright">Rp {target.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
     
                    <div className="h-3 w-full bg-app-bg rounded-full border border-app-border overflow-hidden mb-2 shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out relative ${expenseProgress >= 100 ? 'bg-app-danger' : 'bg-gradient-to-r from-app-warning to-app-warning/80'}`}
                        style={{ width: `${expenseProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
     
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-app-text/50">Status</span>
                      <span className="font-medium text-app-text/70">
                        {expenseToday > target ? (
                          <span className="text-app-danger font-bold">Overbudget! 🚫</span>
                        ) : (
                          `Sisa Rp ${Math.max(target - expenseToday, 0).toLocaleString('id-ID')}`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6">
                <p className="text-app-text/60 font-medium text-sm">Batas belum diatur.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
