import React, { useEffect, useState, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
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
import {
  Sun,
  Moon,
  Bell,
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
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
  const reduceMotion = useReducedMotion();

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
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--warning-color)"
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

  const getTransactionAccountLabel = (transaction: Transaction) => {
    const accountName = (id?: string) => accounts.find((account) => account.id === id)?.name;
    if (transaction.type === "transfer") {
      return `${accountName(transaction.fromAccountId) || "Rekening asal"} → ${accountName(transaction.toAccountId) || "Rekening tujuan"}`;
    }
    return accountName(transaction.accountId) || "Rekening";
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
  const savingsRemaining = Math.max(savingsTarget - Math.max(savingsThisMonth, 0), 0);

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
    <div className="route-dashboard page-register dashboard-ledger flex h-full w-full flex-1 flex-col overflow-y-auto pb-32 text-app-text md:pb-10">
      {/* DESKTOP HEADER */}
      <header className="dashboard-toolbar hidden items-center justify-between gap-6 border-b px-7 py-4 md:flex">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-base font-semibold tracking-[-0.02em] text-app-text-bright">
              <TextReveal key={`${user?.displayName}-${getGreeting()}`} text={`${getGreeting()}, ${user?.displayName || "USER"}`} />
            </h1>
          </div>
          <p className="text-app-text/60 text-xs font-normal">
            {format(new Date(), "EEEE, d MMMM yyyy", { locale: localeId })} · Posisi keuangan terbaru
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
      <header className="mobile-ledger-header flex items-center justify-between px-5 pb-5 pt-6 md:hidden">
        <div>
          <p className="font-ledger text-[28px] leading-none text-app-accent1">Razchly</p>
          <p className="mt-2 text-[11px] text-app-text">{format(new Date(), "EEEE, d MMM yyyy", { locale: localeId })}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/settings"
            state={{ expandSection: 'profile' }}
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-app-accent1/50 bg-app-accent1/10"
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
        </div>
      </header>

      {/* QUICK SHORTCUTS RIBBON (ALL DEVICES) */}
      <ScrollReveal className="hidden">
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
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 0 100% 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
        transition={{ duration: reduceMotion ? 0 : 0.62, ease: [0.16, 1, 0.3, 1] }}
        className="mobile-statement mx-4 mb-4 rounded-[16px] px-5 py-6 md:hidden"
      >
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
        <p className="font-ledger break-words text-[clamp(2.35rem,11vw,3.2rem)] leading-[1.02] tracking-[-0.03em] text-app-text-bright">
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
      </motion.section>

      <section className="mobile-position mx-4 mb-7 rounded-[16px] px-5 py-4 md:hidden">
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

      {/* DESKTOP STATEMENT — one financial surface + one operational side ledger */}
      <motion.section
        initial={reduceMotion ? false : { opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
        transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.16, 1, 0.3, 1] }}
        className="dashboard-statement mx-7 mb-7 hidden grid-cols-12 overflow-hidden md:grid"
      >
        <article className="statement-sheet col-span-8 p-7 xl:p-9">
          <div className="flex items-start justify-between gap-5">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em]">{t('dashboard.totalBalance')}</h2>
              <p className="font-ledger mt-3 break-words text-[clamp(3.2rem,5vw,5.8rem)] leading-[0.92] tracking-[-0.035em]">
                {formatRp(totalBalance)}
              </p>
              <p className="mt-4 text-xs text-app-text">
                {accounts.length} {t('dashboard.allWallets')} · {format(new Date(), "MMMM yyyy", { locale: currentLocale })}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleHideBalances}
              className="flex h-11 w-11 items-center justify-center text-app-text hover:bg-app-hover hover:text-app-text-bright"
              aria-label={hideBalances ? (language === 'en' ? "Show balances" : "Tampilkan saldo") : (language === 'en' ? "Hide balances" : "Sembunyikan saldo")}
            >
              {hideBalances ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 border-y border-app-border">
            <div className="py-6 pr-7">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-[0.06em]">Ringkasan rekening</h3>
                <Link to="/settings" state={{ expandSection: "accounts" }} className="text-xs font-semibold text-app-accent1 hover:text-app-text-bright">Kelola</Link>
              </div>
              <div className="divide-y divide-app-border border-t border-app-border">
                {sortedAccounts.slice(0, 4).map((account) => (
                  <button key={account.id} type="button" onClick={() => { setEditingAccount(account); setIsAccountModalOpen(true); }} className="grid min-h-11 w-full grid-cols-[1fr_auto] items-center gap-4 text-left text-xs hover:bg-app-hover">
                    <span className="truncate text-app-text">{account.name}</span>
                    <span className="font-mono font-semibold text-app-text-bright">{formatRp(account.balance)}</span>
                  </button>
                ))}
                {sortedAccounts.length === 0 && <p className="py-8 text-center text-xs text-app-text">Belum ada rekening aktif.</p>}
              </div>
            </div>

            <div className="border-l border-app-border py-6 pl-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.06em]">Arus kas</h3>
                <select value={selectedChartAccount} onChange={(event) => setSelectedChartAccount(event.target.value)} className="h-9 max-w-36 border-0 border-b border-app-border bg-transparent px-1 text-xs text-app-text-bright outline-none">
                  <option value="all">Semua rekening</option>
                  {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
                </select>
              </div>
              <div className="h-[178px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 6, left: -28, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--ledger-rule)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--ledger-muted)" }} minTickGap={30} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--ledger-muted)" }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                    <Tooltip formatter={(value: number) => hideBalances ? "Rp ••••••" : formatRp(value)} contentStyle={{ background: "var(--ledger-paper-raised)", border: "1px solid var(--ledger-rule)", borderRadius: 8, color: "var(--ledger-ink)", fontSize: 11 }} />
                    <Line type="monotone" dataKey="income" stroke="var(--success-color)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="expense" stroke="var(--danger-color)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-3 divide-x divide-app-border border-b border-app-border">
            <div className="py-5 pr-5"><dt className="text-[11px] text-app-text">Pemasukan</dt><dd className="font-ledger mt-1 text-xl text-app-success">{formatRp(incomeThisMonth)}</dd></div>
            <div className="px-5 py-5"><dt className="text-[11px] text-app-text">Pengeluaran</dt><dd className="font-ledger mt-1 text-xl text-app-danger">{formatRp(expenseThisMonth)}</dd></div>
            <div className="py-5 pl-5"><dt className="text-[11px] text-app-text">Surplus</dt><dd className={`font-ledger mt-1 text-xl ${savingsThisMonth >= 0 ? "text-app-accent1" : "text-app-danger"}`}>{formatRp(savingsThisMonth, { showSign: true })}</dd></div>
          </dl>
        </article>

        <aside className="statement-side col-span-4 flex flex-col">
          <div className="statement-side-row">
            <div className="flex items-center justify-between"><h3>Kondisi bulan ini</h3><button type="button" onClick={() => navigate('/transactions')}>Analisis</button></div>
            <p className={`font-ledger mt-3 text-[30px] ${savingsThisMonth >= 0 ? "text-app-accent1" : "text-app-danger"}`}>{financialHealthStatus.label}</p>
            <span>{savingsThisMonth >= 0 ? `Surplus ${formatRp(savingsThisMonth)}` : `Defisit ${formatRp(Math.abs(savingsThisMonth))}`}</span>
          </div>
          <div className="statement-side-row">
            <div className="flex items-center justify-between"><h3>Pengeluaran bulan ini</h3><button type="button" onClick={() => navigate('/transactions')}>Rincian</button></div>
            <p className="font-ledger mt-3 text-[30px] text-app-text-bright">{formatRp(expenseThisMonth)}</p>
            <span>Hari ini {formatRp(expenseToday)}</span>
          </div>
          <div className="statement-side-row">
            <div className="flex items-center justify-between"><h3>Target tabungan</h3><button type="button" onClick={() => navigate('/savings')}>Rincian</button></div>
            {savingsTarget > 0 ? (
              <>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <p className="font-ledger text-[30px] text-app-text-bright">{Math.round(savingsProgress)}%</p>
                  <span className="mb-1 text-[11px] text-app-text">tercapai</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-4 border-t border-app-border pt-3">
                  <div><dt className="text-[10px] text-app-text">Terkumpul</dt><dd className="mt-1 font-mono text-[11px] text-app-text-bright">{formatRp(Math.max(savingsThisMonth, 0))}</dd></div>
                  <div><dt className="text-[10px] text-app-text">Masih perlu</dt><dd className="mt-1 font-mono text-[11px] text-app-accent1">{formatRp(savingsRemaining)}</dd></div>
                </dl>
              </>
            ) : (
              <>
                <p className="font-ledger mt-3 text-[26px] text-app-text-bright">Belum ditetapkan</p>
                <span>Tentukan target bulanan agar progres dapat dihitung.</span>
              </>
            )}
          </div>
          <button type="button" onClick={() => setGlobalAddModalOpen(true)} className="statement-add mt-auto flex min-h-14 items-center justify-center gap-2 border border-app-accent1/70 text-sm font-semibold text-app-accent1 hover:bg-app-accent1 hover:text-app-on-accent">
            <Plus className="h-4 w-4" /> Tambah transaksi
          </button>
        </aside>
      </motion.section>
      {/* INTEREST OVERVIEW CARD */}
      <ScrollReveal className="dashboard-interest mx-4 mb-6 md:mx-7">
        <InterestCard
          accounts={accounts}
          transactions={recentTransactions}
          onOpenModal={() => setIsInterestModalOpen(true)}
        />
      </ScrollReveal>

      {/* MOBILE WALLET LIST */}
      <section className="mobile-wallets mx-4 mb-8 md:hidden">
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
      <div className="dashboard-workbench mx-7 mb-7 hidden grid-cols-1 lg:grid-cols-3 md:grid">
        {/* DOMPET SAYA */}
        <ScrollReveal className="dashboard-wallet-panel relative flex flex-col overflow-hidden border border-app-border bg-app-card p-6 lg:col-span-1">
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
        <ScrollReveal delay={0.1} className="dashboard-cashflow-panel relative flex flex-col overflow-hidden border border-app-border bg-app-card p-6 lg:col-span-2">
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
      <ScrollReveal className="dashboard-analytics mx-4 mb-7 grid grid-cols-1 lg:grid-cols-2 md:mx-7">
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
      <div className="mobile-recent px-4 pb-12 md:hidden">
        <div className="mb-4 flex items-end justify-between gap-4 px-1">
          <div>
            <h2 className="font-ledger text-[26px] leading-none text-app-text-bright">Catatan hari ini</h2>
            <p className="mt-2 text-xs text-app-text/52">Pergerakan uang terbaru</p>
          </div>
          <Link to="/transactions" state={{ tab: "Semua" }} className="flex min-h-11 items-center text-[12px] font-semibold text-app-accent1">Buka ledger</Link>
        </div>
        {(() => {
          const todayMobileTransactions = recentTransactions.filter(t => isSameDay(parseTxDate(t.date), new Date()));
          return todayMobileTransactions.length === 0 ? (
            <button type="button" onClick={() => setGlobalAddModalOpen(true)} className="daybook-empty w-full py-10 text-left">
              <span className="font-ledger block text-[22px] text-app-text-bright">Halaman hari ini masih kosong.</span>
              <span className="mt-2 block text-xs leading-relaxed text-app-text/58">Catat transaksi pertama agar arus kas hari ini mulai terbaca.</span>
              <span className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-app-accent1"><Plus className="h-4 w-4" /> Tambah transaksi</span>
            </button>
          ) : (
            <div className="mobile-daybook border-y border-app-border">
              {todayMobileTransactions.slice(0, 6).map((transaction) => (
                <button type="button" key={transaction.id} onClick={() => navigate('/transactions', { state: { tab: "Semua" } })} className="daybook-row grid min-h-[76px] w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 text-left">
                  <time className="font-mono text-[10px] text-app-text/48">{safeFormatDate(transaction.date, "HH:mm", { locale: localeId })}</time>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-app-text-bright">{transaction.note || (transaction.type === "income" ? "Pemasukan" : transaction.type === "expense" ? "Pengeluaran" : "Transfer")}</span>
                    <span className="mt-1 block truncate text-[11px] text-app-text/52">{transaction.categoryName || getTransactionAccountLabel(transaction)}</span>
                  </span>
                  <span className={`whitespace-nowrap font-mono text-xs font-semibold ${transaction.type === "income" ? "text-app-success" : transaction.type === "expense" ? "text-app-danger" : "text-app-text-bright"}`}>
                    {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}{formatRp(transaction.amount)}
                  </span>
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* DESKTOP BOTTOM SECTION - TRANSACTIONS */}
      <ScrollReveal className="dashboard-recent mx-7 hidden shrink-0 flex-col overflow-hidden border border-app-border bg-app-card md:flex">
        <div className="relative z-10 flex items-end justify-between gap-5 border-b border-app-border px-6 py-5">
          <div>
            <h2 className="font-ledger text-[28px] leading-none text-app-text-bright">{t('dashboard.recentTransactions')}</h2>
            <p className="mt-2 text-xs text-app-text/58">Ledger aktivitas hari ini</p>
          </div>
          <Link
            to="/transactions"
            state={{ tab: "Semua" }}
            className="flex min-h-11 items-center gap-1 text-xs font-semibold text-app-accent1 hover:text-app-text-bright"
          >
            {language === 'en' ? 'Open full ledger' : 'Buka ledger lengkap'} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {(() => {
          const filteredBottomTransactions = selectedChartAccount === "all" ? recentTransactions : recentTransactions.filter(t => t.accountId === selectedChartAccount);
          const todayDesktopTransactions = filteredBottomTransactions.filter(t => isSameDay(parseTxDate(t.date), new Date()));
          return todayDesktopTransactions.length === 0 ? (
            <div className="relative z-10 grid min-h-32 grid-cols-[1fr_auto] items-center gap-6 px-6 py-8">
              <div>
                <p className="font-ledger text-[24px] text-app-text-bright">Belum ada entri hari ini.</p>
                <p className="mt-2 text-xs text-app-text/58">Transaksi baru akan muncul sebagai baris ledger.</p>
              </div>
              <button type="button" onClick={() => setGlobalAddModalOpen(true)} className="flex min-h-11 items-center gap-2 border border-app-accent1 px-4 text-xs font-semibold text-app-accent1 hover:bg-app-accent1 hover:text-app-bg"><Plus className="h-4 w-4" /> Tambah transaksi</button>
            </div>
          ) : (
            <div className="relative z-10 overflow-x-auto">
              <table className="dashboard-daybook-table w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th>Transaksi</th>
                    <th>Rekening</th>
                    <th>Waktu</th>
                    <th className="text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {todayDesktopTransactions.slice(0, 8).map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <button type="button" onClick={() => navigate('/transactions', { state: { tab: "Semua" } })} className="max-w-[32ch] truncate text-left text-xs font-semibold text-app-text-bright hover:text-app-accent1">
                          {transaction.note || (transaction.type === "income" ? t('dashboard.income') : transaction.type === "expense" ? t('dashboard.expense') : "Transfer")}
                        </button>
                        <span className="mt-1 block text-[11px] text-app-text/52">{transaction.categoryName || transaction.type}</span>
                      </td>
                      <td className="max-w-[28ch] truncate text-xs text-app-text/68">{getTransactionAccountLabel(transaction)}</td>
                      <td><time className="font-mono text-[11px] text-app-text/58">{safeFormatDate(transaction.date, "HH:mm", { locale: currentLocale })}</time></td>
                      <td className={`whitespace-nowrap text-right font-mono text-xs font-semibold ${transaction.type === "income" ? "text-app-success" : transaction.type === "expense" ? "text-app-danger" : "text-app-text-bright"}`}>
                        {transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : ""}{formatRp(transaction.amount)}
                        {Boolean(transaction.adminFee) && <span className="mt-1 block text-[10px] text-app-danger">Fee -{formatRp(transaction.adminFee || 0)}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
