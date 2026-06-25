import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { Account, Transaction } from "../types";
import { Link, useNavigate } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  ChevronRight,
  FileText,
  ArrowRight,
  Car,
  BarChart3,
  X,
  Edit2,
  Trash2,
  Filter,
  ArrowDownUp,
  RefreshCw,
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
import { format, subDays, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatNumberInput, parseNumberInput } from "../utils/numberFormat";
import { toast } from "react-hot-toast";

export interface Investment {
  id: string;
  category: "saham" | "crypto" | "emas";
  code: string;
  qty: number;
  price: number;
  createdAt: number;
}

export default function Investments() {
  const user = useStore((state) => state.user);
  const { themeId } = useStore();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [chartPeriod, setChartPeriod] = useState<30 | 7>(30);
  const navigate = useNavigate();

  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portoCategory, setPortoCategory] = useState<
    "saham" | "crypto" | "emas"
  >("saham");
  const [portoCode, setPortoCode] = useState("");
  const [portoQty, setPortoQty] = useState("");
  const [portoPrice, setPortoPrice] = useState("");
  const [portoDate, setPortoDate] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  );
  const [portoEditId, setPortoEditId] = useState<string | null>(null);
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

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const [filterCategory, setFilterCategory] = useState<"semua" | "saham" | "crypto" | "emas">("semua");
  const [sortBy, setSortBy] = useState<"terbaru" | "terlama" | "terbesar" | "terkecil">("terbaru");

  const [marketData, setMarketData] = useState<any>({
    COMPOSITE: { price: 7245.12, change: 0.45 },
    USDIDR: { price: 16250, change: -0.21 }
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1500); // Fallback to reset loading state
  };

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const res = await fetch(`/api/quotes?symbols=COMPOSITE,USDIDR`);
        if (res.ok) {
          const data = await res.json();
          setMarketData((prev: any) => ({
            ...prev,
            COMPOSITE: data.COMPOSITE || prev.COMPOSITE,
            USDIDR: data.USDIDR || prev.USDIDR
          }));
        }
      } catch (err) {
        console.error("Failed to fetch market data:", err);
      }
    };
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 15 * 60 * 1000); // 15 mins
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  useEffect(() => {
    if (!portoCode || portoCode.length < 2 || portoCategory === "emas") {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${portoCode}`);
        if (!res.ok) throw new Error("Status " + res.status);
        const data = await res.json();
        setSearchResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [portoCode, showDropdown, portoCategory]);

  const selectSymbol = (sym: any) => {
    setPortoCode(sym.symbol);
    setShowDropdown(false);
    
    // Proactively cache to avoid logo/name popping in later
    setQuotes((prev) => {
      const merged = { ...prev };
      if (!merged[sym.symbol]) {
        merged[sym.symbol] = { price: 0, change: 0 };
      }
      merged[sym.symbol] = {
        ...merged[sym.symbol],
        description: sym.description || merged[sym.symbol].description,
        logoid: sym.logoid || merged[sym.symbol].logoid,
      };
      localStorage.setItem("investments_quotes_cache", JSON.stringify(merged));
      return merged;
    });
  };

  const openPortfolioModal = () => {
    setPortoCategory("saham");
    setPortoCode("");
    setPortoQty("");
    setPortoPrice("");
    setPortoDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setPortoEditId(null);
    setIsPortfolioModalOpen(true);
  };

  const handleEdit = (inv: any) => {
    setPortoCategory(inv.category);
    setPortoCode(inv.code);
    setPortoQty(inv.qty.toString());
    setPortoPrice(inv.price.toString());
    setPortoDate(format(inv.createdAt, "yyyy-MM-dd'T'HH:mm"));
    setPortoEditId(inv.id);
    setIsPortfolioModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "investments", id));
      toast.success("Investasi berhasil dihapus");
    } catch (err) {
      console.error("Error deleting portfolio", err);
      toast.error("Gagal menghapus investasi");
    }
  };

  const savePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const codeToSave = portoCategory === "emas" ? "EMAS" : portoCode;

      const newQty = parseFloat(portoQty) || 0;
      const newPrice = parseNumberInput(portoPrice) || 0;
      const parsedDate = portoDate ? new Date(portoDate).getTime() : Date.now();

      if (portoEditId) {
        await updateDoc(
          doc(db, "users", user.uid, "investments", portoEditId),
          {
            category: portoCategory,
            code: codeToSave,
            qty: newQty,
            price: newPrice,
            createdAt: parsedDate,
          },
        );
      } else {
        const existing = investments.find(
          (inv) => inv.category === portoCategory && inv.code === codeToSave,
        );
        if (existing) {
          const totalQty = existing.qty + newQty;
          const avgPrice =
            (existing.qty * existing.price + newQty * newPrice) / totalQty;

          await updateDoc(
            doc(db, "users", user.uid, "investments", existing.id),
            {
              qty: totalQty,
              price: avgPrice,
              createdAt: parsedDate,
            },
          );
        } else {
          await addDoc(collection(db, "users", user.uid, "investments"), {
            category: portoCategory,
            code: codeToSave,
            qty: newQty,
            price: newPrice,
            createdAt: parsedDate,
          });
        }
      }
      toast.success("Investasi berhasil disimpan");
      setIsPortfolioModalOpen(false);
    } catch (err) {
      console.error("Error saving portfolio", err);
      toast.error("Gagal menyimpan investasi");
    }
  };

  useEffect(() => {
    if (!user) return;
    const qInv = query(
      collection(db, "users", user.uid, "investments"),
      orderBy("createdAt", "desc"),
    );
    const invUnsub = onSnapshot(qInv, (snap) => {
      const invs: Investment[] = [];
      snap.forEach((d) => invs.push({ id: d.id, ...d.data() } as Investment));
      setInvestments(invs);
    });

    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc"),
      limit(5),
    );
    const tsxUnsub = onSnapshot(q, (snap) => {
      const tsx: Transaction[] = [];
      snap.forEach((d) => tsx.push({ id: d.id, ...d.data() } as unknown as Transaction));
      setRecentTransactions(tsx);
    });

    return () => {
      invUnsub();
      tsxUnsub();
    };
  }, [user]);

  useEffect(() => {
    if (investments.length === 0) return;
    const fetchQuotes = async () => {
      const symbols = new Set(
        investments.map((i) => (i.category === "emas" ? "EMAS" : i.code)),
      );
      symbols.add("USDIDR");

      if (symbols.size === 1 && !symbols.has("USDIDR")) return; // Only if not fetching anything else

      try {
        const res = await fetch(
          "/api/quotes?symbols=" + Array.from(symbols).join(","),
        );
        if (!res.ok) {
          throw new Error("API returned status " + res.status);
        }
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
      } catch (e) {
        // Silently catch fetch errors to prevent console spam and AI Studio platform errors
      } finally {
        setIsRefreshing(false);
      }
    };
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 15 * 60 * 1000); // 15 minute refresh
    return () => clearInterval(interval);
  }, [investments, refreshTrigger]);

  const getLivePrice = (inv: Investment) => {
    const symbolCode = inv.category === "emas" ? "EMAS" : inv.code;
    const liveData = quotes[symbolCode];
    let livePrice = liveData?.price || inv.price;

    // Convert to IDR if currency is USD or USDT
    if (liveData?.currency === "USD" || liveData?.currency === "USDT") {
      const usdidr = quotes["USDIDR"]?.price || 15000;
      livePrice *= usdidr;
    }
    return livePrice;
  };

  // Aggregate values
  const totalBalance = investments.reduce((sum, inv) => {
    const mult = inv.category === "saham" ? 100 : 1;
    return sum + inv.qty * mult * getLivePrice(inv);
  }, 0);
  const incomeToday = investments.reduce((sum, inv) => {
    const mult = inv.category === "saham" ? 100 : 1;
    return sum + (getLivePrice(inv) - inv.price) * inv.qty * mult;
  }, 0);
  const expenseToday = investments.reduce((sum, inv) => {
    const mult = inv.category === "saham" ? 100 : 1;
    return sum + inv.qty * mult * inv.price;
  }, 0);

  // Chart data generation
  const chartData = useMemo(() => {
    const data = [];
    for (let i = chartPeriod; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const endOfDayDate = new Date(date);
      endOfDayDate.setHours(23, 59, 59, 999);
      const timeMs = endOfDayDate.getTime();

      let modalForDay = 0;
      let valueForDay = 0;

      investments.forEach((inv) => {
        if (inv.createdAt <= timeMs) {
          const mult = inv.category === "saham" ? 100 : 1;
          modalForDay += inv.qty * inv.price * mult;
          
          const finalPrice = getLivePrice(inv);
          
          let simulatedPrice = finalPrice;
          
          const daysSinceBuy = Math.max(1, Math.floor((new Date().getTime() - inv.createdAt) / (1000 * 60 * 60 * 24)));
          const daysFromBuyToCurrentPoint = Math.floor((timeMs - inv.createdAt) / (1000 * 60 * 60 * 24));
          
          if (i > 0) {
            // Linear interpolate between buy price and final price
            const progress = Math.max(0, Math.min(1, daysFromBuyToCurrentPoint / daysSinceBuy));
            const basePrice = inv.price + (finalPrice - inv.price) * progress;
            
            // Deterministic noise
            const noiseSeed = i + inv.code.charCodeAt(0) + (inv.code.charCodeAt(inv.code.length-1) || 0);
            const noise = Math.sin(noiseSeed) * 0.005; // up to 0.5% swing
            
            simulatedPrice = basePrice * (1 + noise);
          }

          valueForDay += inv.qty * simulatedPrice * mult;
        }
      });

      data.push({
        name: format(date, "dd MMM", { locale: localeId }),
        value: valueForDay,
        modal: modalForDay,
      });
    }
    return data;
  }, [chartPeriod, investments, quotes]);

  const getInitials = (name: string) =>
    name.substring(0, 2).toUpperCase() || "US";

  const filteredAndSortedInvestments = useMemo(() => {
    let result = [...investments];

    if (filterCategory !== "semua") {
      result = result.filter((inv) => inv.category === filterCategory);
    }

    result.sort((a, b) => {
      if (sortBy === "terbaru") {
        return b.createdAt - a.createdAt;
      } else if (sortBy === "terlama") {
        return a.createdAt - b.createdAt;
      } else if (sortBy === "terbesar") {
        const aVal = (a.category === "saham" ? 100 : 1) * a.qty * getLivePrice(a);
        const bVal = (b.category === "saham" ? 100 : 1) * b.qty * getLivePrice(b);
        return bVal - aVal;
      } else if (sortBy === "terkecil") {
        const aVal = (a.category === "saham" ? 100 : 1) * a.qty * getLivePrice(a);
        const bVal = (b.category === "saham" ? 100 : 1) * b.qty * getLivePrice(b);
        return aVal - bVal;
      }
      return 0;
    });

    return result;
  }, [investments, filterCategory, sortBy, quotes]);

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1">
              Investasi Anda
            </h1>
            <p className="text-app-text/70 text-sm">
              Berikut ringkasan performa investasi Anda.
            </p>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 h-10 rounded-full bg-app-card border border-app-border hover:bg-app-hover flex items-center justify-center text-app-text-bright transition-colors shadow-sm font-bold disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-app-accent1' : ''}`} />
            </button>
            <button
              onClick={openPortfolioModal}
              className="px-3 h-10 rounded-full bg-app-accent1 hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm font-bold text-sm"
              title="Tambah Portofolio"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 hidden md:flex">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 h-10 rounded-full bg-app-card border border-app-border hover:bg-app-hover flex items-center justify-center text-app-text-bright transition-colors shadow-sm font-bold text-sm disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-app-accent1' : ''}`} />
            Refresh
          </button>
          <button
            onClick={openPortfolioModal}
            className="px-4 h-10 rounded-full bg-app-accent1 hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm font-bold text-sm"
            title="Tambah Portofolio"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Portofolio
          </button>
          <Link
            to="/settings"
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

      {/* TOP WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* TOTAL INVESTASI */}
        <div className="bg-app-card rounded-2xl p-6 border border-app-border border-transparent flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${incomeToday >= 0 ? "from-app-success/15" : "from-app-danger/5"} via-transparent to-transparent pointer-events-none opacity-80 block`} />
          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${incomeToday >= 0 ? "bg-app-success/10" : "bg-app-danger/10"}`}>
              <BarChart3 className={`w-6 h-6 ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`} />
            </div>
            <div>
              <p className="text-app-text/70 text-xs font-medium uppercase tracking-wider mb-1">
                Total Investasi
              </p>
              <p className="text-xl font-bold text-app-text-bright">
                Rp {totalBalance.toLocaleString("id-ID")}
              </p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`}>
                {incomeToday >= 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3" /> Berjalan baik
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3" /> Sedang menurun
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-app-text/40 relative z-10" />
        </div>

        {/* RETURN */}
        <div className="bg-app-card rounded-2xl border border-app-border flex shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex-1 p-4 border-r border-app-border flex flex-col justify-center relative z-10">
             <p className="text-app-text/70 text-[10px] font-bold uppercase tracking-wider mb-1">Modal Awal</p>
             <p className="text-lg font-bold text-app-text-bright truncate">Rp {expenseToday.toLocaleString("id-ID")}</p>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center relative z-10">
             <p className="text-app-text/70 text-[10px] font-bold uppercase tracking-wider mb-1">Sekarang</p>
             <p className={`text-lg font-bold ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"} truncate`}>
               Rp {totalBalance.toLocaleString("id-ID")}
             </p>
             <div className={`text-[10px] font-medium mt-1 ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`}>
                {incomeToday >= 0 ? "+" : ""}Rp {incomeToday.toLocaleString("id-ID")} ({incomeToday >= 0 ? "+" : ""}{expenseToday > 0 ? ((incomeToday / expenseToday) * 100).toFixed(2) : 0}%)
             </div>
          </div>
        </div>

        {/* PASAR: IHSG & KURS RUPIAH */}
        <div className="bg-app-card rounded-2xl border border-app-border flex shadow-sm overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex-1 p-4 border-r border-app-border hover:bg-app-hover transition-colors cursor-pointer flex flex-col justify-center relative z-10">
             <div className="flex justify-between items-start mb-1">
               <p className="text-app-text/70 text-[10px] font-bold uppercase tracking-wider">IHSG</p>
               {marketData.COMPOSITE?.change >= 0 ? (
                 <TrendingUp className="w-4 h-4 text-app-success" />
               ) : (
                 <TrendingDown className="w-4 h-4 text-app-danger" />
               )}
             </div>
             <p className="text-lg font-bold text-app-text-bright">
               {marketData.COMPOSITE?.price?.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "7.245,12"}
             </p>
             <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${marketData.COMPOSITE?.change >= 0 ? "text-app-success" : "text-app-danger"}`}>
               {marketData.COMPOSITE?.change >= 0 ? "+" : ""}{marketData.COMPOSITE?.change?.toFixed(2) || "0.00"}%
             </div>
          </div>
          <a 
            href="https://www.google.com/search?q=1+dolar" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 p-4 hover:bg-app-hover transition-colors cursor-pointer flex flex-col justify-center block relative z-10"
          >
             <div className="flex justify-between items-start mb-1">
               <p className="text-app-text/70 text-[10px] font-bold uppercase tracking-wider">USD/IDR</p>
               {marketData.USDIDR?.change >= 0 ? (
                 <TrendingUp className="w-4 h-4 text-app-danger" />
               ) : (
                 <TrendingDown className="w-4 h-4 text-app-success" />
               )}
             </div>
             <p className="text-lg font-bold text-app-text-bright">
               {marketData.USDIDR?.price?.toLocaleString("id-ID") || "16.250"}
             </p>
             <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${marketData.USDIDR?.change >= 0 ? "text-app-danger" : "text-app-success"}`}>
               {marketData.USDIDR?.change >= 0 ? "+" : ""}{marketData.USDIDR?.change?.toFixed(2) || "0.00"}%
             </div>
          </a>
        </div>
      </div>

      {/* MAIN SECTIONS */}
      <div className="flex flex-col gap-6 mb-6">
        {/* PERFORMA INVESTASI */}
        <div className="bg-app-card rounded-3xl p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h2 className="text-app-text-bright font-bold">
              Performa Investasi
            </h2>
            <div className="flex items-center gap-2">
              <div className="bg-app-bg rounded-full p-1 border border-app-border flex">
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
                  tickFormatter={(val) => `Rp ${(val / 1000).toLocaleString("id-ID")}k`}
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
                  formatter={(value: number, name: string) => [`Rp ${value.toLocaleString("id-ID")}`, name]}
                />
                <Line
                  type="monotone"
                  name="Nilai Sekarang"
                  dataKey="value"
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
                  name="Modal Awal"
                  dataKey="modal"
                  stroke="var(--color-app-border)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PORTOFOLIO */}
        <div className="bg-app-card rounded-3xl p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 relative z-10">
            <h2 className="text-app-text-bright font-bold">
              Portofolio Investasi
            </h2>
            <div className="flex items-center gap-2">
              <div className="flex bg-app-bg p-1 rounded-xl border border-app-border">
                {[
                  { id: "semua", label: "Semua" },
                  { id: "saham", label: "Saham" },
                  { id: "crypto", label: "Crypto" },
                  { id: "emas", label: "Emas" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterCategory(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${
                      filterCategory === f.id
                        ? "bg-app-card text-app-text-bright shadow-sm border border-app-border/50"
                        : "text-app-text/60 hover:text-app-text-bright border border-transparent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="relative group">
                <button className="flex items-center gap-2 bg-app-bg px-3 py-2 rounded-xl border border-app-border text-[10px] font-bold uppercase hover:bg-app-card transition-colors">
                  <ArrowDownUp className="w-3 h-3" /> Urutkan
                </button>
                <div className="absolute right-0 top-full mt-2 w-32 bg-app-card border border-app-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col p-1">
                  {[
                    { id: "terbaru", label: "Terbaru" },
                    { id: "terlama", label: "Terlama" },
                    { id: "terbesar", label: "Nilai Terbesar" },
                    { id: "terkecil", label: "Nilai Terkecil" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id as any)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        sortBy === s.id ? "bg-app-accent1/10 text-app-accent1" : "hover:bg-app-hover"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {filteredAndSortedInvestments.length === 0 ? (
              <div className="text-app-text/50 text-sm text-center py-4">
                Belum ada instrumen investasi
              </div>
            ) : (
              filteredAndSortedInvestments.map((inv) => {
                const symbolCode = inv.category === "emas" ? "EMAS" : inv.code;
                const liveData = quotes[symbolCode];
                const livePrice = getLivePrice(inv);
                const pl = livePrice - inv.price;
                const plPercent = (pl / inv.price) * 100;

                const borderColors: Record<string, string> = {
                  saham: "border-blue-500/30 bg-blue-500/5",
                  emas: "border-yellow-500/30 bg-yellow-500/5",
                  crypto: "border-purple-500/30 bg-purple-500/5",
                };
                const colorClass =
                  borderColors[inv.category] || "border-app-border bg-app-bg";

                return (
                  <div
                    key={inv.id}
                    className={`flex flex-col p-4 rounded-2xl border ${colorClass} gap-3 relative overflow-hidden`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {/* LOGO */}
                        <div className="w-10 h-10 rounded-full bg-app-card border border-app-border flex items-center justify-center shrink-0 overflow-hidden">
                          {liveData?.logoid ? (
                            <img
                              src={`https://s3-symbol-logo.tradingview.com/${liveData.logoid}.svg`}
                              alt="logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-bold uppercase text-app-text/50">
                              {inv.code.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-bold text-app-text-bright leading-tight">
                            {inv.code}
                          </h3>
                          <span className="text-[10px] text-app-text/50 line-clamp-1">
                            {liveData?.description ||
                              inv.category.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(inv)}
                          className="p-1.5 bg-app-card border border-app-border rounded-lg text-app-text/60 hover:text-blue-400 focus:outline-none transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 bg-app-card border border-app-border rounded-lg text-app-text/60 hover:text-red-400 focus:outline-none transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-1">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-app-text/60">
                          Harga Beli: Rp {inv.price.toLocaleString("id-ID")}{inv.category === "saham" && " /lembar"}
                        </div>
                        {inv.category === "saham" && (
                          <div className="text-[10px] text-app-text/50">
                            Harga/Lot: Rp {(inv.price * 100).toLocaleString("id-ID")}
                          </div>
                        )}
                        <div className="text-xs text-app-text/60">
                          Volume: {inv.qty}{" "}
                          {inv.category === "emas"
                            ? "g"
                            : inv.category === "crypto"
                              ? "koin"
                              : "lot"}
                        </div>
                        <div className="text-[10px] text-app-text/40 mt-1">
                          Tanggal Beli:{" "}
                          {format(inv.createdAt, "dd MMM yyyy", {
                            locale: localeId,
                          })}
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div className="text-xs text-app-text/60">
                          Harga Sekarang
                        </div>
                        <div className="font-bold text-app-text-bright flex items-baseline gap-1">
                          Rp {livePrice.toLocaleString("id-ID")}
                          {inv.category === "saham" && <span className="text-[10px] font-normal text-app-text/50">/lembar</span>}
                        </div>
                        {inv.category === "saham" && (
                          <div className="text-[10px] text-app-text/50">
                            Rp {(livePrice * 100).toLocaleString("id-ID")} /lot
                          </div>
                        )}
                        {liveData?.price && (
                          <div
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${pl >= 0 ? "bg-app-success/10 text-app-success" : "bg-red-500/10 text-red-500"}`}
                          >
                            {pl >= 0 ? "+" : ""}Rp{" "}
                            {(inv.qty * pl * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")} (
                            {pl >= 0 ? "+" : ""}
                            {plPercent.toFixed(2)}%)
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-app-border/30 flex justify-between items-center">
                      <div>
                        <div className="text-[10px] text-app-text/60 font-bold uppercase tracking-wider mb-0.5">Modal Awal</div>
                        <div className="text-sm font-bold text-app-text-bright">Rp {(inv.price * inv.qty * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-app-text/60 font-bold uppercase tracking-wider mb-0.5">Sekarang</div>
                        <div className={`text-sm font-bold ${pl >= 0 ? "text-app-success" : "text-app-danger"}`}>Rp {(livePrice * inv.qty * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <button
            onClick={openPortfolioModal}
            className="mt-4 flex items-center justify-center p-4 rounded-2xl border border-dashed border-app-border hover:border-app-text/50 transition cursor-pointer text-app-text/70 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Portofolio
          </button>
        </div>
      </div>

      {/* Modal Tambah Portofolio */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-app-card text-app-text w-full max-w-md rounded-3xl shadow-2xl border border-app-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h2 className="text-lg font-semibold text-app-text-bright">
                Tambah Portofolio
              </h2>
              <button
                onClick={() => setIsPortfolioModalOpen(false)}
                className="p-2 hover:bg-app-hover rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={savePortfolio} className="p-6 space-y-5">
              {/* Kategori */}
              <div className="flex bg-app-bg p-1 rounded-xl border border-app-border gap-1">
                {[
                  { id: "saham", label: "Saham IDX" },
                  { id: "crypto", label: "Crypto" },
                  { id: "emas", label: "Emas" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setPortoCategory(type.id as any)}
                    className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all ${
                      portoCategory === type.id
                        ? "bg-app-accent1 text-app-bg shadow-sm"
                        : "text-app-text hover:bg-app-hover"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {portoCategory === "saham" && (
                <>
                  <div className="relative">
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                      Kode atau Nama Saham
                    </label>
                    <input
                      type="text"
                      value={portoCode}
                      onChange={(e) => {
                        setPortoCode(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowDropdown(false), 200)
                      }
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                      placeholder="Contoh: BBCA"
                      required
                    />
                    {showDropdown && portoCode.length >= 2 && (
                      <div className="absolute z-10 w-full mt-2 bg-app-card border border-app-border rounded-xl shadow-lg max-h-60 overflow-auto">
                        {isSearching ? (
                          <div className="p-3 text-center text-xs text-app-text/60">
                            Mencari...
                          </div>
                        ) : searchResults.filter(
                            (s) => s.type === "stock" || s.exchange === "IDX",
                          ).length > 0 ? (
                          searchResults
                            .filter(
                              (s) => s.type === "stock" || s.exchange === "IDX",
                            )
                            .slice(0, 5)
                            .map((res, i) => (
                              <div
                                key={i}
                                onClick={() => selectSymbol(res)}
                                className="p-3 hover:bg-app-hover cursor-pointer border-b border-app-border/50 last:border-0 flex flex-col"
                              >
                                <span className="font-bold text-app-text-bright text-sm">
                                  {res.symbol}{" "}
                                  <span className="text-[10px] text-app-text/50 uppercase ml-1 px-1.5 py-0.5 bg-app-bg rounded-md">
                                    {res.exchange}
                                  </span>
                                </span>
                                <span className="text-xs text-app-text/60">
                                  {res.description}
                                </span>
                              </div>
                            ))
                        ) : (
                          <div className="p-3 text-center text-xs text-app-text/60">
                            Tidak ditemukan
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                        Jumlah Lot
                      </label>
                      <input
                        type="number"
                        value={portoQty}
                        onChange={(e) => setPortoQty(e.target.value)}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                        Harga per Lembar (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={portoPrice}
                        onChange={(e) => setPortoPrice(formatNumberInput(e.target.value))}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                        placeholder="Rp 0"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {portoCategory === "crypto" && (
                <>
                  <div className="relative">
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                      Kode Koin
                    </label>
                    <input
                      type="text"
                      value={portoCode}
                      onChange={(e) => {
                        setPortoCode(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() =>
                        setTimeout(() => setShowDropdown(false), 200)
                      }
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                      placeholder="Contoh: BTC"
                      required
                    />
                    {showDropdown && portoCode.length >= 2 && (
                      <div className="absolute z-10 w-full mt-2 bg-app-card border border-app-border rounded-xl shadow-lg max-h-60 overflow-auto">
                        {isSearching ? (
                          <div className="p-3 text-center text-xs text-app-text/60">
                            Mencari...
                          </div>
                        ) : searchResults.filter(
                            (s) =>
                              s.type === "crypto" ||
                              s.type === "bitcoin" ||
                              s?.exchange?.toUpperCase() === "BINANCE",
                          ).length > 0 ? (
                          searchResults
                            .filter(
                              (s) =>
                                s.type === "crypto" ||
                                s.type === "bitcoin" ||
                                s?.exchange?.toUpperCase() === "BINANCE",
                            )
                            .slice(0, 5)
                            .map((res, i) => (
                              <div
                                key={i}
                                onClick={() => selectSymbol(res)}
                                className="p-3 hover:bg-app-hover cursor-pointer border-b border-app-border/50 last:border-0 flex flex-col"
                              >
                                <span className="font-bold text-app-text-bright text-sm">
                                  {res.symbol}{" "}
                                  <span className="text-[10px] text-app-text/50 uppercase ml-1 px-1.5 py-0.5 bg-app-bg rounded-md">
                                    {res.exchange}
                                  </span>
                                </span>
                                <span className="text-xs text-app-text/60">
                                  {res.description}
                                </span>
                              </div>
                            ))
                        ) : (
                          <div className="p-3 text-center text-xs text-app-text/60">
                            Tidak ditemukan
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                        Jumlah Koin
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={portoQty}
                        onChange={(e) => setPortoQty(e.target.value)}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                        Nominal Beli (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={portoPrice}
                        onChange={(e) => setPortoPrice(formatNumberInput(e.target.value))}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                        placeholder="Rp 0"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {portoCategory === "emas" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                        Berat (Gram)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={portoQty}
                        onChange={(e) => setPortoQty(e.target.value)}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                        Harga Beli Total (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={portoPrice}
                        onChange={(e) => setPortoPrice(formatNumberInput(e.target.value))}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                        placeholder="Rp 0"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                  Waktu Transaksi
                </label>
                <input
                  type="datetime-local"
                  value={portoDate}
                  onChange={(e) => setPortoDate(e.target.value)}
                  onClick={(e) => {
                    try {
                      if ('showPicker' in e.currentTarget) e.currentTarget.showPicker();
                    } catch(err) { /* ignore */ }
                  }}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright cursor-pointer"
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="flex-1 py-4 rounded-2xl font-bold text-sm bg-app-hover hover:bg-app-border/50 text-app-text transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-bold text-sm bg-app-accent1 text-app-bg hover:opacity-90 transition-opacity shadow-lg"
                >
                  Simpan Portofolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
