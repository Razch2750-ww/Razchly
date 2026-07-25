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
import { Account, Transaction, Loan } from "../types";
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
  EyeOff,
  Target,
  Scan,
  HandCoins,
  ArrowLeftRight,
  Sparkles,
  Zap,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Receipt,
  PiggyBank
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { format, subDays, isSameDay, isSameMonth } from "date-fns";
import { id as localeId, enUS as localeEn } from "date-fns/locale";
import { useTranslation } from "../utils/translations";
import { AccountModal } from "./AccountModal";
import InterestCard from "./InterestCard";
import InterestOverviewModal from "./InterestOverviewModal";
import { HoverCard, ScrollReveal, StaggerContainer, StaggerItem, TextReveal } from "./MotionWrappers";

export interface Investment {
  id: string;
  category: "saham" | "crypto" | "emas";
  code: string;
  qty: number;
  price: number;
  createdAt: number;
}

export default function Dashboard() {
  const { t, language } = useTranslation();
  const currentLocale = language === "en" ? localeEn : localeId;
  const user = useStore((state) => state.user);
  const themeId = useStore((state) => state.themeId);
  const setThemeId = useStore((state) => state.setThemeId);
  const setGlobalAddModalOpen = useStore((state) => state.setGlobalAddModalOpen);
  const setGlobalGrabModalOpen = useStore((state) => state.setGlobalGrabModalOpen);
  const hideBalances = useStore((state) => state.hideBalances);
  const toggleHideBalances = useStore((state) => state.toggleHideBalances);
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
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const navigate = useNavigate();

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [quotes, setQuotes] = useState<
    Record<
      string,
      {
        price: number;
        change: number;
        description?: string;
        logoid?: string;
        currency?: string;
        error?: string;
      }
    >
  >(() => {
    try {
      const cached = localStorage.getItem("investments_quotes_cache");
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  });

  const getLivePrice = (inv: Investment) => {
    const symbolCode = inv.category === "emas" ? "EMAS" : inv.code;
    const liveData = quotes[symbolCode];
    let livePrice = liveData?.price || inv.price;

    // Convert to IDR if currency is USD or USDT
    if (liveData?.currency === "USD" || liveData?.currency === "USDT") {
      const usdidr = quotes["USDIDR"]?.price || 16250;
      livePrice *= usdidr;
    }
    return livePrice;
  };

  const totalInvestmentValue = useMemo(() => {
    return investments.reduce((sum, inv) => {
      const mult = inv.category === "saham" ? 100 : 1;
      return sum + inv.qty * mult * getLivePrice(inv);
    }, 0);
  }, [investments, quotes]);

  const totalInvestmentCapital = useMemo(() => {
    return investments.reduce((sum, inv) => {
      const mult = inv.category === "saham" ? 100 : 1;
      return sum + inv.qty * mult * inv.price;
    }, 0);
  }, [investments]);

  const totalInvestmentReturn = totalInvestmentValue - totalInvestmentCapital;
  const totalInvestmentReturnPercent = totalInvestmentCapital > 0 
    ? (totalInvestmentReturn / totalInvestmentCapital) * 100 
    : 0;

  const accountPieData = useMemo(() => {
    return accounts.map(acc => {
      const details = getAccountIconDetails(acc.icon);
      return {
        name: acc.name,
        value: Math.max(0, acc.balance),
        color: details?.color || "var(--color-app-accent1)"
      };
    }).filter(item => item.value > 0);
  }, [accounts]);

  const categoryPieData = useMemo(() => {
    const expenseTransactions = recentTransactions.filter(t => t.type === 'expense');
    const catSums: Record<string, { name: string, value: number, color: string }> = {};
    const colors = [
      "var(--color-app-danger)",
      "var(--color-app-accent1)",
      "var(--color-app-success)",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#3B82F6",
      "#10B981"
    ];
    let colorIdx = 0;
    expenseTransactions.forEach(t => {
      const name = t.categoryName || 'Lainnya';
      const amount = t.amount || 0;
      if (!catSums[name]) {
        catSums[name] = {
          name,
          value: 0,
          color: colors[colorIdx % colors.length]
        };
        colorIdx++;
      }
      catSums[name].value += amount;
    });
    return Object.values(catSums).sort((a, b) => b.value - a.value);
  }, [recentTransactions]);

  useEffect(() => {
    if (!user) return;
    const qInv = query(collection(db, "users", user.uid, "investments"));
    const invUnsub = onSnapshot(qInv, (snap) => {
      const invs: Investment[] = [];
      snap.forEach((d) => invs.push({ id: d.id, ...d.data() } as Investment));
      setInvestments(invs);
    });
    return () => invUnsub();
  }, [user]);

  useEffect(() => {
    if (investments.length === 0) return;
    const fetchQuotes = async () => {
      const symbols = new Set(
        investments.map((i) => (i.category === "emas" ? "EMAS" : i.code)),
      );
      symbols.add("USDIDR");

      if (symbols.size === 1 && !symbols.has("USDIDR")) return;

      try {
        const res = await fetch(
          "/api/quotes?symbols=" + Array.from(symbols).join(","),
        );
        if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setQuotes((prev) => {
              const merged = { ...prev };
              Object.keys(data).forEach((key) => {
                if (!merged[key]) merged[key] = data[key];
                else {
                  merged[key] = {
                    ...merged[key],
                    ...data[key],
                    logoid: data[key].logoid || merged[key].logoid,
                    description: data[key].description || merged[key].description,
                  };
                }
              });
              localStorage.setItem("investments_quotes_cache", JSON.stringify(merged));
              return merged;
            });
          } else {
            console.warn("Expected JSON from /api/quotes, but received:", contentType);
          }
        }
      } catch (e) {
        console.error("Failed to fetch dashboard investment quotes:", e);
      }
    };
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [investments]);

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

  const getAccountIcon = (id: string) => {
    return accounts.find((a) => a.id === id)?.icon || "wallet";
  };

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

    const loanUnsub = onSnapshot(
      collection(db, "users", user.uid, "loans"),
      (snap) => {
        const fetched: Loan[] = [];
        snap.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Loan));
        setLoans(fetched);
      }
    );

    return () => {
      accUnsub();
      tsxUnsub();
      loanUnsub();
    };
  }, [user]);

  const formatRp = (value: number, options?: { showSign?: boolean; forceSign?: string; noRp?: boolean }) => {
    if (hideBalances) {
      const rpStr = options?.noRp ? "" : "Rp ";
      if (options?.forceSign) return `${options.forceSign}${rpStr}••••••••`;
      if (options?.showSign) return `${value >= 0 ? "+" : "-"}${rpStr}••••••••`;
      return `${rpStr}••••••••`;
    }
    let sign = "";
    if (options?.forceSign) {
      sign = options.forceSign;
    } else if (options?.showSign) {
      sign = value >= 0 ? "+" : "-";
    }
    
    const formattedVal = Math.abs(value).toLocaleString("id-ID");
    const rpStr = options?.noRp ? "" : "Rp ";
    if (value < 0 && !options?.showSign && !options?.forceSign) {
      return `${rpStr}-${formattedVal}`;
    }
    return `${sign}${rpStr}${formattedVal}`;
  };

  const totalBalance = accounts.filter(a => !a.excludeFromTotal).reduce((acc, curr) => acc + curr.balance, 0);

  // Income & Expense calculation for "Today"
  const incomeToday = recentTransactions
    .filter((t) => t.type === "income" && isSameDay(t.date, new Date()))
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseToday = recentTransactions
    .reduce((sum, t) => {
      if (isSameDay(t.date, new Date())) {
        if (t.type === "expense") return sum + t.amount;
        if (t.adminFee) return sum + t.adminFee;
      }
      return sum;
    }, 0);

  // Savings this month
  const incomeThisMonth = recentTransactions
    .filter((t) => t.type === "income" && isSameMonth(t.date, new Date()))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenseThisMonth = recentTransactions
    .reduce((sum, t) => {
      if (isSameMonth(t.date, new Date())) {
        if (t.type === "expense") return sum + t.amount;
        if (t.adminFee) return sum + t.adminFee;
      }
      return sum;
    }, 0);
    
  const savingsThisMonth = incomeThisMonth - expenseThisMonth;
  const savingsTargets = useStore((state) => state.monthlySavingsTargets);
  const savingsTarget = savingsTargets && savingsTargets.length > 0 ? Math.max(...savingsTargets) : 0;
  const savingsProgress = savingsTarget > 0 ? Math.min(Math.max((savingsThisMonth / savingsTarget) * 100, 0), 100) : 0;

  const financialHealthStatus = useMemo(() => {
    if (recentTransactions.length === 0) {
      return { label: "Belum Ada Data", color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/20" };
    }
    if (savingsThisMonth > 0) {
      return { label: "Sehat & Surplus", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
    }
    if (savingsThisMonth === 0) {
      return { label: "Keuangan Seimbang", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
    }
    return { label: "Pengeluaran Tinggi", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" };
  }, [recentTransactions.length, savingsThisMonth]);

  const loanStats = useMemo(() => {
    let totalHutang = 0;
    let totalPiutang = 0;

    loans.forEach((loan) => {
      const numAmount = loan.amount || 0;
      const intVal = loan.interestValue || 0;
      const interestAmount = loan.hasInterest ? (loan.interestType === 'percentage' ? (numAmount * intVal / 100) : intVal) : 0;
      const totalPayment = numAmount + interestAmount;
      const paidAmount = loan.paidAmount || 0;
      const remaining = totalPayment - paidAmount;

      if (remaining > 0) {
        if (loan.type === "lend") {
          totalPiutang += remaining;
        } else {
          totalHutang += remaining;
        }
      }
    });

    return { totalHutang, totalPiutang };
  }, [loans]);

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
          .reduce((sum, t) => {
            if (t.type === "expense") return sum + t.amount;
            if (t.adminFee) return sum + t.adminFee;
            return sum;
          }, 0);

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
          .reduce((sum, t) => {
            if (t.type === "expense") return sum + t.amount;
            if (t.adminFee) return sum + t.adminFee;
            return sum;
          }, 0);

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (language === "en") {
      if (hour >= 3 && hour < 12) return "Good Morning";
      if (hour >= 12 && hour < 17) return "Good Afternoon";
      if (hour >= 17 && hour < 21) return "Good Evening";
      return "Good Night";
    }
    if (hour >= 3 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      {/* DESKTOP HEADER */}
      <header className="hidden md:flex items-start justify-between mb-6 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[32px] leading-[1.1] font-semibold text-app-text-bright tracking-[-0.022em]">
              <TextReveal key={`${user?.displayName}-${getGreeting()}`} text={`${getGreeting()}, ${user?.displayName || "USER"}`} />
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${financialHealthStatus.bg} ${financialHealthStatus.color}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              {financialHealthStatus.label}
            </span>
          </div>
          <p className="text-app-text/60 text-[15px] font-normal tracking-[-0.02em]">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })} — Ringkasan aktivitas & kesehatan keuangan Anda
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setGlobalGrabModalOpen(true)}
            className="flex items-center gap-2 h-10 px-4 rounded-2xl bg-app-card border border-app-border hover:bg-app-hover text-app-text-bright text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Transaksi Grab"
          >
            <Car className="w-4 h-4 text-emerald-400" />
            Catat Grab
          </button>
          <button
            onClick={() => setGlobalAddModalOpen(true)}
            className="flex items-center gap-2 h-10 px-5 rounded-2xl bg-app-accent1 hover:opacity-90 active:scale-95 text-app-bg text-xs font-bold transition-all shadow-sm"
            title="Tambah Transaksi"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
          <Link
            to="/settings"
            state={{ expandSection: 'profile' }}
            className="flex items-center gap-2.5 h-10 px-3.5 rounded-2xl bg-app-card border border-app-border text-xs font-semibold text-app-text-bright hover:bg-app-hover transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-app-accent1 text-[11px] font-bold flex items-center justify-center text-app-bg overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.displayName || "USER")
              )}
            </div>
            <span className="text-app-text/80">{user?.displayName?.split(' ')[0] || "User"}</span>
          </Link>
        </div>
      </header>

      {/* MOBILE HEADER */}
      <header className="md:hidden flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            state={{ expandSection: 'profile' }}
            className="w-10 h-10 rounded-2xl bg-app-card border border-app-border flex items-center justify-center shrink-0 shadow-sm overflow-hidden active:scale-95 transition-all"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-app-accent1 text-app-bg text-xs font-bold flex items-center justify-center">
                {getInitials(user?.displayName || "USER")}
              </div>
            )}
          </Link>
          <div>
             <div className="flex items-center gap-1.5">
               <h1 className="text-base font-bold text-app-text-bright tracking-tight leading-snug">
                 {getGreeting()}, {user?.displayName?.split(' ')[0] || "User"}
               </h1>
             </div>
             <p className="text-app-text/60 text-[11px] font-medium">
               {format(new Date(), "EEEE, d MMM yyyy", { locale: localeId })}
             </p>
          </div>
        </div>
      </header>

      {/* QUICK SHORTCUTS RIBBON (ALL DEVICES) */}
      <ScrollReveal className="mb-5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setGlobalAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-app-accent1/10 border border-app-accent1/20 text-app-accent1 hover:bg-app-accent1/20 transition-all text-xs font-semibold whitespace-nowrap shrink-0 active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pemasukan / Pengeluaran</span>
          </button>
          <button
            onClick={() => setGlobalGrabModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-semibold whitespace-nowrap shrink-0 active:scale-95"
          >
            <Car className="w-3.5 h-3.5" />
            <span>Usaha Grab</span>
          </button>
          <button
            onClick={() => navigate('/savings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 transition-all text-xs font-semibold whitespace-nowrap shrink-0 active:scale-95"
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Tabungan</span>
          </button>
          <button
            onClick={() => navigate('/loans')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-xs font-semibold whitespace-nowrap shrink-0 active:scale-95"
          >
            <HandCoins className="w-3.5 h-3.5" />
            <span>Hutang & Piutang</span>
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-all text-xs font-semibold whitespace-nowrap shrink-0 active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scan AI</span>
          </button>
        </div>
      </ScrollReveal>

      {/* MOBILE TOTAL SALDO WIDGET */}
      <ScrollReveal className="md:hidden mb-5">
        <HoverCard 
          onClick={() => navigate("/transactions", { state: { tab: "Semua" } })}
          className="bg-app-card border border-app-border rounded-[22px] p-4 sm:p-5 relative overflow-hidden text-app-text shadow-sm cursor-pointer"
        >
          <div className="flex justify-between items-start relative z-10 mb-3">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-app-accent1/15 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-app-accent1" />
                  </div>
                  <p className="text-app-text/70 text-xs font-semibold">Total Saldo</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${financialHealthStatus.bg} ${financialHealthStatus.color}`}>
                    {financialHealthStatus.label}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-app-text-bright break-words tracking-tight leading-tight my-1 font-mono">
                  {formatRp(totalBalance)}
                </h2>
                <p className="text-app-text/50 text-[11px] font-medium">
                  {accounts.length} {t('dashboard.allWallets')} · {format(new Date(), "MMMM yyyy", { locale: localeId })}
                </p>
             </div>
             <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleHideBalances();
                }}
                className="p-2 rounded-xl bg-app-bg border border-app-border/60 text-app-text/60 hover:text-app-text-bright transition-colors shrink-0"
                title={hideBalances ? (language === 'en' ? "Show Balances" : "Tampilkan Saldo") : (language === 'en' ? "Hide Balances" : "Sembunyikan Saldo")}
             >
                {hideBalances ? (
                  <EyeOff className="w-4 h-4 text-app-accent1" />
                ) : (
                  <Eye className="w-4 h-4 text-app-text/70" />
                )}
             </button>
          </div>

          {/* Today & Monthly Cash Flow Box */}
          <div className="p-3 rounded-2xl bg-app-bg/80 border border-app-border/50 relative z-10 space-y-2.5">
            {/* Today Cash Flow (2 columns so labels and values never truncate) */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-app-card/70 p-2.5 rounded-xl border border-app-border/30">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-app-success shrink-0" />
                  <span className="text-app-text/60 text-[10px] sm:text-[11px] font-medium whitespace-nowrap">{t('dashboard.incomeToday')}</span>
                </div>
                <p className="text-app-success font-bold font-mono text-xs">{formatRp(incomeToday, { forceSign: "+" })}</p>
              </div>

              <div className="bg-app-card/70 p-2.5 rounded-xl border border-app-border/30">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-app-danger shrink-0" />
                  <span className="text-app-text/60 text-[10px] sm:text-[11px] font-medium whitespace-nowrap">{t('dashboard.expenseToday')}</span>
                </div>
                <p className="text-app-danger font-bold font-mono text-xs">{formatRp(expenseToday, { forceSign: "-" })}</p>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="pt-2 border-t border-app-border/40 grid grid-cols-3 gap-1 text-center">
              <div>
                <p className="text-app-text/50 text-[10px] font-medium whitespace-nowrap">{language === 'en' ? 'Income' : 'Masuk (Bln)'}</p>
                <p className="text-app-success font-semibold font-mono text-[11px] mt-0.5 leading-tight">{formatRp(incomeThisMonth)}</p>
              </div>
              <div>
                <p className="text-app-text/50 text-[10px] font-medium whitespace-nowrap">{language === 'en' ? 'Expense' : 'Keluar (Bln)'}</p>
                <p className="text-app-danger font-semibold font-mono text-[11px] mt-0.5 leading-tight">{formatRp(expenseThisMonth)}</p>
              </div>
              <div>
                <p className="text-app-text/50 text-[10px] font-medium whitespace-nowrap">Net (Bln)</p>
                <p className={`font-semibold font-mono text-[11px] mt-0.5 leading-tight ${savingsThisMonth >= 0 ? 'text-app-accent1' : 'text-app-danger'}`}>{formatRp(savingsThisMonth, { showSign: true })}</p>
              </div>
            </div>
          </div>
        </HoverCard>
      </ScrollReveal>

      {/* MOBILE INVESTASI & PINJAMAN WIDGETS */}
      <div className="md:hidden grid grid-cols-2 gap-4 mb-6">
        <ScrollReveal delay={0.08} className="h-full">
          <HoverCard 
            onClick={() => navigate("/investments")}
            className="bg-app-card border border-app-border rounded-[22px] p-4 relative overflow-hidden text-app-text shadow-sm cursor-pointer h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-1.5 gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-app-accent1/15 flex items-center justify-center shrink-0">
                    <TrendingUp className={`w-3.5 h-3.5 ${totalInvestmentReturn >= 0 ? "text-app-success" : "text-app-danger"}`} />
                  </div>
                  <span className="text-app-text/90 text-xs font-semibold whitespace-nowrap">{t('dashboard.investments')}</span>
                </div>
                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${totalInvestmentReturn >= 0 ? "bg-app-success/15 text-app-success" : "bg-app-danger/15 text-app-danger"}`}>
                  {totalInvestmentReturn >= 0 ? "+" : ""}{totalInvestmentReturnPercent.toFixed(1)}%
                </span>
              </div>

              <h2 className="text-sm font-bold text-app-text-bright font-mono my-1 leading-tight">{formatRp(totalInvestmentValue)}</h2>
            </div>

            <div className="pt-2 mt-2 border-t border-app-border/40 space-y-1 text-[10px]">
               <div className="flex justify-between items-center gap-1">
                  <span className="text-app-text/50 font-medium whitespace-nowrap">{t('dashboard.capital')}</span>
                  <span className="text-app-text-bright font-semibold font-mono text-right">{formatRp(totalInvestmentCapital)}</span>
               </div>
               <div className="flex justify-between items-center gap-1">
                  <span className="text-app-text/50 font-medium whitespace-nowrap">{t('dashboard.returns')}</span>
                  <span className={`font-semibold font-mono text-right ${totalInvestmentReturn >= 0 ? "text-app-success" : "text-app-danger"}`}>
                     {formatRp(totalInvestmentReturn, { showSign: true })}
                  </span>
               </div>
            </div>
          </HoverCard>
        </ScrollReveal>

        <ScrollReveal delay={0.12} className="h-full">
          <HoverCard 
            onClick={() => navigate("/loans")}
            className="bg-app-card border border-app-border rounded-[22px] p-4 relative overflow-hidden text-app-text shadow-sm cursor-pointer h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-1.5 gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-lg bg-app-warning/15 flex items-center justify-center shrink-0">
                    <HandCoins className="w-3.5 h-3.5 text-app-accent1" />
                  </div>
                  <span className="text-app-text/90 text-xs font-semibold whitespace-nowrap">{language === 'en' ? 'Loans' : 'Pinjaman'}</span>
                </div>
                <span className="text-[9.5px] font-bold text-app-text/60 bg-app-hover px-1 py-0.5 rounded-md shrink-0">Net</span>
              </div>

              <h2 className="text-sm font-bold text-app-text-bright font-mono my-1 leading-tight">{formatRp(loanStats.totalPiutang - loanStats.totalHutang)}</h2>
            </div>

            <div className="pt-2 mt-2 border-t border-app-border/40 space-y-1 text-[10px]">
               <div className="flex justify-between items-center gap-1">
                  <span className="text-app-text/50 font-medium whitespace-nowrap">{language === 'en' ? 'Receivable' : 'Piutang'}</span>
                  <span className="text-app-success font-semibold font-mono text-right">{formatRp(loanStats.totalPiutang)}</span>
               </div>
               <div className="flex justify-between items-center gap-1">
                  <span className="text-app-text/50 font-medium whitespace-nowrap">{language === 'en' ? 'Debt' : 'Hutang'}</span>
                  <span className="text-app-danger font-semibold font-mono text-right">{formatRp(loanStats.totalHutang)}</span>
               </div>
            </div>
          </HoverCard>
        </ScrollReveal>
      </div>

      {/* DESKTOP TOP WIDGETS - bento asymmetric layout with equal gap-6 */}
      <div className="hidden md:grid grid-cols-3 gap-6 mb-6">
        {/* HERO: TOTAL SALDO - takes 2 cols */}
        <ScrollReveal className="col-span-2 h-full">
          <HoverCard
            onClick={() => navigate("/transactions", { state: { tab: "Semua" } })}
            className="bg-app-card rounded-[22px] p-6 border border-app-border shadow-sm cursor-pointer overflow-hidden relative h-full flex flex-col justify-between"
          >
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-app-accent1/15 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-app-accent1" />
                    </div>
                    <div>
                      <span className="text-app-text/70 text-xs font-semibold block">{t('dashboard.totalBalance')}</span>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-0.5 ${financialHealthStatus.bg} ${financialHealthStatus.color}`}>
                        {financialHealthStatus.label}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHideBalances();
                    }}
                    className="p-2 rounded-xl hover:bg-app-hover text-app-text/60 hover:text-app-text-bright transition-colors"
                    title={hideBalances ? (language === 'en' ? "Show Balances" : "Tampilkan Saldo") : (language === 'en' ? "Hide Balances" : "Sembunyikan Saldo")}
                  >
                    {hideBalances ? (
                      <EyeOff className="w-5 h-5 text-app-accent1" />
                    ) : (
                      <Eye className="w-5 h-5 text-app-text/40" />
                    )}
                  </button>
                </div>

                <p className="text-[36px] lg:text-[42px] leading-tight font-bold tracking-[-0.02em] text-app-text-bright font-mono">
                  {formatRp(totalBalance)}
                </p>
                <p className="text-app-text/50 text-xs mt-1.5 font-medium">
                  {accounts.length} {t('dashboard.allWallets')} · {format(new Date(), "MMMM yyyy", { locale: currentLocale })}
                </p>
              </div>

              {/* Bottom Financial Breakdown Box */}
              <div className="mt-5 p-4 rounded-2xl bg-app-bg/60 border border-app-border/50 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-[11px] text-app-text/60 font-medium mb-1 truncate">
                    {language === 'en' ? 'Income (Month)' : 'Pemasukan Bulan Ini'}
                  </p>
                  <p className="text-sm lg:text-base font-bold text-app-success font-mono truncate">
                    {formatRp(incomeThisMonth)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-app-text/60 font-medium mb-1 truncate">
                    {language === 'en' ? 'Expense (Month)' : 'Pengeluaran Bulan Ini'}
                  </p>
                  <p className="text-sm lg:text-base font-bold text-app-danger font-mono truncate">
                    {formatRp(expenseThisMonth)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-app-text/60 font-medium mb-1 truncate">
                    {language === 'en' ? 'Net Cash Flow' : 'Arus Kas (Net)'}
                  </p>
                  <p className={`text-sm lg:text-base font-bold font-mono truncate ${savingsThisMonth >= 0 ? 'text-app-accent1' : 'text-app-danger'}`}>
                    {formatRp(savingsThisMonth, { showSign: true })}
                  </p>
                </div>
              </div>
            </div>
          </HoverCard>
        </ScrollReveal>

        {/* RIGHT SIDE: 2×2 compact grid */}
        <div className="grid grid-rows-2 gap-4 h-full">
          {/* Row 1: Pemasukan + Pengeluaran side by side */}
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Pemasukan */}
            <ScrollReveal delay={0.05} className="h-full">
              <HoverCard
                onClick={() => navigate("/transactions", { state: { tab: "Pemasukan" } })}
                className="bg-app-card rounded-[22px] p-4 border border-app-border shadow-sm cursor-pointer overflow-hidden relative h-full flex flex-col justify-between hover:border-app-success/40 transition-all"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-app-success/15 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 text-app-success" />
                    </div>
                    <span className="text-app-text/80 text-xs font-semibold">{language === 'en' ? 'Income' : 'Masuk'}</span>
                  </div>
                  <span className="text-[10px] font-medium text-app-text/50 bg-app-hover px-1.5 py-0.5 rounded-md">{t('common.today')}</span>
                </div>

                <p className="text-app-text-bright text-base lg:text-lg font-bold tracking-tight font-mono relative z-10 truncate my-1">
                  {formatRp(incomeToday)}
                </p>

                <div className="text-[11px] text-app-text/50 font-medium flex items-center justify-between pt-2 border-t border-app-border/40 relative z-10">
                  <span className="truncate">{language === 'en' ? 'Month' : 'Bulan Ini'}</span>
                  <span className="text-app-success font-semibold font-mono truncate ml-1">{formatRp(incomeThisMonth)}</span>
                </div>
              </HoverCard>
            </ScrollReveal>

            {/* Pengeluaran */}
            <ScrollReveal delay={0.08} className="h-full">
              <HoverCard
                onClick={() => navigate("/transactions", { state: { tab: "Pengeluaran" } })}
                className="bg-app-card rounded-[22px] p-4 border border-app-border shadow-sm cursor-pointer overflow-hidden relative h-full flex flex-col justify-between hover:border-app-danger/40 transition-all"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-app-danger/15 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-3.5 h-3.5 text-app-danger" />
                    </div>
                    <span className="text-app-text/80 text-xs font-semibold">{language === 'en' ? 'Expenses' : 'Keluar'}</span>
                  </div>
                  <span className="text-[10px] font-medium text-app-text/50 bg-app-hover px-1.5 py-0.5 rounded-md">{t('common.today')}</span>
                </div>

                <p className="text-app-text-bright text-base lg:text-lg font-bold tracking-tight font-mono relative z-10 truncate my-1">
                  {formatRp(expenseToday)}
                </p>

                <div className="text-[11px] text-app-text/50 font-medium flex items-center justify-between pt-2 border-t border-app-border/40 relative z-10">
                  <span className="truncate">{language === 'en' ? 'Month' : 'Bulan Ini'}</span>
                  <span className="text-app-danger font-semibold font-mono truncate ml-1">{formatRp(expenseThisMonth)}</span>
                </div>
              </HoverCard>
            </ScrollReveal>
          </div>

          {/* Row 2: Investasi + Pinjaman side by side */}
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* Investasi */}
            <ScrollReveal delay={0.1} className="h-full">
              <HoverCard
                onClick={() => navigate("/investments")}
                className="bg-app-card rounded-[22px] p-4 border border-app-border shadow-sm cursor-pointer overflow-hidden relative h-full flex flex-col justify-between hover:border-app-accent1/40 transition-all"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-app-accent1/15 flex items-center justify-center shrink-0">
                      <TrendingUp className={`w-3.5 h-3.5 ${totalInvestmentReturn >= 0 ? "text-app-success" : "text-app-danger"}`} />
                    </div>
                    <span className="text-app-text/80 text-xs font-semibold">{t('dashboard.investments')}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${totalInvestmentReturn >= 0 ? "bg-app-success/15 text-app-success" : "bg-app-danger/15 text-app-danger"}`}>
                    {totalInvestmentReturn >= 0 ? "+" : ""}{totalInvestmentReturnPercent.toFixed(1)}%
                  </span>
                </div>

                <p className="text-app-text-bright text-base lg:text-lg font-bold tracking-tight font-mono relative z-10 truncate my-1">
                  {formatRp(totalInvestmentValue)}
                </p>

                <div className="text-[11px] text-app-text/50 font-medium flex items-center justify-between pt-2 border-t border-app-border/40 relative z-10">
                  <span className="truncate">Return</span>
                  <span className={`font-semibold font-mono truncate ml-1 ${totalInvestmentReturn >= 0 ? "text-app-success" : "text-app-danger"}`}>
                    {formatRp(totalInvestmentReturn, { showSign: true })}
                  </span>
                </div>
              </HoverCard>
            </ScrollReveal>

            {/* Pinjaman */}
            <ScrollReveal delay={0.12} className="h-full">
              <HoverCard
                onClick={() => navigate("/loans")}
                className="bg-app-card rounded-[22px] p-4 border border-app-border shadow-sm cursor-pointer overflow-hidden relative h-full flex flex-col justify-between hover:border-app-accent1/40 transition-all"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-app-warning/15 flex items-center justify-center shrink-0">
                      <HandCoins className="w-3.5 h-3.5 text-app-accent1" />
                    </div>
                    <span className="text-app-text/80 text-xs font-semibold">{t('dashboard.loans')}</span>
                  </div>
                  <span className="text-[10px] font-medium text-app-text/50 bg-app-hover px-1.5 py-0.5 rounded-md">Net</span>
                </div>

                <p className="text-app-text-bright text-base lg:text-lg font-bold tracking-tight font-mono relative z-10 truncate my-1">
                  {formatRp(loanStats.totalPiutang - loanStats.totalHutang)}
                </p>

                <div className="text-[11px] text-app-text/50 font-medium flex items-center justify-between pt-2 border-t border-app-border/40 relative z-10">
                  <span className="text-app-success font-mono truncate">+{formatRp(loanStats.totalPiutang, { noRp: true })}</span>
                  <span className="text-app-danger font-mono truncate ml-1">-{formatRp(loanStats.totalHutang, { noRp: true })}</span>
                </div>
              </HoverCard>
            </ScrollReveal>
          </div>
        </div>
      </div>


      {/* INTEREST OVERVIEW CARD */}
      <ScrollReveal className="mb-6 w-full">
        <InterestCard
          accounts={accounts}
          transactions={recentTransactions}
          onOpenModal={() => setIsInterestModalOpen(true)}
        />
      </ScrollReveal>

      {/* MOBILE MIDDLE SECTION */}
      <div className="md:hidden space-y-6 mb-6">
        {/* DOMPET SAYA */}
        <div>
          <div className="flex justify-between items-center mb-3 px-1">
              <h2 className="text-app-text-bright text-lg font-semibold tracking-[-0.01em]">{t('dashboard.myWallets')}</h2>
              <Link to="/settings" state={{ expandSection: "accounts" }} className="text-app-accent1 text-xs font-semibold">{t('dashboard.viewAll')}</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
             {sortedAccounts.map(acc => {
                const iconDetails = getAccountIconDetails(acc.icon);
                const hasCustomColor = iconDetails?.color;
                
                return (
                <div key={acc.id} onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }} className="min-w-[150px] bg-app-card rounded-[22px] p-4 flex flex-col justify-between border border-app-border relative overflow-hidden cursor-pointer shadow-sm">
                  {hasCustomColor ? (
                    <div 
                      className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-80 block"
                      style={{ background: `linear-gradient(to bottom right, color-mix(in srgb, ${iconDetails.color} 25%, transparent), transparent, transparent)` }}
                    />
                  ) : (
                    <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${iconDetails?.type === 'cash' ? 'from-app-success/5' : 'from-app-accent1/15'} via-transparent to-transparent pointer-events-none opacity-80 block`} />
                  )}
                  <div className="relative z-10">
                     <AccountIcon iconId={acc.icon} className="w-10 h-10 shrink-0 mb-3" />
                     <div>
                        <p className="text-app-text-bright text-xs mb-0.5 line-clamp-1 uppercase font-semibold">{acc.name}</p>
                        <p className="text-app-success font-bold font-mono text-sm mb-1.5">{formatRp(acc.balance)}</p>
                        <div className="flex items-center gap-1 text-app-text/60 text-[10px]">
                           <Edit2 className="w-3 h-3" />
                           <span>{language === 'en' ? 'Adjust' : 'Sesuaikan'}</span>
                        </div>
                     </div>
                  </div>
                </div>
             )})}
             <div onClick={() => { navigate('/settings', { state: { expandSection: "accounts" } }) }} className="min-w-[120px] bg-app-card rounded-[22px] p-4 flex flex-col items-center justify-center border border-app-border cursor-pointer shadow-sm">
                <div className="w-10 h-10 rounded-full bg-app-hover flex items-center justify-center mb-2">
                   <Plus className="w-5 h-5 text-app-accent1" />
                </div>
                <p className="text-app-text/60 text-xs font-semibold text-center">{language === 'en' ? 'Manage' : 'Kelola'}<br/>{language === 'en' ? 'Wallets' : 'Dompet'}</p>
             </div>
          </div>
        </div>

        {/* MOBILE ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-4">
            <button onClick={() => navigate('/transactions')} className="bg-app-card border border-app-border p-4 rounded-[22px] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-app-hover shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-app-accent1/10 flex items-center justify-center">
                   <BarChart2 className="w-5 h-5 text-app-accent1" />
                </div>
                <span className="text-app-text-bright font-semibold text-xs text-center leading-tight">{language === 'en' ? 'Reports' : 'Laporan Keuangan'}</span>
            </button>
            <button onClick={() => navigate('/grab')} className="bg-app-card border border-app-border p-4 rounded-[22px] flex flex-col items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-app-hover shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                   <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-app-text-bright font-semibold text-xs text-center leading-tight">{language === 'en' ? 'Business Analytics' : 'Analisis Usaha'}</span>
            </button>
        </div>
      </div>

      {/* DESKTOP MIDDLE SECTION */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* DOMPET SAYA */}
        <ScrollReveal className="lg:col-span-1 bg-app-card rounded-[22px] p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center mb-5 relative z-10">
            <h2 className="text-app-text-bright text-[20px] font-semibold tracking-[-0.01em]">{t('dashboard.myWallets')}</h2>
            <div className="relative">
              <button 
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 text-xs font-semibold text-app-text/70 hover:text-app-text px-2.5 py-1.5 rounded-xl hover:bg-app-hover transition-colors border border-app-border/50"
                title={language === 'en' ? 'Sort' : 'Urutkan'}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {language === 'en' ? 'Sort' : 'Urutkan'}
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-app-card border border-app-border rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => { setAccountSort("balance_desc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                    >
                      {t('dashboard.sortBalanceDesc')}
                      {accountSort === "balance_desc" && <Check className="w-3.5 h-3.5 text-app-accent1" />}
                    </button>
                    <button
                      onClick={() => { setAccountSort("balance_asc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                    >
                      {t('dashboard.sortBalanceAsc')}
                      {accountSort === "balance_asc" && <Check className="w-3.5 h-3.5 text-app-accent1" />}
                    </button>
                    <div className="h-px w-full bg-app-border/50 my-1" />
                    <button
                      onClick={() => { setAccountSort("name_asc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                    >
                      {t('dashboard.sortNameAsc')}
                      {accountSort === "name_asc" && <Check className="w-3.5 h-3.5 text-app-accent1" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="space-y-3 flex-1 max-h-[320px] overflow-y-auto pr-1 overflow-x-hidden scrollbar-thin">
            {sortedAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-app-text/50 text-xs py-8">
                <Wallet className="w-8 h-8 text-app-text/30 mb-2 animate-waggle" />
                {language === 'en' ? 'No wallets yet' : 'Belum ada dompet'}
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
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-app-bg border border-app-border hover:border-app-accent1/50 transition cursor-pointer relative overflow-hidden group"
                >
                  {hasCustomColor ? (
                    <div 
                      className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-80 block"
                      style={{ background: `linear-gradient(to bottom right, color-mix(in srgb, ${iconDetails.color} 25%, transparent), transparent, transparent)` }}
                    />
                  ) : (
                    <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${iconDetails?.type === 'cash' ? 'from-app-success/5' : 'from-app-accent1/15'} via-transparent to-transparent pointer-events-none opacity-80 block`} />
                  )}
                  <div className="flex items-center gap-3.5 relative z-10">
                    <AccountIcon iconId={acc.icon} className="w-9 h-9 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-app-text-bright font-semibold text-xs">
                          {acc.name}
                        </p>
                        {acc.isPrimary && (
                          <span className="bg-app-accent1/20 text-app-accent1 text-[9px] font-bold px-2 py-0.5 rounded-md">
                            {language === 'en' ? 'PRIMARY' : 'UTAMA'}
                          </span>
                        )}
                      </div>
                      <p className="text-app-text/70 text-xs font-mono font-semibold mt-0.5">
                        {formatRp(acc.balance)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-app-text/40 group-hover:text-app-accent1 transition-colors relative z-10" />
                </div>
                );
              })
            )}
          </div>
          <Link
            to="/settings"
            state={{ expandSection: 'accounts' }}
            className="mt-4 flex items-center justify-center p-3 rounded-xl border border-dashed border-app-border hover:border-app-accent1/50 transition cursor-pointer text-app-text/70 text-xs font-semibold"
          >
            <Plus className="w-4 h-4 mr-1.5 text-app-accent1" />
            {language === 'en' ? 'Add Wallet' : 'Tambah Dompet'}
          </Link>
        </ScrollReveal>

        {/* ALUR KAS (CHART) */}
        <ScrollReveal delay={0.1} className="lg:col-span-2 bg-app-card rounded-[22px] p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 relative z-10">
            <div>
              <h2 className="text-app-text-bright text-[20px] font-semibold tracking-[-0.01em]">{t('dashboard.cashflowTitle')}</h2>
              <p className="text-app-text/60 text-xs font-medium">Tren perbandingan pemasukan vs pengeluaran</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={selectedChartAccount}
                onChange={(e) => setSelectedChartAccount(e.target.value)}
                className="bg-app-bg border border-app-border rounded-xl px-3 py-1.5 text-xs font-medium text-app-text-bright focus:outline-none focus:border-app-accent1 transition-colors cursor-pointer"
              >
                <option value="all">{language === 'en' ? 'All Accounts' : 'Semua Rekening'}</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              <div className="bg-app-bg rounded-xl p-1 border border-app-border flex gap-1">
                <button
                  onClick={() => setChartPeriod(0)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${chartPeriod === 0 ? "bg-app-accent1 text-app-bg shadow-sm" : "text-app-text/60 hover:text-app-text-bright"}`}
                >
                  {t('dashboard.day')}
                </button>
                <button
                  onClick={() => setChartPeriod(7)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${chartPeriod === 7 ? "bg-app-accent1 text-app-bg shadow-sm" : "text-app-text/60 hover:text-app-text-bright"}`}
                >
                  {language === 'en' ? '7 Days' : '7 Hari'}
                </button>
                <button
                  onClick={() => setChartPeriod(30)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${chartPeriod === 30 ? "bg-app-accent1 text-app-bg shadow-sm" : "text-app-text/60 hover:text-app-text-bright"}`}
                >
                  {language === 'en' ? '30 Days' : '30 Hari'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] sm:min-h-[260px] w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="dashboardIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-app-success)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-app-success)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="dashboardExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-app-danger)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--color-app-danger)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
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
                  dy={5}
                  opacity={0.7}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--color-app-text)" }}
                  opacity={0.7}
                />
                <Tooltip
                  formatter={(value: number) => [hideBalances ? "Rp ••••••••" : `Rp ${value.toLocaleString("id-ID")}`, undefined]}
                  contentStyle={{
                    backgroundColor: "var(--color-app-card)",
                    border: "1px solid var(--color-app-border)",
                    borderRadius: "12px",
                    padding: "8px 12px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
                  }}
                  itemStyle={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-app-text-bright)",
                  }}
                  labelStyle={{
                    fontSize: 11,
                    color: "var(--color-app-text)",
                    marginBottom: 4,
                  }}
                />
                <Area
                  type="monotone"
                  name={t('dashboard.income')}
                  dataKey="income"
                  stroke="var(--color-app-success)"
                  fill="url(#dashboardIncomeGrad)"
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  name={t('dashboard.expense')}
                  dataKey="expense"
                  stroke="var(--color-app-danger)"
                  fill="url(#dashboardExpenseGrad)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-auto pt-3 flex items-center justify-between border-t border-app-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-app-accent1 shrink-0"></div>
              <span className="text-app-text/70 text-xs font-semibold uppercase tracking-wide truncate">
                {chartPeriod === 0 ? (language === 'en' ? "Today's Net Profit" : "Estimasi Laba Bersih Hari Ini") : (language === 'en' ? `Net Profit ${chartPeriod}D` : `Estimasi Laba Bersih ${chartPeriod} Hari`)}
              </span>
            </div>
            <span className="text-app-accent1 font-bold text-sm sm:text-base font-mono shrink-0 ml-2">
              {formatRp(chartData.reduce((acc, curr) => acc + (curr.income - curr.expense), 0))}
            </span>
          </div>
        </ScrollReveal>
      </div>

      {/* DESKTOP & MOBILE VISUAL ANALYTICS (PIE CHARTS) */}
      <ScrollReveal className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* PIE CHART 1: ALOKASI SALDO DOMPET */}
        <div className="bg-app-card rounded-[22px] p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-app-text-bright text-base sm:text-lg font-semibold tracking-tight">{language === 'en' ? 'Wallet Balance Allocation' : 'Alokasi Saldo Dompet'}</h2>
            <PieChartIcon className="w-4.5 h-4.5 text-app-accent1" />
          </div>
          {accountPieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-app-text/50 text-xs py-8 min-h-[160px]">
              <Wallet className="w-7 h-7 text-app-text/30 mb-1.5" />
              {language === 'en' ? 'No active wallet balance data' : 'Tidak ada data saldo dompet aktif'}
            </div>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[160px]">
              <div className="w-full sm:w-1/2 h-[160px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {accountPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [hideBalances ? "Rp ••••••••" : `Rp ${value.toLocaleString("id-ID")}`, language === 'en' ? 'Balance' : 'Saldo']}
                      contentStyle={{
                        backgroundColor: "var(--color-app-card)",
                        border: "1px solid var(--color-app-border)",
                        borderRadius: "12px",
                        padding: "8px 12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                {accountPieData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs p-1.5 rounded-xl bg-app-bg/60 border border-app-border/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-app-text-bright font-medium truncate text-[11px]">{item.name}</span>
                    </div>
                    <span className="text-app-accent1 font-mono font-bold text-[11px] ml-2">
                      {((item.value / (totalBalance || 1)) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PIE CHART 2: DISTRIBUSI PENGELUARAN */}
        <div className="bg-app-card rounded-[22px] p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="text-app-text-bright text-base sm:text-lg font-semibold tracking-tight">{language === 'en' ? 'This Month Expense Distribution' : 'Distribusi Pengeluaran Bulan Ini'}</h2>
            <BarChart2 className="w-4.5 h-4.5 text-app-danger" />
          </div>
          {categoryPieData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-app-text/50 text-xs py-8 min-h-[160px]">
              <TrendingDown className="w-7 h-7 text-app-text/30 mb-1.5" />
              {language === 'en' ? 'No expense data this month' : 'Tidak ada data pengeluaran bulan ini'}
            </div>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 min-h-[160px]">
              <div className="w-full sm:w-1/2 h-[160px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [hideBalances ? "Rp ••••••••" : `Rp ${value.toLocaleString("id-ID")}`, language === 'en' ? 'Expense' : 'Pengeluaran']}
                      contentStyle={{
                        backgroundColor: "var(--color-app-card)",
                        border: "1px solid var(--color-app-border)",
                        borderRadius: "12px",
                        padding: "8px 12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full sm:w-1/2 space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                {categoryPieData.map((item, index) => {
                  const totalExpense = categoryPieData.reduce((s, i) => s + i.value, 0);
                  return (
                    <div key={index} className="flex items-center justify-between text-xs p-1.5 rounded-xl bg-app-bg/60 border border-app-border/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-app-text-bright font-medium truncate text-[11px]">{item.name}</span>
                      </div>
                      <span className="text-app-danger font-mono font-bold text-[11px] ml-2">
                        {((item.value / (totalExpense || 1)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </ScrollReveal>

      {/* MOBILE BOTTOM SECTION - TRANSACTIONS */}
      <div className="md:hidden pb-12">
        <div className="flex justify-between items-center mb-6 px-1">
            <h2 className="text-app-text-bright text-[20px] font-semibold tracking-[-0.01em]">Transaksi Terbaru</h2>
            <Link to="/transactions" state={{ tab: "Semua" }} className="text-app-accent1 text-[13px] font-medium">Lihat Semua</Link>
        </div>
        {(() => {
          const todayMobileTransactions = recentTransactions.filter(t => isSameDay(t.date, new Date()));
          return todayMobileTransactions.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-app-card border border-app-border flex items-center justify-center mb-5">
                 <FileText className="w-8 h-8 text-app-accent1 animate-waggle" />
              </div>
              <p className="text-app-text-bright font-semibold mb-1.5">Belum ada transaksi hari ini</p>
              <p className="text-app-text/60 text-[13px]">Mulai catat transaksi pertama Anda hari ini</p>
           </div>
          ) : (
           <div className="space-y-3">
              {todayMobileTransactions.map((t) => (
                 <div key={t.id} onClick={() => navigate('/transactions', { state: { tab: "Semua" } })} className="flex items-center justify-between p-4 rounded-2xl bg-app-card border border-app-border active:scale-[0.98] transition-transform relative overflow-hidden">
                     
                     <div className="flex items-center gap-4 relative z-10">
                       <div className={`w-12 h-12 rounded-[1.1rem] flex items-center justify-center shrink-0 ${t.type === "income" ? "bg-app-success/10 text-app-success" : t.type === "expense" ? "bg-app-danger/10 text-app-danger" : "bg-app-accent1/10 text-app-accent1"}`}>
                         {t.type === "income" && <TrendingUp className="w-5 h-5" />}
                         {t.type === "expense" && <TrendingDown className="w-5 h-5" />}
                         {t.type === "transfer" && (
                           <AccountIcon
                             iconId={getAccountIcon(t.fromAccountId)}
                             className="w-6 h-6 border-0 bg-transparent shadow-none"
                           />
                         )}
                       </div>
                       <div>
                         <div className="flex items-center gap-2 mb-0.5">
                           <p className="text-app-text-bright font-semibold text-[15px]">
                             {t.note || (t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer")}
                           </p>
                           {t.categoryId && (
                              <span className="px-2 py-0.5 bg-app-bg border border-app-border text-app-text text-[10px] font-semibold rounded-full hidden sm:flex items-center gap-1">
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
                     <p className={`text-[17px] font-semibold whitespace-nowrap relative z-10 ${t.type === "income" ? "text-app-success" : t.type === "expense" ? "text-app-danger" : "text-app-text"}`}>
                       {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} Rp {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(t.amount)}
                       {Boolean(t.adminFee) && (
                         <span className="block text-[10px] text-app-danger font-semibold text-right mt-0.5">
                           Fee: -Rp {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(t.adminFee)}
                         </span>
                       )}
                     </p>
                 </div>
              ))}
           </div>
          );
        })()}
      </div>

      {/* DESKTOP BOTTOM SECTION - TRANSACTIONS */}
      <ScrollReveal className="hidden md:flex bg-app-card rounded-[22px] p-6 border border-app-border flex-col shadow-sm shrink-0 overflow-hidden relative">
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div>
            <h2 className="text-app-text-bright text-[20px] font-semibold tracking-[-0.01em]">{t('dashboard.recentTransactions')}</h2>
            <p className="text-app-text/60 text-xs font-medium">Aktivitas transaksi keuangan Anda hari ini</p>
          </div>
          <Link
            to="/transactions"
            state={{ tab: "Semua" }}
            className="text-app-accent1 text-xs font-semibold hover:underline flex items-center gap-1 bg-app-accent1/10 border border-app-accent1/20 px-3 py-1.5 rounded-xl transition-all"
          >
            {language === 'en' ? 'View all transactions' : 'Lihat semua transaksi'} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(() => {
          const filteredBottomTransactions = selectedChartAccount === "all" ? recentTransactions : recentTransactions.filter(t => t.accountId === selectedChartAccount);
          const todayDesktopTransactions = filteredBottomTransactions.filter(t => isSameDay(t.date, new Date()));
          return todayDesktopTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-app-bg border border-app-border border-dashed relative z-10">
              <FileText className="w-8 h-8 text-app-text/30 mb-2 animate-waggle" />
              <p className="text-app-text/60 text-xs font-medium">{language === 'en' ? 'No transactions recorded today' : 'Belum ada transaksi yang dicatat hari ini'}</p>
            </div>
          ) : (
            <div className="space-y-3 relative z-10">
              {todayDesktopTransactions.map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => navigate('/transactions', { state: { tab: "Semua" } })}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-app-bg border border-app-border hover:border-app-accent1/50 transition cursor-pointer relative overflow-hidden group"
                >
                  <div className="flex items-center gap-3.5 relative z-10">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                        ${
                          tx.type === "income"
                            ? "bg-app-success/10 text-app-success"
                            : tx.type === "expense"
                              ? "bg-app-danger/10 text-app-danger"
                              : "bg-app-accent1/10 text-app-accent1"
                        }`}
                    >
                      {tx.type === "income" && <TrendingUp className="w-5 h-5" />}
                      {tx.type === "expense" && <TrendingDown className="w-5 h-5" />}
                      {tx.type === "transfer" && (
                        <AccountIcon
                          iconId={getAccountIcon(tx.fromAccountId)}
                          className="w-5 h-5 border-0 bg-transparent shadow-none"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-app-text-bright font-semibold text-xs">
                          {tx.note ||
                            (tx.type === "income"
                              ? t('dashboard.income')
                              : tx.type === "expense"
                                ? t('dashboard.expense')
                                : "Transfer")}
                        </p>
                        {tx.categoryId && (
                            <span className="px-2 py-0.5 bg-app-card border border-app-border text-app-text text-[10px] font-semibold rounded-full hidden sm:flex items-center gap-1">
                              <CategoryIcon iconId={tx.categoryIcon || 'dollar-sign'} className="w-3 h-3 text-app-text/70" />
                              <span>{tx.categoryName}</span>
                            </span>
                        )}
                      </div>
                      <p className="text-[11px] text-app-text/60 mt-0.5">
                        {format(tx.date, "dd MMM yyyy", { locale: currentLocale })}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <p
                      className={`text-xs font-mono font-bold whitespace-nowrap relative z-10
                          ${
                            tx.type === "income"
                              ? "text-app-success"
                              : tx.type === "expense"
                                ? "text-app-danger"
                                : "text-app-text-bright"
                          }`}
                    >
                      {tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""}{" "}
                      Rp {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(tx.amount)}
                    </p>
                    {Boolean(tx.adminFee) && (
                      <p className="text-[10px] text-app-danger font-semibold mt-0.5">
                        Fee: -Rp {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(tx.adminFee)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </ScrollReveal>
      <AccountModal 
        isOpen={isAccountModalOpen} 
        onClose={() => setIsAccountModalOpen(false)} 
        account={editingAccount} 
      />
      <InterestOverviewModal
        isOpen={isInterestModalOpen}
        onClose={() => setIsInterestModalOpen(false)}
        accounts={accounts}
        transactions={recentTransactions}
      />
    </div>
  );
}
