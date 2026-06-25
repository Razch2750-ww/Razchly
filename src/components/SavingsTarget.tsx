import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { doc, updateDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Target, ArrowUp, ArrowDown, Plus, Car } from 'lucide-react';

import { formatNumberInput, parseNumberInput } from '../utils/numberFormat';
import { Transaction } from '../types';
import { isSameMonth, isSameDay } from 'date-fns';
import confetti from 'canvas-confetti';

export default function SavingsTarget() {
  const { user, monthlySavingsTargets, setMonthlySavingsTargets, dailyIncomeTargets, setDailyIncomeTargets, dailyExpenseLimits, setDailyExpenseLimits, setGlobalAddModalOpen, setGlobalGrabModalOpen } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [targetInputs, setTargetInputs] = useState<string[]>(monthlySavingsTargets && monthlySavingsTargets.length > 0 ? monthlySavingsTargets.map(t => formatNumberInput(t.toString())) : ['']);
  const [incomeTargetInputs, setIncomeTargetInputs] = useState<string[]>(dailyIncomeTargets && dailyIncomeTargets.length > 0 ? dailyIncomeTargets.map(t => formatNumberInput(t.toString())) : ['']);
  const [expenseLimitInputs, setExpenseLimitInputs] = useState<string[]>(dailyExpenseLimits && dailyExpenseLimits.length > 0 ? dailyExpenseLimits.map(t => formatNumberInput(t.toString())) : ['']);


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
  }, [monthlySavingsTargets, dailyIncomeTargets, dailyExpenseLimits]);

  const handleTabunganChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
        try {
            const parsedTargets = targetInputs.map(t => parseNumberInput(t)).filter(t => t > 0);
            const parsedIncomeTargets = incomeTargetInputs.map(t => parseNumberInput(t)).filter(t => t > 0);
            const parsedExpenseLimits = expenseLimitInputs.map(t => parseNumberInput(t)).filter(t => t > 0);
            
            // Cleanup single target field format from legacy if saving array
            await updateDoc(doc(db, 'users', user.uid), { 
                monthlySavingsTargets: parsedTargets.length > 0 ? parsedTargets : [],
                dailyIncomeTargets: parsedIncomeTargets.length > 0 ? parsedIncomeTargets : [],
                dailyExpenseLimits: parsedExpenseLimits.length > 0 ? parsedExpenseLimits : []
            });
            setMonthlySavingsTargets(parsedTargets);
            setDailyIncomeTargets(parsedIncomeTargets);
            setDailyExpenseLimits(parsedExpenseLimits);
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
    .filter((t) => t.type === "expense" && isSameMonth(new Date(t.date), new Date()))
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    
  const incomeToday = useMemo(() => transactions
    .filter((t) => t.type === "income" && isSameDay(new Date(t.date), new Date()))
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    
  const expenseToday = useMemo(() => transactions
    .filter((t) => t.type === "expense" && isSameDay(new Date(t.date), new Date()))
    .reduce((sum, t) => sum + t.amount, 0), [transactions]);
    
  const savingsThisMonth = incomeThisMonth - expenseThisMonth;
  
  useEffect(() => {
    if (!transactions.length) return;
    
    // We only celebrate actual non-zero targets
    const currentMonthStr = new Date().toISOString().slice(0, 7); 
    const currentDayStr = new Date().toISOString().slice(0, 10);

    let celebrated = false;

    if (monthlySavingsTargets && monthlySavingsTargets.length > 0) {
      monthlySavingsTargets.forEach((target, idx) => {
        const key = `celebrated_savings_${currentMonthStr}_layer_${idx}`;
        if (target > 0 && savingsThisMonth >= target && !localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          celebrated = true;
          setTimeout(() => {
            toast.success(`Selamat! Target Tabungan Layer ${idx + 1} tercapai! 🎉`, { duration: 5000 });
          }, idx * 500); // Stagger toasts if multiple hit
        }
      });
    }

    if (dailyIncomeTargets && dailyIncomeTargets.length > 0) {
      dailyIncomeTargets.forEach((target, idx) => {
        const key = `celebrated_income_${currentDayStr}_layer_${idx}`;
        if (target > 0 && incomeToday >= target && !localStorage.getItem(key)) {
          localStorage.setItem(key, "true");
          celebrated = true;
          setTimeout(() => {
            toast.success(`Luar Biasa! Penghasilan Harian Layer ${idx + 1} tercapai! 🚀`, { duration: 5000 });
          }, idx * 500 + 200);
        }
      });
    }
    
    // Warning for expenses over limit
    if (dailyExpenseLimits && dailyExpenseLimits.length > 0) {
        dailyExpenseLimits.forEach((target, idx) => {
            const key = `warned_expense_${currentDayStr}_layer_${idx}`;
            if (target > 0 && expenseToday > target && !localStorage.getItem(key)) {
                localStorage.setItem(key, "true");
                setTimeout(() => {
                    toast.error(`Perhatian: Pengeluaran melebihi Batas Layer ${idx + 1}! 💸`, { duration: 5000 });
                }, idx * 500 + 400);
            }
        });
    }

    if (celebrated) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#4ade80', '#3b82f6', '#facc15', '#f43f5e']
      });
    }

  }, [savingsThisMonth, incomeToday, expenseToday, monthlySavingsTargets, dailyIncomeTargets, dailyExpenseLimits, transactions.length]);

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1 tracking-tight">
            Target Tabungan
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
        <div className="lg:col-span-2 bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden">
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
            
            <div className="grid grid-cols-1 gap-4">
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

        <div className="lg:col-span-1 bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-success/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="w-24 h-24 text-app-success" />
          </div>
          <p className="text-app-text/70 text-xs font-medium uppercase tracking-wider mb-2 relative z-10">Laba Bersih Bulan Ini</p>
          <h3 className="text-3xl font-bold text-app-text-bright relative z-10">Rp {Math.max(savingsThisMonth, 0).toLocaleString("id-ID")}</h3>
          <p className="text-xs text-app-text/50 mt-2 relative z-10">Masuk akal untuk ditabung</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Tabungan Bulanan Berlayer */}
        {monthlySavingsTargets && monthlySavingsTargets.length > 0 ? (
          monthlySavingsTargets.map((target, idx) => {
            const savingsProgress = target > 0 ? Math.min(Math.max((savingsThisMonth / target) * 100, 0), 100) : 0;
            return (
                <div key={idx} className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/5 via-transparent to-transparent pointer-events-none" />
                  <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
                     <Star className="w-5 h-5 text-app-accent1" /> Tabungan Layer {idx + 1}
                  </h2>
                  
                  <div className="relative z-10 w-full flex-1 flex flex-col justify-end">
                       <div className="flex justify-between items-end mb-2">
                         <div>
                            <p className="text-[10px] text-app-text/70 font-semibold mb-1 uppercase tracking-widest">Tercapai</p>
                            <p className="text-lg font-bold text-app-accent1">Rp {Math.max(savingsThisMonth, 0).toLocaleString('id-ID')}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-app-text/70 font-semibold mb-1 uppercase tracking-widest">Target L{idx + 1}</p>
                            <p className="text-sm font-bold text-app-text-bright">Rp {target.toLocaleString('id-ID')}</p>
                         </div>
                       </div>
        
                       <div className="h-4 w-full bg-app-bg rounded-full border border-app-border overflow-hidden mb-4 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-app-accent1/80 to-app-accent1 transition-all duration-1000 ease-out relative"
                          style={{ width: `${savingsProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
        
                      <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-2xl border border-app-border/50 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-app-text-bright">
                          {savingsProgress.toFixed(0)}% Tercapai
                        </span>
                        <span className="text-[10px] font-medium text-app-text/70">
                          {savingsThisMonth >= target ? (
                            <span className="text-app-success font-bold text-[10px]">Tercapai! 🎉</span>
                          ) : (
                            `Sisa Rp ${Math.max(target - savingsThisMonth, 0).toLocaleString('id-ID')}`
                          )}
                        </span>
                      </div>
                    </div>
                </div>
            );
          })
        ) : (
          <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden text-center justify-center">
            <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
                 <Star className="w-5 h-5 text-app-accent1" /> Tabungan Bulan Ini
              </h2>
            <div className="relative z-10 py-6">
              <p className="text-app-text/60 font-medium text-sm">Target belum diatur.</p>
            </div>
          </div>
        )}

        {/* Penghasilan Harian Berlayer */}
        {dailyIncomeTargets && dailyIncomeTargets.length > 0 ? (
          dailyIncomeTargets.map((target, idx) => {
            const incomeProgress = target > 0 ? Math.min((incomeToday / target) * 100, 100) : 0;
            return (
                <div key={idx} className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-success/5 via-transparent to-transparent pointer-events-none" />
                  <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
                     <ArrowUp className="w-5 h-5 text-app-success" /> Penghasilan Layer {idx + 1}
                  </h2>
                  
                  <div className="relative z-10 w-full flex-1 flex flex-col justify-end">
                       <div className="flex justify-between items-end mb-2">
                         <div>
                            <p className="text-[10px] text-app-text/70 font-semibold mb-1 uppercase tracking-widest">Tercapai</p>
                            <p className="text-lg font-bold text-app-success">Rp {Math.max(incomeToday, 0).toLocaleString('id-ID')}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-app-text/70 font-semibold mb-1 uppercase tracking-widest">Target L{idx + 1}</p>
                            <p className="text-sm font-bold text-app-text-bright">Rp {target.toLocaleString('id-ID')}</p>
                         </div>
                       </div>
        
                       <div className="h-4 w-full bg-app-bg rounded-full border border-app-border overflow-hidden mb-4 shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-app-success/80 to-app-success transition-all duration-1000 ease-out relative"
                          style={{ width: `${incomeProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
        
                      <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-2xl border border-app-border/50 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-app-text-bright">
                          {incomeProgress.toFixed(0)}% Tercapai
                        </span>
                        <span className="text-[10px] font-medium text-app-text/70">
                          {incomeToday >= target ? (
                            <span className="text-app-success font-bold text-[10px]">Tercapai! 🎉</span>
                          ) : (
                            `Kurang Rp ${Math.max(target - incomeToday, 0).toLocaleString('id-ID')}`
                          )}
                        </span>
                      </div>
                    </div>
                </div>
            );
          })
        ) : (
          <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden text-center justify-center">
            <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
                 <ArrowUp className="w-5 h-5 text-app-success" /> Penghasilan Harian
              </h2>
            <div className="relative z-10 py-6">
              <p className="text-app-text/60 font-medium text-sm">Target belum diatur.</p>
            </div>
          </div>
        )}

        {/* Pengeluaran Harian Berlayer */}
        {dailyExpenseLimits && dailyExpenseLimits.length > 0 ? (
          dailyExpenseLimits.map((target, idx) => {
            const expenseProgress = target > 0 ? Math.min((expenseToday / target) * 100, 100) : 0;
            return (
                <div key={idx} className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-danger/5 via-transparent to-transparent pointer-events-none" />
                  <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
                     <ArrowDown className="w-5 h-5 text-app-danger" /> Pengeluaran Layer {idx + 1}
                  </h2>
                  
                  <div className="relative z-10 w-full flex-1 flex flex-col justify-end">
                       <div className="flex justify-between items-end mb-2">
                         <div>
                            <p className="text-[10px] text-app-text/70 font-semibold mb-1 uppercase tracking-widest">Terpakai</p>
                            <p className="text-lg font-bold text-app-danger">Rp {Math.max(expenseToday, 0).toLocaleString('id-ID')}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-app-text/70 font-semibold mb-1 uppercase tracking-widest">Batas L{idx + 1}</p>
                            <p className="text-sm font-bold text-app-text-bright">Rp {target.toLocaleString('id-ID')}</p>
                         </div>
                       </div>
        
                       <div className="h-4 w-full bg-app-bg rounded-full border border-app-border overflow-hidden mb-4 shadow-inner">
                        <div 
                          className={`h-full transition-all duration-1000 ease-out relative ${expenseProgress >= 100 ? 'bg-app-danger' : 'bg-gradient-to-r from-app-warning to-app-warning/80'}`}
                          style={{ width: `${expenseProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse" />
                        </div>
                      </div>
        
                      <div className="flex justify-between items-center bg-app-bg/50 p-3 rounded-2xl border border-app-border/50 backdrop-blur-sm">
                        <span className="text-[10px] font-bold text-app-text-bright">
                          {expenseProgress.toFixed(0)}% Terpakai
                        </span>
                        <span className="text-[10px] font-medium text-app-text/70">
                          {expenseToday > target ? (
                            <span className="text-app-danger font-bold text-[10px]">Overbudget! 🚫</span>
                          ) : (
                            `Sisa Rp ${Math.max(target - expenseToday, 0).toLocaleString('id-ID')}`
                          )}
                        </span>
                      </div>
                    </div>
                </div>
            );
          })
        ) : (
          <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col relative overflow-hidden text-center justify-center">
            <h2 className="text-app-text-bright font-bold mb-6 text-center text-lg relative z-10 flex items-center justify-center gap-2">
                 <ArrowDown className="w-5 h-5 text-app-danger" /> Pengeluaran Harian
              </h2>
            <div className="relative z-10 py-6">
              <p className="text-app-text/60 font-medium text-sm">Batas belum diatur.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
