import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { Account, Transaction } from "../types";
import { Link, useNavigate } from "react-router-dom";
import { AccountIcon, getAccountIconDetails } from "./AccountIcon";
import { CategoryIcon } from "./CategoryIcon";
import {
  Sun,
  Moon,
  Bell,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
  FileText,
  ArrowRight,
  Car,
  ArrowUpDown,
  Check,
  Cloud,
  Image as ImageIcon,
  Settings,
  Edit2,
  BarChart2,
  Eye,
  Target,
  Scan
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format, subDays, isSameDay, isSameMonth } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AccountModal } from "./AccountModal";

export default function Dashboard() {
  const user = useStore((state) => state.user);
  const { themeId, setThemeId, setGlobalAddModalOpen, setGlobalGrabModalOpen } =
    useStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [chartPeriod, setChartPeriod] = useState<number>(0);
  const [selectedChartAccount, setSelectedChartAccount] = useState<string>("all");
  const [accountSort, setAccountSort] = useState<"balance_desc" | "balance_asc" | "name_asc">("balance_desc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const navigate = useNavigate();

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      // Primary account always at the top
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;

      if (accountSort === "balance_desc") return b.balance - a.balance;
      if (accountSort === "balance_asc") return a.balance - b.balance;
      if (accountSort === "name_asc") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [accounts, accountSort]);

  useEffect(() => {
    if (!user) return;
    const accUnsub = onSnapshot(
      collection(db, "users", user.uid, "accounts"),
      (snap) => {
        const accts: Account[] = [];
        snap.forEach((d) => accts.push({ id: d.id, ...d.data() } as Account));
        setAccounts(accts);
      },
    );

    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc"),
      limit(500)
    );
    const tsxUnsub = onSnapshot(q, (snap) => {
      const tsx: Transaction[] = [];
      snap.forEach((d) => tsx.push({ id: d.id, ...d.data() } as unknown as Transaction));
      setRecentTransactions(tsx);
    });

    return () => {
      accUnsub();
      tsxUnsub();
    };
  }, [user]);

  const totalBalance = accounts.filter(a => !a.excludeFromTotal).reduce((acc, curr) => acc + curr.balance, 0);

  // Income & Expense calculation for "Today"
  const incomeToday = recentTransactions
    .filter((t) => t.type === "income" && isSameDay(t.date, new Date()))
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseToday = recentTransactions
    .filter((t) => t.type === "expense" && isSameDay(t.date, new Date()))
    .reduce((sum, t) => sum + t.amount, 0);

  // Savings this month
  const incomeThisMonth = recentTransactions
    .filter((t) => t.type === "income" && isSameMonth(t.date, new Date()))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenseThisMonth = recentTransactions
    .filter((t) => t.type === "expense" && isSameMonth(t.date, new Date()))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const savingsThisMonth = incomeThisMonth - expenseThisMonth;
  const savingsTargets = useStore((state) => state.monthlySavingsTargets);
  const savingsTarget = savingsTargets && savingsTargets.length > 0 ? Math.max(...savingsTargets) : 0;
  const savingsProgress = savingsTarget > 0 ? Math.min(Math.max((savingsThisMonth / savingsTarget) * 100, 0), 100) : 0;

  // Chart data generation
  const chartData = useMemo(() => {
    const data = [];
    const filteredTransactions = selectedChartAccount === "all" 
      ? recentTransactions 
      : recentTransactions.filter(t => t.accountId === selectedChartAccount);

    if (chartPeriod === 0) {
      const today = new Date();
      for (let i = 0; i <= 24; i++) {
        // filter transactions where hour === i and isSameDay
        const hourTrans = filteredTransactions.filter((t) => {
          const d = new Date(t.date);
          return isSameDay(d, today) && d.getHours() === i;
        });
        const income = hourTrans
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = hourTrans
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({
          name: `${i.toString().padStart(2, "0")}:00`,
          value: income - expense,
          income,
          expense,
        });
      }
    } else {
      for (let i = chartPeriod; i >= 0; i--) {
        const date = subDays(new Date(), i);
        // Find transactions for this day
        const dayTransactions = filteredTransactions.filter((t) =>
          isSameDay(new Date(t.date), date),
        );
        const income = dayTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = dayTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);

        data.push({
          name: format(date, "dd MMM", { locale: localeId }),
          value: income - expense,
          income,
          expense,
        });
      }
    }
    return data;
  }, [chartPeriod, recentTransactions, selectedChartAccount]);

  const toggleTheme = () => {
    setThemeId(themeId === "dark" ? "light" : "dark");
  };

  const getInitials = (name: string) =>
    name.substring(0, 2).toUpperCase() || "US";

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      {/* DESKTOP HEADER */}
      <header className="hidden md:flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1">
            Selamat datang kembali, {user?.displayName || "USER"} 👋
          </h1>
          <p className="text-app-text-bright text-sm">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })} • Berikut ringkasan keuangan hari ini.
          </p>
        </div>

        <div className="flex items-center gap-4 hidden md:flex">
          <button
            onClick={() => {
              setGlobalGrabModalOpen(true);
              navigate("/transactions");
            }}
            className="w-10 h-10 rounded-full bg-app-success hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm"
            title="Transaksi Grab"
          >
            <Car className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setGlobalAddModalOpen(true);
              navigate("/transactions");
            }}
            className="w-10 h-10 rounded-full bg-app-accent1 hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm"
            title="Tambah Transaksi"
          >
            <Plus className="w-5 h-5" />
          </button>
          <Link
            to="/settings"
            state={{ expandSection: 'profile' }}
            className="px-4 h-10 rounded-full bg-app-card flex items-center justify-center text-sm font-semibold text-app-text-bright border border-app-border gap-2 hover:bg-app-hover cursor-pointer transition-colors"
          >
            <span className="opacity-70">
              {user?.displayName?.toUpperCase() || "USER"}
            </span>
            <div className="w-6 h-6 rounded-full bg-app-accent1 text-xs font-bold flex items-center justify-center text-app-bg overflow-hidden">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                getInitials(user?.displayName || "USER")
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-start justify-between mb-6 px-1">
        <div>
           <h1 className="text-xl font-black text-app-text-bright tracking-widest uppercase mb-0.5">RAZCH</h1>
           <p className="text-app-text/60 text-xs capitalize">{format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })}</p>
        </div>
        <div className="flex items-center gap-4">
           <Car onClick={() => navigate('/grab')} className="w-5 h-5 text-app-text/60 cursor-pointer" />
           <Target onClick={() => navigate('/savings')} className="w-5 h-5 text-app-text/60 cursor-pointer" />
           <Scan onClick={() => navigate('/analyze')} className="w-5 h-5 text-app-text/60 cursor-pointer" />
           <Settings onClick={() => navigate('/settings')} className="w-5 h-5 text-app-text/60 cursor-pointer" />
        </div>
      </header>

      {/* MOBILE TOTAL SALDO WIDGET */}
      <div className="md:hidden mb-6">
        <div className="bg-app-card border border-app-border rounded-[1.5rem] p-6 relative overflow-hidden text-app-text shadow-lg cursor-pointer" onClick={() => navigate("/transactions", { state: { tab: "Semua" } })}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-app-accent1/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-app-accent1/5 rounded-full blur-[40px] pointer-events-none"></div>
          
          <div className="flex justify-between items-start relative z-10 mb-6 mt-1">
             <div>
                <p className="text-app-text/70 text-xs font-bold tracking-[0.15em] mb-2 uppercase">Total Saldo</p>
                <div className="flex items-center gap-2 mb-1">
                   <h2 className="text-3xl font-bold text-app-text-bright">Rp {totalBalance.toLocaleString("id-ID")}</h2>
                </div>
                <p className="text-app-text/60 text-xs font-medium">Seluruh dompet • {format(new Date(), "MMMM yyyy", { locale: localeId })}</p>
             </div>
             <Eye className="w-5 h-5 text-app-text/70" />
          </div>

          <div className="h-px w-full bg-app-border mt-4 mb-4 relative z-10"></div>

          <div className="flex justify-between items-center relative z-10">
             <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                   <div className="w-2 h-2 rounded-full bg-app-success"></div>
                   <span className="text-app-text/80 text-[13px]">Pemasukan</span>
                </div>
                <p className="text-app-success font-bold text-[15px]">+Rp {incomeThisMonth.toLocaleString("id-ID")}</p>
             </div>
             <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 mb-1.5">
                   <div className="w-2 h-2 rounded-full bg-app-danger"></div>
                   <span className="text-app-text/80 text-[13px]">Pengeluaran</span>
                </div>
                <p className="text-app-danger font-bold text-[15px]">-Rp {expenseThisMonth.toLocaleString("id-ID")}</p>
             </div>
          </div>
        </div>
      </div>

      {/* DESKTOP TOP WIDGETS */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* TOTAL SALDO */}
        <div
          onClick={() => navigate("/transactions", { state: { tab: "Semua" } })}
          className="bg-app-card rounded-2xl p-6 border border-app-border flex items-center justify-between shadow-sm cursor-pointer hover:bg-app-hover transition-colors overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-app-accent1/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-app-accent1" />
            </div>
            <div>
              <p className="text-app-text/70 text-xs font-medium uppercase tracking-wider mb-1">
                Total Saldo
              </p>
              <p className="text-xl font-bold text-app-text-bright">
                Rp {totalBalance.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-1 mt-1 text-app-accent1 text-xs font-medium">
                <TrendingUp className="w-3 h-3" /> Saldo Aman
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-app-text/40 relative z-10" />
        </div>

        {/* PEMASUKAN */}
        <div
          onClick={() =>
            navigate("/transactions", { state: { tab: "Pemasukan" } })
          }
          className="bg-app-card rounded-2xl p-6 border border-app-border flex items-center justify-between shadow-sm cursor-pointer hover:bg-app-hover transition-colors overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-success/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-app-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-app-success" />
            </div>
            <div>
              <p className="text-app-text/70 text-xs font-medium uppercase tracking-wider mb-1">
                Pemasukan (Hari Ini)
              </p>
              <p className="text-xl font-bold text-app-text-bright">
                Rp {incomeToday.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-1 mt-1 text-app-success text-xs font-medium">
                <TrendingUp className="w-3 h-3" /> 0% dari kemarin
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-app-text/40 relative z-10" />
        </div>

        {/* PENGELUARAN */}
        <div
          onClick={() =>
            navigate("/transactions", { state: { tab: "Pengeluaran" } })
          }
          className="bg-app-card rounded-2xl p-6 border border-app-border flex items-center justify-between shadow-sm cursor-pointer hover:bg-app-hover transition-colors overflow-hidden relative"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-danger/5 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-app-danger/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-app-danger" />
            </div>
            <div>
              <p className="text-app-text/70 text-xs font-medium uppercase tracking-wider mb-1">
                Pengeluaran (Hari Ini)
              </p>
              <p className="text-xl font-bold text-app-text-bright">
                Rp {expenseToday.toLocaleString("id-ID")}
              </p>
              <div className="flex items-center gap-1 mt-1 text-app-danger text-xs font-medium">
                <TrendingDown className="w-3 h-3" /> 0% dari kemarin
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-app-text/40 relative z-10" />
        </div>
      </div>

      {/* MOBILE MIDDLE SECTION */}
      <div className="md:hidden pb-4">
        {/* DOMPET SAYA */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-app-text-bright font-bold text-lg">Dompet saya</h2>
              <Link to="/settings" state={{ expandSection: "accounts" }} className="text-app-accent1 text-[13px] font-medium">Lihat semua</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
             {sortedAccounts.map(acc => {
                const iconDetails = getAccountIconDetails(acc.icon);
                const hasCustomColor = iconDetails?.color;
                
                return (
                <div key={acc.id} onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }} className="min-w-[140px] bg-app-card rounded-[1.2rem] p-4 flex flex-col justify-between border border-app-border relative overflow-hidden">
                  {hasCustomColor ? (
                    <div 
                      className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-80 block"
                      style={{ background: `linear-gradient(to bottom right, color-mix(in srgb, ${iconDetails.color} 25%, transparent), transparent, transparent)` }}
                    />
                  ) : (
                    <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${iconDetails?.type === 'cash' ? 'from-app-success/5' : 'from-app-accent1/15'} via-transparent to-transparent pointer-events-none opacity-80 block`} />
                  )}
                  <div className="relative z-10">
                     <AccountIcon iconId={acc.icon} className="w-10 h-10 shrink-0 mb-4" />
                     <div>
                        <p className="text-app-text-bright text-[13px] mb-1 line-clamp-1 uppercase font-bold">{acc.name}</p>
                        <p className="text-app-success font-bold text-[15px] mb-2">Rp {acc.balance.toLocaleString("id-ID")}</p>
                        <div className="flex items-center gap-1.5 text-app-text/60 text-[11px]">
                           <Edit2 className="w-3.5 h-3.5" />
                           <span>Sesuaikan</span>
                        </div>
                     </div>
                  </div>
                </div>
             )})}
             <div onClick={() => { navigate('/settings', { state: { expandSection: "accounts" } }) }} className="min-w-[120px] bg-app-card rounded-[1.2rem] p-4 flex flex-col items-center justify-center border border-app-border cursor-pointer">

                <div className="w-12 h-12 rounded-full bg-app-hover flex items-center justify-center mb-3">
                   <Plus className="w-6 h-6 text-app-accent1" />
                </div>
                <p className="text-app-text/60 text-[13px] text-center">Kelola<br/>Dompet</p>
             </div>
          </div>
        </div>

        {/* MOBILE ACTION BUTTONS */}
        <div className="flex gap-4 mb-8">
            <button onClick={() => navigate('/transactions')} className="flex-1 bg-app-card border border-app-border py-4 rounded-[1.2rem] flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-app-hover">
                <div className="w-8 h-8 rounded bg-app-accent1/10 flex items-center justify-center">
                   <BarChart2 className="w-4 h-4 text-app-accent1" />
                </div>
                <span className="text-app-text-bright font-semibold text-[15px]">Laporan</span>
            </button>
            <button onClick={() => navigate('/grab')} className="flex-1 bg-app-card border border-app-border py-4 rounded-[1.2rem] flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-app-hover">
                <div className="w-8 h-8 rounded bg-app-accent1/10 flex items-center justify-center">
                   <TrendingUp className="w-4 h-4 text-app-accent1" />
                </div>
                <span className="text-app-text-bright font-semibold text-[15px]">Analisis Usaha</span>
            </button>
        </div>
      </div>

      {/* DESKTOP MIDDLE SECTION */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* DOMPET SAYA */}
        <div className="md:col-span-1 bg-app-card rounded-3xl p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 relative z-50">
            <h2 className="text-app-text-bright font-bold">Dompet Saya</h2>
            <div className="relative">
              <button 
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 text-xs font-semibold text-app-text/70 hover:text-app-text px-2 py-1 rounded-lg hover:bg-app-hover transition-colors"
                title="Urutkan"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                Urutkan
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-app-card border border-app-border rounded-xl shadow-lg z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => { setAccountSort("balance_desc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                    >
                      Saldo Tertinggi
                      {accountSort === "balance_desc" && <Check className="w-3.5 h-3.5 text-app-accent1" />}
                    </button>
                    <button
                      onClick={() => { setAccountSort("balance_asc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                    >
                      Saldo Terendah
                      {accountSort === "balance_asc" && <Check className="w-3.5 h-3.5 text-app-accent1" />}
                    </button>
                    <div className="h-px w-full bg-app-border/50 my-1" />
                    <button
                      onClick={() => { setAccountSort("name_asc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                    >
                      Nama (A-Z)
                      {accountSort === "name_asc" && <Check className="w-3.5 h-3.5 text-app-accent1" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="space-y-4 flex-1 max-h-[336px] overflow-y-auto pr-2 overflow-x-hidden" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--color-app-border) transparent" }}>
            {sortedAccounts.length === 0 ? (
              <div className="text-app-text/50 text-sm text-center py-4">
                Belum ada dompet
              </div>
            ) : (
              sortedAccounts.map((acc, index) => {
                const iconDetails = getAccountIconDetails(acc.icon);
                const hasCustomColor = iconDetails?.color;

                return (
                <div
                  key={acc.id}
                  onClick={() => {
                    setEditingAccount(acc);
                    setIsAccountModalOpen(true);
                  }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-app-bg border border-app-border hover:border-app-accent1/50 transition cursor-pointer relative overflow-hidden group"
                >
                  {hasCustomColor ? (
                    <div 
                      className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-80 block"
                      style={{ background: `linear-gradient(to bottom right, color-mix(in srgb, ${iconDetails.color} 25%, transparent), transparent, transparent)` }}
                    />
                  ) : (
                    <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${iconDetails?.type === 'cash' ? 'from-app-success/5' : 'from-app-accent1/15'} via-transparent to-transparent pointer-events-none opacity-80 block`} />
                  )}
                  <div className="flex items-center gap-4 relative z-10">
                    <AccountIcon iconId={acc.icon} className="w-10 h-10 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-app-text-bright font-semibold">
                          {acc.name}
                        </p>
                        {acc.isPrimary && (
                          <span className="bg-app-accent1/20 text-app-accent1 text-[9px] font-bold px-2 py-0.5 rounded-sm">
                            UTAMA
                          </span>
                        )}
                      </div>
                      <p className="text-app-text/70 text-xs mt-1">
                        Rp {acc.balance.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-app-text/40 relative z-10" />
                </div>
                );
              })
            )}
          </div>
          <Link
            to="/settings"
            state={{ expandSection: 'accounts' }}
            className="mt-4 flex items-center justify-center p-4 rounded-2xl border border-dashed border-app-border hover:border-app-text/50 transition cursor-pointer text-app-text/70 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Dompet
          </Link>
        </div>

        {/* ALUR KAS (CHART) */}
        <div className="md:col-span-2 bg-app-card rounded-3xl p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-app-text-bright font-bold">Alur Kas</h2>
            <div className="flex items-center gap-2">
              <select
                value={selectedChartAccount}
                onChange={(e) => setSelectedChartAccount(e.target.value)}
                className="bg-app-bg border border-app-border rounded-lg px-2 py-1.5 text-xs text-app-text-bright focus:outline-none focus:border-app-accent1/50 transition-colors cursor-pointer"
              >
                <option value="all">Semua Rekening</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              <div className="bg-app-bg rounded-full p-1 border border-app-border flex hidden sm:flex">
                <button
                  onClick={() => setChartPeriod(0)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${chartPeriod === 0 ? "bg-app-accent1 text-white shadow-sm" : "text-app-text/60 hover:text-app-text-bright"}`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => setChartPeriod(7)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${chartPeriod === 7 ? "bg-app-accent1 text-white shadow-sm" : "text-app-text/60 hover:text-app-text-bright"}`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setChartPeriod(30)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${chartPeriod === 30 ? "bg-app-accent1 text-white shadow-sm" : "text-app-text/60 hover:text-app-text-bright"}`}
                >
                  30 Hari
                </button>
              </div>
              <button
                onClick={() => navigate("/transactions", { state: { tab: "Semua" } })}
                className="text-app-accent1 text-sm font-medium hover:underline ml-2"
              >
                Lihat Semua
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-app-border)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--color-app-text)" }}
                  dy={10}
                  opacity={0.5}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--color-app-text)" }}
                  opacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-app-card)",
                    border: "1px solid var(--color-app-border)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{
                    fontSize: 12,
                    color: "var(--color-app-text-bright)",
                  }}
                  labelStyle={{
                    fontSize: 12,
                    color: "var(--color-app-text)",
                    marginBottom: 4,
                  }}
                />
                <Line
                  type="monotone"
                  name="Pemasukan"
                  dataKey="income"
                  stroke="var(--color-app-success)"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "var(--color-app-success)",
                    strokeWidth: 0,
                  }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  name="Pengeluaran"
                  dataKey="expense"
                  stroke="var(--color-app-danger)"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                    fill: "var(--color-app-danger)",
                    strokeWidth: 0,
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-app-border pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-app-accent1"></div>
              <span className="text-app-text/70 text-xs font-semibold uppercase tracking-wide">
                {chartPeriod === 0 ? "Estimasi Laba Bersih Hari Ini" : `Estimasi Laba Bersih ${chartPeriod} Hari Terakhir`}
              </span>
            </div>
            <span className="text-app-accent1 font-bold">
              Rp {chartData.reduce((acc, curr) => acc + (curr.income - curr.expense), 0).toLocaleString("id-ID")}
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SECTION - TRANSACTIONS */}
      <div className="md:hidden pb-12">
        <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-app-text-bright font-bold text-lg">Transaksi Terbaru</h2>
            <Link to="/transactions" state={{ tab: "Semua" }} className="text-app-accent1 text-[13px] font-medium">Lihat Semua</Link>
        </div>
        {(() => {
          const todayMobileTransactions = recentTransactions.filter(t => isSameDay(t.date, new Date()));
          return todayMobileTransactions.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-app-card border border-app-border flex items-center justify-center mb-5">
                 <FileText className="w-8 h-8 text-app-accent1" />
              </div>
              <p className="text-app-text-bright font-bold mb-1.5">Belum ada transaksi hari ini</p>
              <p className="text-app-text/60 text-[13px]">Mulai catat transaksi pertama Anda hari ini</p>
           </div>
          ) : (
           <div className="space-y-3">
              {todayMobileTransactions.map((t) => (
                 <div key={t.id} onClick={() => navigate('/transactions', { state: { tab: "Semua" } })} className="flex items-center justify-between p-4 rounded-2xl bg-app-card border border-app-border active:scale-[0.98] transition-transform relative overflow-hidden">
                     <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${t.type === 'income' ? 'from-app-success/10' : t.type === 'expense' ? 'from-app-danger/10' : 'from-app-text/10'} via-transparent to-transparent pointer-events-none opacity-50 block`} />
                     <div className="flex items-center gap-4 relative z-10">
                       <div className={`w-12 h-12 rounded-[1.1rem] flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-app-success/10 text-app-success" : t.type === "expense" ? "bg-app-danger/10 text-app-danger" : "bg-app-text/10 text-app-text"}`}>
                         {t.type === "income" && <TrendingUp className="w-5 h-5" />}
                         {t.type === "expense" && <TrendingDown className="w-5 h-5" />}
                       </div>
                       <div>
                         <div className="flex items-center gap-2 mb-0.5">
                           <p className="text-app-text-bright font-semibold text-[15px]">
                             {t.note || (t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer")}
                           </p>
                           {t.categoryId && (
                              <span className="px-2 py-0.5 bg-app-bg border border-app-border text-app-text text-[10px] font-bold rounded-full hidden sm:flex items-center gap-1">
                                <CategoryIcon iconId={t.categoryIcon || 'dollar-sign'} className="w-3 h-3 text-app-text/70" />
                                <span>{t.categoryName}</span>
                              </span>
                           )}
                         </div>
                         <p className="text-app-text/60 text-[13px]">
                           {format(t.date, "dd MMM yyyy", { locale: localeId })}
                         </p>
                       </div>
                     </div>
                     <p className={`text-[15px] font-bold whitespace-nowrap relative z-10 ${t.type === "income" ? "text-app-success" : t.type === "expense" ? "text-app-danger" : "text-app-text"}`}>
                       {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} Rp {t.amount.toLocaleString("id-ID")}
                     </p>
                 </div>
              ))}
           </div>
          );
        })()}
      </div>

      {/* DESKTOP BOTTOM SECTION - TRANSACTIONS */}
      <div className="hidden md:flex bg-app-card rounded-3xl p-6 border border-app-border flex-col shadow-sm shrink-0 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-app-text-bright font-bold">Transaksi Terakhir</h2>
          <Link
            to="/transactions"
            state={{ tab: "Semua" }}
            className="text-app-accent1 text-sm font-medium hover:underline flex items-center"
          >
            Lihat semua transaksi <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        {(() => {
          const filteredBottomTransactions = selectedChartAccount === "all" ? recentTransactions : recentTransactions.filter(t => t.accountId === selectedChartAccount);
          const todayDesktopTransactions = filteredBottomTransactions.filter(t => isSameDay(t.date, new Date()));
          return todayDesktopTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl bg-app-bg border border-app-border border-dashed relative z-10">
              <FileText className="w-8 h-8 text-app-text/30 mb-3" />
              <p className="text-app-text/50 text-sm">Belum ada transaksi hari ini</p>
            </div>
          ) : (
            <div className="space-y-3 relative z-10">
              {todayDesktopTransactions.map((t) => (
                <div
                  key={t.id}
                  onClick={() => navigate('/transactions', { state: { tab: "Semua" } })}
                  className="flex items-center justify-between p-4 rounded-2xl bg-app-bg border border-app-border hover:border-app-accent1/50 transition cursor-pointer relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${t.type === 'income' ? 'from-app-success/10' : t.type === 'expense' ? 'from-app-danger/10' : 'from-app-text/10'} via-transparent to-transparent pointer-events-none opacity-50 block`} />
                  <div className="flex items-center gap-4 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                      ${
                        t.type === "income"
                          ? "bg-app-success/10 text-app-success"
                          : t.type === "expense"
                            ? "bg-app-danger/10 text-app-danger"
                            : "bg-app-text/10 text-app-text"
                      }`}
                  >
                    {t.type === "income" && <TrendingUp className="w-5 h-5" />}
                    {t.type === "expense" && (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-app-text-bright font-medium text-sm">
                        {t.note ||
                          (t.type === "income"
                            ? "Pemasukan"
                            : t.type === "expense"
                              ? "Pengeluaran"
                              : "Transfer")}
                      </p>
                      {t.categoryId && (
                          <span className="px-2 py-0.5 bg-app-card border border-app-border text-app-text text-[10px] font-bold rounded-full hidden sm:flex items-center gap-1">
                            <CategoryIcon iconId={t.categoryIcon || 'dollar-sign'} className="w-3 h-3 text-app-text/70" />
                            <span>{t.categoryName}</span>
                          </span>
                      )}
                    </div>
                    <p className="text-xs text-app-text/60 mt-0.5">
                      {format(t.date, "dd MMM yyyy", { locale: localeId })}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-sm font-bold whitespace-nowrap relative z-10
                      ${
                        t.type === "income"
                          ? "text-app-success"
                          : t.type === "expense"
                            ? "text-app-danger"
                            : "text-app-text-bright"
                      }`}
                >
                  {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""}{" "}
                  Rp {t.amount.toLocaleString("id-ID")}
                </p>
              </div>
            ))}
          </div>
        );
        })()}
      </div>
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        account={editingAccount} 
      />
    </div>
  );
}
