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
  writeBatch,
  getDoc,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { sendDeviceNotification } from "../utils/notification";
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
  List,
  PieChart as PieChartIcon,
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
} from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { formatNumberInput, parseNumberInput } from "../utils/numberFormat";
import { toast } from "react-hot-toast";
import { motion } from "motion/react";
import { HoverCard, ScrollReveal, StaggerContainer, StaggerItem, TextReveal } from "./MotionWrappers";

export interface Investment {
  id: string;
  category: "saham" | "crypto" | "emas";
  code: string;
  qty: number;
  price: number;
  createdAt: number;
}

function AssetLogo({ logoid, code, description }: { logoid?: string; code: string; description?: string }) {
  const [customError, setCustomError] = useState(false);
  const [tvError, setTvError] = useState(false);

  useEffect(() => {
    setCustomError(false);
    setTvError(false);
  }, [logoid, code, description]);

  // Try to find an original custom logo first
  const cleanCode = code.toUpperCase().trim();
  const cleanDesc = (description || "").toLowerCase();

  let customLogoUrl = "";

  // Well-known exact mappings
  const mappings: Record<string, string> = {
    RANS: "https://upload.wikimedia.org/wikipedia/id/7/7b/Logo_RANS_Entertainment.png",
    BACH: "https://logo.clearbit.com/bach.co.id",
    PRDL: "https://logo.clearbit.com/prodia.co.id",
    PRDA: "https://logo.clearbit.com/prodia.co.id",
    JECX: "https://logo.clearbit.com/jec.co.id",
    BBCA: "https://logo.clearbit.com/bca.co.id",
    BBRI: "https://logo.clearbit.com/bri.co.id",
    BBNI: "https://logo.clearbit.com/bni.co.id",
    BMRI: "https://logo.clearbit.com/bankmandiri.co.id",
    TLKM: "https://logo.clearbit.com/telkom.co.id",
    ASII: "https://logo.clearbit.com/astra.co.id",
    UNVR: "https://logo.clearbit.com/unilever.co.id",
    GOTO: "https://logo.clearbit.com/gotocompany.com",
    BUKA: "https://logo.clearbit.com/bukalapak.com",
  };

  if (mappings[cleanCode]) {
    customLogoUrl = mappings[cleanCode];
  } else if (cleanDesc.includes("rans entertainment")) {
    customLogoUrl = "https://upload.wikimedia.org/wikipedia/id/7/7b/Logo_RANS_Entertainment.png";
  } else if (cleanDesc.includes("prodia")) {
    customLogoUrl = "https://logo.clearbit.com/prodia.co.id";
  } else if (cleanDesc.includes("bach multi global")) {
    customLogoUrl = "https://logo.clearbit.com/bach.co.id";
  } else if (cleanDesc.includes("astra international")) {
    customLogoUrl = "https://logo.clearbit.com/astra.co.id";
  } else if (cleanDesc.includes("telkom")) {
    customLogoUrl = "https://logo.clearbit.com/telkom.co.id";
  } else if (cleanDesc.includes("central asia")) {
    customLogoUrl = "https://logo.clearbit.com/bca.co.id";
  } else if (cleanDesc.includes("rakyat indonesia")) {
    customLogoUrl = "https://logo.clearbit.com/bri.co.id";
  } else if (cleanDesc.includes("negara indonesia")) {
    customLogoUrl = "https://logo.clearbit.com/bni.co.id";
  } else if (cleanDesc.includes("mandiri")) {
    customLogoUrl = "https://logo.clearbit.com/bankmandiri.co.id";
  } else if (cleanDesc) {
    // Attempt clearbit from first descriptive word
    const words = cleanDesc
      .replace(/^pt\s+/, "")
      .replace(/\s+tbk$/, "")
      .trim()
      .split(/\s+/);
    if (words.length > 0 && words[0].length > 2) {
      const cleanWord = words[0].replace(/[^a-z0-9]/g, "");
      if (cleanWord) {
        customLogoUrl = `https://logo.clearbit.com/${cleanWord}.co.id`;
      }
    }
  }

  if (customLogoUrl && !customError) {
    return (
      <img
        src={customLogoUrl}
        alt={code}
        className="w-full h-full object-cover bg-white"
        referrerPolicy="no-referrer"
        onError={() => setCustomError(true)}
      />
    );
  }

  // Fallback to TradingView logo
  if (logoid && !tvError) {
    return (
      <img
        src={`https://s3-symbol-logo.tradingview.com/${logoid}.svg`}
        alt={code}
        className="w-full h-full object-cover bg-white"
        referrerPolicy="no-referrer"
        onError={() => setTvError(true)}
      />
    );
  }

  // Fallback to text initials badge
  return (
    <div className="w-full h-full flex items-center justify-center bg-app-accent1/15 text-app-accent1 font-bold text-xs tracking-wider uppercase">
      {code.slice(0, 2)}
    </div>
  );
}

function getFraction(price: number): number {
  if (price < 200) return 1;
  if (price < 500) return 2;
  if (price < 2000) return 5;
  if (price < 5000) return 10;
  return 25;
}

function getAraPercentage(price: number): number {
  if (price <= 200) return 0.35;
  if (price <= 5000) return 0.25;
  return 0.20;
}

const ARB_PERCENTAGE = 0.15;

interface SimulationStep {
  day: number;
  prevPrice: number;
  pct: number;
  frac: number;
  change: number;
  price: number;
  totalValue: number;
}

function AraArbSimulator({ ownedStocks }: { ownedStocks: Investment[] }) {
  const [stockName, setStockName] = useState("");
  const [priceInput, setPriceInput] = useState("272");
  const [lotInput, setLotInput] = useState("10");
  const [days, setDays] = useState(10);
  const [direction, setDirection] = useState<"ara" | "arb">("ara");

  const parsedPrice = parseNumberInput(priceInput) || 0;
  const parsedLots = parseNumberInput(lotInput) || 0;

  const simulationSteps = useMemo(() => {
    if (parsedPrice <= 0) return [];
    
    const steps: SimulationStep[] = [];
    let currentPrice = parsedPrice;
    const maxDays = Math.min(Math.max(1, days), 100);
    
    for (let i = 1; i <= maxDays; i++) {
      const prev = currentPrice;
      const frac = getFraction(prev);
      
      let pct = 0;
      let theoryChange = 0;
      let change = 0;
      let nextPrice = 0;
      
      if (direction === "ara") {
        pct = getAraPercentage(prev);
        theoryChange = prev * pct;
        change = Math.floor(theoryChange / frac) * frac;
        nextPrice = prev + change;
      } else {
        pct = ARB_PERCENTAGE;
        theoryChange = prev * pct;
        change = Math.floor(theoryChange / frac) * frac;
        nextPrice = Math.max(50, prev - change);
      }
      
      steps.push({
        day: i,
        prevPrice: prev,
        pct: pct * 100,
        frac,
        change,
        price: nextPrice,
        totalValue: nextPrice * parsedLots * 100,
      });
      
      currentPrice = nextPrice;
    }
    return steps;
  }, [parsedPrice, parsedLots, days, direction]);

  const handleQuickSelect = (code: string, price: number, qty?: number) => {
    setStockName(code);
    setPriceInput(price.toLocaleString("id-ID"));
    if (qty !== undefined) {
      setLotInput(qty.toString());
    }
  };

  return (
    <div className="bg-app-card rounded-3xl p-6 border border-app-border flex flex-col shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 relative z-10">
        <div>
          <h2 className="text-app-text-bright font-bold flex items-center gap-2 text-lg">
            Simulasi ARA & ARB Saham (BEI)
          </h2>
          <p className="text-xs text-app-text/60 mt-1">
            Hitung potensi auto rejection berdasarkan regulasi fraksi harga dan batasan BEI terbaru.
          </p>
        </div>
        
        {/* Toggle ARA / ARB */}
        <div className="flex bg-app-bg p-1 rounded-xl border border-app-border">
          <button
            type="button"
            onClick={() => setDirection("ara")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
              direction === "ara"
                ? "bg-app-success text-white shadow-sm font-bold"
                : "text-app-text/60 hover:text-app-text-bright font-semibold"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> ARA
          </button>
          <button
            type="button"
            onClick={() => setDirection("arb")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1.5 ${
              direction === "arb"
                ? "bg-app-danger text-white shadow-sm font-bold"
                : "text-app-text/60 hover:text-app-text-bright font-semibold"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> ARB
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        {/* INPUTS CONTAINER (Full Width, beautifully aligned) */}
        <div className="bg-app-bg/40 p-5 rounded-2xl border border-app-border/60 space-y-5">
          {/* Section 1: Quick Select */}
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
              Pilih Contoh / Portofolio
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect("Contoh 1", 272, 10)}
                className="px-2.5 py-1.5 rounded-lg bg-app-bg border border-app-border text-xs text-app-text hover:text-app-text-bright hover:border-app-accent1 transition-all"
              >
                Rp 272 (Contoh 1)
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect("Contoh 2", 1255, 10)}
                className="px-2.5 py-1.5 rounded-lg bg-app-bg border border-app-border text-xs text-app-text hover:text-app-text-bright hover:border-app-accent1 transition-all"
              >
                Rp 1.255 (Contoh 2)
              </button>
              
              {ownedStocks.map((stock) => (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => handleQuickSelect(stock.code, stock.price, stock.qty)}
                  className="px-2.5 py-1.5 rounded-lg bg-app-bg border border-app-border text-xs text-app-text hover:text-app-text-bright hover:border-app-accent1 transition-all flex items-center gap-1.5"
                >
                  <span className="font-bold text-app-accent1">{stock.code}</span>
                  <span className="text-app-text/60">Rp {stock.price.toLocaleString("id-ID")}</span>
                  {stock.qty && <span className="px-1 py-0.5 rounded bg-app-bg text-[9px] text-app-accent2">{stock.qty} Lot</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Main inputs in a clean responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                Nama / Kode Saham
              </label>
              <input
                type="text"
                value={stockName}
                onChange={(e) => setStockName(e.target.value.toUpperCase())}
                placeholder="Contoh: TLKM"
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm focus:border-app-accent1 outline-none text-app-text-bright font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                Harga Sebelumnya (Rp)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(formatNumberInput(e.target.value))}
                placeholder="Harga acuan..."
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm focus:border-app-accent1 outline-none text-app-text-bright font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">
                Jumlah Lot
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={lotInput}
                onChange={(e) => setLotInput(formatNumberInput(e.target.value))}
                placeholder="Jumlah lot..."
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm focus:border-app-accent1 outline-none text-app-text-bright font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70 flex justify-between">
                <span>Berapa Kali ARA/ARB ({days}x)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={days > 15 ? 15 : days}
                  onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                  className="flex-1 accent-app-accent1 cursor-pointer bg-app-border h-1 rounded"
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={days}
                  onChange={(e) => setDays(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center bg-app-bg border border-app-border rounded-lg py-1.5 text-xs text-app-text-bright font-bold focus:border-app-accent1 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Summary details */}
          {parsedPrice > 0 && parsedLots > 0 && (
            <div className="bg-app-bg/50 p-4 rounded-xl border border-app-border/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div>
                <span className="text-app-text/50">Total Uang Awal:</span>
                <span className="font-bold text-app-text-bright ml-2 text-sm">
                  Rp {(parsedPrice * parsedLots * 100).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="text-app-text/50">
                Konversi Shares: <span className="font-bold text-app-text-bright">{parsedLots} lot</span> ({ (parsedLots * 100).toLocaleString("id-ID") } lembar saham)
              </div>
            </div>
          )}
        </div>

        {/* PROJECTION RESULTS & ATURAN BEI (Stack below) */}
        <div className="space-y-6">
          <div className="bg-app-bg/50 rounded-2xl border border-app-border p-5">
            <h3 className="text-xs font-bold text-app-text-bright uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Hasil Proyeksi Hari-ke-Hari {stockName ? `Saham ${stockName}` : ""}</span>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${direction === "ara" ? "bg-app-success/10 text-app-success border border-app-success/20" : "bg-app-danger/10 text-app-danger border border-app-danger/20"}`}>
                {direction.toUpperCase()} MODE
              </span>
            </h3>
            
            {simulationSteps.length === 0 ? (
              <p className="text-xs text-app-text/50 text-center py-8">
                Masukkan harga acuan yang valid untuk melihat simulasi.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b border-app-border text-app-text/50">
                      <th className="pb-3 font-bold">HARI</th>
                      <th className="pb-3 font-bold text-right">HARGA ACUAN</th>
                      <th className="pb-3 font-bold text-right">HARGA TARGET</th>
                      {parsedLots > 0 && (
                        <>
                          <th className="pb-3 font-bold text-right">LOT</th>
                          <th className="pb-3 font-bold text-right">TOTAL UANG TARGET</th>
                          <th className="pb-3 font-bold text-right">KUMULATIF +/-</th>
                        </>
                      )}
                      <th className="pb-3 font-bold text-right">FRAKSI</th>
                      <th className="pb-3 font-bold text-right">B.PERSEN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/30">
                    {simulationSteps.map((step) => {
                      const initialTotal = parsedPrice * parsedLots * 100;
                      const diffTotal = step.totalValue - initialTotal;
                      const pctTotal = initialTotal > 0 ? (diffTotal / initialTotal) * 100 : 0;
                      return (
                        <tr key={step.day} className="hover:bg-app-hover/35 transition-colors">
                          <td className="py-3 font-bold text-app-text-bright">Hari {step.day}</td>
                          <td className="py-3 text-right font-medium text-app-text/80">Rp {step.prevPrice.toLocaleString("id-ID")}</td>
                          <td className={`py-3 text-right font-bold text-sm ${direction === "ara" ? "text-app-success" : "text-app-danger"}`}>
                            Rp {step.price.toLocaleString("id-ID")}
                          </td>
                          {parsedLots > 0 && (
                            <>
                              <td className="py-3 text-right text-app-text/70">{parsedLots} lot</td>
                              <td className="py-3 text-right font-bold text-app-text-bright">
                                Rp {step.totalValue.toLocaleString("id-ID")}
                              </td>
                              <td className={`py-3 text-right font-semibold text-xs ${diffTotal >= 0 ? "text-app-success" : "text-app-danger"}`}>
                                {diffTotal >= 0 ? "+" : ""}Rp {diffTotal.toLocaleString("id-ID")}
                                <span className="block text-[10px] font-normal opacity-80">
                                  ({diffTotal >= 0 ? "+" : ""}{pctTotal.toFixed(2)}%)
                                </span>
                              </td>
                            </>
                          )}
                          <td className="py-3 text-right text-app-text/50">Rp {step.frac}</td>
                          <td className="py-3 text-right text-app-text/60">{direction === "ara" ? "+" : "-"}{step.pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rules Explanation */}
          <div className="bg-app-card rounded-2xl border border-app-border/40 p-4 text-[11px] text-app-text/60 space-y-3">
            <h4 className="font-bold text-app-text-bright">
              Aturan ARA & ARB Bursa Efek Indonesia (BEI):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="font-bold text-app-success">Batas Kenaikan (ARA):</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Harga Rp50 – Rp200: <span className="font-semibold text-app-text-bright">+35%</span></li>
                  <li>Harga &gt;Rp200 – Rp5.000: <span className="font-semibold text-app-text-bright">+25%</span></li>
                  <li>Harga &gt;Rp5.000: <span className="font-semibold text-app-text-bright">+20%</span></li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="font-bold text-app-danger">Batas Penurunan (ARB):</p>
                <p className="leading-normal">
                  Seragam <span className="font-semibold text-app-text-bright">-15%</span> untuk seluruh rentang harga saham.
                </p>
                <p className="leading-normal">
                  Pembulatan ke bawah (<span className="font-semibold text-app-text-bright">floor</span>) diterapkan pada kelipatan fraksi harga terdekat agar tidak melampaui persentase maksimal.
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-app-border/30">
              <span className="font-bold text-app-text-bright">Tabel Fraksi Harga:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1.5">
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border/20 text-center">
                  <p className="text-app-text/40 text-[9px] uppercase font-bold">Selalu &lt; 200</p>
                  <p className="font-bold text-app-text-bright">Rp 1</p>
                </div>
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border/20 text-center">
                  <p className="text-app-text/40 text-[9px] uppercase font-bold">200 - &lt; 500</p>
                  <p className="font-bold text-app-text-bright">Rp 2</p>
                </div>
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border/20 text-center">
                  <p className="text-app-text/40 text-[9px] uppercase font-bold">500 - &lt; 2.000</p>
                  <p className="font-bold text-app-text-bright">Rp 5</p>
                </div>
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border/20 text-center">
                  <p className="text-app-text/40 text-[9px] uppercase font-bold">2.000 - &lt; 5.000</p>
                  <p className="font-bold text-app-text-bright">Rp 10</p>
                </div>
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border/20 text-center col-span-2 sm:col-span-1">
                  <p className="text-app-text/40 text-[9px] uppercase font-bold">&ge; 5.000</p>
                  <p className="font-bold text-app-text-bright">Rp 25</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [portoTxType, setPortoTxType] = useState<"beli" | "jual">("beli");
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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [portoAccountId, setPortoAccountId] = useState("");
  const [hasFee, setHasFee] = useState(false);
  const [portoFee, setPortoFee] = useState("");
  const [portoSelectedId, setPortoSelectedId] = useState("");
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
  const [portfolioViewMode, setPortfolioViewMode] = useState<"daftar" | "alokasi">("daftar");
  const [allocationViewBy, setAllocationViewBy] = useState<"aset" | "kategori">("aset");

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
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const data = await res.json();
            setMarketData((prev: any) => ({
              ...prev,
              COMPOSITE: data.COMPOSITE || prev.COMPOSITE,
              USDIDR: data.USDIDR || prev.USDIDR
            }));
          } else {
            console.warn("Expected JSON from /api/quotes, but received:", contentType);
          }
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
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          setSearchResults(data);
        } else {
          throw new Error("API returned non-JSON response: " + contentType);
        }
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
    setPortoTxType("beli");
    setPortoCategory("saham");
    setPortoCode("");
    setPortoQty("");
    setPortoPrice("");
    setPortoDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setPortoAccountId(accounts[0]?.id || "");
    setHasFee(false);
    setPortoFee("");
    setPortoSelectedId("");
    setPortoEditId(null);
    setIsPortfolioModalOpen(true);
  };

  const handleEdit = (inv: any) => {
    setPortoTxType("beli");
    setPortoCategory(inv.category);
    setPortoCode(inv.code);
    setPortoQty(inv.qty.toString());
    setPortoPrice(inv.price.toString());
    setPortoDate(format(inv.createdAt, "yyyy-MM-dd'T'HH:mm"));
    setPortoAccountId(accounts[0]?.id || "");
    setHasFee(false);
    setPortoFee("");
    setPortoSelectedId(inv.id);
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
      const parsedDate = portoDate ? new Date(portoDate).getTime() : Date.now();

      if (portoEditId) {
        // Direct correction of an investment document
        const codeToSave = portoCategory === "emas" ? "EMAS" : portoCode.toUpperCase();
        const newQty = parseFloat(portoQty) || 0;
        const newPrice = parseNumberInput(portoPrice) || 0;

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
        toast.success("Penyesuaian investasi berhasil disimpan");
        setIsPortfolioModalOpen(false);
        return;
      }

      // "Buy & Sell" transaction-based flow
      if (portoTxType === "beli") {
        const codeToSave = portoCategory === "emas" ? "EMAS" : portoCode.toUpperCase();
        const qty = parseFloat(portoQty) || 0;
        const price = parseNumberInput(portoPrice) || 0;
        const fee = hasFee ? parseNumberInput(portoFee) || 0 : 0;

        if (qty <= 0 || price <= 0) {
          toast.error("Jumlah dan harga harus lebih besar dari 0");
          return;
        }

        if (!portoAccountId) {
          toast.error("Pilih rekening pembayaran");
          return;
        }

        const mult = portoCategory === "saham" ? 100 : 1;
        const totalCost = qty * price * mult + fee;

        const batch = writeBatch(db);

        // Deduct from account balance
        const accRef = doc(db, "users", user.uid, "accounts", portoAccountId);
        const accSnap = await getDoc(accRef);
        if (!accSnap.exists()) {
          toast.error("Rekening tidak ditemukan");
          return;
        }
        const currentBal = accSnap.data()?.balance || 0;
        batch.update(accRef, { balance: currentBal - totalCost });

        // Update / Add holding
        const existing = investments.find(
          (inv) => inv.category === portoCategory && inv.code === codeToSave
        );

        if (existing) {
          const totalQty = existing.qty + qty;
          const avgPrice = (existing.qty * existing.price + qty * price) / totalQty;
          const invRef = doc(db, "users", user.uid, "investments", existing.id);
          batch.update(invRef, {
            qty: totalQty,
            price: avgPrice,
            createdAt: parsedDate,
          });
        } else {
          const invRef = doc(collection(db, "users", user.uid, "investments"));
          batch.set(invRef, {
            category: portoCategory,
            code: codeToSave,
            qty: qty,
            price: price,
            createdAt: parsedDate,
          });
        }

        // Add transaction log
        const tsxRef = doc(collection(db, "users", user.uid, "transactions"));
        batch.set(tsxRef, {
          type: "expense",
          amount: totalCost,
          accountId: portoAccountId,
          date: parsedDate,
          note: `Beli ${portoCategory === "saham" ? "Saham" : portoCategory === "crypto" ? "Crypto" : "Emas"} - ${codeToSave} (${qty} ${portoCategory === "saham" ? "Lot" : portoCategory === "crypto" ? "Koin" : "Gram"})`,
          categoryId: "investment-buy",
          categoryName: "Beli Investasi",
          categoryIcon: "TrendingUp",
        });

        await batch.commit();

        sendDeviceNotification(
          "Pembelian Investasi Baru 📈",
          `Beli ${portoCategory === "saham" ? "Saham" : portoCategory === "crypto" ? "Crypto" : "Emas"} - ${codeToSave}\nNominal: Rp ${totalCost.toLocaleString("id-ID")}\nJumlah: ${qty} ${portoCategory === "saham" ? "Lot" : portoCategory === "crypto" ? "Koin" : "Gram"}`
        );

        toast.success("Pembelian investasi berhasil disimpan");
      } else {
        // Sell flow
        if (!portoSelectedId) {
          toast.error("Pilih instrumen investasi yang ingin dijual");
          return;
        }

        const existing = investments.find((inv) => inv.id === portoSelectedId);
        if (!existing) {
          toast.error("Instrumen investasi tidak ditemukan");
          return;
        }

        const qty = parseFloat(portoQty) || 0;
        const price = parseNumberInput(portoPrice) || 0;
        const fee = hasFee ? parseNumberInput(portoFee) || 0 : 0;

        if (qty <= 0 || price <= 0) {
          toast.error("Jumlah dan harga harus lebih besar dari 0");
          return;
        }

        if (qty > existing.qty) {
          toast.error(`Jumlah yang dijual (${qty}) melebihi kepemilikan Anda (${existing.qty})`);
          return;
        }

        if (!portoAccountId) {
          toast.error("Pilih rekening tujuan dana");
          return;
        }

        const mult = existing.category === "saham" ? 100 : 1;
        const totalEarnings = qty * price * mult - fee;

        const batch = writeBatch(db);

        // Add to account balance
        const accRef = doc(db, "users", user.uid, "accounts", portoAccountId);
        const accSnap = await getDoc(accRef);
        if (!accSnap.exists()) {
          toast.error("Rekening tidak ditemukan");
          return;
        }
        const currentBal = accSnap.data()?.balance || 0;
        batch.update(accRef, { balance: currentBal + totalEarnings });

        // Update/Delete holding
        const remainingQty = existing.qty - qty;
        const invRef = doc(db, "users", user.uid, "investments", existing.id);
        if (remainingQty <= 0) {
          batch.delete(invRef);
        } else {
          batch.update(invRef, {
            qty: remainingQty,
            createdAt: parsedDate,
          });
        }

        // Add transaction log
        const tsxRef = doc(collection(db, "users", user.uid, "transactions"));
        batch.set(tsxRef, {
          type: "income",
          amount: totalEarnings,
          accountId: portoAccountId,
          date: parsedDate,
          note: `Jual ${existing.category === "saham" ? "Saham" : existing.category === "crypto" ? "Crypto" : "Emas"} - ${existing.code} (${qty} ${existing.category === "saham" ? "Lot" : existing.category === "crypto" ? "Koin" : "Gram"})`,
          categoryId: "investment-sell",
          categoryName: "Jual Investasi",
          categoryIcon: "TrendingDown",
        });

        await batch.commit();

        sendDeviceNotification(
          "Penjualan Investasi Baru 📉",
          `Jual ${existing.category === "saham" ? "Saham" : existing.category === "crypto" ? "Crypto" : "Emas"} - ${existing.code}\nNominal: Rp ${totalEarnings.toLocaleString("id-ID")}\nJumlah: ${qty} ${existing.category === "saham" ? "Lot" : existing.category === "crypto" ? "Koin" : "Gram"}`
        );

        toast.success("Penjualan investasi berhasil disimpan");
      }

      setIsPortfolioModalOpen(false);
    } catch (err) {
      console.error("Error saving portfolio", err);
      toast.error("Gagal menyimpan transaksi investasi");
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

    const accUnsub = onSnapshot(
      collection(db, "users", user.uid, "accounts"),
      (snap) => {
        const accs: Account[] = [];
        snap.forEach((d) => accs.push({ id: d.id, ...d.data() } as Account));
        setAccounts(accs);
        if (accs.length > 0) {
          setPortoAccountId((prev) => prev || accs[0].id);
        }
      }
    );

    return () => {
      invUnsub();
      tsxUnsub();
      accUnsub();
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
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("API returned non-JSON response: " + contentType);
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

  const ownedStocks = useMemo(() => {
    return investments.filter((inv) => inv.category === "saham");
  }, [investments]);

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1">
              <TextReveal text="Investasi Anda" />
            </h1>
            <p className="text-app-text/70 text-sm">
              Berikut ringkasan performa investasi Anda.
            </p>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="px-3 h-10 rounded-full bg-app-card border border-app-border hover:bg-app-hover flex items-center justify-center text-app-text-bright transition-colors shadow-sm font-bold"
              title="Simulasi ARA/ARB"
            >
              <TrendingUp className="w-4 h-4 text-app-accent1" />
            </button>
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
            onClick={() => setIsSimulatorOpen(true)}
            className="px-4 h-10 rounded-full bg-app-card border border-app-border hover:bg-app-hover flex items-center justify-center text-app-text-bright transition-colors shadow-sm font-bold text-sm gap-2"
            title="Simulasi ARA/ARB"
          >
            <TrendingUp className="w-4 h-4 text-app-accent1" />
            Simulasi ARA/ARB
          </button>
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
      {/* WIDGETS (STACK ON MOBILE, GRID ON DESKTOP) */}
      <div className="flex flex-col gap-4 mb-6 md:grid md:grid-cols-3 md:gap-6 md:mb-8">
        {/* TOTAL INVESTASI */}
        <div className="bg-app-card rounded-2xl p-6 border border-app-border flex items-center justify-between shadow-sm relative overflow-hidden cursor-pointer">
          <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${incomeToday >= 0 ? "from-app-success/15" : "from-app-danger/5"} via-transparent to-transparent pointer-events-none opacity-80 block`} />
          <div className="flex items-center gap-4 relative z-10 w-full">
            <div className={`w-12 h-12 shrink-0 rounded-xl flex items-center justify-center ${incomeToday >= 0 ? "bg-app-success/10" : "bg-app-danger/10"}`}>
              <BarChart3 className={`w-6 h-6 ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-app-text/70 text-xs font-medium uppercase tracking-wider mb-1">
                Total Investasi
              </p>
              <p className="text-xl font-bold text-app-text-bright break-words leading-tight">
                Rp {totalBalance.toLocaleString("id-ID")}
              </p>
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`}>
                {incomeToday >= 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 shrink-0" /> <span className="truncate">Berjalan baik</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 shrink-0" /> <span className="truncate">Sedang menurun</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 shrink-0 text-app-text/40 relative z-10 ml-2" />
        </div>

        {/* RETURN */}
        <div className="bg-app-card rounded-2xl border border-app-border flex shadow-sm overflow-hidden relative cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex-1 p-4 border-r border-app-border flex flex-col justify-center relative z-10 min-w-0">
             <p className="text-app-text/70 text-[10px] font-bold uppercase tracking-wider mb-1">Modal Awal</p>
             <p className="text-lg font-bold text-app-text-bright break-words leading-tight">Rp {expenseToday.toLocaleString("id-ID")}</p>
          </div>
          <div className="flex-1 p-4 flex flex-col justify-center relative z-10 min-w-0">
             <p className="text-app-text/70 text-[10px] font-bold uppercase tracking-wider mb-1">Sekarang</p>
             <p className={`text-lg font-bold ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"} break-words leading-tight`}>
               Rp {totalBalance.toLocaleString("id-ID")}
             </p>
             <div className={`text-[10px] font-medium mt-1 ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"} leading-tight`}>
                {incomeToday >= 0 ? "+" : ""}Rp {incomeToday.toLocaleString("id-ID")} <br className="md:hidden" />({incomeToday >= 0 ? "+" : ""}{expenseToday > 0 ? ((incomeToday / expenseToday) * 100).toFixed(2) : 0}%)
             </div>
          </div>
        </div>

        {/* PASAR: IHSG & KURS RUPIAH */}
        <div className="bg-app-card rounded-2xl border border-app-border flex shadow-sm overflow-hidden relative cursor-pointer">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="flex-1 p-4 border-r border-app-border hover:bg-app-hover transition-colors cursor-pointer flex flex-col justify-center relative z-10 min-w-0">
             <div className="flex justify-between items-start mb-1">
               <p className="text-app-text/70 text-[10px] font-bold uppercase tracking-wider">IHSG</p>
               {marketData.COMPOSITE?.change >= 0 ? (
                 <TrendingUp className="w-4 h-4 shrink-0 text-app-success" />
               ) : (
                 <TrendingDown className="w-4 h-4 shrink-0 text-app-danger" />
               )}
             </div>
             <p className="text-lg font-bold text-app-text-bright break-words leading-tight">
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
            className="flex-1 p-4 hover:bg-app-hover transition-colors cursor-pointer flex flex-col justify-center relative z-10 min-w-0"
          >
             <div className="flex justify-between items-start mb-1">
               <p className="text-app-text/70 text-[10px] font-bold uppercase tracking-wider">USD/IDR</p>
               {marketData.USDIDR?.change >= 0 ? (
                 <TrendingUp className="w-4 h-4 shrink-0 text-app-danger" />
               ) : (
                 <TrendingDown className="w-4 h-4 shrink-0 text-app-success" />
               )}
             </div>
             <p className="text-lg font-bold text-app-text-bright break-words leading-tight">
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
                <defs>
                  <linearGradient id={`colorValue-${chartPeriod}`} x1="0" y1="0" x2="1" y2="0">
                    {chartData.length <= 1 ? (
                      <stop offset="100%" stopColor="var(--color-app-success)" />
                    ) : (
                      chartData.flatMap((d, i) => {
                        if (i === 0) return [<stop key="stop-start" offset="0%" stopColor="var(--color-app-success)" />];
                        const prevOffset = `${((i - 1) / (chartData.length - 1)) * 100}%`;
                        const currentOffset = `${(i / (chartData.length - 1)) * 100}%`;
                        const isDown = (d?.value ?? 0) < (chartData[i - 1]?.value ?? 0);
                        const color = isDown ? "var(--color-app-danger)" : "var(--color-app-success)";
                        return [
                          <stop key={`stop-${i}-prev`} offset={prevOffset} stopColor={color} />,
                          <stop key={`stop-${i}-curr`} offset={currentOffset} stopColor={color} />
                        ];
                      })
                    )}
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
                  stroke={`url(#colorValue-${chartPeriod})`}
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, index, payload } = props;
                    if (!payload) return null;
                    const prevPayload = index > 0 ? chartData[index - 1] : payload;
                    const isDown = payload.value < (prevPayload?.value ?? payload.value);
                    const color = isDown ? "var(--color-app-danger)" : "var(--color-app-success)";
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={3}
                        fill={color}
                        stroke="none"
                        key={`dot-${index}`}
                      />
                    );
                  }}
                  activeDot={(props: any) => {
                    const { cx, cy, index, payload } = props;
                    if (!payload) return null;
                    const prevPayload = index > 0 ? chartData[index - 1] : payload;
                    const isDown = payload.value < (prevPayload?.value ?? payload.value);
                    const color = isDown ? "var(--color-app-danger)" : "var(--color-app-success)";
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={color}
                        stroke="none"
                        key={`active-dot-${index}`}
                      />
                    );
                  }}
                />
                <Line
                  type="monotone"
                  name="Modal Awal"
                  dataKey="modal"
                  stroke="#ffffff"
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
                <button
                  onClick={() => setPortfolioViewMode("daftar")}
                  className={`p-1.5 rounded-lg transition-all ${
                    portfolioViewMode === "daftar"
                      ? "bg-app-card text-app-accent1 shadow-sm border border-app-border/50"
                      : "text-app-text/60 hover:text-app-text-bright border border-transparent"
                  }`}
                  title="Tampilan Daftar"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPortfolioViewMode("alokasi")}
                  className={`p-1.5 rounded-lg transition-all ${
                    portfolioViewMode === "alokasi"
                      ? "bg-app-card text-app-accent1 shadow-sm border border-app-border/50"
                      : "text-app-text/60 hover:text-app-text-bright border border-transparent"
                  }`}
                  title="Tampilan Alokasi"
                >
                  <PieChartIcon className="w-4 h-4" />
                </button>
              </div>

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
          {portfolioViewMode === "alokasi" ? (
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col">
              <div className="flex bg-app-card border border-app-border rounded-lg p-1 mb-2 shrink-0 mx-1">
                <button
                  onClick={() => setAllocationViewBy("aset")}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-colors ${
                    allocationViewBy === "aset"
                      ? "bg-app-bg text-app-text-bright shadow-sm"
                      : "text-app-text/50 hover:text-app-text"
                  }`}
                >
                  Semua Aset
                </button>
                <button
                  onClick={() => setAllocationViewBy("kategori")}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-colors ${
                    allocationViewBy === "kategori"
                      ? "bg-app-bg text-app-text-bright shadow-sm"
                      : "text-app-text/50 hover:text-app-text"
                  }`}
                >
                  Kategori
                </button>
              </div>
              {(() => {
                let allocationData: any[] = [];
                if (allocationViewBy === "aset") {
                  allocationData = filteredAndSortedInvestments
                    .map((inv) => {
                      const symbolCode = inv.category === "emas" ? "EMAS" : inv.code;
                      const livePrice = getLivePrice(inv);
                      const value = (inv.category === "saham" ? 100 : 1) * inv.qty * livePrice;
                      return {
                        id: inv.id,
                        name: inv.code,
                        category: inv.category,
                        value: value,
                        qty: inv.qty,
                        logoid: quotes[symbolCode]?.logoid,
                        description: quotes[symbolCode]?.description,
                      };
                    })
                    .sort((a, b) => b.value - a.value);
                } else {
                  const aggregated = filteredAndSortedInvestments.reduce((acc, inv) => {
                    const livePrice = getLivePrice(inv);
                    const value = (inv.category === "saham" ? 100 : 1) * inv.qty * livePrice;
                    if (!acc[inv.category]) {
                      acc[inv.category] = {
                        id: inv.category,
                        name: inv.category.charAt(0).toUpperCase() + inv.category.slice(1),
                        category: inv.category,
                        value: 0,
                        qty: 0,
                        logoid: "",
                        description: `Alokasi Kategori ${inv.category}`,
                      };
                    }
                    acc[inv.category].value += value;
                    acc[inv.category].qty += inv.qty;
                    return acc;
                  }, {} as Record<string, any>);
                  allocationData = Object.values(aggregated).sort((a, b) => b.value - a.value);
                }

                const totalAllocValue = allocationData.reduce((sum, item) => sum + item.value, 0);
                const COLORS = [
                  "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", 
                  "#14B8A6", "#6366f1", "#EC4899", "#f97316"
                ];

                if (totalAllocValue === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center text-app-text/50 text-sm py-8 bg-app-card/30 border border-dashed border-app-border rounded-2xl h-full mt-4 mx-1">
                      <TrendingUp className="w-8 h-8 text-app-text/30 mb-2 animate-waggle" />
                      Belum ada instrumen investasi
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex justify-center items-center h-[240px] relative mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={105}
                            stroke="none"
                            paddingAngle={3}
                            dataKey="value"
                            isAnimationActive={true}
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--color-app-card)",
                              border: "1px solid var(--color-app-border)",
                              borderRadius: "16px",
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                              padding: "12px",
                            }}
                            itemStyle={{
                              fontSize: 14,
                              fontWeight: "bold",
                              color: "var(--color-app-text-bright)",
                            }}
                            formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Nilai"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold text-app-text-bright">Rp {totalAllocValue.toLocaleString("id-ID")}</span>
                        <span className="text-xs text-app-text/60 mt-1">{allocationData.length} {allocationViewBy === "aset" ? "Aset" : "Kategori"}</span>
                      </div>
                    </div>

                    <div className="space-y-5 px-1 pb-4">
                      {allocationData.map((item, index) => {
                        const percentage = totalAllocValue > 0 ? ((item.value / totalAllocValue) * 100) : 0;
                        const color = COLORS[index % COLORS.length];

                        return (
                          <div key={item.id} className="flex flex-col gap-3 group">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-app-card border border-app-border flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                  <AssetLogo logoid={item.logoid} code={item.name} description={item.description} />
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-sm text-app-text-bright">{item.name}</span>
                                    <span className="text-xs text-app-text/60 font-medium">Rp {item.value.toLocaleString("id-ID")}</span>
                                  </div>
                                </div>
                              </div>
                              <span className="font-bold text-[15px] text-app-text-bright">{percentage.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-app-border/30 rounded-full overflow-hidden relative">
                              <div 
                                className="h-full rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${percentage}%`, backgroundColor: color }}
                              >
                                <div className="absolute inset-0 bg-white/20 w-full h-full mix-blend-overlay"></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <StaggerContainer className="space-y-4 flex-1 overflow-y-auto pr-2">
              {filteredAndSortedInvestments.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-app-text/50 text-sm py-8 bg-app-card/30 border border-dashed border-app-border rounded-2xl">
                  <TrendingUp className="w-8 h-8 text-app-text/30 mb-2 animate-waggle" />
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
                    <StaggerItem key={inv.id}>
                      <div
                        className={`flex flex-col p-4 rounded-2xl border ${colorClass} gap-3 relative overflow-hidden`}
                      >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {/* LOGO */}
                          <div className="w-10 h-10 rounded-full bg-app-card border border-app-border flex items-center justify-center shrink-0 overflow-hidden">
                            <AssetLogo logoid={liveData?.logoid} code={inv.code} description={liveData?.description} />
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

                      <div className="flex flex-col gap-2 mt-4">
                         <div className="flex justify-between items-center">
                           <span className="text-xs text-app-text/60">Volume</span>
                           <span className="text-xs font-medium text-app-text-bright">{inv.qty} {inv.category === "emas" ? "g" : inv.category === "crypto" ? "koin" : "lot"}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-xs text-app-text/60">Harga Beli</span>
                           <span className="text-xs font-medium text-app-text-bright">Rp {inv.price.toLocaleString("id-ID")} {inv.category === "saham" && "/lembar"}</span>
                         </div>
                         <div className="flex justify-between items-center">
                           <span className="text-xs text-app-text/60">Harga Sekarang</span>
                           <span className="text-xs font-medium text-app-text-bright">Rp {livePrice.toLocaleString("id-ID")} {inv.category === "saham" && "/lembar"}</span>
                         </div>
                         {liveData?.price && (
                           <div className="flex justify-between items-center">
                             <span className="text-xs text-app-text/60">Return</span>
                             <span className={`text-xs font-bold ${pl >= 0 ? "text-app-success" : "text-app-danger"}`}>
                               {pl >= 0 ? "+" : ""}Rp {(inv.qty * pl * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")} ({pl >= 0 ? "+" : ""}{plPercent.toFixed(2)}%)
                             </span>
                           </div>
                         )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-app-border/30 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-app-text/60 font-bold uppercase tracking-wider mb-1">Modal Awal</div>
                          <div className="text-sm font-bold text-app-text-bright">Rp {(inv.price * inv.qty * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-app-text/60 font-bold uppercase tracking-wider mb-1">Nilai Sekarang</div>
                          <div className={`text-sm font-bold ${pl >= 0 ? "text-app-success" : "text-app-danger"}`}>Rp {(livePrice * inv.qty * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")}</div>
                        </div>
                      </div>
                      </div>
                    </StaggerItem>
                  );
                })
              )}
            </StaggerContainer>
          )}
          <button
            onClick={openPortfolioModal}
            className="mt-4 flex items-center justify-center p-4 rounded-2xl border border-dashed border-app-border hover:border-app-text/50 transition cursor-pointer text-app-text/70 text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Portofolio
          </button>
        </div>
      </div>

      {/* Modal Simulasi ARA/ARB */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-app-card text-app-text w-full max-w-5xl rounded-3xl shadow-2xl border border-app-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg shrink-0">
              <h2 className="text-lg font-bold text-app-text-bright flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-app-accent1" />
                Simulasi ARA & ARB Saham (BEI)
              </h2>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="p-2 hover:bg-app-hover rounded-full transition-colors text-app-text/70 hover:text-app-text-bright"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <AraArbSimulator ownedStocks={ownedStocks} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Portofolio */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-app-card text-app-text w-full max-w-md rounded-3xl shadow-2xl border border-app-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h2 className="text-lg font-semibold text-app-text-bright">
                {portoEditId ? "Sesuaikan Portofolio" : portoTxType === "beli" ? "Beli Investasi" : "Jual Investasi"}
              </h2>
              <button
                onClick={() => setIsPortfolioModalOpen(false)}
                className="p-2 hover:bg-app-hover rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={savePortfolio} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Beli / Jual Tabs (Only when not editing directly) */}
              {!portoEditId && (
                <div className="flex bg-app-bg p-1 rounded-xl border border-app-border gap-1 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPortoTxType("beli");
                      setPortoCategory("saham");
                      setPortoCode("");
                      setPortoQty("");
                      setPortoPrice("");
                      setHasFee(false);
                      setPortoFee("");
                      setPortoSelectedId("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      portoTxType === "beli"
                        ? "bg-app-accent1 text-app-bg shadow-sm"
                        : "text-app-text hover:bg-app-hover"
                    }`}
                  >
                    Beli
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPortoTxType("jual");
                      const activeInvs = investments.filter(inv => inv.qty > 0);
                      if (activeInvs.length > 0) {
                        setPortoSelectedId(activeInvs[0].id);
                        setPortoCategory(activeInvs[0].category);
                        setPortoCode(activeInvs[0].code);
                      } else {
                        setPortoSelectedId("");
                      }
                      setPortoQty("");
                      setPortoPrice("");
                      setHasFee(false);
                      setPortoFee("");
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      portoTxType === "jual"
                        ? "bg-app-accent1 text-app-bg shadow-sm"
                        : "text-app-text hover:bg-app-hover"
                    }`}
                  >
                    Jual
                  </button>
                </div>
              )}

              {/* Beli Flow Inputs */}
              {(portoTxType === "beli" || portoEditId) && (
                <>
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
                        disabled={!!portoEditId}
                        onClick={() => setPortoCategory(type.id as any)}
                        className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 ${
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
                          disabled={!!portoEditId}
                          onChange={(e) => {
                            setPortoCode(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() =>
                            setTimeout(() => setShowDropdown(false), 200)
                          }
                          className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright disabled:opacity-60"
                          placeholder="Contoh: BBCA"
                          required
                        />
                        {showDropdown && portoCode.length >= 2 && !portoEditId && (
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
                            {portoEditId ? "Harga Beli Rata-Rata" : "Harga per Lembar (Rp)"}
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
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
                          disabled={!!portoEditId}
                          onChange={(e) => {
                            setPortoCode(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          onBlur={() =>
                            setTimeout(() => setShowDropdown(false), 200)
                          }
                          className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright disabled:opacity-60"
                          placeholder="Contoh: BTC"
                          required
                        />
                        {showDropdown && portoCode.length >= 2 && !portoEditId && (
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
                            Harga Beli per Koin (Rp)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
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
                            Harga per Gram (Rp)
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
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
                </>
              )}

              {/* Jual Flow Inputs */}
              {portoTxType === "jual" && !portoEditId && (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                      Pilih Portofolio
                    </label>
                    <select
                      value={portoSelectedId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setPortoSelectedId(id);
                        const found = investments.find(inv => inv.id === id);
                        if (found) {
                          setPortoCategory(found.category);
                          setPortoCode(found.code);
                        }
                      }}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                      required
                    >
                      <option value="" disabled>-- Pilih Portofolio Anda --</option>
                      {investments.filter(inv => inv.qty > 0).map(inv => (
                        <option key={inv.id} value={inv.id}>
                          {inv.code} ({inv.category === "saham" ? "Saham IDX" : inv.category === "crypto" ? "Crypto" : "Emas"}) - Dimiliki: {inv.qty} {inv.category === "saham" ? "Lot" : inv.category === "crypto" ? "Koin" : "Gram"}
                        </option>
                      ))}
                    </select>
                    {portoSelectedId && (() => {
                      const found = investments.find(inv => inv.id === portoSelectedId);
                      if (!found) return null;
                      return (
                        <div className="mt-2 text-xs text-app-text/60 bg-app-bg p-3 rounded-xl border border-app-border/40">
                          Kepemilikan: <span className="font-bold text-app-text-bright">{found.qty} {found.category === "saham" ? "Lot" : found.category === "crypto" ? "Koin" : "Gram"}</span> dengan rata-rata beli <span className="font-bold text-app-text-bright">Rp {found.price.toLocaleString("id-ID")}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                        Jumlah Dijual
                      </label>
                      <input
                        type="number"
                        step={portoCategory === "saham" ? "1" : portoCategory === "crypto" ? "0.000001" : "0.01"}
                        value={portoQty}
                        onChange={(e) => setPortoQty(e.target.value)}
                        className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                        Harga Jual per {portoCategory === "saham" ? "Lembar" : portoCategory === "crypto" ? "Koin" : "Gram"} (Rp)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
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

              {/* Accounts & Fees (Only when creating a new transaction, not when editing directly) */}
              {!portoEditId && (
                <>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                      {portoTxType === "beli" ? "Bayar dari Rekening" : "Terima di Rekening"}
                    </label>
                    <select
                      value={portoAccountId}
                      onChange={(e) => setPortoAccountId(e.target.value)}
                      className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright font-medium"
                      required
                    >
                      <option value="" disabled>-- Pilih Rekening --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (Saldo: Rp {acc.balance.toLocaleString("id-ID")})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-app-text/70">Ada Biaya Transaksi (Fee)?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setHasFee(!hasFee);
                          setPortoFee("");
                        }}
                        className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-1 ${
                          hasFee ? "bg-app-accent1" : "bg-app-border"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-app-card rounded-full shadow-md transition-transform ${
                            hasFee ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                    {hasFee && (
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">
                          Nominal Fee (Rp)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={portoFee}
                          onChange={(e) => setPortoFee(formatNumberInput(e.target.value))}
                          className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright"
                          placeholder="Rp 0"
                          required
                        />
                      </div>
                    )}
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
                  {portoEditId ? "Simpan Perubahan" : portoTxType === "beli" ? "Simpan Pembelian" : "Simpan Penjualan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
