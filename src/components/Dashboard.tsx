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
import { parseTxDate, safeFormatDate } from "../utils/dateUtils";
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
    .filter((t) => t.type === "income" && isSameDay(parseTxDate(t.date), new Date()))
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseToday = recentTransactions
    .reduce((sum, t) => {
      if (isSameDay(parseTxDate(t.date), new Date())) {
        if (t.type === "expense") return sum + t.amount;
        if (t.adminFee) return sum + t.adminFee;
      }
      return sum;
    }, 0);

  // Savings this month
  const incomeThisMonth = recentTransactions
    .filter((t) => t.type === "income" && isSameMonth(parseTxDate(t.date), new Date()))
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseThisMonth = recentTransactions
    .reduce((sum, t) => {
      if (isSameMonth(parseTxDate(t.date), new Date())) {
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
      return { label: "Belum Ada Data", color: "text-app-text/70", bg: "bg-app-bg border-app-border" };
    }
    if (savingsThisMonth > 0) {
      return { label: "Sehat & Surplus", color: "text-app-success", bg: "bg-app-success/10 border-app-success/20" };
    }
    if (savingsThisMonth === 0) {
      return { label: "Keuangan Seimbang", color: "text-app-warning", bg: "bg-app-warning/10 border-app-warning/20" };
    }
    return { label: "Pengeluaran Tinggi", color: "text-app-danger", bg: "bg-app-danger/10 border-app-danger/20" };
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
          const d = parseTxDate(t.date);
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
          isSameDay(parseTxDate(t.date), date),
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
          </div>
          <p className="text-app-text/60 text-[15px] font-normal tracking-[-0.02em]">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })} — Ringkasan aktivitas & kesehatan keuangan Anda
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button type="button"
            onClick={() => setGlobalGrabModalOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl border border-app-border bg-app-card px-4 text-xs font-semibold text-app-text-bright hover:bg-app-hover"
            title="Transaksi Grab"
          >
            <Car className="w-4 h-4 text-app-success" />
            Catat Grab
          </button>
          <button type="button"
            onClick={() => setGlobalAddModalOpen(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-app-accent1 px-5 text-xs font-semibold text-app-bg hover:opacity-90"
            title="Tambah Transaksi"
          >
            <Plus className="w-4 h-4" />
            Tambah
          </button>
          <Link
            to="/settings"
            state={{ expandSection: 'profile' }}
            className="flex h-11 items-center gap-2.5 rounded-xl border border-app-border bg-app-card px-3.5 text-xs font-semibold text-app-text-bright hover:bg-app-hover"
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
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-app-border bg-app-card"
            aria-label="Buka pengaturan profil"
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
      <ScrollReveal className="mb-5 md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button type="button"
            onClick={() => setGlobalAddModalOpen(true)}
            className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-app-border bg-app-card px-3 text-xs font-semibold text-app-text-bright hover:border-app-accent1/30 hover:bg-app-hover"
          >
            <Plus className="w-3.5 h-3.5 text-app-accent1" />
            <span>Pemasukan / Pengeluaran</span>
          </button>
          <button type="button"
            onClick={() => setGlobalGrabModalOpen(true)}
            className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-app-border bg-app-card px-3 text-xs font-semibold text-app-text-bright hover:border-app-success/30 hover:bg-app-hover"
          >
            <Car className="w-3.5 h-3.5 text-app-success" />
            <span>Usaha Grab</span>
          </button>
          <button type="button"
            onClick={() => navigate('/savings')}
            className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-app-border bg-app-card px-3 text-xs font-semibold text-app-text-bright hover:border-app-accent1/30 hover:bg-app-hover"
          >
            <PiggyBank className="w-3.5 h-3.5 text-app-accent1" />
            <span>Tabungan</span>
          </button>
          <button type="button"
            onClick={() => navigate('/loans')}
            className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-app-border bg-app-card px-3 text-xs font-semibold text-app-text-bright hover:border-app-warning/30 hover:bg-app-hover"
          >
            <HandCoins className="w-3.5 h-3.5 text-app-warning" />
            <span>Hutang & Piutang</span>
          </button>
          <button type="button"
            onClick={() => navigate('/analyze')}
            className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-app-border bg-app-card px-3 text-xs font-semibold text-app-text-bright hover:border-app-accent1/30 hover:bg-app-hover"
          >
            <Sparkles className="w-3.5 h-3.5 text-app-accent1" />
            <span>Scan AI</span>
          </button>
        </div>
      </ScrollReveal>

      {/* MOBILE LEDGER */}
      <section className="mb-7 border-y border-app-border py-5 md:hidden">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Wallet className="h-4 w-4 text-app-accent1" strokeWidth={1.7} />
            <h2 className="text-sm font-semibold text-app-text-bright">{t('dashboard.totalBalance')}</h2>
          </div>
          <button
            type="button"
            onClick={toggleHideBalances}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-app-text/60 hover:bg-app-hover hover:text-app-text-bright"
            aria-label={hideBalances ? (language === 'en' ? "Show balances" : "Tampilkan saldo") : (language === 'en' ? "Hide balances" : "Sembunyikan saldo")}
          >
            {hideBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <p className="break-words font-mono text-[30px] font-semibold leading-tight tracking-[-0.035em] text-app-text-bright">
          {formatRp(totalBalance)}
        </p>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="text-app-text/55">{accounts.length} {t('dashboard.allWallets')} · {format(new Date(), "MMMM yyyy", { locale: localeId })}</span>
          <span className={`shrink-0 font-medium ${financialHealthStatus.color}`}>{financialHealthStatus.label}</span>
        </div>

        <dl className="mt-5 grid grid-cols-3 divide-x divide-app-border border-t border-app-border pt-4">
          <div className="pr-3">
            <dt className="text-xs text-app-text/50">{language === 'en' ? 'Income' : 'Masuk'}</dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-app-success">{formatRp(incomeThisMonth)}</dd>
          </div>
          <div className="px-3">
            <dt className="text-xs text-app-text/50">{language === 'en' ? 'Expense' : 'Keluar'}</dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-app-danger">{formatRp(expenseThisMonth)}</dd>
          </div>
          <div className="pl-3">
            <dt className="text-xs text-app-text/50">Net</dt>
            <dd className={`mt-1 font-mono text-sm font-semibold ${savingsThisMonth >= 0 ? "text-app-accent1" : "text-app-danger"}`}>
              {formatRp(savingsThisMonth, { showSign: true })}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-8 md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-app-text-bright">{language === 'en' ? 'Other positions' : 'Posisi lainnya'}</h2>
          <button type="button" onClick={() => navigate("/transactions")} className="flex h-11 items-center gap-1 px-2 text-xs font-semibold text-app-accent1">
            Detail <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y divide-app-border border-y border-app-border">
          <button
            type="button"
            onClick={() => navigate("/investments")}
            className="flex min-h-[76px] w-full items-center justify-between py-4 text-left"
          >
            <span>
              <span className="block text-xs text-app-text/55">{t('dashboard.investments')}</span>
              <span className="mt-1 block font-mono text-base font-semibold text-app-text-bright">{formatRp(totalInvestmentValue)}</span>
            </span>
            <span className={`font-mono text-xs font-semibold ${totalInvestmentReturn >= 0 ? "text-app-success" : "text-app-danger"}`}>
              {formatRp(totalInvestmentReturn, { showSign: true })}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/loans")}
            className="flex min-h-[76px] w-full items-center justify-between py-4 text-left"
          >
            <span>
              <span className="block text-xs text-app-text/55">{language === 'en' ? 'Loans' : 'Pinjaman'}</span>
              <span className="mt-1 block font-mono text-base font-semibold text-app-text-bright">{formatRp(loanStats.totalPiutang - loanStats.totalHutang)}</span>
            </span>
            <span className="text-right text-xs text-app-text/50">
              <span className="block text-app-success">+{formatRp(loanStats.totalPiutang, { noRp: true })}</span>
              <span className="mt-1 block text-app-danger">-{formatRp(loanStats.totalHutang, { noRp: true })}</span>
            </span>
          </button>
        </div>
      </section>

      {/* DESKTOP LEDGER — 3 + 5 + 4 columns, no nested cards */}
      <section className="mb-8 hidden grid-cols-12 border-y border-app-border md:grid">
        <div className="col-span-3 flex min-h-[248px] flex-col justify-between p-6">
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wallet className="h-4 w-4 text-app-accent1" strokeWidth={1.7} />
                <h2 className="text-sm font-semibold text-app-text-bright">{t('dashboard.totalBalance')}</h2>
              </div>
              <button
                type="button"
                onClick={toggleHideBalances}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-app-text/60 hover:bg-app-hover hover:text-app-text-bright"
                aria-label={hideBalances ? (language === 'en' ? "Show balances" : "Tampilkan saldo") : (language === 'en' ? "Hide balances" : "Sembunyikan saldo")}
              >
                {hideBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="break-words font-mono text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-app-text-bright">
              {formatRp(totalBalance)}
            </p>
            <p className="mt-2 text-xs text-app-text/55">
              {accounts.length} {t('dashboard.allWallets')} · {format(new Date(), "MMMM yyyy", { locale: currentLocale })}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-app-border pt-4">
            <span className={`flex items-center gap-2 text-xs font-medium ${financialHealthStatus.color}`}>
              <ShieldCheck className="h-4 w-4" />
              {financialHealthStatus.label}
            </span>
            <Link to="/settings" state={{ expandSection: "accounts" }} className="text-xs font-semibold text-app-accent1 hover:text-app-text-bright">
              Kelola
            </Link>
          </div>
        </div>

        <div className="col-span-5 flex min-h-[248px] flex-col justify-between border-l border-app-border p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-app-text-bright">{language === 'en' ? 'Monthly cash flow' : 'Arus kas bulan ini'}</h2>
              <p className="mt-1 text-xs text-app-text/50">{language === 'en' ? 'Income, expense, and net position' : 'Pemasukan, pengeluaran, dan posisi bersih'}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/transactions")}
              className="flex h-11 items-center gap-2 rounded-xl px-3 text-xs font-semibold text-app-accent1 hover:bg-app-hover"
            >
              Detail
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <dl className="grid grid-cols-3 divide-x divide-app-border border-y border-app-border">
            <div className="py-5 pr-4">
              <dt className="mb-2 text-xs text-app-text/55">{language === 'en' ? 'Income' : 'Masuk'}</dt>
              <dd className="font-mono text-base font-semibold text-app-success">{formatRp(incomeThisMonth)}</dd>
            </div>
            <div className="px-4 py-5">
              <dt className="mb-2 text-xs text-app-text/55">{language === 'en' ? 'Expense' : 'Keluar'}</dt>
              <dd className="font-mono text-base font-semibold text-app-danger">{formatRp(expenseThisMonth)}</dd>
            </div>
            <div className="py-5 pl-4">
              <dt className="mb-2 text-xs text-app-text/55">Net</dt>
              <dd className={`font-mono text-base font-semibold ${savingsThisMonth >= 0 ? "text-app-accent1" : "text-app-danger"}`}>
                {formatRp(savingsThisMonth, { showSign: true })}
              </dd>
            </div>
          </dl>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-app-text/50">{language === 'en' ? 'Today' : 'Hari ini'}</span>
            <span className="font-mono text-app-text-bright">
              <span className="text-app-success">+{formatRp(incomeToday, { noRp: true })}</span>
              <span className="mx-2 text-app-text/30">/</span>
              <span className="text-app-danger">-{formatRp(expenseToday, { noRp: true })}</span>
            </span>
          </div>
        </div>

        <div className="col-span-4 min-h-[248px] border-l border-app-border p-6">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-app-text-bright">{language === 'en' ? 'Other positions' : 'Posisi lainnya'}</h2>
            <p className="mt-1 text-xs text-app-text/50">{language === 'en' ? 'Investments and outstanding loans' : 'Investasi serta pinjaman berjalan'}</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/investments")}
            className="flex min-h-[76px] w-full items-center justify-between border-t border-app-border py-4 text-left hover:text-app-text-bright"
          >
            <span>
              <span className="block text-xs text-app-text/55">{t('dashboard.investments')}</span>
              <span className="mt-1 block font-mono text-base font-semibold text-app-text-bright">{formatRp(totalInvestmentValue)}</span>
            </span>
            <span className={`font-mono text-xs font-semibold ${totalInvestmentReturn >= 0 ? "text-app-success" : "text-app-danger"}`}>
              {formatRp(totalInvestmentReturn, { showSign: true })}
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/loans")}
            className="flex min-h-[76px] w-full items-center justify-between border-y border-app-border py-4 text-left hover:text-app-text-bright"
          >
            <span>
              <span className="block text-xs text-app-text/55">{t('dashboard.loans')}</span>
              <span className="mt-1 block font-mono text-base font-semibold text-app-text-bright">{formatRp(loanStats.totalPiutang - loanStats.totalHutang)}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-app-text/40" />
          </button>
        </div>
      </section>
      {/* INTEREST OVERVIEW CARD */}
      <ScrollReveal className="mb-6 w-full">
        <InterestCard
          accounts={accounts}
          transactions={recentTransactions}
          onOpenModal={() => setIsInterestModalOpen(true)}
        />
      </ScrollReveal>

      {/* MOBILE WALLET LIST */}
      <section className="mb-8 md:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-app-text-bright">{t('dashboard.myWallets')}</h2>
          <Link to="/settings" state={{ expandSection: "accounts" }} className="flex min-h-11 items-center px-2 text-xs font-semibold text-app-accent1">
            {t('dashboard.viewAll')}
          </Link>
        </div>
        <div className="divide-y divide-app-border border-y border-app-border">
          {sortedAccounts.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center text-xs text-app-text/55">
              <Wallet className="mb-3 h-8 w-8 text-app-text/30" />
              <span className="font-medium text-app-text-bright">{language === 'en' ? 'No wallets yet' : 'Belum ada dompet'}</span>
            </div>
          ) : (
            sortedAccounts.map((acc) => (
              <button
                type="button"
                key={acc.id}
                onClick={() => {
                  setEditingAccount(acc);
                  setIsAccountModalOpen(true);
                }}
                className="flex min-h-[72px] w-full items-center gap-3 py-3 text-left"
              >
                <AccountIcon iconId={acc.icon} className="h-10 w-10 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-app-text-bright">{acc.name}</span>
                    {acc.isPrimary && <span className="text-[11px] text-app-accent1">{language === 'en' ? 'Primary' : 'Utama'}</span>}
                  </span>
                  <span className="mt-1 block truncate font-mono text-sm font-semibold text-app-text-bright">{formatRp(acc.balance)}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-app-text/40" />
              </button>
            ))
          )}
          <Link
            to="/settings"
            state={{ expandSection: "accounts" }}
            className="flex min-h-14 items-center gap-2 py-3 text-sm font-medium text-app-accent1"
          >
            <Plus className="h-4 w-4" />
            {language === 'en' ? 'Manage wallets' : 'Kelola dompet'}
          </Link>
        </div>
      </section>

      {/* DESKTOP MIDDLE SECTION */}
      <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* DOMPET SAYA */}
        <ScrollReveal className="lg:col-span-1 bg-app-card rounded-2xl p-6 border border-app-border flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-5 relative z-10">
            <h2 className="text-app-text-bright text-[20px] font-semibold tracking-[-0.01em]">{t('dashboard.myWallets')}</h2>
            <div className="relative">
              <button type="button"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 text-xs font-semibold text-app-text/70 hover:text-app-text px-2.5 py-1.5 rounded-xl hover:bg-app-hover transition-colors border border-app-border/50"
                title={language === 'en' ? 'Sort' : 'Urutkan'}
                aria-haspopup="menu"
                aria-expanded={showSortMenu}
                aria-controls="wallet-sort-menu"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {language === 'en' ? 'Sort' : 'Urutkan'}
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} aria-hidden="true" />
                  <div id="wallet-sort-menu" role="menu" className="absolute right-0 mt-2 w-48 bg-app-card border border-app-border rounded-xl z-50 py-1.5 overflow-hidden animate-in fade-in duration-100">
                    <button type="button"
                      onClick={() => { setAccountSort("balance_desc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                      role="menuitemradio"
                      aria-checked={accountSort === "balance_desc"}
                    >
                      {t('dashboard.sortBalanceDesc')}
                      {accountSort === "balance_desc" && <Check className="w-3.5 h-3.5 text-app-accent1" />}
                    </button>
                    <button type="button"
                      onClick={() => { setAccountSort("balance_asc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                      role="menuitemradio"
                      aria-checked={accountSort === "balance_asc"}
                    >
                      {t('dashboard.sortBalanceAsc')}
                      {accountSort === "balance_asc" && <Check className="w-3.5 h-3.5 text-app-accent1" />}
                    </button>
                    <div className="h-px w-full bg-app-border/50 my-1" />
                    <button type="button"
                      onClick={() => { setAccountSort("name_asc"); setShowSortMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-app-hover text-app-text transition-colors flex items-center justify-between"
                      role="menuitemradio"
                      aria-checked={accountSort === "name_asc"}
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
                <Wallet className="mb-2 h-8 w-8 text-app-text/30" />
                {language === 'en' ? 'No wallets yet' : 'Belum ada dompet'}
              </div>
            ) : (
              sortedAccounts.map((acc) => (
                <button
                  type="button"
                  key={acc.id}
                  onClick={() => {
                    setEditingAccount(acc);
                    setIsAccountModalOpen(true);
                  }}
                  className="group flex min-h-[64px] w-full items-center justify-between rounded-xl border border-app-border bg-app-bg p-3.5 text-left hover:border-app-accent1/50"
                >
                  <div className="flex items-center gap-3.5">
                    <AccountIcon iconId={acc.icon} className="w-9 h-9 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-app-text-bright font-semibold text-xs">
                          {acc.name}
                        </p>
                        {acc.isPrimary && (
                          <span className="text-[11px] font-medium text-app-accent1">
                            {language === 'en' ? 'Primary' : 'Utama'}
                          </span>
                        )}
                      </div>
                      <p className="text-app-text/70 text-xs font-mono font-semibold mt-0.5">
                        {formatRp(acc.balance)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-app-text/40 group-hover:text-app-accent1" />
                </button>
              ))
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
        <ScrollReveal delay={0.1} className="lg:col-span-2 bg-app-card rounded-2xl p-6 border border-app-border flex flex-col relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 relative z-10">
            <div>
              <h2 className="text-app-text-bright text-[20px] font-semibold tracking-[-0.01em]">{t('dashboard.cashflowTitle')}</h2>
              <p className="text-app-text/60 text-xs font-medium">Tren perbandingan pemasukan vs pengeluaran</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={selectedChartAccount}
                onChange={(e) => setSelectedChartAccount(e.target.value)}
                className="min-h-11 cursor-pointer rounded-xl border border-app-border bg-app-bg px-3 text-xs font-medium text-app-text-bright focus:border-app-accent1 focus:outline-none"
              >
                <option value="all">{language === 'en' ? 'All Accounts' : 'Semua Rekening'}</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
              <div className="bg-app-bg rounded-xl p-1 border border-app-border flex gap-1">
                <button
                  type="button"
                  onClick={() => setChartPeriod(0)}
                  aria-pressed={chartPeriod === 0}
                  className={`min-h-11 rounded-lg px-3 text-xs font-semibold transition-colors ${chartPeriod === 0 ? "bg-app-accent1 text-app-bg" : "text-app-text/60 hover:text-app-text-bright"}`}
                >
                  {t('dashboard.day')}
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod(7)}
                  aria-pressed={chartPeriod === 7}
                  className={`min-h-11 rounded-lg px-3 text-xs font-semibold transition-colors ${chartPeriod === 7 ? "bg-app-accent1 text-app-bg" : "text-app-text/60 hover:text-app-text-bright"}`}
                >
                  {language === 'en' ? '7 Days' : '7 Hari'}
                </button>
                <button
                  type="button"
                  onClick={() => setChartPeriod(30)}
                  aria-pressed={chartPeriod === 30}
                  className={`min-h-11 rounded-lg px-3 text-xs font-semibold transition-colors ${chartPeriod === 30 ? "bg-app-accent1 text-app-bg" : "text-app-text/60 hover:text-app-text-bright"}`}
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-app-border)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-app-text)" }}
                  dy={5}
                  opacity={0.7}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-app-text)" }}
                  opacity={0.7}
                />
                <Tooltip
                  formatter={(value: number) => [hideBalances ? "Rp ••••••••" : `Rp ${value.toLocaleString("id-ID")}`, undefined]}
                  contentStyle={{
                    backgroundColor: "var(--color-app-card)",
                    border: "1px solid var(--color-app-border)",
                    borderRadius: "12px",
                    padding: "8px 12px"
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
                  fill="transparent"
                  fillOpacity={0}
                  strokeWidth={2.5}
                />
                <Area
                  type="monotone"
                  name={t('dashboard.expense')}
                  dataKey="expense"
                  stroke="var(--color-app-danger)"
                  fill="transparent"
                  fillOpacity={0}
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
        <div className="bg-app-card rounded-2xl p-6 border border-app-border flex flex-col relative overflow-hidden">
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
        <div className="bg-app-card rounded-2xl p-6 border border-app-border flex flex-col relative overflow-hidden">
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
          const todayMobileTransactions = recentTransactions.filter(t => isSameDay(parseTxDate(t.date), new Date()));
          return todayMobileTransactions.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 rounded-full bg-app-card border border-app-border flex items-center justify-center mb-5">
                 <FileText className="w-8 h-8 text-app-accent1" />
              </div>
              <p className="text-app-text-bright font-semibold mb-1.5">Belum ada transaksi hari ini</p>
              <p className="text-app-text/60 text-[13px]">Mulai catat transaksi pertama Anda hari ini</p>
           </div>
          ) : (
           <div className="space-y-3">
              {todayMobileTransactions.map((t) => (
                 <button type="button" key={t.id} onClick={() => navigate('/transactions', { state: { tab: "Semua" } })} className="relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-app-border bg-app-card p-4 text-left">

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
                              <span className="px-2 py-0.5 bg-app-bg border border-app-border text-app-text text-[11px] font-semibold rounded-full hidden sm:flex items-center gap-1">
                                <CategoryIcon iconId={t.categoryIcon || 'dollar-sign'} className="w-3 h-3 text-app-text/70" />
                                <span>{t.categoryName}</span>
                              </span>
                           )}
                         </div>
                         <p className="text-app-text/60 text-[13px]">
                           {safeFormatDate(t.date, "dd MMM yyyy", { locale: localeId })}
                         </p>
                       </div>
                     </div>
                     <p className={`text-[17px] font-semibold whitespace-nowrap relative z-10 ${t.type === "income" ? "text-app-success" : t.type === "expense" ? "text-app-danger" : "text-app-text"}`}>
                       {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} Rp {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(t.amount)}
                       {Boolean(t.adminFee) && (
                         <span className="block text-[11px] text-app-danger font-semibold text-right mt-0.5">
                           Fee: -Rp {new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }).format(t.adminFee)}
                         </span>
                       )}
                     </p>
                 </button>
              ))}
           </div>
          );
        })()}
      </div>

      {/* DESKTOP BOTTOM SECTION - TRANSACTIONS */}
      <ScrollReveal className="hidden md:flex bg-app-card rounded-2xl p-6 border border-app-border flex-col shrink-0 overflow-hidden relative">
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
          const todayDesktopTransactions = filteredBottomTransactions.filter(t => isSameDay(parseTxDate(t.date), new Date()));
          return todayDesktopTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-2xl bg-app-bg border border-app-border border-dashed relative z-10">
              <FileText className="w-8 h-8 text-app-text/30 mb-2" />
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
                            <span className="px-2 py-0.5 bg-app-card border border-app-border text-app-text text-[11px] font-semibold rounded-full hidden sm:flex items-center gap-1">
                              <CategoryIcon iconId={tx.categoryIcon || 'dollar-sign'} className="w-3 h-3 text-app-text/70" />
                              <span>{tx.categoryName}</span>
                            </span>
                        )}
                      </div>
                      <p className="text-[11px] text-app-text/60 mt-0.5">
                        {safeFormatDate(tx.date, "dd MMM yyyy", { locale: currentLocale })}
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
                      <p className="text-[11px] text-app-danger font-semibold mt-0.5">
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
