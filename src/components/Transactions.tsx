import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  collection,
  onSnapshot,
  writeBatch,
  doc,
  query,
  orderBy,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { authFetch } from "../utils/api";
import { Account, Transaction, TransactionType, Category } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  X,
  Sun,
  Moon,
  Bell,
  FileSpreadsheet,
  FileText,
  Info,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ChevronDown,
  Car,
  Trash2,
  Edit2,
  ArrowLeft,
  Share2,
  Laptop,
  ChevronRight,
  ChevronLeft,
  Wallet,
  Briefcase,
  MoreHorizontal,
  ShoppingCart,
  HelpCircle,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Target,
  Coins,
  Compass,
  Search,
  SlidersHorizontal,
  Filter,
  PieChart as PieChartIcon,
  BarChart3,
  Zap,
  Copy,
  Calendar,
  ShieldCheck
} from "lucide-react";
import {
  format,
  isSameMonth,
  isSameDay,
  isSameWeek,
  subMonths,
  addMonths,
  subDays,
  addDays,
  subWeeks,
  addWeeks
} from "date-fns";
import { id as localeId, enUS as localeEn } from "date-fns/locale";
import { useTranslation } from "../utils/translations";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { sendDeviceNotification } from "../utils/notification";
import { AccountIcon } from "./AccountIcon";
import { CategoryIcon, getCategoryIconDetails } from "./CategoryIcon";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";

import { formatNumberInput, parseNumberInput } from "../utils/numberFormat";
import { parseTxDate, safeFormatDate } from "../utils/dateUtils";
import { toast } from "react-hot-toast";
import { HoverCard, ScrollReveal, StaggerContainer, StaggerItem, TextReveal, MicroLoop } from "./MotionWrappers";
import { ActionBtn } from "./PageShell";

export default function Transactions({ modalOnly = false }: { modalOnly?: boolean }) {
  const { t, language } = useTranslation();
  const currentLocale = language === "en" ? localeEn : localeId;
  const detailRef = useRef<HTMLDivElement>(null);
  const {
    user,
    themeId,
    setThemeId,
    grabCashAccount,
    grabDompetAccount,
    grabHematAccount,
  } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"Semua" | "Pemasukan" | "Pengeluaran">(
    (location.state as any)?.tab || "Semua",
  );

  useEffect(() => {
    if ((location.state as any)?.tab) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [location.state]);

  const [selectedReportAccount, setSelectedReportAccount] =
    useState<string>("all");
  const [selectedReportPeriod, setSelectedReportPeriod] =
    useState<string>("this_month");

  // Regular Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [note, setNote] = useState("");
  const [hasAdminFee, setHasAdminFee] = useState(false);
  const [adminFee, setAdminFee] = useState("");
  const [adminFeeChargeTo, setAdminFeeChargeTo] = useState<
    "origin" | "destination"
  >("origin");
  const [isTransferAll, setIsTransferAll] = useState(false);

  useEffect(() => {
    if (type === "transfer" && isTransferAll && fromAccountId) {
      const acc = accounts.find((a) => a.id === fromAccountId);
      if (acc) {
        setAmount(formatNumberInput(acc.balance.toString()));
      }
    }
  }, [type, isTransferAll, fromAccountId, accounts]);
  const [tsxDate, setTsxDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );

  // Grab Modal State
  const [isGrabModalOpen, setIsGrabModalOpen] = useState(false);
  const [grabType, setGrabType] = useState<"tunai" | "nontunai">("tunai");
  const [grabNominal, setGrabNominal] = useState("");
  const [grabCashReceived, setGrabCashReceived] = useState("");
  const [grabAppDriver, setGrabAppDriver] = useState("");
  const [grabAppCust, setGrabAppCust] = useState("");
  const [grabLabel, setGrabLabel] = useState("Reguler");
  const [grabDate, setGrabDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );

  // Mobile Specific States
  const [mobileTab, setMobileTab] = useState<
    "Harian" | "Mingguan" | "Bulanan" | "Custom"
  >("Harian");
  const [mobileCurrentDate, setMobileCurrentDate] = useState<Date>(new Date());
  const [mobileCustomStartDate, setMobileCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mobileCustomEndDate, setMobileCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mobileAccountFilter, setMobileAccountFilter] =
    useState<string>("Semua");
  const [mobileIncomeFilter, setMobileIncomeFilter] = useState<string>("Semua");
  const [mobileExpenseFilter, setMobileExpenseFilter] =
    useState<string>("Semua");

  // AI Strategy Recommendation State
  const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
  const [strategyRecommendation, setStrategyRecommendation] = useState<{
    summary: string;
    diagnostic: string[];
    savingsRecommendations: Array<{
      title: string;
      description: string;
      priority: string;
      potentialSavings: string;
    }>;
    allocationPlan: Array<{
      category: string;
      currentPct: number;
      recommendedPct: number;
      recommendedAmount: number;
    }>;
    incomeStrategies: string[];
    isOffline?: boolean;
  } | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);

  const fetchFinancialStrategy = async () => {
    setStrategyLoading(true);
    setIsStrategyModalOpen(true);
    try {
      const response = await authFetch("/api/gemini/financial-strategy", {
        method: "POST",
        body: JSON.stringify({
          netProfit: stats.netProfit,
          income: stats.income,
          expense: stats.expense,
          avgIncome: stats.avgIncome,
          avgExpense: stats.avgExpense,
          count: stats.count,
          periodText: getPeriodText()
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil rekomendasi strategi.");
      }

      const data = await response.json();
      setStrategyRecommendation(data);
    } catch (error) {
      console.error("Error fetching financial strategy:", error);
      toast.error("Gagal mendapatkan rekomendasi strategi AI.");
    } finally {
      setStrategyLoading(false);
    }
  };

  const {
    isGlobalAddModalOpen,
    isGlobalGrabModalOpen,
    setGlobalAddModalOpen,
    setGlobalGrabModalOpen,
  } = useStore();

  useEffect(() => {
    if (isGlobalAddModalOpen && modalOnly) {
      if (accounts.length > 0) {
        openAddModal();
        setGlobalAddModalOpen(false);
      } else {
        // If accounts are taking time to load, we can just open it anyway,
        // it will just default to empty accountId and the user can select it when they load.
        // But better to just wait. We'll add a timeout so it doesn't get stuck.
        const timer = setTimeout(() => {
          openAddModal();
          setGlobalAddModalOpen(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isGlobalAddModalOpen, accounts, modalOnly]);

  useEffect(() => {
    if (isGlobalGrabModalOpen && modalOnly) {
      setIsGrabModalOpen(true);
      setGlobalGrabModalOpen(false);
    }
  }, [isGlobalGrabModalOpen, modalOnly]);

  useEffect(() => {
    if (!user) return;

    // Fetch Accounts
    const accUnsub = onSnapshot(
      collection(db, "users", user.uid, "accounts"),
      (snap) => {
        const accts: Account[] = [];
        snap.forEach((d) => accts.push({ id: d.id, ...d.data() } as Account));
        setAccounts(accts);
      },
    );

    // Fetch Categories
    const catUnsub = onSnapshot(
      collection(db, "users", user.uid, "categories"),
      (snap) => {
        const cats: Category[] = [];
        snap.forEach((d) => cats.push({ id: d.id, ...d.data() } as Category));
        setCategories(cats);
      },
    );

    // Fetch Transactions
    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc"),
    );
    const tsxUnsub = onSnapshot(q, (snap) => {
      const tsx: Transaction[] = [];
      snap.forEach((d) => tsx.push({ id: d.id, ...d.data() } as unknown as Transaction));
      setTransactions(tsx);
    });

    return () => {
      accUnsub();
      catUnsub();
      tsxUnsub();
    };
  }, [user]);

  const [categoryId, setCategoryId] = useState("");


  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setIsTransferAll(false);
    if (!editingTransaction) {
      if (newType === "expense") {
        setAccountId(localStorage.getItem('lastAccountId_expense') || accounts[0]?.id || "");
      } else if (newType === "income") {
        setAccountId(localStorage.getItem('lastAccountId_income') || accounts[0]?.id || "");
      } else if (newType === "transfer") {
        setFromAccountId(localStorage.getItem('lastAccountId_transfer_from') || accounts[0]?.id || "");
        setToAccountId(localStorage.getItem('lastAccountId_transfer_to') || accounts[1]?.id || accounts[0]?.id || "");
      }
    }
  };

  const openAddModal = () => {
    setEditingTransaction(null);
    setType("expense");
    setAmount("");
    setAccountId(localStorage.getItem('lastAccountId_expense') || accounts[0]?.id || "");
    setFromAccountId(localStorage.getItem('lastAccountId_transfer_from') || accounts[0]?.id || "");
    setToAccountId(localStorage.getItem('lastAccountId_transfer_to') || accounts[1]?.id || accounts[0]?.id || "");
    setNote("");
    setCategoryId("");
    setHasAdminFee(false);
    setAdminFee("");
    setAdminFeeChargeTo("origin");
    setIsTransferAll(false);
    setTsxDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const openEditModal = (t: Transaction) => {
    setEditingTransaction(t);
    setType(t.type);
    setAmount(t.amount.toString());
    setAccountId(t.accountId || "");
    setFromAccountId(t.fromAccountId || "");
    setToAccountId(t.toAccountId || "");
    setNote(t.note || "");
    setCategoryId(t.categoryId || "");
    setHasAdminFee(!!t.adminFee);
    setAdminFee(t.adminFee ? t.adminFee.toString() : "");
    setAdminFeeChargeTo(t.adminFeeChargeTo || "origin");
    setIsTransferAll(false);
    setTsxDate(format(new Date(t.date), "yyyy-MM-dd'T'HH:mm"));
    setIsModalOpen(true);
  };

  const getAccountName = (id?: string) =>
    accounts.find((a) => a.id === id)?.name || "Unknown";

  const saveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const numAmount = parseNumberInput(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);

      // Track balance changes for each account
      const balanceChanges = new Map<string, number>();

      // 1. Revert old transaction if editing
      if (editingTransaction) {
        const t = editingTransaction;
        if (t.type === "income") {
          if (t.accountId) {
            balanceChanges.set(t.accountId, (balanceChanges.get(t.accountId) || 0) - t.amount);
            if (t.adminFee) {
              balanceChanges.set(t.accountId, (balanceChanges.get(t.accountId) || 0) + t.adminFee);
            }
          }
        } else if (t.type === "expense") {
          if (t.accountId) {
            balanceChanges.set(t.accountId, (balanceChanges.get(t.accountId) || 0) + t.amount);
            if (t.adminFee) {
              balanceChanges.set(t.accountId, (balanceChanges.get(t.accountId) || 0) + t.adminFee);
            }
          }
        } else if (t.type === "transfer") {
          if (t.fromAccountId && t.toAccountId) {
            balanceChanges.set(t.fromAccountId, (balanceChanges.get(t.fromAccountId) || 0) + t.amount);
            balanceChanges.set(t.toAccountId, (balanceChanges.get(t.toAccountId) || 0) - t.amount);

            if (t.adminFee) {
              if (t.adminFeeChargeTo === "origin") {
                balanceChanges.set(t.fromAccountId, (balanceChanges.get(t.fromAccountId) || 0) + t.adminFee);
              } else {
                balanceChanges.set(t.toAccountId, (balanceChanges.get(t.toAccountId) || 0) + t.adminFee);
              }
            }
          }
        }
      }

      // 2. Apply new transaction balance changes
      if (type === "income") {
        if (!accountId) return;
        balanceChanges.set(accountId, (balanceChanges.get(accountId) || 0) + numAmount);

        let numAdmin = 0;
        if (hasAdminFee) {
          numAdmin = parseNumberInput(adminFee);
          if (!isNaN(numAdmin) && numAdmin > 0) {
            balanceChanges.set(accountId, (balanceChanges.get(accountId) || 0) - numAdmin);
          }
        }
      } else if (type === "expense") {
        if (!accountId) return;
        balanceChanges.set(accountId, (balanceChanges.get(accountId) || 0) - numAmount);

        let numAdmin = 0;
        if (hasAdminFee) {
          numAdmin = parseNumberInput(adminFee);
          if (!isNaN(numAdmin) && numAdmin > 0) {
            balanceChanges.set(accountId, (balanceChanges.get(accountId) || 0) - numAdmin);
          }
        }
      } else if (type === "transfer") {
        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) return;
        balanceChanges.set(fromAccountId, (balanceChanges.get(fromAccountId) || 0) - numAmount);
        balanceChanges.set(toAccountId, (balanceChanges.get(toAccountId) || 0) + numAmount);

        let numAdmin = 0;
        if (hasAdminFee) {
          numAdmin = parseNumberInput(adminFee);
          if (!isNaN(numAdmin) && numAdmin > 0) {
            if (adminFeeChargeTo === "origin") {
              balanceChanges.set(fromAccountId, (balanceChanges.get(fromAccountId) || 0) - numAdmin);
            } else {
              balanceChanges.set(toAccountId, (balanceChanges.get(toAccountId) || 0) - numAdmin);
            }
          }
        }
      }

      // 3. Write account balance updates to batch
      for (const [accId, change] of balanceChanges.entries()) {
        if (change === 0) continue;
        const accRef = doc(db, "users", user.uid, "accounts", accId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) {
          const currentBal = accDoc.data().balance || 0;
          batch.update(accRef, { balance: currentBal + change });
        }
      }

      // 4. Construct transaction data
      const tsxRef = editingTransaction
        ? doc(db, "users", user.uid, "transactions", editingTransaction.id)
        : doc(collection(db, "users", user.uid, "transactions"));

      const tsxData: any = {
        type,
        amount: numAmount,
        date: tsxDate ? new Date(tsxDate).getTime() : Date.now(),
        note,
      };

      if ((type === "income" || type === "expense") && categoryId) {
        const cat = categories.find((c) => c.id === categoryId);
        if (cat) {
          tsxData.categoryId = cat.id;
          tsxData.categoryName = cat.name;
          tsxData.categoryIcon = cat.icon;
        }
      } else {
        tsxData.categoryId = "";
        tsxData.categoryName = "";
        tsxData.categoryIcon = "";
      }

      if (type === "income" || type === "expense") {
        tsxData.accountId = accountId;
        tsxData.fromAccountId = "";
        tsxData.toAccountId = "";

        let numAdmin = 0;
        if (hasAdminFee) {
          numAdmin = parseNumberInput(adminFee);
          if (!isNaN(numAdmin) && numAdmin > 0) {
            tsxData.adminFee = numAdmin;
            tsxData.adminFeeChargeTo = "origin";
          } else {
            tsxData.adminFee = 0;
            tsxData.adminFeeChargeTo = "";
          }
        } else {
          tsxData.adminFee = 0;
          tsxData.adminFeeChargeTo = "";
        }
      } else if (type === "transfer") {
        tsxData.fromAccountId = fromAccountId;
        tsxData.toAccountId = toAccountId;
        tsxData.accountId = "";

        let numAdmin = 0;
        if (hasAdminFee) {
          numAdmin = parseNumberInput(adminFee);
          if (!isNaN(numAdmin) && numAdmin > 0) {
            tsxData.adminFee = numAdmin;
            tsxData.adminFeeChargeTo = adminFeeChargeTo;
          }
        } else {
          tsxData.adminFee = 0;
          tsxData.adminFeeChargeTo = "";
        }
      }

      if (editingTransaction) {
        batch.update(tsxRef, tsxData);
      } else {
        batch.set(tsxRef, tsxData);
      }

      await batch.commit();

      // Fire device notification with details
      let notifBody = "";
      let notifTitle = "";
      const actionStr = editingTransaction ? "diperbarui" : "berhasil dicatat";
      if (type === "income") {
        notifTitle = editingTransaction ? "Pemasukan diperbarui" : "Pemasukan baru";
        notifBody = `Pemasukan sebesar Rp ${numAmount.toLocaleString("id-ID")} ${actionStr}.\nKeterangan: ${note || "-"}`;
      } else if (type === "expense") {
        notifTitle = editingTransaction ? "Pengeluaran diperbarui" : "Pengeluaran baru";
        notifBody = `Pengeluaran sebesar Rp ${numAmount.toLocaleString("id-ID")} ${actionStr}.\nKeterangan: ${note || "-"}`;
      } else if (type === "transfer") {
        notifTitle = editingTransaction ? "Transfer diperbarui" : "Transfer baru";
        notifBody = `Transfer sebesar Rp ${numAmount.toLocaleString("id-ID")} dari ${getAccountName(fromAccountId)} ke ${getAccountName(toAccountId)} ${actionStr}.\nKeterangan: ${note || "-"}`;
      }
      if (notifTitle) {
        sendDeviceNotification(notifTitle, notifBody);
      }

      toast.success(editingTransaction ? "Transaksi berhasil diperbarui" : "Transaksi berhasil disimpan");
      closeModal();
    } catch (err) {
      console.error("Error saving transaction", err);
      toast.error("Gagal menyimpan transaksi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [tsxToDelete, setTsxToDelete] = useState<Transaction | null>(null);

  const confirmDeleteTransaction = async () => {
    if (!user || !tsxToDelete) return;

    try {
      const batch = writeBatch(db);
      const tsx = tsxToDelete;

      const tsxRef = doc(db, "users", user.uid, "transactions", tsx.id);
      batch.delete(tsxRef);

      const updateBal = async (accId: string, amountChange: number) => {
        const accRef = doc(db, "users", user.uid, "accounts", accId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) {
          const currentBal = accDoc.data().balance || 0;
          batch.update(accRef, { balance: currentBal + amountChange });
        }
      };

      if (tsx.type === "income") {
        if (tsx.accountId) {
          const change = -tsx.amount + (tsx.adminFee || 0);
          await updateBal(tsx.accountId, change);
        }
      } else if (tsx.type === "expense") {
        if (tsx.accountId) {
          const change = tsx.amount + (tsx.adminFee || 0);
          await updateBal(tsx.accountId, change);
        }
      } else if (tsx.type === "transfer") {
        if (tsx.fromAccountId && tsx.toAccountId) {
          let fromChange = tsx.amount;
          let toChange = -tsx.amount;

          if (tsx.adminFee) {
            if (tsx.adminFeeChargeTo === "origin") {
              fromChange += tsx.adminFee;
            } else if (tsx.adminFeeChargeTo === "destination") {
              toChange += tsx.adminFee;
            }
          }
          await updateBal(tsx.fromAccountId, fromChange);
          await updateBal(tsx.toAccountId, toChange);
        }
      }

      await batch.commit();
      toast.success("Transaksi berhasil dihapus");
      setTsxToDelete(null);
    } catch (err) {
      console.error("Error deleting transaction", err);
      toast.error("Gagal menghapus transaksi");
      // Fallback alert is still an issue, we can just log
    }
  };

  const saveGrabTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!grabCashAccount || !grabDompetAccount) {
      toast.error(
        "Peringatan: Silahkan atur Rekening Cash & Dompet Grab di halaman Pengaturan terlebih dahulu.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(db);
      const timestamp = grabDate ? new Date(grabDate).getTime() : Date.now();

      const updateAccountBalance = async (
        accId: string,
        amountChange: number,
      ) => {
        if (amountChange === 0) return;
        const accRef = doc(db, "users", user.uid, "accounts", accId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) {
          const currentBal = accDoc.data().balance || 0;
          batch.update(accRef, { balance: currentBal + amountChange });
        }
      };

      if (grabType === "nontunai") {
        const numNominal = parseNumberInput(grabNominal);
        if (isNaN(numNominal) || numNominal <= 0) return;

        const tsxRef = doc(collection(db, "users", user.uid, "transactions"));
        batch.set(tsxRef, {
          type: "income",
          amount: numNominal,
          date: timestamp,
          accountId: grabDompetAccount,
          note: `Grab Non-Tunai (${grabLabel})`,
        });
        await updateAccountBalance(grabDompetAccount, numNominal);
      } else {
        const cashDiterima = parseNumberInput(grabCashReceived);
        const appDriver = parseNumberInput(grabAppDriver);
        const appCust = parseNumberInput(grabAppCust);

        if (isNaN(cashDiterima) || isNaN(appDriver) || isNaN(appCust)) return;
        if (cashDiterima < appCust) {
          toast.error("Cash diterima tidak boleh kurang dari App Customer");
          return;
        }

        const grabDelta = appDriver - appCust;
        const tip = Math.max(0, cashDiterima - appCust);

        // 1. Transaction Cash Diterima -> ke akun Tunai
        const tsxCashRef = doc(
          collection(db, "users", user.uid, "transactions"),
        );
        batch.set(tsxCashRef, {
          type: "income",
          amount: cashDiterima,
          date: timestamp,
          accountId: grabCashAccount,
          note: `Grab Cash (${grabLabel}) - Driver ${appDriver}, Cust ${appCust}${tip > 0 ? `, Tip ${tip}` : ""}`,
        });
        await updateAccountBalance(grabCashAccount, cashDiterima);

        // 2. Transaction Grab Delta -> ke akun Grab
        if (grabDelta !== 0) {
          const isIncome = grabDelta > 0;
          const absDelta = Math.abs(grabDelta);
          const tsxDeltaRef = doc(
            collection(db, "users", user.uid, "transactions"),
          );
          batch.set(tsxDeltaRef, {
            type: isIncome ? "income" : "expense",
            amount: absDelta,
            date: timestamp + 1, // ensure order visually
            accountId: grabDompetAccount,
            note: `Selisih Grab (${grabLabel}) - Driver ${appDriver}, Cust ${appCust}`,
          });
          await updateAccountBalance(grabDompetAccount, grabDelta);
        }
      }

      await batch.commit();

      const nominalVal = parseNumberInput(grabNominal);
      sendDeviceNotification(
        "Transaksi Grab Baru 🚗",
        `Order Grab (${grabType === "tunai" ? "Tunai" : "Non-Tunai"}) - ${grabLabel}\nNominal: Rp ${nominalVal.toLocaleString("id-ID")}\nKeterangan: Driver ${grabAppDriver || "0"}, Cust ${grabAppCust || "0"}`
      );

      toast.success("Order Grab berhasil dicatat");

      // Reset form
      setGrabNominal("");
      setGrabCashReceived("");
      setGrabAppDriver("");
      setGrabAppCust("");
      setGrabDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setIsGrabModalOpen(false);
    } catch (err) {
      console.error("Error saving grab transaction", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTheme = () => {
    setThemeId(themeId === "dark" ? "light" : "dark");
  };

  const getInitials = (name: string) =>
    name.substring(0, 2).toUpperCase() || "US";

  const filteredByAccountTransactions = useMemo(() => {
    if (selectedReportAccount === "all") return transactions;
    return transactions.filter(
      (t) =>
        t.accountId === selectedReportAccount ||
        t.fromAccountId === selectedReportAccount ||
        t.toAccountId === selectedReportAccount,
    );
  }, [transactions, selectedReportAccount]);

  const filteredByPeriodTransactions = useMemo(() => {
    const today = new Date();
    return filteredByAccountTransactions.filter((t) => {
      const tDate = parseTxDate(t.date);
      if (selectedReportPeriod === "this_month") {
        return isSameMonth(tDate, today);
      }
      if (selectedReportPeriod === "last_month") {
        return isSameMonth(tDate, subMonths(today, 1));
      }
      if (selectedReportPeriod === "today") {
        return isSameDay(tDate, today);
      }
      if (selectedReportPeriod === "this_week") {
        return isSameWeek(tDate, today, { locale: localeId });
      }
      if (selectedReportPeriod.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = selectedReportPeriod.split("-");
        return (
          tDate.getFullYear() === parseInt(year) &&
          tDate.getMonth() === parseInt(month) - 1
        );
      }
      return true;
    });
  }, [filteredByAccountTransactions, selectedReportPeriod]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredByPeriodTransactions.forEach((t) => {
      if (t.type === "income") income += t.amount;
      if (t.type === "expense") expense += t.amount;
      if (t.adminFee) expense += t.adminFee;
    });
    const netProfit = income - expense;
    let daysInPeriod = 1;

    if (
      selectedReportPeriod === "this_month" ||
      selectedReportPeriod.match(/^\d{4}-\d{2}$/)
    ) {
      const refDate =
        selectedReportPeriod === "this_month"
          ? new Date()
          : new Date(selectedReportPeriod + "-01");
      daysInPeriod = new Date(
        refDate.getFullYear(),
        refDate.getMonth() + 1,
        0,
      ).getDate();
    } else if (selectedReportPeriod === "last_month") {
      const refDate = subMonths(new Date(), 1);
      daysInPeriod = new Date(
        refDate.getFullYear(),
        refDate.getMonth() + 1,
        0,
      ).getDate();
    } else if (selectedReportPeriod === "this_week") {
      daysInPeriod = 7;
    }

    const avgIncome = income / daysInPeriod;
    const avgExpense = expense / daysInPeriod;
    const savingsRate = income > 0 ? Math.max(0, Math.min(100, Math.round((netProfit / income) * 100))) : 0;
    return {
      income,
      expense,
      netProfit,
      avgIncome,
      avgExpense,
      savingsRate,
      count: filteredByPeriodTransactions.length,
    };
  }, [filteredByPeriodTransactions, selectedReportPeriod]);

  const getAccountIcon = (id: string) => {
    return accounts.find((a) => a.id === id)?.icon || "wallet";
  };

  const filteredTransactions = useMemo(() => {
    if (tab === "Semua") return filteredByPeriodTransactions;
    if (tab === "Pemasukan")
      return filteredByPeriodTransactions.filter((t) => t.type === "income");
    if (tab === "Pengeluaran")
      return filteredByPeriodTransactions.filter((t) => t.type === "expense");
    return filteredByPeriodTransactions;
  }, [filteredByPeriodTransactions, tab]);

  const mobileFilteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Period filter
    filtered = filtered.filter(t => {
      const tDate = parseTxDate(t.date);
      if (mobileTab === "Harian") return isSameDay(tDate, mobileCurrentDate);
      if (mobileTab === "Mingguan") return isSameWeek(tDate, mobileCurrentDate, { locale: currentLocale });
      if (mobileTab === "Bulanan") return isSameMonth(tDate, mobileCurrentDate);
      if (mobileTab === "Custom") {
        if (!mobileCustomStartDate || !mobileCustomEndDate) return true;
        const start = parseTxDate(mobileCustomStartDate);
        start.setHours(0, 0, 0, 0);
        const end = parseTxDate(mobileCustomEndDate);
        end.setHours(23, 59, 59, 999);
        return tDate >= start && tDate <= end;
      }
      return true;
    });

    // Account filter
    if (mobileAccountFilter !== "Semua") {
      filtered = filtered.filter((t) => t.accountId === mobileAccountFilter || t.fromAccountId === mobileAccountFilter || t.toAccountId === mobileAccountFilter);
    }

    // Category filter
    filtered = filtered.filter(t => {
      if (mobileIncomeFilter !== "Semua" && mobileExpenseFilter !== "Semua") {
        return t.categoryId === mobileIncomeFilter || t.categoryId === mobileExpenseFilter;
      }
      if (mobileIncomeFilter !== "Semua") {
        if (t.type === "income") return t.categoryId === mobileIncomeFilter;
        return false;
      }
      if (mobileExpenseFilter !== "Semua") {
        if (t.type === "expense") return t.categoryId === mobileExpenseFilter;
        return false;
      }
      return true;
    });

    return filtered;
  }, [transactions, mobileTab, mobileCurrentDate, mobileCustomStartDate, mobileCustomEndDate, mobileAccountFilter, mobileIncomeFilter, mobileExpenseFilter, currentLocale]);

  const mobileChartData = useMemo(() => {
    const dateMap = new Map();
    if (mobileTab === "Harian") {
      for (let i = 0; i <= 23; i++) {
        const hourString = i.toString().padStart(2, "0") + ":00";
        dateMap.set(hourString, { date: hourString, income: 0, expense: 0 });
      }
    }
    const sortedTsx = [...mobileFilteredTransactions].sort(
      (a, b) => parseTxDate(a.date).getTime() - parseTxDate(b.date).getTime(),
    );
    sortedTsx.forEach((t) => {
      const d = mobileTab === "Harian" ? safeFormatDate(t.date, "HH:00") : safeFormatDate(t.date, "dd/MM");
      if (!dateMap.has(d)) dateMap.set(d, { date: d, income: 0, expense: 0 });
      if (t.type === "income") dateMap.get(d).income += t.amount;
      if (t.type === "expense") dateMap.get(d).expense += t.amount;
      if (t.adminFee) dateMap.get(d).expense += t.adminFee;
    });
    let data = Array.from(dateMap.values());
    if (data.length === 0) {
      data = [{ date: mobileTab === "Harian" ? "00:00" : safeFormatDate(new Date(), "dd/MM"), income: 0, expense: 0 }];
    }
    return data;
  }, [mobileFilteredTransactions, mobileTab]);

  const mobileStats = useMemo(() => {
    let income = 0;
    let expense = 0;

    mobileFilteredTransactions.forEach((t) => {
      if (t.type === "income") {
        income += t.amount;
      } else if (t.type === "expense") {
        expense += t.amount;
      }
      if (t.adminFee) {
        expense += t.adminFee;
      }
    });

    return {
      income,
      expense,
      netProfit: income - expense,
    };
  }, [mobileFilteredTransactions]);

  const handleMobilePrev = () => {
    if (mobileTab === "Harian") setMobileCurrentDate((prev) => subDays(prev, 1));
    else if (mobileTab === "Mingguan") setMobileCurrentDate((prev) => subWeeks(prev, 1));
    else if (mobileTab === "Bulanan") setMobileCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleMobileNext = () => {
    if (mobileTab === "Harian") setMobileCurrentDate((prev) => addDays(prev, 1));
    else if (mobileTab === "Mingguan") setMobileCurrentDate((prev) => addWeeks(prev, 1));
    else if (mobileTab === "Bulanan") setMobileCurrentDate((prev) => addMonths(prev, 1));
  };

  const getMobilePeriodText = () => {
    if (mobileTab === "Harian") {
      if (isSameDay(mobileCurrentDate, new Date())) return (language === "en" ? "Today - " : "Hari ini - ") + format(mobileCurrentDate, "EEEE, d MMM yyyy", { locale: currentLocale });
      return format(mobileCurrentDate, "EEEE, d MMM yyyy", { locale: currentLocale });
    }
    if (mobileTab === "Mingguan") {
      if (isSameWeek(mobileCurrentDate, new Date(), { locale: currentLocale })) return (language === "en" ? "This week - " : "Minggu ini - ") + format(mobileCurrentDate, "d MMM yyyy", { locale: currentLocale });
      return (language === "en" ? "Week " : "Minggu ") + format(mobileCurrentDate, "w, MMM yyyy", { locale: currentLocale });
    }
    if (mobileTab === "Bulanan") {
      if (isSameMonth(mobileCurrentDate, new Date())) return (language === "en" ? "This month - " : "Bulan ini - ") + format(mobileCurrentDate, "MMMM yyyy", { locale: currentLocale });
      return format(mobileCurrentDate, "MMMM yyyy", { locale: currentLocale });
    }
    return "Custom";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const financialHealthStatus = useMemo(() => {
    if (stats.count === 0) {
      return {
        label: language === "en" ? "No Data Yet" : "Belum Ada Data",
        color: "text-app-text/60",
        bg: "bg-app-card border-app-border/60",
        badge: "neutral",
      };
    }
    if (stats.netProfit > 0) {
      return {
        label: language === "en" ? "Surplus Cash Flow" : "Keuangan Surplus 🟢",
        color: "text-app-success",
        bg: "bg-app-success/15 border-app-success/30",
        badge: "surplus",
      };
    }
    if (stats.netProfit < 0) {
      return {
        label: language === "en" ? "Deficit Warning" : "Pengeluaran Defisit 🔴",
        color: "text-app-danger",
        bg: "bg-app-danger/15 border-app-danger/30",
        badge: "deficit",
      };
    }
    return {
      label: language === "en" ? "Balanced Flow" : "Keuangan Seimbang 🟡",
      color: "text-amber-400",
      bg: "bg-app-accent1/15 border-amber-500/30",
      badge: "balanced",
    };
  }, [stats, language]);

  const expenseCategoryBreakdown = useMemo(() => {
    const catMap = new Map<string, { id: string; name: string; icon: string; total: number; count: number }>();
    const expenseTx = filteredByPeriodTransactions.filter((t) => t.type === "expense");

    expenseTx.forEach((t) => {
      const catId = t.categoryId || "uncategorized";
      const catName = t.categoryName || (language === "en" ? "Uncategorized" : "Tanpa Kategori");
      const catIcon = t.categoryIcon || "shopping-cart";

      const current = catMap.get(catId) || { id: catId, name: catName, icon: catIcon, total: 0, count: 0 };
      current.total += t.amount + (t.adminFee || 0);
      current.count += 1;
      catMap.set(catId, current);
    });

    const totalExpense = stats.expense || 1;
    return Array.from(catMap.values())
      .map((item) => ({
        ...item,
        pct: Math.min(100, Math.round((item.total / totalExpense) * 100)),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredByPeriodTransactions, stats.expense, language]);

  const incomeCategoryBreakdown = useMemo(() => {
    const catMap = new Map<string, { id: string; name: string; icon: string; total: number; count: number }>();
    const incomeTx = filteredByPeriodTransactions.filter((t) => t.type === "income");

    incomeTx.forEach((t) => {
      const catId = t.categoryId || "uncategorized";
      const catName = t.categoryName || (language === "en" ? "Uncategorized" : "Tanpa Kategori");
      const catIcon = t.categoryIcon || "briefcase";

      const current = catMap.get(catId) || { id: catId, name: catName, icon: catIcon, total: 0, count: 0 };
      current.total += t.amount;
      current.count += 1;
      catMap.set(catId, current);
    });

    const totalIncome = stats.income || 1;
    return Array.from(catMap.values())
      .map((item) => ({
        ...item,
        pct: Math.min(100, Math.round((item.total / totalIncome) * 100)),
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredByPeriodTransactions, stats.income, language]);

  const desktopChartData = useMemo(() => {
    const dateMap = new Map<string, { date: string; income: number; expense: number; net: number }>();
    if (selectedReportPeriod === "today") {
      for (let i = 0; i <= 23; i++) {
        const hourString = i.toString().padStart(2, "0") + ":00";
        dateMap.set(hourString, { date: hourString, income: 0, expense: 0, net: 0 });
      }
    }
    const sortedTsx = [...filteredByPeriodTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    sortedTsx.forEach((t) => {
      const d = selectedReportPeriod === "today" ? format(new Date(t.date), "HH:00") : format(new Date(t.date), "dd/MM");
      if (!dateMap.has(d)) {
        dateMap.set(d, { date: d, income: 0, expense: 0, net: 0 });
      }
      const item = dateMap.get(d)!;
      if (t.type === "income") item.income += t.amount;
      if (t.type === "expense") item.expense += t.amount;
      if (t.adminFee) item.expense += t.adminFee;
      item.net = item.income - item.expense;
    });
    let data = Array.from(dateMap.values());
    if (data.length === 0) {
      data = [{ date: selectedReportPeriod === "today" ? "00:00" : format(new Date(), "dd/MM"), income: 0, expense: 0, net: 0 }];
    }
    return data;
  }, [filteredByPeriodTransactions, selectedReportPeriod]);

  const filteredAndSearchedTransactions = useMemo(() => {
    let result = filteredTransactions;

    if (categoryFilter !== "all") {
      result = result.filter((t) => t.categoryId === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          (t.note && t.note.toLowerCase().includes(q)) ||
          (t.categoryName && t.categoryName.toLowerCase().includes(q)) ||
          t.amount.toString().includes(q)
      );
    }

    return result;
  }, [filteredTransactions, categoryFilter, searchQuery]);

  const groupedTransactions = useMemo(() => {
    const groups: { [dateKey: string]: { dateStr: string; dateObj: Date; items: Transaction[]; dailyIncome: number; dailyExpense: number } } = {};

    filteredAndSearchedTransactions.forEach((t) => {
      const tDate = parseTxDate(t.date);
      const key = safeFormatDate(tDate, "yyyy-MM-dd");
      if (!groups[key]) {
        let label = safeFormatDate(tDate, "EEEE, d MMMM yyyy", { locale: currentLocale });
        if (isSameDay(tDate, new Date())) {
          label = (language === "en" ? "Today, " : "Hari ini, ") + safeFormatDate(tDate, "d MMMM yyyy", { locale: currentLocale });
        } else if (isSameDay(tDate, subDays(new Date(), 1))) {
          label = (language === "en" ? "Yesterday, " : "Kemarin, ") + safeFormatDate(tDate, "d MMMM yyyy", { locale: currentLocale });
        }

        groups[key] = {
          dateStr: label,
          dateObj: tDate,
          items: [],
          dailyIncome: 0,
          dailyExpense: 0,
        };
      }

      groups[key].items.push(t);
      if (t.type === "income") groups[key].dailyIncome += t.amount;
      if (t.type === "expense") groups[key].dailyExpense += t.amount;
      if (t.adminFee) groups[key].dailyExpense += t.adminFee;
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((k) => groups[k]);
  }, [filteredAndSearchedTransactions, currentLocale, language]);

  const getPeriodText = () => {
    if (selectedReportPeriod === "today")
      return format(new Date(), "d MMMM yyyy", { locale: currentLocale });
    if (selectedReportPeriod === "this_week") return language === "en" ? "This Week" : "Minggu Ini";
    if (selectedReportPeriod === "this_month")
      return format(new Date(), "MMMM yyyy", { locale: currentLocale });
    if (selectedReportPeriod === "last_month")
      return format(subMonths(new Date(), 1), "MMMM yyyy", {
        locale: currentLocale,
      });
    if (selectedReportPeriod.match(/^\d{4}-\d{2}$/))
      return format(new Date(selectedReportPeriod + "-01"), "MMMM yyyy", {
        locale: currentLocale,
      });
    return "";
  };

  const exportToExcel = async () => {
    if (filteredByPeriodTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor pada periode ini.");
      return;
    }
    const XLSX = await import("xlsx");

    const data = filteredByPeriodTransactions.map((t) => {
      const typeStr =
        t.type === "income"
          ? "Pemasukan"
          : t.type === "expense"
            ? "Pengeluaran"
            : "Transfer";
      return {
        Tanggal: format(new Date(t.date), "dd/MM/yyyy HH:mm"),
        Tipe: typeStr,
        Catatan: t.note,
        Jumlah: t.amount,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(
      workbook,
      `Laporan_Keuangan_${getPeriodText().replace(/\s+/g, "_")}.xlsx`,
    );
  };

  const exportToPDF = async () => {
    if (filteredByPeriodTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor pada periode ini.");
      return;
    }
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF();
    doc.text(`Laporan Keuangan - ${getPeriodText()}`, 14, 15);

    const bodyData = filteredByPeriodTransactions.map((t) => {
      const typeStr =
        t.type === "income"
          ? "Pemasukan"
          : t.type === "expense"
            ? "Pengeluaran"
            : "Transfer";
      return [
        format(new Date(t.date), "dd/MM/yyyy HH:mm"),
        typeStr,
        t.note,
        `Rp ${t.amount.toLocaleString("id-ID")}`,
      ];
    });

    autoTable(doc, {
      head: [["Tanggal", "Tipe", "Catatan", "Jumlah"]],
      body: bodyData,
      startY: 25,
    });

    doc.save(`Laporan_Keuangan_${getPeriodText().replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <>
      {!modalOnly && (
        <div className="route-transactions page-register transaction-workspace flex h-full w-full flex-1 flex-col overflow-y-auto p-0 text-app-text">
          {/* MOBILE LAYOUT */}
          <div className="transaction-mobile flex min-h-0 w-full flex-col px-4 pb-32 pt-5 md:hidden">
        {/* Header */}
        <div className="mobile-transaction-header mb-4 flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border/40 bg-app-card/60 text-app-text hover:text-app-text-bright" aria-label="Kembali">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-app-text-bright">
            <TextReveal text={language === 'en' ? "Transactions" : "Transaksi"} />
          </h1>
          <button type="button" onClick={exportToPDF} className="flex h-11 w-11 items-center justify-center rounded-xl border border-app-border/40 bg-app-card/60 text-app-text/80 hover:text-app-text-bright" aria-label="Ekspor laporan sebagai PDF" title="Ekspor PDF">
            <Share2 className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Period Tabs */}
        <div className="mobile-period-tabs mb-3 flex items-center justify-between gap-1 border-y border-app-border/60">
          {["Harian", "Mingguan", "Bulanan", "Custom"].map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={mobileTab === p}
              onClick={() => {
                setMobileTab(p as any);
                setMobileCurrentDate(new Date());
              }}
              className={`min-h-11 flex-1 border-b-2 border-transparent px-1 text-xs font-semibold transition-colors ${mobileTab === p ? "border-app-accent1 text-app-accent1" : "text-app-text/60 hover:bg-app-hover hover:text-app-text-bright"}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Date Navigator */}
        {mobileTab === "Custom" ? (
          <div className="mobile-date-range mb-4 flex items-center gap-2 border-b border-app-border/60 py-2">
            <input
              type="date"
              aria-label="Tanggal mulai"
              value={mobileCustomStartDate}
              onChange={(e) => setMobileCustomStartDate(e.target.value)}
              className="flex-1 bg-app-card border border-app-border text-app-text-bright text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-app-accent1"
            />
            <span className="text-app-text/50 text-xs">-</span>
            <input
              type="date"
              aria-label="Tanggal selesai"
              value={mobileCustomEndDate}
              onChange={(e) => setMobileCustomEndDate(e.target.value)}
              className="flex-1 bg-app-card border border-app-border text-app-text-bright text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-app-accent1"
            />
          </div>
        ) : (
          <div className="mobile-period-nav mb-4 flex items-center justify-between border-b border-app-border/60 py-1.5">
            <button type="button" onClick={handleMobilePrev} className="flex h-11 w-11 items-center justify-center rounded-lg border border-app-border/50 bg-app-card text-app-accent1" aria-label="Periode sebelumnya">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-xs text-app-text-bright">
              {getMobilePeriodText()}
            </span>
            <button type="button" onClick={handleMobileNext} className="flex h-11 w-11 items-center justify-center rounded-lg border border-app-border/50 bg-app-card text-app-accent1" aria-label="Periode berikutnya">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters Group */}
        <details className="mobile-filter-panel mb-5 border-y border-app-border/60">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-2 text-sm font-medium text-app-text-bright">
            <span>Filter transaksi</span>
            <span className="flex items-center gap-1.5 text-xs text-app-text/55">
              {[mobileAccountFilter, mobileIncomeFilter, mobileExpenseFilter].filter((value) => value !== "Semua").length || "Semua"}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </span>
          </summary>
          <div className="space-y-3 pb-3">
          {/* Account Filter */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-app-card border border-app-border/60 flex items-center justify-center shrink-0">
              <Wallet className="w-3.5 h-3.5 text-app-text/70" />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                aria-pressed={mobileAccountFilter === "Semua"}
                onClick={() => setMobileAccountFilter("Semua")}
                className={`min-h-11 shrink-0 rounded-xl px-3 text-xs font-semibold transition-colors ${mobileAccountFilter === "Semua" ? "bg-app-accent1 text-app-bg" : "border border-app-border/60 bg-app-card text-app-text/70 hover:border-app-text/30"}`}
              >
                Semua
              </button>
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  aria-pressed={mobileAccountFilter === acc.id}
                  onClick={() => setMobileAccountFilter(acc.id)}
                  className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs transition-colors ${mobileAccountFilter === acc.id ? "bg-app-accent1 text-app-bg font-semibold" : "border border-app-border/60 bg-app-card text-app-text/70 hover:border-app-text/30"}`}
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${acc.id === "tunai" ? "bg-app-accent1" : "bg-app-text/35"}`}
                  />
                  {acc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Income Category Filter */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-app-success/15 border border-app-success/20 flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-app-success" />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                aria-pressed={mobileIncomeFilter === "Semua"}
                onClick={() => setMobileIncomeFilter("Semua")}
                className={`min-h-11 shrink-0 rounded-xl px-3 text-xs font-semibold transition-colors ${mobileIncomeFilter === "Semua" ? "bg-app-accent1 text-app-bg" : "border border-app-border/60 bg-app-card text-app-text/70 hover:border-app-text/30"}`}
              >
                Semua
              </button>
              {categories
                .filter((c) => c.type === "income")
                .map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={mobileIncomeFilter === cat.id}
                    onClick={() => setMobileIncomeFilter(cat.id)}
                    className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs transition-colors ${mobileIncomeFilter === cat.id ? "border border-app-success/40 bg-app-success/20 font-semibold text-app-success" : "border border-app-border/60 bg-app-card text-app-text/70 hover:border-app-text/30"}`}
                  >
                    <Briefcase className="w-3 h-3 text-app-success" />
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>

          {/* Expense Category Filter */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-app-danger/15 border border-app-danger/20 flex items-center justify-center shrink-0">
              <TrendingDown className="w-3.5 h-3.5 text-app-danger" />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                type="button"
                aria-pressed={mobileExpenseFilter === "Semua"}
                onClick={() => setMobileExpenseFilter("Semua")}
                className={`min-h-11 shrink-0 rounded-xl px-3 text-xs font-semibold transition-colors ${mobileExpenseFilter === "Semua" ? "bg-app-accent1 text-app-bg" : "border border-app-border/60 bg-app-card text-app-text/70 hover:border-app-text/30"}`}
              >
                Semua
              </button>
              {categories
                .filter((c) => c.type === "expense")
                .map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={mobileExpenseFilter === cat.id}
                    onClick={() => setMobileExpenseFilter(cat.id)}
                    className={`flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs transition-colors ${mobileExpenseFilter === cat.id ? "border border-app-danger/40 bg-app-danger/20 font-semibold text-app-danger" : "border border-app-border/60 bg-app-card text-app-text/70 hover:border-app-text/30"}`}
                  >
                    <ShoppingCart className="w-3 h-3 text-app-danger" />
                    {cat.name}
                  </button>
                ))}
            </div>
          </div>
          </div>
        </details>

        {/* The chart stays available without pushing the ledger below the first viewport. */}
        <details className="mobile-cashflow-disclosure mb-5 border-y border-app-border">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between py-2 text-sm font-semibold text-app-text-bright">
            <span>Tren arus kas</span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-app-text/55">
              Lihat grafik <ChevronDown className="h-4 w-4" />
            </span>
          </summary>
        <div className="relative border-t border-app-border py-4">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mobileChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-app-border, #333)"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-app-text, #aaa)" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-app-text, #aaa)" }}
                  tickFormatter={(val) => {
                    if (val >= 1000) return `${val / 1000}k`;
                    return val;
                  }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="space-y-1 rounded-xl border border-app-border bg-app-card p-3 text-xs">
                          <p className="font-semibold text-app-text-bright mb-1 border-b border-app-border pb-1">
                            {mobileTab === "Harian" ? `${label}` : `Tanggal ${label}`}
                          </p>
                          <p className="font-medium text-app-success">
                            Pemasukan: Rp {Number(payload[0]?.value || 0).toLocaleString("id-ID")}
                          </p>
                          <p className="font-medium text-app-danger">
                            Pengeluaran: Rp {Number(payload[1]?.value || 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="var(--success-color)"
                  strokeWidth={2}
                  fillOpacity={0}
                  fill="transparent"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="var(--danger-color)"
                  strokeWidth={2}
                  fillOpacity={0}
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        </details>

        <dl className="mobile-summary-strip mb-7 grid grid-cols-3 divide-x divide-app-border border-y border-app-border">
          <div className="py-5 pr-3">
            <dt className="text-xs text-app-text/50">Pemasukan</dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-app-success">
              Rp {mobileStats.income.toLocaleString("id-ID")}
            </dd>
          </div>
          <div className="px-3 py-5">
            <dt className="text-xs text-app-text/50">Pengeluaran</dt>
            <dd className="mt-1 font-mono text-sm font-semibold text-app-danger">
              Rp {mobileStats.expense.toLocaleString("id-ID")}
            </dd>
          </div>
          <div className="py-5 pl-3">
            <dt className="text-xs text-app-text/50">Bersih</dt>
            <dd className={`mt-1 font-mono text-sm font-semibold ${mobileStats.netProfit >= 0 ? "text-app-accent1" : "text-app-danger"}`}>
              Rp {mobileStats.netProfit.toLocaleString("id-ID")}
            </dd>
          </div>
        </dl>

        <section className="mobile-transaction-list">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-app-text-bright">Daftar transaksi</h3>
            <span className="text-xs text-app-text/50">{mobileFilteredTransactions.length} catatan</span>
          </div>

          {mobileFilteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center border-y border-app-border py-12 text-center text-xs text-app-text/55">
              <FileText className="mb-3 h-8 w-8 text-app-text/30" />
              <p className="font-medium text-app-text-bright">Belum ada transaksi</p>
              <p className="mt-1">Catatan baru akan tampil pada periode ini.</p>
            </div>
          ) : (
            <StaggerContainer
              key={`${mobileCurrentDate.toISOString()}_${mobileTab}_${mobileIncomeFilter}_${mobileExpenseFilter}_${mobileAccountFilter}`}
              className="divide-y divide-app-border border-y border-app-border"
            >
              {mobileFilteredTransactions.map((t) => (
                <StaggerItem key={t.id} className="mobile-transaction-entry py-0">
                  <details>
                    <summary className="grid min-h-[68px] cursor-pointer list-none grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 py-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center ${
                          t.type === "income"
                            ? "text-app-success"
                            : t.type === "expense"
                              ? "text-app-danger"
                              : "text-app-accent1"
                        }`}
                      >
                        <AccountIcon
                          iconId={getAccountIcon(t.type === "transfer" ? t.fromAccountId : t.accountId)}
                          className="h-[18px] w-[18px]"
                        />
                      </span>

                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-app-text-bright">
                          {t.note || (t.type === "income" ? "Pemasukan" : t.type === "expense" ? "Pengeluaran" : "Transfer")}
                        </span>
                        <span className="mt-1 flex min-w-0 items-center gap-1.5 text-[11px] text-app-text/55">
                          {t.categoryId && (
                            <CategoryIcon iconId={t.categoryIcon || "dollar-sign"} className="h-3 w-3 shrink-0" />
                          )}
                          <span className="truncate">
                            {t.type === "transfer"
                              ? `${getAccountName(t.fromAccountId)} → ${getAccountName(t.toAccountId)}`
                              : [t.categoryName, getAccountName(t.accountId)].filter(Boolean).join(" · ")}
                          </span>
                          <span aria-hidden="true">·</span>
                          <time className="shrink-0">{safeFormatDate(t.date, "dd MMM, HH:mm", { locale: currentLocale })}</time>
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5 text-right">
                        <span>
                          <span
                            className={`block whitespace-nowrap font-mono text-xs font-semibold ${
                              t.type === "income"
                                ? "text-app-success"
                                : t.type === "expense"
                                  ? "text-app-danger"
                                  : "text-app-text-bright"
                            }`}
                          >
                            {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} Rp {t.amount.toLocaleString("id-ID")}
                          </span>
                          {Boolean(t.adminFee) && (
                            <span className="mt-1 block text-[11px] font-medium text-app-danger">
                              Fee −Rp {t.adminFee.toLocaleString("id-ID")}
                            </span>
                          )}
                        </span>
                        <MoreHorizontal className="h-4 w-4 shrink-0 text-app-text/40" aria-hidden="true" />
                      </span>
                    </summary>
                    <div className="flex justify-end gap-2 border-t border-app-border/60 pb-3 pt-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="flex min-h-11 items-center gap-2 px-3 text-xs font-semibold text-app-accent1 hover:bg-app-accent1/10"
                      >
                        <Edit2 className="h-4 w-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setTsxToDelete(t)}
                        className="flex min-h-11 items-center gap-2 px-3 text-xs font-semibold text-app-danger hover:bg-app-danger/10"
                      >
                        <Trash2 className="h-4 w-4" /> Hapus
                      </button>
                    </div>
                  </details>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </section>
      </div>
      {/* DESKTOP LAYOUT */}
      <div className="transaction-desktop hidden h-full w-full flex-col gap-0 md:flex">
        {/* HEADER SECTION (Like Dashboard) */}
        {/* HEADER SECTION */}
        <header className="transaction-header flex shrink-0 flex-col justify-between gap-4 px-7 py-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl md:text-[1.75rem] font-semibold text-app-text-bright tracking-tight leading-tight">
              <TextReveal text={language === "en" ? "Transactions" : "Transaksi"} />
            </h1>
            <p className="text-app-text/60 text-sm mt-1">
              {language === "en" ? "Review, filter, and reconcile every movement of money." : "Tinjau, filter, dan cocokkan setiap pergerakan uang."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ActionBtn
              variant="success"
              icon={<Car className="w-4 h-4" />}
              onClick={() => setGlobalGrabModalOpen(true)}
              title={language === "en" ? "Grab Transactions" : "Transaksi Grab"}
            />
            <ActionBtn
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setGlobalAddModalOpen(true)}
              title={language === "en" ? "Add Transaction" : "Tambah Transaksi"}
            >
              {language === "en" ? "Add" : "Tambah"}
            </ActionBtn>
            <Link
              to="/settings"
              state={{ expandSection: 'profile' }}
              className="flex items-center gap-2.5 h-9 px-3 rounded-xl bg-app-card border border-app-border text-sm font-medium text-app-text-bright hover:bg-app-hover transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-app-accent1 text-[11px] font-semibold flex items-center justify-center text-app-bg overflow-hidden shrink-0">
                {user?.photoURL ? (
                  <img
                    src={user?.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(user?.displayName || "USER")
                )}
              </div>
              <span className="text-app-text/70">{user?.displayName?.split(' ')[0] || "User"}</span>
            </Link>
          </div>
        </header>

        {/* FILTER & EXPORT BAR */}
        <ScrollReveal className="transaction-filter-block">
          <div className="bg-app-card border border-app-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-app-text-bright text-[20px] font-semibold tracking-tight">
                  {language === "en" ? "Transaction period" : "Periode transaksi"}
                </h2>
              </div>
              <p className="text-app-text/60 text-xs">
                {language === "en" ? "Period:" : "Periode:"} <span className="font-medium text-app-text-bright">{getPeriodText()}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 relative z-10">
              <div className="relative">
                <select
                  value={selectedReportAccount}
                  onChange={(e) => setSelectedReportAccount(e.target.value)}
                  className="bg-app-bg border border-app-border text-app-text-bright text-xs rounded-xl pl-3.5 pr-9 py-2.5 appearance-none outline-none focus:border-app-accent1 cursor-pointer font-medium"
                >
                  <option value="all">{language === "en" ? "All Wallets" : "Semua Dompet"}</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString("id-ID")})</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-app-text/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    aria-label="Rekening transaksi"
                    value={
                      selectedReportPeriod.match(/^\d{4}-\d{2}$/)
                        ? "custom"
                        : selectedReportPeriod
                    }
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setSelectedReportPeriod(format(new Date(), "yyyy-MM"));
                      } else {
                        setSelectedReportPeriod(e.target.value);
                      }
                    }}
                    className="bg-app-bg border border-app-border text-app-text-bright text-xs rounded-xl pl-3.5 pr-9 py-2.5 appearance-none outline-none focus:border-app-accent1 cursor-pointer font-medium"
                  >
                    <option value="today">{language === "en" ? "Today" : "Hari Ini"}</option>
                    <option value="this_week">{language === "en" ? "This Week" : "Minggu Ini"}</option>
                    <option value="this_month">{language === "en" ? "This Month" : "Bulan Ini"}</option>
                    <option value="last_month">{language === "en" ? "Previous Month" : "Bulan Sebelumnya"}</option>
                    <option value="custom">{language === "en" ? "Select Month" : "Pilih Bulan"}</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-app-text/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {selectedReportPeriod.match(/^\d{4}-\d{2}$/) && (
                  <input
                    type="month"
                    value={selectedReportPeriod}
                    onChange={(e) => setSelectedReportPeriod(e.target.value)}
                    className="bg-app-bg border border-app-border text-app-text-bright text-xs rounded-xl px-3 py-2 outline-none focus:border-app-accent1 cursor-pointer"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={exportToExcel}
                className="flex h-11 items-center gap-1.5 rounded-xl border border-app-success/30 px-3.5 text-xs font-medium text-app-success hover:bg-app-success/10"
              >
                <FileSpreadsheet className="w-4 h-4" /> Excel
              </button>
              <button
                type="button"
                onClick={exportToPDF}
                className="flex h-11 items-center gap-1.5 rounded-xl bg-app-danger px-3.5 text-xs font-medium text-app-bg hover:opacity-90"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* STATS & AI INSIGHT GRID */}
        <ScrollReveal className="transaction-statement-block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
            {/* TOTAL KEUNTUNGAN BERSIH */}
            <div className="lg:col-span-2 bg-app-card rounded-2xl p-6 border border-app-border flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-app-text/60">
                    {language === "en" ? "Total Net Profit" : "Total Keuntungan Bersih"}
                  </span>
                  <span className={`text-xs font-medium ${financialHealthStatus.color}`}>
                    {financialHealthStatus.label}
                  </span>
                </div>

                <h2 className={`text-4xl md:text-5xl font-mono font-bold tracking-tight mb-3 ${stats.netProfit >= 0 ? "text-app-text-bright" : "text-app-danger"}`}>
                  Rp {stats.netProfit.toLocaleString("id-ID")}
                </h2>

                {/* MARGIN PROGRESS METER */}
                <div className="space-y-1.5 mt-4 max-w-md">
                  <div className="flex justify-between text-xs text-app-text/60">
                    <span>
                      {stats.income > 0
                        ? `Penyimpanan: ${stats.savingsRate}% dari Pemasukan`
                        : "Belum ada pemasukan terdeteksi"}
                    </span>
                    <span className="font-semibold text-app-text-bright">
                      Target: min. 20%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-app-bg border border-app-border rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, stats.savingsRate))}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        stats.savingsRate >= 20 ? "bg-app-success" : stats.savingsRate > 0 ? "bg-app-accent1" : "bg-app-danger"
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="relative z-10 mt-auto grid grid-cols-1 divide-y divide-app-border border-y border-app-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="flex flex-col justify-center py-4 text-left sm:pr-4">
                  <span className="text-lg font-bold text-app-text-bright mb-0.5">
                    {stats.count}
                  </span>
                  <span className="text-xs text-app-text/50">
                    {language === "en" ? "Total Transactions" : "Total Transaksi"}
                  </span>
                </div>
                <div className="flex flex-col justify-center py-4 text-left sm:px-4">
                  <span className="text-lg font-bold text-app-success mb-0.5">
                    Rp {Math.round(stats.avgIncome).toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-app-text/50">
                    {language === "en" ? "Income / Day" : "Rata-rata / Hari"}
                  </span>
                </div>
                <div className="flex flex-col justify-center py-4 text-left sm:pl-4">
                  <span className="text-lg font-bold text-app-danger mb-0.5">
                    Rp {Math.round(stats.avgExpense).toLocaleString("id-ID")}
                  </span>
                  <span className="text-xs text-app-text/50">
                    {language === "en" ? "Expenses / Day" : "Pengeluaran / Hari"}
                  </span>
                </div>
              </div>
            </div>

            {/* AI INSIGHT */}
            <div className="bg-app-card rounded-2xl p-6 border border-app-border flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-app-accent1/60" />

              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-app-accent1/10 flex items-center justify-center text-app-accent1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium text-app-accent1">
                    Insight keuangan
                  </span>
                </div>
              </div>

              <h3 className="text-app-text-bright text-[18px] font-semibold tracking-tight mb-2 relative z-10">
                {stats.count === 0
                  ? `Belum Ada Transaksi ${selectedReportPeriod === "today" ? "Hari Ini" : selectedReportPeriod === "this_week" ? "Minggu Ini" : "Bulan Ini"}`
                  : stats.netProfit > 0
                    ? "Keuangan Sehat & Surplus"
                    : stats.netProfit < 0
                      ? "Pengeluaran Melebihi Pemasukan"
                      : "Keuangan Berada di Titik Seimbang"}
              </h3>

              <p className="text-app-text/70 text-xs leading-relaxed mb-6 flex-1 relative z-10">
                {stats.count === 0
                  ? "Belum ada transaksi tercatat pada periode ini. Mulai catat transaksi harian Anda untuk melihat visualisasi dan rekomendasi AI."
                  : stats.netProfit > 0
                    ? `Performa keuangan baik! Anda berhasil mencatatkan surplus sebesar Rp ${stats.netProfit.toLocaleString("id-ID")}. Alokasikan sebagian surplus ini ke dana darurat atau instrumen investasi.`
                    : stats.netProfit < 0
                      ? `Perhatian! Pengeluaran Anda melebihi pemasukan sebesar Rp ${Math.abs(stats.netProfit).toLocaleString("id-ID")}. Evaluasi kategori pengeluaran terbesar Anda.`
                      : "Pemasukan dan pengeluaran Anda tepat seimbang. Upayakan efisiensi pengeluaran untuk menciptakan margin tabungan."}
              </p>

              <button
                type="button"
                onClick={fetchFinancialStrategy}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-app-accent1/30 bg-app-accent1/10 px-4 text-xs font-semibold text-app-accent1 hover:bg-app-accent1/20"
              >
                <span>Pelajari Strategi AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* VISUAL CHARTS SECTION */}
        <ScrollReveal className="transaction-charts-block">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
            {/* CASH FLOW TREND CHART */}
            <div className="lg:col-span-2 bg-app-card border border-app-border rounded-2xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-app-success/10 flex items-center justify-center text-app-success">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-app-text-bright">
                      Tren Arus Kas (Pemasukan vs Pengeluaran)
                    </h3>
                    <p className="text-[11px] text-app-text/50">
                      Visualisasi pergerakan dana harian pada periode terpilih
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-app-success" />
                    <span className="text-app-text/70">Pemasukan</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-app-danger" />
                    <span className="text-app-text/70">Pengeluaran</span>
                  </div>
                </div>
              </div>

              <div className="h-[240px] w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={desktopChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.7} />
                    <XAxis dataKey="date" stroke="var(--text-color)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-color)" fontSize={11} tickLine={false} tickFormatter={(v) => `Rp ${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="space-y-1 rounded-xl border border-app-border bg-app-card p-3 text-xs">
                              <p className="font-semibold text-app-text-bright mb-1 border-b border-app-border pb-1">
                                {selectedReportPeriod === "today" ? `${label}` : `Tanggal ${label}`}
                              </p>
                              <p className="text-app-success font-medium">
                                Pemasukan: Rp {Number(payload[0]?.value || 0).toLocaleString("id-ID")}
                              </p>
                              <p className="text-app-danger font-medium">
                                Pengeluaran: Rp {Number(payload[1]?.value || 0).toLocaleString("id-ID")}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="income" stroke="var(--success-color)" strokeWidth={2} fillOpacity={0} fill="transparent" />
                    <Area type="monotone" dataKey="expense" stroke="var(--danger-color)" strokeWidth={2} fillOpacity={0} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CATEGORY BREAKDOWN VISUALIZER */}
            <div className="bg-app-card border border-app-border rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-app-accent1/10 flex items-center justify-center text-app-accent1">
                      <PieChartIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-app-text-bright">
                        Alokasi Pengeluaran
                      </h3>
                      <p className="text-[11px] text-app-text/50">
                        Kategori pengeluaran terbesar
                      </p>
                    </div>
                  </div>
                </div>

                {expenseCategoryBreakdown.length === 0 ? (
                  <div className="text-center py-12 text-app-text/50 text-xs">
                    Belum ada data pengeluaran.
                  </div>
                ) : (
                  <div className="space-y-3 mt-2">
                    {expenseCategoryBreakdown.slice(0, 4).map((cat) => (
                      <div key={cat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-app-text-bright truncate max-w-[140px] flex items-center gap-1.5">
                            <CategoryIcon iconId={cat.icon} className="w-3.5 h-3.5 text-app-accent1" />
                            <span>{cat.name}</span>
                          </span>
                          <span className="font-semibold text-app-danger">
                            Rp {cat.total.toLocaleString("id-ID")} ({cat.pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-app-bg border border-app-border/40 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${cat.pct}%` }}
                            className="h-full bg-app-danger rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="button"
                onClick={() => {
                  setTab("Pengeluaran");
                  detailRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="mt-4 pt-3 border-t border-app-border/50 text-xs font-semibold text-app-accent1 hover:underline text-center w-full"
              >
                Lihat Semua Kategori →
              </button>
            </div>
          </div>
        </ScrollReveal>

        {/* SUMBER & ALOKASI SUMMARY CARDS */}
        <ScrollReveal className="transaction-secondary-block">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 shrink-0">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-app-text-bright">
                  Sumber Pendapatan
                </h3>
                <button type="button"
                  onClick={() => {
                    setTab("Pemasukan");
                    detailRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-app-accent1 text-xs font-semibold hover:underline"
                >
                  Lihat Detail →
                </button>
              </div>
              <HoverCard
                onClick={() => {
                  setTab("Pemasukan");
                  detailRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-app-card border border-app-border rounded-2xl p-6 flex justify-between items-center overflow-hidden relative cursor-pointer hover:bg-app-hover transition-colors w-full"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-app-success/10 flex items-center justify-center shrink-0 border border-app-success/20">
                    <TrendingUp className="w-6 h-6 text-app-success" />
                  </div>
                  <div>
                    <p className="text-app-text-bright font-semibold text-base">
                      Total Pemasukan
                    </p>
                    <p className="text-app-text/50 text-xs mt-0.5">
                      {filteredByPeriodTransactions.filter((t) => t.type === "income").length} Transaksi
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-app-success relative z-10">
                  Rp {stats.income.toLocaleString("id-ID")}
                </p>
              </HoverCard>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-app-text-bright">
                  Alokasi Pengeluaran
                </h3>
                <button type="button"
                  onClick={() => {
                    setTab("Pengeluaran");
                    detailRef.current?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-app-danger text-xs font-semibold hover:underline"
                >
                  Optimasi Biaya →
                </button>
              </div>
              <HoverCard
                onClick={() => {
                  setTab("Pengeluaran");
                  detailRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-app-card border border-app-border rounded-2xl p-6 flex justify-between items-center overflow-hidden relative cursor-pointer hover:bg-app-hover transition-colors w-full"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-app-danger/10 flex items-center justify-center shrink-0 border border-app-danger/20">
                    <TrendingDown className="w-6 h-6 text-app-danger" />
                  </div>
                  <div>
                    <p className="text-app-text-bright font-semibold text-base">
                      Total Pengeluaran
                    </p>
                    <p className="text-app-text/50 text-xs mt-0.5">
                      {filteredByPeriodTransactions.filter((t) => t.type === "expense").length} Transaksi
                    </p>
                  </div>
                </div>
                <p className="text-xl font-bold font-mono text-app-danger relative z-10">
                  Rp {stats.expense.toLocaleString("id-ID")}
                </p>
              </HoverCard>
            </div>
          </div>
        </ScrollReveal>

        {/* DETAIL TRANSAKSI */}
        <div
          ref={detailRef}
          className="transaction-ledger-block flex min-h-[400px] flex-1 shrink-0 flex-col"
        >
          {/* SEARCH & TYPE FILTER BAR */}
          <div className="transaction-ledger-surface flex flex-col space-y-4 border border-app-border bg-app-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-app-text-bright">
                  Detail Transaksi
                </h3>
                <span className="text-xs bg-app-bg border border-app-border px-2.5 py-1 rounded-full text-app-text/60 font-medium">
                  {filteredAndSearchedTransactions.length} Transaksi
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* SEARCH INPUT */}
                <div className="relative min-w-[200px] flex-1 sm:flex-none">
                  <Search className="w-4 h-4 text-app-text/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari transaksi..."
                    className="w-full bg-app-bg border border-app-border text-app-text-bright text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-app-accent1 transition-colors"
                  />
                  {searchQuery && (
                    <button type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-app-text/40 hover:text-app-text"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* CATEGORY FILTER SELECT */}
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-app-bg border border-app-border text-app-text-bright text-xs rounded-xl pl-3 pr-8 py-2 appearance-none outline-none focus:border-app-accent1 cursor-pointer font-medium"
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-app-text/50 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* TYPE TABS */}
                <div className="flex items-center gap-1 bg-app-bg p-1 rounded-xl border border-app-border">
                  {["Semua", "Pemasukan", "Pengeluaran"].map((t) => {
                    const isActive = tab === t;
                    const activeColorClass = t === "Semua" ? "bg-app-accent1" : t === "Pemasukan" ? "bg-app-success" : "bg-app-danger";
                    return (
                      <button type="button"
                        key={t}
                        onClick={() => setTab(t as any)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative cursor-pointer"
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTabTxDesktop"
                            className={`absolute inset-0 rounded-lg ${activeColorClass}`}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <span className={`relative z-10 ${isActive ? "text-app-bg" : "text-app-text/60 hover:text-app-text-bright"}`}>
                          {t}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* GROUPED TRANSACTION TIMELINE */}
            {groupedTransactions.length === 0 ? (
              <div className="p-12 text-center text-app-text/50 rounded-2xl border border-dashed border-app-border my-2 flex flex-col items-center justify-center gap-3">
                <MicroLoop type="waggle">
                  <Wallet className="w-10 h-10 text-app-accent1/60" />
                </MicroLoop>
                <span className="text-sm font-medium">Tidak ada transaksi yang cocok dengan filter.</span>
              </div>
            ) : (
              <div className="space-y-6 pt-2 overflow-y-auto max-h-[600px] pr-1">
                {groupedTransactions.map((group) => (
                  <div key={group.dateStr} className="space-y-2">
                    {/* DATE GROUP HEADER */}
                    <div className="ledger-date-row sticky top-0 z-20 flex items-center justify-between border border-app-border/40 bg-app-bg/95 px-3 py-2 text-xs font-semibold text-app-text/70">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-app-accent1" />
                        <span>{group.dateStr}</span>
                      </span>
                      <div className="flex items-center gap-3 font-mono">
                        {group.dailyIncome > 0 && (
                          <span className="text-app-success">+Rp {group.dailyIncome.toLocaleString("id-ID")}</span>
                        )}
                        {group.dailyExpense > 0 && (
                          <span className="text-app-danger">-Rp {group.dailyExpense.toLocaleString("id-ID")}</span>
                        )}
                      </div>
                    </div>

                    {/* ITEMS LIST */}
                    <div className="space-y-2">
                      {group.items.map((t) => (
                        <div
                          key={t.id}
                          className="ledger-entry-row group flex cursor-pointer items-center justify-between border-b border-app-border/60 bg-app-bg px-3.5 py-3.5 hover:bg-app-hover"
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                              ${
                                t.type === "income"
                                  ? "bg-app-success/10 text-app-success border-app-success/20"
                                  : t.type === "expense"
                                    ? "bg-app-danger/10 text-app-danger border-app-danger/20"
                                    : "bg-app-accent1/10 text-app-accent1 border-app-accent1/20"
                              }`}
                            >
                              <AccountIcon
                                iconId={getAccountIcon(
                                  t.type === "transfer" ? t.fromAccountId : t.accountId
                                )}
                                className="w-5 h-5"
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-app-text-bright font-semibold">
                                  {t.note ||
                                    (t.type === "income"
                                      ? "Pemasukan"
                                      : t.type === "expense"
                                        ? "Pengeluaran"
                                        : "Transfer")}
                                </p>
                                {t.categoryId && (
                                  <span className="px-2 py-0.5 bg-app-card border border-app-border text-app-text text-xs font-medium rounded-md flex items-center gap-1">
                                    <CategoryIcon
                                      iconId={t.categoryIcon || "dollar-sign"}
                                      className="w-3 h-3 text-app-text/70"
                                    />
                                    <span>{t.categoryName}</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] opacity-60 mt-0.5">
                                {t.type === "transfer"
                                  ? `Transfer: ${getAccountName(t.fromAccountId)} ➔ ${getAccountName(t.toAccountId)}`
                                  : getAccountName(t.accountId)}{" "}
                                • {safeFormatDate(t.date, "HH:mm")}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p
                                className={`text-xs font-bold font-mono ${
                                  t.type === "income"
                                    ? "text-app-success"
                                    : t.type === "expense"
                                      ? "text-app-danger"
                                      : "text-app-text-bright"
                                }`}
                              >
                                {t.type === "income" ? "+" : t.type === "expense" ? "-" : ""} Rp {t.amount.toLocaleString("id-ID")}
                              </p>
                              {Boolean(t.adminFee) && (
                                <p className="text-xs text-app-danger font-semibold">
                                  Fee: -Rp {t.adminFee.toLocaleString("id-ID")}
                                </p>
                              )}
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                              <button type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(t);
                                }}
                                className="p-1.5 text-app-accent1 hover:bg-app-accent1/10 rounded-lg transition-all"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTsxToDelete(t);
                                }}
                                className="p-1.5 text-app-danger hover:bg-app-danger/10 rounded-lg transition-all"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}
      {/* End of DESKTOP LAYOUT */}
      {/* Modal Add */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/72 md:items-center md:justify-center">
          <div
            className="transaction-sheet flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-[18px] border text-app-text md:max-w-xl md:rounded-[18px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
          >
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h2 id="transaction-modal-title" className="text-lg font-semibold text-app-text-bright">
                {editingTransaction ? "Edit transaksi" : "Tambah transaksi"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-app-hover"
                aria-label="Tutup formulir transaksi"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex p-4 gap-2 border-b border-app-border overflow-x-auto no-scrollbar bg-app-card">
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                aria-pressed={type === "expense"}
                className={`min-h-11 flex-1 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors ${type === "expense" ? "bg-app-danger text-app-bg" : "border border-app-border bg-app-bg hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                aria-pressed={type === "income"}
                className={`min-h-11 flex-1 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors ${type === "income" ? "bg-app-success text-app-bg" : "border border-app-border bg-app-bg hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Pemasukan
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("transfer")}
                aria-pressed={type === "transfer"}
                className={`min-h-11 flex-1 whitespace-nowrap rounded-xl px-3 text-sm font-semibold transition-colors ${type === "transfer" ? "bg-app-accent1 text-app-bg" : "border border-app-border bg-app-bg hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Transfer
              </button>
            </div>

            <form
              onSubmit={saveTransaction}
              className="transaction-form space-y-6 overflow-y-auto bg-app-card p-6 pb-12 md:pb-6"
            >
              {/* Type specific fields */}
              {(type === "income" || type === "expense") && (
                <div>
                  <label className="text-xs font-medium mb-2 block text-app-text/70">
                    Rekening
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => {
                      setAccountId(e.target.value);
                      localStorage.setItem(`lastAccountId_${type}`, e.target.value);
                    }}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors appearance-none"
                    required
                  >
                    <option value="" disabled>
                      Pilih Rekening
                    </option>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (Rp {acc.balance.toLocaleString("id-ID")})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type === "transfer" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium mb-2 block text-app-text/70">
                      Dari Rekening
                    </label>
                    <select
                      aria-label="Rekening asal"
                      value={fromAccountId}
                      onChange={(e) => {
                        setFromAccountId(e.target.value);
                        localStorage.setItem('lastAccountId_transfer_from', e.target.value);
                      }}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors appearance-none"
                      required
                    >
                      <option value="" disabled>
                        Pilih Rekening Asal
                      </option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString("id-ID")})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-2 block text-app-text/70">
                      Ke Rekening
                    </label>
                    <select
                      aria-label="Rekening tujuan"
                      value={toAccountId}
                      onChange={(e) => {
                        setToAccountId(e.target.value);
                        localStorage.setItem('lastAccountId_transfer_to', e.target.value);
                      }}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors appearance-none"
                      required
                    >
                      <option value="" disabled>
                        Pilih Rekening Tujuan
                      </option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name} (Rp {acc.balance.toLocaleString("id-ID")})</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="transaction-amount-field">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-app-text/70 m-0">
                    Nominal (Rp)
                  </label>
                  {type === "transfer" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-xs font-medium text-app-text/70">Transfer Semua Saldo</span>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isTransferAll}
                          onChange={(e) => setIsTransferAll(e.target.checked)}
                        />
                        <div className="w-7 h-4 bg-app-card border border-app-border rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-app-text/50 peer-checked:after:bg-white after:border after:border-transparent after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-app-accent1"></div>
                      </div>
                    </label>
                  )}
                </div>
                <input
                  aria-label="Nominal transaksi"
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    setAmount(formatNumberInput(e.target.value));
                    setIsTransferAll(false);
                  }}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-4 text-2xl font-semibold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                  placeholder="0"
                  required
                />
              </div>

              {(type === "transfer" || type === "income" || type === "expense") && (
                <div className="flex flex-col gap-4 bg-app-bg p-4 rounded-2xl border border-app-border">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="admin"
                      checked={hasAdminFee}
                      onChange={(e) => setHasAdminFee(e.target.checked)}
                      className="w-5 h-5 bg-app-card border border-app-border rounded accent-app-accent1"
                    />
                    <label
                      htmlFor="admin"
                      className="text-sm font-medium cursor-pointer text-app-text-bright"
                    >
                      Ada Biaya / Admin Fee?
                    </label>
                  </div>

                  {hasAdminFee && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 border-t border-app-border">
                      <div className="flex-1">
                        <label className="text-xs font-medium mb-2 block text-app-text/70">
                          Biaya / Admin Fee (Rp)
                        </label>
                        <input
                          aria-label="Biaya admin"
                          type="text"
                          inputMode="numeric"
                          value={adminFee}
                          onChange={(e) =>
                            setAdminFee(formatNumberInput(e.target.value))
                          }
                          className="w-full bg-transparent border-b border-app-border text-app-text-bright placeholder:text-app-text/50 px-1 py-2 font-mono text-lg focus:border-app-accent1 outline-none"
                          placeholder="0"
                          required
                        />
                      </div>
                      {type === "transfer" && (
                        <div className="flex-1">
                          <label className="text-xs font-medium mb-2 block text-app-text/70">
                            Potong Saldo Dari
                          </label>
                          <select
                            aria-label="Rekening pemotongan biaya admin"
                            className="w-full bg-transparent text-xs text-app-accent1 font-semibold uppercase py-3 border-b border-transparent hover:border-app-border outline-none appearance-none"
                            value={adminFeeChargeTo}
                            onChange={(e) =>
                              setAdminFeeChargeTo(e.target.value as any)
                            }
                          >
                            <option value="origin">Potong Rekening Asal</option>
                            <option value="destination">
                              Potong Rekening Tujuan
                            </option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {type !== "transfer" && (
                <div>
                  <label className="text-xs font-medium mb-2 block text-app-text/70">
                    Kategori (Opsional)
                  </label>
                  <select
                    aria-label="Kategori transaksi"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                  >
                    <option value="">-- Pilih Kategori --</option>
                    {categories
                      .filter((c) => c.type === type)
                      .map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium mb-2 block text-app-text/70">
                  Catatan
                </label>
                <input
                  aria-label="Catatan transaksi"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                  placeholder="Keterangan transaksi..."
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block text-app-text/70">
                  Waktu Transaksi
                </label>
                <input
                  aria-label="Waktu transaksi"
                  type="datetime-local"
                  value={tsxDate}
                  onChange={(e) => setTsxDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      if ("showPicker" in e.currentTarget)
                        e.currentTarget.showPicker();
                    } catch (err) {
                      /* ignore */
                    }
                  }}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors cursor-pointer"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-accent1 py-4 text-sm font-semibold text-app-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : editingTransaction ? "Perbarui Transaksi" : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Add Grab */}
      {isGrabModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end md:items-center md:justify-center backdrop-blur-sm">
          <div className="bg-app-card text-app-text w-full md:max-w-xl md:rounded-[18px] rounded-t-[18px] overflow-hidden max-h-[90vh] flex flex-col border border-app-border animate-in slide-in-from-bottom duration-200" role="dialog" aria-modal="true" aria-labelledby="grab-dialog-title">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h2 id="grab-dialog-title" className="text-lg font-semibold text-app-text-bright flex items-center gap-2">
                <Car className="w-5 h-5 text-app-success" /> Transaksi Grab
              </h2>
              <button type="button"
                onClick={() => setIsGrabModalOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl hover:bg-app-hover"
                aria-label="Tutup formulir transaksi Grab"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex p-4 gap-2 border-b border-app-border bg-app-card">
              <button type="button"
                onClick={() => setGrabType("tunai")}
                aria-pressed={grabType === "tunai"}
                className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors ${grabType === "tunai" ? "bg-app-success text-app-bg" : "bg-app-bg border border-app-border hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Tunai
              </button>
              <button type="button"
                onClick={() => setGrabType("nontunai")}
                aria-pressed={grabType === "nontunai"}
                className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition-colors ${grabType === "nontunai" ? "bg-app-success text-app-bg" : "bg-app-bg border border-app-border hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Non-Tunai
              </button>
            </div>

            <form
              onSubmit={saveGrabTransaction}
              className="p-6 pb-12 md:pb-6 space-y-6 overflow-y-auto bg-app-card"
            >
              {/* Pilihan Label Layanan */}
              <div>
                <label className="text-xs font-medium mb-2 block text-app-text/70">
                  Layanan Grab
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Hemat",
                    "Reguler",
                    "Instant",
                    "Sameday",
                    "Food",
                    "Mart",
                  ].map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setGrabLabel(label)}
                      aria-pressed={grabLabel === label}
                      className={`min-h-11 rounded-xl border px-4 text-xs font-semibold transition-colors ${grabLabel === label ? "bg-app-accent1 border-app-accent1 text-app-bg" : "border-app-border bg-app-bg text-app-text/70 hover:text-app-text-bright"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {grabType === "nontunai" ? (
                <div>
                  <label className="text-xs font-medium mb-2 block text-app-text/70">
                    Nominal Pendapatan (Rp)
                  </label>
                  <input
                    aria-label="Nominal pendapatan Grab"
                    type="text"
                    inputMode="numeric"
                    value={grabNominal}
                    onChange={(e) =>
                      setGrabNominal(formatNumberInput(e.target.value))
                    }
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-4 text-xl font-semibold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                    placeholder="0"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium mb-2 block text-app-text/70">
                      1. Cash Diterima di Tangan (Rp)
                    </label>
                    <input
                      aria-label="Cash diterima"
                      type="text"
                      inputMode="numeric"
                      value={grabCashReceived}
                      onChange={(e) =>
                        setGrabCashReceived(formatNumberInput(e.target.value))
                      }
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-lg font-semibold text-app-success focus:border-app-accent1 outline-none transition-colors"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium mb-2 block text-app-text/70">
                        2. Nominal di Aplikasi Driver
                      </label>
                      <input
                        aria-label="Nominal pada aplikasi driver"
                        type="text"
                        inputMode="numeric"
                        value={grabAppDriver}
                        onChange={(e) =>
                          setGrabAppDriver(formatNumberInput(e.target.value))
                        }
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-base font-semibold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-2 block text-app-text/70">
                        3. Nominal di Aplikasi Customer
                      </label>
                      <input
                        aria-label="Nominal pada aplikasi customer"
                        type="text"
                        inputMode="numeric"
                        value={grabAppCust}
                        onChange={(e) =>
                          setGrabAppCust(formatNumberInput(e.target.value))
                        }
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-base font-semibold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                  {grabCashReceived &&
                    grabAppCust &&
                    parseNumberInput(grabCashReceived) <
                      parseNumberInput(grabAppCust) && (
                      <p className="text-xs text-app-danger font-semibold mt-1">
                        Error: Cash diterima tidak boleh kurang dari App
                        Customer!
                      </p>
                    )}
                  {/* Preview Kalkulasi */}
                  {grabCashReceived &&
                    grabAppDriver &&
                    grabAppCust &&
                    parseNumberInput(grabCashReceived) >=
                      parseNumberInput(grabAppCust) && (
                      <div className="p-4 bg-app-success/10 rounded-xl mt-4 border border-app-success/20">
                        <p className="text-xs text-app-success font-semibold mb-2">
                          Simulasi Hitungan:
                        </p>
                        <ul className="text-xs text-app-text-bright space-y-1">
                          <li>
                            Masuk Rekening Tunai: Rp{" "}
                            {parseNumberInput(grabCashReceived).toLocaleString(
                              "id-ID",
                            )}
                          </li>
                          <li>
                            Selisih Rek. Dompet: Rp{" "}
                            {(
                              parseNumberInput(grabAppDriver) -
                              parseNumberInput(grabAppCust)
                            ).toLocaleString("id-ID")}
                          </li>
                          <li>
                            Tip: Rp{" "}
                            {(
                              parseNumberInput(grabCashReceived) -
                              parseNumberInput(grabAppCust)
                            ).toLocaleString("id-ID")}
                          </li>
                          <li className="pt-1 mt-1 border-t border-app-success/20 font-semibold">
                            Total Pendapatan: Rp{" "}
                            {(
                              parseNumberInput(grabAppDriver) +
                              Math.max(
                                0,
                                parseNumberInput(grabCashReceived) -
                                  parseNumberInput(grabAppCust),
                              )
                            ).toLocaleString("id-ID")}
                          </li>
                        </ul>
                      </div>
                    )}
                </div>
              )}

              <div>
                <label className="text-xs font-medium mb-2 block text-app-text/70">
                  Waktu Transaksi
                </label>
                <input
                  aria-label="Waktu transaksi Grab"
                  type="datetime-local"
                  value={grabDate}
                  onChange={(e) => setGrabDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      if ("showPicker" in e.currentTarget)
                        e.currentTarget.showPicker();
                    } catch (err) {
                      /* ignore */
                    }
                  }}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors cursor-pointer"
                  required
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (grabType === "tunai" &&
                      parseNumberInput(grabCashReceived) <
                        parseNumberInput(grabAppCust))
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-success py-4 text-sm font-semibold text-app-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Transaksi Grab"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirm Delete Modal */}
      {tsxToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-app-card text-app-text w-full max-w-sm rounded-[18px] border border-app-border p-6 animate-in fade-in duration-200" role="alertdialog" aria-modal="true" aria-labelledby="delete-transaction-title">
            <h3 id="delete-transaction-title" className="text-lg font-semibold text-app-text-bright mb-2">
              Hapus Transaksi?
            </h3>
            <p className="text-sm text-app-text/70 mb-6">
              Tindakan ini tidak dapat dibatalkan. Saldo rekening akan
              disesuaikan kembali.
            </p>
            <div className="flex gap-3">
              <button type="button"
                onClick={() => setTsxToDelete(null)}
                className="flex-1 py-3 bg-app-bg border border-app-border text-app-text-bright rounded-xl font-semibold hover:bg-app-hover transition-colors"
              >
                Batal
              </button>
              <button type="button"
                onClick={confirmDeleteTransaction}
                className="flex-1 rounded-xl bg-app-danger py-3 font-semibold text-app-bg hover:opacity-90"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI STRATEGY RECOMMENDATION MODAL */}
      <AnimatePresence>
        {isStrategyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsStrategyModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-app-card border border-app-border w-full max-w-3xl rounded-[18px] overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
              role="dialog"
              aria-modal="true"
              aria-label="Strategi keuangan AI"
            >
              {/* Decorative solid accent line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-app-accent1" />

              {/* Header */}
              <div className="p-6 border-b border-app-border flex items-center justify-between shrink-0 bg-app-bg/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-app-accent1/10 flex items-center justify-center text-app-accent1 relative">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-app-text-bright flex items-center gap-2">
                      Strategi Keuangan AI
                      {strategyRecommendation?.isOffline && (
                        <span className="text-xs font-semibold bg-app-border px-2 py-0.5 rounded-full text-app-text/60">
                          Mode Lokal
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-app-text/60">
                      Rekomendasi taktis dan alokasi anggaran personal Anda
                    </p>
                  </div>
                </div>
                <button type="button"
                  onClick={() => setIsStrategyModalOpen(false)}
                  className="w-10 h-10 rounded-full hover:bg-app-hover flex items-center justify-center text-app-text/50 hover:text-app-text-bright transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {strategyLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 text-app-accent1 animate-spin" />
                      <Sparkles className="w-5 h-5 text-app-accent2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping" />
                    </div>
                    <div className="text-center space-y-1">
                      <h3 className="font-semibold text-app-text-bright">
                        Merumuskan Strategi AI...
                      </h3>
                      <p className="text-xs text-app-text/50 max-w-xs">
                        Algoritma cerdas sedang menganalisis pengeluaran dan merancang skema alokasi ideal Anda
                      </p>
                    </div>
                  </div>
                ) : strategyRecommendation ? (
                  <>
                    {/* EXECUTIVE SUMMARY CARD */}
                    <div className="p-5 rounded-2xl bg-app-accent1/10 border border-app-accent1/20 relative overflow-hidden">
                      <p className="text-sm text-app-text-bright font-medium leading-relaxed">
                        {strategyRecommendation.summary}
                      </p>
                    </div>

                    {/* DIAGNOSTIC FINDINGS */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-app-text-bright uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-app-danger" />
                        Temuan Diagnostik
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {strategyRecommendation.diagnostic.map((diag, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3.5 bg-app-bg border border-app-border rounded-xl text-xs text-app-text/80 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-app-danger shrink-0 mt-1.5" />
                            <span>{diag}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SAVINGS RECOMMENDATIONS */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-app-text-bright uppercase tracking-wider flex items-center gap-2">
                        <Coins className="w-4 h-4 text-app-success" />
                        Rekomendasi Penghematan Taktis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {strategyRecommendation.savingsRecommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="p-4 bg-app-bg border border-app-border rounded-2xl flex flex-col justify-between hover:border-app-accent1/30 transition-all group"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span
                                  className={`text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                                    rec.priority === "tinggi"
                                      ? "bg-app-danger/15 text-app-danger"
                                      : rec.priority === "sedang"
                                        ? "bg-app-warning/15 text-app-warning"
                                        : "bg-app-accent2/15 text-app-accent2"
                                  }`}
                                >
                                  {rec.priority}
                                </span>
                                <span className="text-xs font-semibold text-app-success bg-app-success/10 px-2 py-0.5 rounded-full">
                                  {rec.potentialSavings}
                                </span>
                              </div>
                              <h4 className="font-semibold text-app-text-bright text-xs mb-1.5 group-hover:text-app-accent1 transition-colors">
                                {rec.title}
                              </h4>
                              <p className="text-[11px] text-app-text/60 leading-relaxed">
                                {rec.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* BUDGET ALLOCATION PLAN */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-app-text-bright uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-4 h-4 text-app-accent2" />
                        Rencana Alokasi Anggaran Ideal (50/20/20/10)
                      </h3>
                      <div className="p-4 bg-app-bg border border-app-border rounded-2xl space-y-4">
                        {strategyRecommendation.allocationPlan.map((plan, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="text-app-text-bright max-w-[70%] truncate">
                                {plan.category}
                              </span>
                              <span className="text-app-success">
                                Rp {plan.recommendedAmount.toLocaleString("id-ID")}
                              </span>
                            </div>

                            {/* Horizontal progress visualization */}
                            <div className="h-2 w-full bg-app-border rounded-full overflow-hidden relative flex">
                              <div
                                style={{ width: `${plan.recommendedPct}%` }}
                                className={`h-full rounded-full ${
                                  index === 0
                                    ? "bg-app-accent1"
                                    : index === 1
                                      ? "bg-app-accent2"
                                      : index === 2
                                        ? "bg-app-success"
                                        : "bg-app-warning"
                                }`}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-app-text/50">
                              <span>Alokasi saat ini: ~{plan.currentPct}%</span>
                              <span className="font-semibold text-app-text/80">Rekomendasi: {plan.recommendedPct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* INCOME STRATEGIES */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-app-text-bright uppercase tracking-wider flex items-center gap-2">
                        <Compass className="w-4 h-4 text-app-accent1" />
                        Strategi Peningkatan Pemasukan
                      </h3>
                      <div className="p-4 bg-app-bg border border-app-border rounded-2xl space-y-3">
                        {strategyRecommendation.incomeStrategies.map((strat, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 text-xs leading-relaxed text-app-text/80"
                          >
                            <div className="w-5 h-5 rounded-full bg-app-accent1/10 flex items-center justify-center shrink-0 text-app-accent1 text-xs font-semibold mt-0.5">
                              {index + 1}
                            </div>
                            <span>{strat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-app-text/50">
                    Gagal memuat rekomendasi strategi.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-app-border flex justify-end shrink-0 bg-app-bg/30">
                <button type="button"
                  onClick={() => setIsStrategyModalOpen(false)}
                  className="min-h-11 rounded-xl bg-app-accent1 px-6 text-xs font-semibold text-app-bg hover:opacity-90"
                >
                  Selesai & Terapkan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
