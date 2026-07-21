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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { formatNumberInput, parseNumberInput } from "../utils/numberFormat";
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

  const openAddModal = () => {
    setEditingTransaction(null);
    setType("expense");
    setAmount("");
    setAccountId(accounts[0]?.id || "");
    setFromAccountId(accounts[0]?.id || "");
    setToAccountId(accounts[1]?.id || accounts[0]?.id || "");
    setNote("");
    setCategoryId("");
    setHasAdminFee(false);
    setAdminFee("");
    setAdminFeeChargeTo("origin");
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
        notifTitle = editingTransaction ? "Pemasukan Diperbarui 💰" : "Pemasukan Baru 💰";
        notifBody = `Pemasukan sebesar Rp ${numAmount.toLocaleString("id-ID")} ${actionStr}.\nKeterangan: ${note || "-"}`;
      } else if (type === "expense") {
        notifTitle = editingTransaction ? "Pengeluaran Diperbarui 💸" : "Pengeluaran Baru 💸";
        notifBody = `Pengeluaran sebesar Rp ${numAmount.toLocaleString("id-ID")} ${actionStr}.\nKeterangan: ${note || "-"}`;
      } else if (type === "transfer") {
        notifTitle = editingTransaction ? "Transfer Diperbarui 🔄" : "Transfer Baru 🔄";
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
      const tDate = new Date(t.date);
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
    return {
      income,
      expense,
      netProfit,
      avgIncome,
      avgExpense,
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
      const tDate = new Date(t.date);
      if (mobileTab === "Harian") return isSameDay(tDate, mobileCurrentDate);
      if (mobileTab === "Mingguan") return isSameWeek(tDate, mobileCurrentDate, { locale: currentLocale });
      if (mobileTab === "Bulanan") return isSameMonth(tDate, mobileCurrentDate);
      if (mobileTab === "Custom") {
        if (!mobileCustomStartDate || !mobileCustomEndDate) return true;
        const start = new Date(mobileCustomStartDate);
        const end = new Date(mobileCustomEndDate);
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
      if (t.type === "income" && mobileIncomeFilter !== "Semua") return t.categoryId === mobileIncomeFilter;
      if (t.type === "expense" && mobileExpenseFilter !== "Semua") return t.categoryId === mobileExpenseFilter;
      return true;
    });

    return filtered;
  }, [transactions, mobileTab, mobileCurrentDate, mobileCustomStartDate, mobileCustomEndDate, mobileAccountFilter, mobileIncomeFilter, mobileExpenseFilter]);

  const mobileChartData = useMemo(() => {
    const dateMap = new Map();
    const sortedTsx = [...mobileFilteredTransactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    sortedTsx.forEach((t) => {
      const d = format(new Date(t.date), "dd/MM");
      if (!dateMap.has(d)) dateMap.set(d, { date: d, income: 0, expense: 0 });
      if (t.type === "income") dateMap.get(d).income += t.amount;
      if (t.type === "expense") dateMap.get(d).expense += t.amount;
      if (t.adminFee) dateMap.get(d).expense += t.adminFee;
    });
    let data = Array.from(dateMap.values());
    if (data.length === 0) {
      data = [{ date: format(new Date(), "dd/MM"), income: 0, expense: 0 }];
    }
    return data;
  }, [mobileFilteredTransactions]);

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

  const exportToExcel = () => {
    if (filteredByPeriodTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor pada periode ini.");
      return;
    }

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

  const exportToPDF = () => {
    if (filteredByPeriodTransactions.length === 0) {
      toast.error("Tidak ada data untuk diekspor pada periode ini.");
      return;
    }

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
        <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-0 md:p-8 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
          {/* MOBILE LAYOUT */}
          <div className="md:hidden flex flex-col w-full min-h-screen px-4 pt-4 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6 text-app-text" />
          </button>
          <h1 className="text-xl font-bold text-app-text-bright">
            <TextReveal text="Laporan Keuangan" />
          </h1>
          <button>
            <Share2 className="w-5 h-5 text-app-text/80" />
          </button>
        </div>

        {/* Period Tabs */}
        <div className="bg-app-card rounded-xl p-1 flex items-center justify-between mb-6 border border-app-border">
          {["Harian", "Mingguan", "Bulanan", "Custom"].map((p) => (
            <button
              key={p}
              onClick={() => {
                setMobileTab(p as any);
                setMobileCurrentDate(new Date());
              }}
              className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${mobileTab === p ? "bg-app-accent1 text-app-bg shadow-md" : "text-app-text/60 hover:text-app-text-bright"}`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Date Navigator */}
        {mobileTab === "Custom" ? (
          <div className="flex items-center gap-2 mb-6 px-2">
            <input 
              type="date" 
              value={mobileCustomStartDate}
              onChange={(e) => setMobileCustomStartDate(e.target.value)}
              className="flex-1 bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-3 py-2 outline-none focus:border-app-accent1"
            />
            <span className="text-app-text/50">-</span>
            <input 
              type="date" 
              value={mobileCustomEndDate}
              onChange={(e) => setMobileCustomEndDate(e.target.value)}
              className="flex-1 bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-3 py-2 outline-none focus:border-app-accent1"
            />
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6 px-2">
            <button onClick={handleMobilePrev}>
              <ChevronLeft className="w-5 h-5 text-app-accent1" />
            </button>
            <span className="font-bold text-sm text-app-text-bright">
              {getMobilePeriodText()}
            </span>
            <button onClick={handleMobileNext}>
              <ChevronRight className="w-5 h-5 text-app-accent1" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-4 mb-8">
          {/* Account Filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 text-app-text/60" />
            </div>
            <button
              onClick={() => setMobileAccountFilter("Semua")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold shrink-0 transition-colors ${mobileAccountFilter === "Semua" ? "bg-app-accent1 text-app-bg" : "border border-app-border text-app-text"}`}
            >
              Semua
            </button>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setMobileAccountFilter(acc.id)}
                className={`px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 shrink-0 transition-colors ${mobileAccountFilter === acc.id ? "bg-app-accent1 text-app-bg" : "border border-app-border text-app-text"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${acc.id === "tunai" ? "bg-app-bg" : "bg-blue-400"}`}
                />{" "}
                {acc.name}
              </button>
            ))}
          </div>

          {/* Income Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-app-success" />
            </div>
            <button
              onClick={() => setMobileIncomeFilter("Semua")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold shrink-0 transition-colors ${mobileIncomeFilter === "Semua" ? "bg-app-accent1 text-app-bg" : "border border-app-border text-app-text"}`}
            >
              Semua
            </button>
            {categories
              .filter((c) => c.type === "income")
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMobileIncomeFilter(cat.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 shrink-0 transition-colors ${mobileIncomeFilter === cat.id ? "bg-app-accent1 text-app-bg" : "border border-app-border text-app-text"}`}
                >
                  <Briefcase className="w-3 h-3 text-app-success" /> {cat.name}
                </button>
              ))}
          </div>

          {/* Expense Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5 text-app-danger" />
            </div>
            <button
              onClick={() => setMobileExpenseFilter("Semua")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold shrink-0 transition-colors ${mobileExpenseFilter === "Semua" ? "bg-app-accent1 text-app-bg" : "border border-app-border text-app-text"}`}
            >
              Semua
            </button>
            {categories
              .filter((c) => c.type === "expense")
              .map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMobileExpenseFilter(cat.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 shrink-0 transition-colors ${mobileExpenseFilter === cat.id ? "bg-app-accent1 text-app-bg" : "border border-app-border text-app-text"}`}
                >
                  <ShoppingCart className="w-3 h-3 text-app-danger" /> {cat.name}
                </button>
              ))}
          </div>
        </div>

        {/* Chart Section */}
        <h3 className="text-[13px] font-bold text-app-text-bright mb-3">
          Tren Alur Kas (Pemasukan vs Pengeluaran)
        </h3>
        <div className="bg-app-card border border-app-border rounded-2xl p-4 mb-6 relative shadow-lg">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
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
                  tick={{ fontSize: 10, fill: "var(--color-app-text, #aaa)" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "var(--color-app-text, #aaa)" }}
                  tickFormatter={(val) => {
                    if (val >= 1000) return `${val / 1000}k`;
                    return val;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-app-card, #1A1A1A)",
                    borderColor: "var(--color-app-border, #333)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ fontSize: "12px" }}
                  labelStyle={{
                    fontSize: "12px",
                    color: "var(--color-app-text-bright, #fff)",
                    marginBottom: "4px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#10b981" }}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="bg-app-card border border-app-border rounded-2xl flex items-center mb-2 shadow-lg">
          <div className="flex-1 flex flex-col justify-center px-4 py-5 border-r border-app-border">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-app-text/50" />
              <span className="text-[11px] text-app-text/50 uppercase tracking-widest font-bold">
                Pemasukan
              </span>
            </div>
            <span className="text-app-success font-bold text-base">
              Rp {mobileStats.income.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center px-4 py-5">
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-app-text/50" />
              <span className="text-[11px] text-app-text/50 uppercase tracking-widest font-bold">
                Pengeluaran
              </span>
            </div>
            <span className="text-app-danger font-bold text-base">
              Rp {mobileStats.expense.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div className="bg-app-card border border-app-border rounded-2xl p-5 flex justify-between items-center shadow-lg">
          <span className="text-[13px] text-app-text-bright font-medium">
            Laba Bersih
          </span>
          <div
            className={`${mobileStats.netProfit >= 0 ? "bg-app-success/10" : "bg-app-danger/10"} px-3 py-1.5 rounded-full flex items-center gap-2`}
          >
            <div
              className={`w-2 h-2 rounded-full ${mobileStats.netProfit >= 0 ? "bg-app-success" : "bg-app-danger"}`}
            />
            <span
              className={`${mobileStats.netProfit >= 0 ? "text-app-success" : "text-app-danger"} font-bold text-[13px]`}
            >
              Rp {mobileStats.netProfit.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        {/* History Transaksi Section */}
        <div className="mt-6">
          <h3 className="text-[13px] font-bold text-app-text-bright mb-3">
            Daftar Transaksi
          </h3>
          <div className="bg-app-card border border-app-border rounded-2xl p-4 shadow-lg space-y-3 relative overflow-hidden">
            
            {mobileFilteredTransactions.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-app-text/50 text-xs rounded-xl border border-dashed border-app-border relative z-10 bg-app-card/30">
                <FileText className="w-8 h-8 text-app-text/30 mb-2 animate-waggle" />
                Belum ada transaksi di periode ini.
              </div>
            ) : (
              <StaggerContainer className="space-y-2 relative z-10">
                {mobileFilteredTransactions.map((t) => (
                  <StaggerItem key={t.id}>
                    <div
                      className="flex items-center justify-between p-3.5 bg-app-bg hover:bg-app-hover rounded-xl transition-colors border border-app-border/40 hover:border-app-border relative overflow-hidden"
                    >
                    
                    <div className="flex items-center gap-3 relative z-10 min-w-0 flex-1">
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
                            t.type === "transfer"
                              ? t.fromAccountId
                              : t.accountId,
                          )}
                          className="w-5 h-5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs text-app-text-bright font-bold truncate">
                            {t.note ||
                              (t.type === "income"
                                ? "Pemasukan"
                                : t.type === "expense"
                                  ? "Pengeluaran"
                                  : "Transfer")}
                          </p>
                          {t.type === "transfer" && (
                            <span className="px-1.5 py-0.5 bg-app-accent1/10 text-app-accent1 text-[8px] font-black rounded-full border border-app-accent1/20 uppercase tracking-wide">
                              Transfer
                            </span>
                          )}
                          {t.categoryId && (
                            <span className="px-1.5 py-0.5 bg-app-card border border-app-border text-app-text text-[8px] font-bold rounded-full flex items-center gap-1">
                              <CategoryIcon
                                iconId={t.categoryIcon || "dollar-sign"}
                                className="w-2.5 h-2.5 text-app-text/70"
                              />
                              <span>{t.categoryName}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] opacity-60 mt-0.5 truncate">
                          {t.type === "transfer"
                            ? `${getAccountName(t.fromAccountId)} ➔ ${getAccountName(t.toAccountId)}`
                            : getAccountName(t.accountId)}{" "}
                          •{" "}
                          {format(t.date, "dd MMM, HH:mm", {
                            locale: currentLocale,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 relative z-10 shrink-0 pl-2">
                      <div className="flex flex-col items-end gap-1">
                        <p
                          className={`text-xs font-bold whitespace-nowrap
                          ${
                            t.type === "income"
                              ? "text-app-success"
                              : t.type === "expense"
                                ? "text-app-danger"
                                : "text-app-text-bright"
                          }`}
                        >
                          {t.type === "income"
                            ? "+"
                            : t.type === "expense"
                              ? "-"
                              : ""}{" "}
                          Rp {t.amount.toLocaleString("id-ID")}
                        </p>
                        {t.adminFee && (
                          <p className="text-[9px] text-app-danger font-semibold mt-0.5">
                            Fee: -Rp {t.adminFee.toLocaleString("id-ID")}
                          </p>
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(t);
                            }}
                            className="p-1 text-app-accent1 hover:bg-app-accent1/10 rounded-full transition-all"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTsxToDelete(t);
                            }}
                            className="p-1 text-app-danger hover:bg-app-danger/10 rounded-full transition-all"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </div>
      {/* DESKTOP LAYOUT */}
      <div className="hidden md:flex flex-col w-full h-full gap-6">
        {/* HEADER SECTION (Like Dashboard) */}
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-2xl md:text-[1.75rem] font-bold text-app-text-bright tracking-tight leading-tight">
              <TextReveal text={language === "en" ? "Financial Report" : "Laporan Keuangan"} />
            </h1>
            <p className="text-app-text/60 text-sm mt-1">
              {language === "en" ? "Download and analyze your monthly financial reports." : "Unduh dan analisis laporan keuangan bulanan Anda."}
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
              <div className="w-6 h-6 rounded-full bg-app-accent1 text-[11px] font-bold flex items-center justify-center text-white overflow-hidden shrink-0">
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
        <ScrollReveal>
          <div className="bg-app-card border border-app-border rounded-2xl p-4 md:p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm shrink-0 relative overflow-hidden">
          
          <div className="relative z-10">
            <h2 className="text-app-text-bright font-bold text-lg">
              {language === "en" ? "Financial Report" : "Laporan Keuangan"}
            </h2>
            <p className="text-app-text/60 text-xs mt-1">
              {language === "en" ? "Period:" : "Periode:"} {getPeriodText()}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <div className="relative">
              <select
                value={selectedReportAccount}
                onChange={(e) => setSelectedReportAccount(e.target.value)}
                className="bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl pl-4 pr-10 py-2.5 appearance-none outline-none focus:border-app-accent1 cursor-pointer"
              >
                <option value="all">{language === "en" ? "All Wallets" : "Semua Dompet"}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-app-text/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
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
                  className="bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl pl-4 pr-10 py-2.5 appearance-none outline-none focus:border-app-accent1 cursor-pointer"
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
                  className="bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-2.5 outline-none focus:border-app-accent1 cursor-pointer"
                />
              )}
            </div>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2.5 border border-app-success/30 text-app-success hover:bg-app-success/10 transition-colors rounded-xl font-medium text-sm"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#d32f2f] hover:bg-[#b71c1c] text-white transition-colors rounded-xl font-medium text-sm"
            >
              <FileText className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>
        </ScrollReveal>

        {/* STATS & AI INSIGHT GRID */}
        <ScrollReveal>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 shrink-0">
          {/* TOTAL KEUNTUNGAN BERSIH */}
          <div className="lg:col-span-2 bg-app-card rounded-[24px] p-6 md:p-8 border border-app-border/40 shadow-sm flex flex-col justify-between relative overflow-hidden">
            {/* DECORATIVE LIGHTING - optional aesthetic */}
            

            <div className="relative z-10 mb-8">
              <div className="inline-block px-3 py-1 bg-app-success/10 text-app-success text-[10px] font-bold tracking-wider rounded-full mb-4 uppercase">
                {language === "en" ? "Total Net Profit" : "Total Keuntungan Bersih"}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-app-text-bright mb-2">
                Rp {stats.netProfit.toLocaleString("id-ID")}
              </h2>
              <div className="flex items-center gap-2 text-app-text/60 text-xs">
                <Info className="w-4 h-4" /> {language === "en" ? "No previous month data available for comparison" : "Belum ada data bulan sebelumnya untuk perbandingan"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10 mt-auto">
              <div className="bg-app-bg border border-app-border/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-app-text-bright mb-1">
                  {stats.count}
                </span>
                <span className="text-[10px] text-app-text/50 font-bold tracking-wider uppercase">
                  {language === "en" ? "Total Transactions" : "Total Transaksi"}
                </span>
              </div>
              <div className="bg-app-bg border border-app-border/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-app-success mb-1">
                  Rp {Math.round(stats.avgIncome).toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-app-text/50 font-bold tracking-wider uppercase">
                  {language === "en" ? "Average / Day" : "Rata-rata / Hari"}
                </span>
              </div>
              <div className="bg-app-bg border border-app-border/50 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-app-danger mb-1">
                  Rp {Math.round(stats.avgExpense).toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] text-app-text/50 font-bold tracking-wider uppercase">
                  {language === "en" ? "Expenses / Day" : "Pengeluaran / Hari"}
                </span>
              </div>
            </div>
          </div>

          {/* AI INSIGHT */}
          <div className="bg-app-card rounded-[24px] p-6 md:p-8 border border-app-border/40 shadow-sm flex flex-col relative overflow-hidden">
            
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <Sparkles className="w-5 h-5 text-app-accent1" />
              <span className="text-app-accent1 text-[10px] font-bold tracking-widest uppercase">
                AI Insight
              </span>
            </div>
            <h3 className="text-app-text-bright font-bold text-lg mb-3 relative z-10">
              {stats.count === 0
                ? `Belum Ada Transaksi ${selectedReportPeriod === "today" ? "Hari Ini" : selectedReportPeriod === "this_week" ? "Minggu Ini" : "Bulan Ini"}`
                : stats.netProfit > 0
                  ? "Keuangan Anda Sehat"
                  : stats.netProfit < 0
                    ? "Pengeluaran Lebih Besar"
                    : "Keuangan Seimbang"}
            </h3>
            <p className="text-app-text/70 text-sm leading-relaxed mb-8 flex-1 relative z-10">
              {stats.count === 0
                ? "Belum ada transaksi tercatat di periode ini. Pastikan transaksi sudah disinkronkan, atau mulai catat transaksi Anda."
                : stats.netProfit > 0
                  ? `Bagus! Keuangan Anda surplus. Pemasukan lebih besar Rp ${stats.netProfit.toLocaleString("id-ID")} dibandingkan pengeluaran.`
                  : stats.netProfit < 0
                    ? `Hati-hati! Pengeluaran Anda lebih besar Rp ${Math.abs(stats.netProfit).toLocaleString("id-ID")} dari pemasukan pada periode ini.`
                    : "Pemasukan dan pengeluaran Anda saat ini seimbang."}
            </p>
            <button
              onClick={fetchFinancialStrategy}
              className="flex items-center gap-2 text-app-accent1 text-xs font-bold tracking-widest uppercase hover:opacity-80 transition-opacity relative z-10 cursor-pointer"
            >
              Pelajari Strategi <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        </ScrollReveal>

        {/* SUMBER & ALOKASI */}
        <ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 shrink-0">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-app-text-bright">
                Sumber Pendapatan
              </h3>
              <button
                onClick={() => {
                  setTab("Pemasukan");
                  detailRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-app-accent1 text-xs font-semibold hover:underline"
              >
                Lihat Detail
              </button>
            </div>
            <HoverCard
              onClick={() => {
                setTab("Pemasukan");
                detailRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-app-card border border-app-border/40 rounded-[24px] p-6 flex justify-between items-center shadow-sm overflow-hidden relative cursor-pointer hover:bg-app-hover transition-colors w-full"
            >
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-app-success/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-app-success" />
                </div>
                <div>
                  <p className="text-app-text-bright font-bold text-base">
                    Total Pemasukan
                  </p>
                  <p className="text-app-text/50 text-xs mt-0.5">
                    {
                      filteredByPeriodTransactions.filter(
                        (t) => t.type === "income",
                      ).length
                    }{" "}
                    Transaksi
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-app-success relative z-10">
                Rp {stats.income.toLocaleString("id-ID")}
              </p>
            </HoverCard>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-app-text-bright">
                Alokasi Pengeluaran
              </h3>
              <button
                onClick={() => {
                  setTab("Pengeluaran");
                  detailRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-app-danger text-xs font-semibold hover:underline"
              >
                Optimasi Biaya
              </button>
            </div>
            <HoverCard
              onClick={() => {
                setTab("Pengeluaran");
                detailRef.current?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-app-card border border-app-border/40 rounded-[24px] p-6 flex justify-between items-center shadow-sm overflow-hidden relative cursor-pointer hover:bg-app-hover transition-colors w-full"
            >
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-app-danger/10 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-6 h-6 text-app-danger" />
                </div>
                <div>
                  <p className="text-app-text-bright font-bold text-base">
                    Total Pengeluaran
                  </p>
                  <p className="text-app-text/50 text-xs mt-0.5">
                    {
                      filteredByPeriodTransactions.filter(
                        (t) => t.type === "expense",
                      ).length
                    }{" "}
                    Transaksi
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-app-danger relative z-10">
                Rp {stats.expense.toLocaleString("id-ID")}
              </p>
            </HoverCard>
          </div>
        </div>
        </ScrollReveal>

        {/* DETAIL TRANSAKSI */}
        <div
          ref={detailRef}
          className="flex-1 flex flex-col shrink-0 min-h-[400px]"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h3 className="text-xl font-bold text-app-text-bright">
              Detail Transaksi
            </h3>
            <div className="flex items-center gap-1 bg-app-card p-1 rounded-full border border-app-border relative">
              {["Semua", "Pemasukan", "Pengeluaran"].map((t) => {
                const isActive = tab === t;
                const activeColorClass = t === "Semua" ? "bg-app-accent1" : t === "Pemasukan" ? "bg-app-success" : "bg-app-danger";
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t as any)}
                    className="px-5 py-2 rounded-full text-xs font-bold transition-colors relative"
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabTxDesktop"
                        className={`absolute inset-0 rounded-full ${activeColorClass}`}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={`relative z-10 ${isActive ? "text-white" : "text-app-text/60 hover:text-app-text-bright"}`}>
                      {t}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-app-card border border-app-border/40 rounded-[24px] p-6 shadow-sm mb-6 flex-1 overflow-hidden relative flex flex-col">
            
            {filteredTransactions.length === 0 ? (
              <div className="p-8 text-center text-app-text/50 rounded-2xl border border-dashed border-app-border mt-4 relative z-10 flex flex-col items-center justify-center gap-3">
                <MicroLoop type="waggle">
                  <Wallet className="w-10 h-10 text-app-accent1/60" />
                </MicroLoop>
                <span>Belum ada transaksi di tab ini.</span>
              </div>
            ) : (
              <StaggerContainer className="space-y-2 mt-4 flex-1 overflow-y-auto no-scrollbar relative z-10 pr-2 -mr-2 pb-2">
                {filteredTransactions.map((t) => (
                  <StaggerItem key={t.id}>
                    <div
                      className="flex items-center justify-between p-4 bg-app-bg hover:bg-app-hover rounded-2xl transition-colors border border-app-border/50 hover:border-app-border cursor-pointer group relative overflow-hidden"
                    >
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border
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
                            t.type === "transfer"
                              ? t.fromAccountId
                              : t.accountId,
                          )}
                          className="w-6 h-6"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm text-app-text-bright font-bold">
                            {t.note ||
                              (t.type === "income"
                                ? "Pemasukan"
                                : t.type === "expense"
                                  ? "Pengeluaran"
                                  : "Transfer")}
                          </p>
                          {t.type === "transfer" && (
                            <span className="px-2 py-0.5 bg-app-accent1/10 text-app-accent1 text-[10px] font-bold rounded-full border border-app-accent1/20 hidden sm:inline-block">
                              Transfer
                            </span>
                          )}
                          {t.categoryId && (
                            <span className="px-2 py-0.5 bg-app-card border border-app-border text-app-text text-[10px] font-bold rounded-full hidden sm:flex items-center gap-1">
                              <CategoryIcon
                                iconId={t.categoryIcon || "dollar-sign"}
                                className="w-3 h-3 text-app-text/70"
                              />
                              <span>{t.categoryName}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] opacity-60 mt-0.5 truncate max-w-[200px] md:max-w-[400px]">
                          {t.type === "transfer"
                            ? `Transfer: ${getAccountName(t.fromAccountId)} ➔ ${getAccountName(t.toAccountId)}`
                            : getAccountName(t.accountId)}{" "}
                          •{" "}
                          {format(t.date, "dd MMM yyyy, HH:mm", {
                            locale: localeId,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="flex flex-col items-end">
                        <p
                          className={`text-base font-bold whitespace-nowrap
                          ${
                            t.type === "income"
                              ? "text-app-success"
                              : t.type === "expense"
                                ? "text-app-danger"
                                : "text-app-text-bright"
                          }`}
                        >
                          {t.type === "income"
                            ? "+"
                            : t.type === "expense"
                              ? "-"
                              : ""}{" "}
                          Rp {t.amount.toLocaleString("id-ID")}
                        </p>
                        {t.adminFee && (
                          <p className="text-[10px] text-app-danger font-semibold mt-0.5">
                            Fee: -Rp {t.adminFee.toLocaleString("id-ID")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(t);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-app-accent1 hover:bg-app-accent1/10 rounded-full transition-all md:opacity-0 max-md:opacity-100"
                        title="Edit Transaksi"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTsxToDelete(t);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-app-danger hover:bg-app-danger/10 rounded-full transition-all md:opacity-0 max-md:opacity-100"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </div>
      </div>{" "}
        </div>
      )}
      {/* End of DESKTOP LAYOUT */}
      {/* Modal Add */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end md:items-center md:justify-center backdrop-blur-sm">
          <div className="bg-app-card text-app-text w-full md:max-w-xl md:rounded-[24px] rounded-t-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-app-border/40 animate-in slide-in-from-bottom md:zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h2 className="text-lg font-semibold text-app-text-bright">
                {editingTransaction ? "Edit Transaksi" : "Catat Transaksi"}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-app-hover rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex p-4 gap-2 border-b border-app-border overflow-x-auto no-scrollbar bg-app-card">
              <button
                onClick={() => setType("expense")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${type === "expense" ? "bg-app-danger text-app-bg shadow-md" : "bg-app-bg border border-app-border hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Pengeluaran
              </button>
              <button
                onClick={() => setType("income")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${type === "income" ? "bg-app-success text-app-bg shadow-md" : "bg-app-bg border border-app-border hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Pemasukan
              </button>
              <button
                onClick={() => setType("transfer")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors whitespace-nowrap ${type === "transfer" ? "bg-app-accent1 text-app-bg shadow-md" : "bg-app-bg border border-app-border hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Transfer
              </button>
            </div>

            <form
              onSubmit={saveTransaction}
              className="p-6 pb-12 md:pb-6 space-y-6 overflow-y-auto bg-app-card"
            >
              {/* Type specific fields */}
              {(type === "income" || type === "expense") && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                    Rekening
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
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
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                      Dari Rekening
                    </label>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors appearance-none"
                      required
                    >
                      <option value="" disabled>
                        Pilih Rekening Asal
                      </option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                      Ke Rekening
                    </label>
                    <select
                      value={toAccountId}
                      onChange={(e) => setToAccountId(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors appearance-none"
                      required
                    >
                      <option value="" disabled>
                        Pilih Rekening Tujuan
                      </option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                  Nominal (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-4 text-2xl font-bold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
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
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2 border-t border-app-border/50">
                      <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                          Biaya / Admin Fee (Rp)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={adminFee}
                          onChange={(e) =>
                            setAdminFee(formatNumberInput(e.target.value))
                          }
                          className="w-full bg-transparent border-b border-app-border text-app-text-bright placeholder:text-app-text/30 px-1 py-2 font-mono text-lg focus:border-app-accent1 outline-none"
                          placeholder="0"
                          required
                        />
                      </div>
                      {type === "transfer" && (
                        <div className="flex-1">
                          <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                            Potong Saldo Dari
                          </label>
                          <select
                            className="w-full bg-transparent text-[10px] text-app-accent1 font-bold uppercase py-3 border-b border-transparent hover:border-app-border outline-none appearance-none"
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
                  <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                    Kategori (Opsional)
                  </label>
                  <select
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
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                  Catatan
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                  placeholder="Keterangan transaksi..."
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                  Waktu Transaksi
                </label>
                <input
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
                  className="w-full bg-app-accent1 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 text-app-bg font-bold py-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2"
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
          <div className="bg-app-card text-app-text w-full md:max-w-xl md:rounded-[24px] rounded-t-[24px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-app-border/40 animate-in slide-in-from-bottom md:zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h2 className="text-lg font-semibold text-app-text-bright flex items-center gap-2">
                <Car className="w-5 h-5 text-app-success" /> Transaksi Grab
              </h2>
              <button
                onClick={() => setIsGrabModalOpen(false)}
                className="p-2 hover:bg-app-hover rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex p-4 gap-2 border-b border-app-border bg-app-card">
              <button
                onClick={() => setGrabType("tunai")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${grabType === "tunai" ? "bg-app-success text-white shadow-md" : "bg-app-bg border border-app-border hover:bg-app-hover hover:text-app-text-bright"}`}
              >
                Tunai
              </button>
              <button
                onClick={() => setGrabType("nontunai")}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${grabType === "nontunai" ? "bg-app-success text-white shadow-md" : "bg-app-bg border border-app-border hover:bg-app-hover hover:text-app-text-bright"}`}
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
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
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
                      className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${grabLabel === label ? "bg-app-accent1 border-app-accent1 text-white shadow-sm" : "border-app-border bg-app-bg text-app-text/70 hover:text-app-text-bright"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {grabType === "nontunai" ? (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                    Nominal Pendapatan (Rp)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={grabNominal}
                    onChange={(e) =>
                      setGrabNominal(formatNumberInput(e.target.value))
                    }
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-4 text-xl font-bold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                    placeholder="0"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                      1. Cash Diterima di Tangan (Rp)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={grabCashReceived}
                      onChange={(e) =>
                        setGrabCashReceived(formatNumberInput(e.target.value))
                      }
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-lg font-bold text-app-success focus:border-app-accent1 outline-none transition-colors"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                        2. Nominal di Aplikasi Driver
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={grabAppDriver}
                        onChange={(e) =>
                          setGrabAppDriver(formatNumberInput(e.target.value))
                        }
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-base font-bold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                        3. Nominal di Aplikasi Customer
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={grabAppCust}
                        onChange={(e) =>
                          setGrabAppCust(formatNumberInput(e.target.value))
                        }
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-base font-bold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                  {grabCashReceived &&
                    grabAppCust &&
                    parseNumberInput(grabCashReceived) <
                      parseNumberInput(grabAppCust) && (
                      <p className="text-xs text-app-danger font-bold mt-1">
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
                        <p className="text-xs text-app-success font-bold mb-2">
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
                          <li className="pt-1 mt-1 border-t border-app-success/20 font-bold">
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
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                  Waktu Transaksi
                </label>
                <input
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
                  className="w-full bg-app-success disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 text-white font-bold py-4 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2"
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
          <div className="bg-app-card text-app-text w-full max-w-sm rounded-[24px] shadow-2xl border border-app-border/40 p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-app-text-bright mb-2">
              Hapus Transaksi?
            </h3>
            <p className="text-sm text-app-text/70 mb-6">
              Tindakan ini tidak dapat dibatalkan. Saldo rekening akan
              disesuaikan kembali.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTsxToDelete(null)}
                className="flex-1 py-3 bg-app-bg border border-app-border text-app-text-bright rounded-xl font-semibold hover:bg-app-hover transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteTransaction}
                className="flex-1 py-3 bg-app-danger text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-app-danger/20"
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
              className="bg-app-card border border-app-border w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]"
            >
              {/* Decorative solid accent line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-app-accent1" />

              {/* Header */}
              <div className="p-6 border-b border-app-border flex items-center justify-between shrink-0 bg-app-bg/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-app-accent1/10 flex items-center justify-center text-app-accent1 shadow-inner relative">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-app-text-bright flex items-center gap-2">
                      Strategi Keuangan AI
                      {strategyRecommendation?.isOffline && (
                        <span className="text-[10px] font-bold bg-app-border px-2 py-0.5 rounded-full text-app-text/60">
                          Mode Lokal
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-app-text/60">
                      Rekomendasi taktis dan alokasi anggaran personal Anda
                    </p>
                  </div>
                </div>
                <button
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
                      <div className="absolute top-0 right-0 w-24 h-24 bg-app-accent1/5 rounded-full blur-xl pointer-events-none" />
                      <p className="text-sm text-app-text-bright font-medium leading-relaxed">
                        {strategyRecommendation.summary}
                      </p>
                    </div>

                    {/* DIAGNOSTIC FINDINGS */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-app-text-bright uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-app-danger" />
                        Temuan Diagnostik
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {strategyRecommendation.diagnostic.map((diag, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3.5 bg-app-bg border border-app-border/40 rounded-xl text-xs text-app-text/80 leading-relaxed"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-app-danger shrink-0 mt-1.5" />
                            <span>{diag}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SAVINGS RECOMMENDATIONS */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-app-text-bright uppercase tracking-wider flex items-center gap-2">
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
                                  className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                                    rec.priority === "tinggi"
                                      ? "bg-app-danger/15 text-app-danger"
                                      : rec.priority === "sedang"
                                        ? "bg-app-warning/15 text-app-warning"
                                        : "bg-app-accent2/15 text-app-accent2"
                                  }`}
                                >
                                  {rec.priority}
                                </span>
                                <span className="text-[10px] font-bold text-app-success bg-app-success/10 px-2 py-0.5 rounded-full">
                                  {rec.potentialSavings}
                                </span>
                              </div>
                              <h4 className="font-bold text-app-text-bright text-xs mb-1.5 group-hover:text-app-accent1 transition-colors">
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
                      <h3 className="text-sm font-bold text-app-text-bright uppercase tracking-wider flex items-center gap-2">
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
                            <div className="flex justify-between text-[10px] text-app-text/50">
                              <span>Alokasi saat ini: ~{plan.currentPct}%</span>
                              <span className="font-bold text-app-text/80">Rekomendasi: {plan.recommendedPct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* INCOME STRATEGIES */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-app-text-bright uppercase tracking-wider flex items-center gap-2">
                        <Compass className="w-4 h-4 text-app-accent1" />
                        Strategi Peningkatan Pemasukan
                      </h3>
                      <div className="p-4 bg-app-bg border border-app-border rounded-2xl space-y-3">
                        {strategyRecommendation.incomeStrategies.map((strat, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 text-xs leading-relaxed text-app-text/80"
                          >
                            <div className="w-5 h-5 rounded-full bg-app-accent1/10 flex items-center justify-center shrink-0 text-app-accent1 text-[10px] font-bold mt-0.5">
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
                <button
                  onClick={() => setIsStrategyModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-app-accent1 hover:opacity-90 text-app-bg font-bold text-xs transition-opacity cursor-pointer shadow-md"
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
