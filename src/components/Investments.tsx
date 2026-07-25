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
  Briefcase,
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
  Info,
  Sparkles,
  ShieldCheck,
  Target,
  Zap,
  Award,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Layers,
  Bot,
  ArrowUpRight,
  BrainCircuit,
  Check,
  Clock,
  ShieldAlert,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
import { id as localeId, enUS as localeEn } from "date-fns/locale";
import { useTranslation } from "../utils/translations";
import { formatNumberInput, parseNumberInput } from "../utils/numberFormat";
import { toast } from "react-hot-toast";
import { motion } from "motion/react";
import { HoverCard, ScrollReveal, StaggerContainer, StaggerItem, TextReveal } from "./MotionWrappers";
import { PageShell, ActionBtn, EmptyState, FieldLabel } from "./PageShell";

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
    <div className="w-full h-full flex items-center justify-center bg-app-accent1/15 text-app-accent1 font-semibold text-xs tracking-wider uppercase">
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
    <div className="bg-app-card rounded-[20px] p-6 border border-app-border/60 flex flex-col shadow-lg shadow-black/10 relative overflow-hidden">
      
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 relative z-10">
        <div>
          <h2 className="text-app-text-bright font-semibold flex items-center gap-2 text-lg">
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
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all flex items-center gap-1.5 ${
              direction === "ara"
                ? "bg-app-success text-white shadow-sm font-semibold"
                : "text-app-text/60 hover:text-app-text-bright font-semibold"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> ARA
          </button>
          <button
            type="button"
            onClick={() => setDirection("arb")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all flex items-center gap-1.5 ${
              direction === "arb"
                ? "bg-app-danger text-white shadow-sm font-semibold"
                : "text-app-text/60 hover:text-app-text-bright font-semibold"
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> ARB
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 relative z-10">
        {/* INPUTS CONTAINER (Full Width, beautifully aligned) */}
        <div className="bg-app-bg/40 p-5 rounded-2xl border border-app-border space-y-5">
          {/* Section 1: Quick Select */}
          <div>
            <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block text-app-text/70">
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
                  <span className="font-semibold text-app-accent1">{stock.code}</span>
                  <span className="text-app-text/60">Rp {stock.price.toLocaleString("id-ID")}</span>
                  {stock.qty && <span className="px-1 py-0.5 rounded bg-app-bg text-[9px] text-app-accent2">{stock.qty} Lot</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Main inputs in a clean responsive grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block text-app-text/70">
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
              <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block text-app-text/70">
                Harga Sebelumnya (Rp)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={priceInput}
                onChange={(e) => setPriceInput(formatNumberInput(e.target.value))}
                placeholder="Harga acuan..."
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm focus:border-app-accent1 outline-none text-app-text-bright font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block text-app-text/70">
                Jumlah Lot
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={lotInput}
                onChange={(e) => setLotInput(formatNumberInput(e.target.value))}
                placeholder="Jumlah lot..."
                className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-2.5 text-sm focus:border-app-accent1 outline-none text-app-text-bright font-semibold"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block text-app-text/70 flex justify-between">
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
                  className="w-16 text-center bg-app-bg border border-app-border rounded-lg py-1.5 text-xs text-app-text-bright font-semibold focus:border-app-accent1 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Summary details */}
          {parsedPrice > 0 && parsedLots > 0 && (
            <div className="bg-app-bg/50 p-4 rounded-xl border border-app-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div>
                <span className="text-app-text/50">Total Uang Awal:</span>
                <span className="font-semibold text-app-text-bright ml-2 text-sm">
                  Rp {(parsedPrice * parsedLots * 100).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="text-app-text/50">
                Konversi Shares: <span className="font-semibold text-app-text-bright">{parsedLots} lot</span> ({ (parsedLots * 100).toLocaleString("id-ID") } lembar saham)
              </div>
            </div>
          )}
        </div>

        {/* PROJECTION RESULTS & ATURAN BEI (Stack below) */}
        <div className="space-y-6">
          <div className="bg-app-bg/50 rounded-2xl border border-app-border p-5">
            <h3 className="text-xs font-semibold text-app-text-bright uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Hasil Proyeksi Hari-ke-Hari {stockName ? `Saham ${stockName}` : ""}</span>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${direction === "ara" ? "bg-app-success/10 text-app-success border border-app-success/20" : "bg-app-danger/10 text-app-danger border border-app-danger/20"}`}>
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
                      <th className="pb-3 font-semibold">HARI</th>
                      <th className="pb-3 font-semibold text-right">HARGA ACUAN</th>
                      <th className="pb-3 font-semibold text-right">HARGA TARGET</th>
                      {parsedLots > 0 && (
                        <>
                          <th className="pb-3 font-semibold text-right">LOT</th>
                          <th className="pb-3 font-semibold text-right">TOTAL UANG TARGET</th>
                          <th className="pb-3 font-semibold text-right">KUMULATIF +/-</th>
                        </>
                      )}
                      <th className="pb-3 font-semibold text-right">FRAKSI</th>
                      <th className="pb-3 font-semibold text-right">B.PERSEN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/30">
                    {simulationSteps.map((step) => {
                      const initialTotal = parsedPrice * parsedLots * 100;
                      const diffTotal = step.totalValue - initialTotal;
                      const pctTotal = initialTotal > 0 ? (diffTotal / initialTotal) * 100 : 0;
                      return (
                        <tr key={step.day} className="hover:bg-app-hover/35 transition-colors">
                          <td className="py-3 font-semibold text-app-text-bright">Hari {step.day}</td>
                          <td className="py-3 text-right font-medium text-app-text/80">Rp {step.prevPrice.toLocaleString("id-ID")}</td>
                          <td className={`py-3 text-right font-semibold text-sm ${direction === "ara" ? "text-app-success" : "text-app-danger"}`}>
                            Rp {step.price.toLocaleString("id-ID")}
                          </td>
                          {parsedLots > 0 && (
                            <>
                              <td className="py-3 text-right text-app-text/70">{parsedLots} lot</td>
                              <td className="py-3 text-right font-semibold text-app-text-bright">
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
          <div className="bg-app-card rounded-[20px] border border-app-border/60 p-4 sm:p-5 text-xs text-app-text/70 space-y-3 shadow-lg shadow-black/5">
            <h4 className="font-semibold text-app-text-bright">
              Aturan ARA & ARB Bursa Efek Indonesia (BEI):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <p className="font-semibold text-app-success">Batas Kenaikan (ARA):</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Harga Rp50 - Rp200: <span className="font-semibold text-app-text-bright">+35%</span></li>
                  <li>Harga &gt;Rp200 - Rp5.000: <span className="font-semibold text-app-text-bright">+25%</span></li>
                  <li>Harga &gt;Rp5.000: <span className="font-semibold text-app-text-bright">+20%</span></li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <p className="font-semibold text-app-danger">Batas Penurunan (ARB):</p>
                <p className="leading-normal">
                  Seragam <span className="font-semibold text-app-text-bright">-15%</span> untuk seluruh rentang harga saham.
                </p>
                <p className="leading-normal">
                  Pembulatan ke bawah (<span className="font-semibold text-app-text-bright">floor</span>) diterapkan pada kelipatan fraksi harga terdekat agar tidak melampaui persentase maksimal.
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t border-app-border">
              <span className="font-semibold text-app-text-bright">Tabel Fraksi Harga:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1.5">
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border text-center">
                  <p className="text-app-text/50 text-[9px] uppercase font-semibold">Selalu &lt; 200</p>
                  <p className="font-semibold text-app-text-bright">Rp 1</p>
                </div>
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border text-center">
                  <p className="text-app-text/50 text-[9px] uppercase font-semibold">200 - &lt; 500</p>
                  <p className="font-semibold text-app-text-bright">Rp 2</p>
                </div>
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border text-center">
                  <p className="text-app-text/50 text-[9px] uppercase font-semibold">500 - &lt; 2.000</p>
                  <p className="font-semibold text-app-text-bright">Rp 5</p>
                </div>
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border text-center">
                  <p className="text-app-text/50 text-[9px] uppercase font-semibold">2.000 - &lt; 5.000</p>
                  <p className="font-semibold text-app-text-bright">Rp 10</p>
                </div>
                <div className="bg-app-bg/40 p-1.5 rounded border border-app-border text-center col-span-2 sm:col-span-1">
                  <p className="text-app-text/50 text-[9px] uppercase font-semibold">&ge; 5.000</p>
                  <p className="font-semibold text-app-text-bright">Rp 25</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Smart parser to extract investment data from transaction notes
export function parseInvestmentFromTransaction(tx: any) {
  const note = (tx.note || "").trim();
  const categoryId = tx.categoryId || "";
  
  // Try strict format first (the one generated by Investments.tsx)
  // e.g. "Beli Saham - BBCA (10 Lot)"
  const strictBuyRegex = /Beli\s+(Saham|Crypto|Emas)\s+-\s+([A-Z0-9]+)\s+\(([\d.]+)\s+(Lot|Koin|Gram)\)/i;
  const strictSellRegex = /Jual\s+(Saham|Crypto|Emas)\s+-\s+([A-Z0-9]+)\s+\(([\d.]+)\s+(Lot|Koin|Gram)\)/i;
  
  let match = note.match(strictBuyRegex);
  if (match) {
    const category = match[1].toLowerCase() as "saham" | "crypto" | "emas";
    const code = match[2].toUpperCase();
    const qty = parseFloat(match[3]);
    const type = "buy";
    return { category, code, qty, type, date: tx.date, amount: tx.amount };
  }
  
  match = note.match(strictSellRegex);
  if (match) {
    const category = match[1].toLowerCase() as "saham" | "crypto" | "emas";
    const code = match[2].toUpperCase();
    const qty = parseFloat(match[3]);
    const type = "sell";
    return { category, code, qty, type, date: tx.date, amount: tx.amount };
  }

  // Loose parser for manual logs or general transaction page
  // If categoryId is "investment-buy" or note contains indicators
  const isBuy = categoryId === "investment-buy" || /beli|buy/i.test(note);
  const isSell = categoryId === "investment-sell" || /jual|sell/i.test(note);
  
  if (isBuy || isSell) {
    let category: "saham" | "crypto" | "emas" = "saham";
    if (/crypto|btc|eth|sol|bnb|doge|usdt/i.test(note)) category = "crypto";
    else if (/emas|gold|antam/i.test(note)) category = "emas";
    else if (/saham|idx|bbca|bbri|bmri|tlkm/i.test(note)) category = "saham";
    else if (categoryId === "investment-buy" || categoryId === "investment-sell") {
      category = "saham";
    } else {
      return null; // Not an investment transaction
    }

    // Extract ticker code (uppercase word of 3-7 characters, or EMAS)
    let code = "EMAS";
    if (category === "emas") {
      code = "EMAS";
    } else {
      // Find uppercase ticker like BBCA, BTCUSDT, etc.
      const tickerMatch = note.match(/\b([A-Z]{3,8})\b/);
      if (tickerMatch) {
        code = tickerMatch[1];
      } else {
        // Look for any word that could be a code
        const wordMatch = note.match(/\b([A-Za-z0-9]{3,7})\b/);
        code = wordMatch ? wordMatch[1].toUpperCase() : "UNKNOWN";
      }
    }

    // Extract quantity (decimal or integer number)
    let qty = 1;
    const qtyMatch = note.match(/([\d.]+)\s*(lot|koin|coin|gram|g|pcs|btc|eth|sol|bnb|usd)?/i);
    if (qtyMatch) {
      qty = parseFloat(qtyMatch[1]);
    }

    return {
      category,
      code,
      qty,
      type: isBuy ? "buy" : "sell",
      date: tx.date,
      amount: tx.amount
    };
  }
  
  return null;
}

export default function Investments() {
  const { t, language } = useTranslation();
  const currentLocale = language === "en" ? localeEn : localeId;
  const user = useStore((state) => state.user);
  const { themeId } = useStore();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "holding" | "ai_insights">("dashboard");
  const [heroChartView, setHeroChartView] = useState<"equity" | "return">("equity");
  const [investStyle, setInvestStyle] = useState<"dividend" | "growth" | "value" | "swing" | "moderate" | "conservative">("growth");
  const [aiInsightsData, setAiInsightsData] = useState<any>(null);
  const [isAiInsightsLoading, setIsAiInsightsLoading] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState<"1W" | "1M" | "3M" | "YTD" | "1Y" | "All">("1M");
  const [equityReturnViewMode, setEquityReturnViewMode] = useState<"daily" | "monthly">("daily");
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
  const [portfolioViewMode, setPortfolioViewMode] = useState<"daftar" | "audit" | "alokasi">("daftar");
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
    setPortoAccountId(localStorage.getItem('lastAccountId_investasi') || accounts[0]?.id || "");
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
    setPortoAccountId(localStorage.getItem('lastAccountId_investasi') || accounts[0]?.id || "");
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
    );
    const tsxUnsub = onSnapshot(q, (snap) => {
      const tsx: Transaction[] = [];
      snap.forEach((d) => tsx.push({ id: d.id, ...d.data() } as unknown as Transaction));
      setAllTransactions(tsx);
      setRecentTransactions(tsx.slice(0, 5));
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

  // Memoized audited holdings based on transaction history
  const auditedHoldings = useMemo(() => {
    const holdings: Record<string, {
      category: "saham" | "crypto" | "emas";
      code: string;
      qty: number;
      avgBuyPrice: number;
      realizedPL: number;
      wins: number;
      losses: number;
      totalBuyAmount: number;
      totalBuyQty: number;
      totalSellAmount: number;
      totalSellQty: number;
      transactionsCount: number;
      earliestTxDate: number;
    }> = {};

    // Sort transactions chronologically (oldest first) to accurately simulate ledger
    const chronologicalTx = [...allTransactions]
      .filter((tx) => !!tx.date)
      .sort((a, b) => (a.date || 0) - (b.date || 0));

    chronologicalTx.forEach((tx) => {
      const parsed = parseInvestmentFromTransaction(tx);
      if (!parsed) return;

      const key = `${parsed.category}-${parsed.code}`;
      const mult = parsed.category === "saham" ? 100 : 1;

      if (!holdings[key]) {
        holdings[key] = {
          category: parsed.category,
          code: parsed.code,
          qty: 0,
          avgBuyPrice: 0,
          realizedPL: 0,
          wins: 0,
          losses: 0,
          totalBuyAmount: 0,
          totalBuyQty: 0,
          totalSellAmount: 0,
          totalSellQty: 0,
          transactionsCount: 0,
          earliestTxDate: tx.date || Date.now()
        };
      }

      const h = holdings[key];
      h.transactionsCount++;

      if (parsed.type === "buy") {
        const buyQty = parsed.qty;
        const buyAmount = parsed.amount;
        const buyPricePerUnit = buyQty > 0 ? (buyAmount / (buyQty * mult)) : 0;

        const currentTotalQty = h.qty;
        const newTotalQty = currentTotalQty + buyQty;

        if (newTotalQty > 0) {
          h.avgBuyPrice = ((h.avgBuyPrice * currentTotalQty) + (buyPricePerUnit * buyQty)) / newTotalQty;
        } else {
          h.avgBuyPrice = buyPricePerUnit;
        }

        h.qty = newTotalQty;
        h.totalBuyQty += buyQty;
        h.totalBuyAmount += buyAmount;
      } else {
        const sellQty = parsed.qty;
        const sellAmount = parsed.amount;
        const sellPricePerUnit = sellQty > 0 ? (sellAmount / (sellQty * mult)) : 0;

        if (h.qty > 0) {
          // If selling price is higher than current average buy price -> Win!
          // If selling price is lower than current average buy price -> Lose!
          if (sellPricePerUnit > h.avgBuyPrice) {
            h.wins += 1;
          } else if (sellPricePerUnit < h.avgBuyPrice) {
            h.losses += 1;
          }
          
          // Realized profit/loss calculation
          const profitPerUnit = sellPricePerUnit - h.avgBuyPrice;
          h.realizedPL += profitPerUnit * sellQty * mult;
        } else {
          // If selling with 0 recorded holdings, compare with 0 (or default to Win)
          if (sellPricePerUnit > 0) {
            h.wins += 1;
          }
          h.realizedPL += sellAmount;
        }

        h.qty = Math.max(0, h.qty - sellQty);
        h.totalSellQty += sellQty;
        h.totalSellAmount += sellAmount;
      }

      if (tx.date && tx.date < h.earliestTxDate) {
        h.earliestTxDate = tx.date;
      }
    });

    // Sort: active holdings first, then alphabetically by code
    return Object.values(holdings)
      .filter(h => h.totalBuyQty > 0 || h.totalSellQty > 0)
      .sort((a, b) => {
        if (a.qty > 0 && b.qty <= 0) return -1;
        if (a.qty <= 0 && b.qty > 0) return 1;
        return a.code.localeCompare(b.code);
      });
  }, [allTransactions]);

  const auditedInvestments = useMemo<Investment[]>(() => {
    return auditedHoldings
      .filter(h => h.qty > 0)
      .map((h, idx) => {
        const mult = h.category === "saham" ? 100 : 1;
        const avgPrice = h.totalBuyQty > 0 ? h.totalBuyAmount / (h.totalBuyQty * mult) : 0;
        return {
          id: `audited-${idx}`,
          category: h.category,
          code: h.code,
          qty: h.qty,
          price: Math.round(avgPrice),
          createdAt: h.earliestTxDate || Date.now(),
        };
      });
  }, [auditedHoldings]);

  const activeInvestments = useMemo(() => {
    return activeTab === "holding" ? investments : auditedInvestments;
  }, [activeTab, investments, auditedInvestments]);

  const syncInvestmentsWithTransactions = async () => {
    if (!user) return;
    const confirmSync = window.confirm(
      "Apakah Anda yakin ingin menyinkronkan daftar portofolio investasi Anda dengan riwayat transaksi?\n\nIni akan menghapus daftar portofolio manual Anda saat ini dan menggantinya dengan hasil perhitungan riwayat transaksi, termasuk kuantitas dan harga rata-rata beli."
    );
    if (!confirmSync) return;

    try {
      const batch = writeBatch(db);

      // 1. Delete all existing investments
      investments.forEach((inv) => {
        batch.delete(doc(db, "users", user.uid, "investments", inv.id));
      });

      // 2. Add each reconstructed active holding (qty > 0)
      let count = 0;
      auditedHoldings.forEach((h) => {
        if (h.qty <= 0) return;
        const mult = h.category === "saham" ? 100 : 1;
        const avgPrice = h.totalBuyQty > 0 ? h.totalBuyAmount / (h.totalBuyQty * mult) : 0;
        
        const invRef = doc(collection(db, "users", user.uid, "investments"));
        batch.set(invRef, {
          category: h.category,
          code: h.code,
          qty: h.qty,
          price: Math.round(avgPrice),
          createdAt: Date.now(),
        });
        count++;
      });

      await batch.commit();
      toast.success(`Portofolio investasi berhasil disinkronkan! ${count} aset aktif dimuat.`);
    } catch (err) {
      console.error("Gagal menyinkronkan portofolio:", err);
      toast.error("Gagal menyinkronkan portofolio");
    }
  };

  useEffect(() => {
    const fetchQuotes = async () => {
      const symbols = new Set<string>();
      
      // Collect from manual portfolio
      investments.forEach((i) => {
        symbols.add(i.category === "emas" ? "EMAS" : i.code);
      });
      
      // Collect from transaction-audited portfolio
      auditedInvestments.forEach((i) => {
        symbols.add(i.category === "emas" ? "EMAS" : i.code);
      });

      symbols.add("USDIDR");

      if (symbols.size === 1 && symbols.has("USDIDR")) return; // Only if not fetching anything else besides currency

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
  }, [investments, auditedInvestments, refreshTrigger]);

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
  const totalBalance = activeInvestments.reduce((sum, inv) => {
    const mult = inv.category === "saham" ? 100 : 1;
    return sum + inv.qty * mult * getLivePrice(inv);
  }, 0);
  const incomeToday = activeInvestments.reduce((sum, inv) => {
    const mult = inv.category === "saham" ? 100 : 1;
    return sum + (getLivePrice(inv) - inv.price) * inv.qty * mult;
  }, 0);
  const expenseToday = activeInvestments.reduce((sum, inv) => {
    const mult = inv.category === "saham" ? 100 : 1;
    return sum + inv.qty * mult * inv.price;
  }, 0);

  const fetchAiInsights = async (styleToUse?: string) => {
    const currentStyle = styleToUse || investStyle;
    setIsAiInsightsLoading(true);
    setAiInsightsError(null);

    try {
      const token = await user?.getIdToken();
      const res = await fetch("/api/ai/investment-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          investments: activeInvestments.map((inv) => {
            const livePrice = getLivePrice(inv);
            const mult = inv.category === "saham" ? 100 : 1;
            const totalCost = inv.qty * inv.price * mult;
            const currentValue = inv.qty * livePrice * mult;
            const profitLoss = currentValue - totalCost;
            const returnPct = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
            return {
              category: inv.category,
              code: inv.code,
              qty: inv.qty,
              costBasis: inv.price,
              totalCost,
              currentValue,
              profitLoss,
              returnPct
            };
          }),
          style: currentStyle,
          totalModal: expenseToday,
          totalEquity: totalBalance,
          netProfit: incomeToday,
          marketData
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      setAiInsightsData({ ...data, style: currentStyle });
    } catch (err: any) {
      console.error("Gagal mengambil AI Investment Insights:", err);
      setAiInsightsError("Gagal terhubung dengan server AI. Silakan coba beberapa saat lagi.");
    } finally {
      setIsAiInsightsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ai_insights" && (!aiInsightsData || aiInsightsData.style !== investStyle)) {
      fetchAiInsights(investStyle);
    }
  }, [activeTab, investStyle]);

  // Calculate days count based on period
  const numDays = useMemo(() => {
    if (chartPeriod === "1W") return 7;
    if (chartPeriod === "1M") return 30;
    if (chartPeriod === "3M") return 90;
    if (chartPeriod === "1Y") return 365;
    if (chartPeriod === "YTD") {
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const diffTime = Math.abs(new Date().getTime() - startOfYear.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    if (chartPeriod === "All") {
      const allTxDates = allTransactions.filter((tx) => !!tx.date).map((tx) => tx.date!);
      const activeDates = activeInvestments.map((inv) => inv.createdAt);
      const combined = [...allTxDates, ...activeDates];
      if (combined.length === 0) return 30;
      const earliest = Math.min(...combined);
      const diffTime = Math.abs(new Date().getTime() - earliest);
      return Math.max(30, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    return 30;
  }, [chartPeriod, activeInvestments, allTransactions]);

  // Chart data generation
  const chartData = useMemo(() => {
    const data = [];
    const targetIhsg = marketData.COMPOSITE?.change || 0.45;

    const chronologicalTx = [...allTransactions]
      .filter((tx) => !!tx.date)
      .sort((a, b) => (a.date || 0) - (b.date || 0));

    for (let i = numDays; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const endOfDayDate = new Date(date);
      endOfDayDate.setHours(23, 59, 59, 999);
      const timeMs = endOfDayDate.getTime();

      let modalForDay = 0;
      let valueForDay = 0;
      let netInflowForDay = 0;
      let historicalModal = 0;

      const holdingsForDay: Record<string, { qty: number; avgPrice: number; category: string; code: string; earliestTxDate: number }> = {};

      chronologicalTx.forEach((tx) => {
        if (!tx.date || tx.date > timeMs) return;
        const parsed = parseInvestmentFromTransaction(tx);
        if (!parsed) return;

        const key = `${parsed.category}-${parsed.code}`;
        const mult = parsed.category === "saham" ? 100 : 1;

        if (!holdingsForDay[key]) {
          holdingsForDay[key] = {
            category: parsed.category,
            code: parsed.code,
            qty: 0,
            avgPrice: 0,
            earliestTxDate: tx.date
          };
        }

        const h = holdingsForDay[key];

        const isTxOnThisDay = isSameDay(new Date(tx.date), date);

        if (parsed.type === "buy") {
          const buyQty = parsed.qty;
          const buyAmount = parsed.amount;
          const buyPricePerUnit = buyQty > 0 ? (buyAmount / (buyQty * mult)) : 0;
          const newTotalQty = h.qty + buyQty;
          if (newTotalQty > 0) {
            h.avgPrice = ((h.avgPrice * h.qty) + (buyPricePerUnit * buyQty)) / newTotalQty;
          } else {
            h.avgPrice = buyPricePerUnit;
          }
          h.qty = newTotalQty;
          historicalModal += buyAmount;
          if (isTxOnThisDay) {
            netInflowForDay += buyAmount;
          }
        } else {
          const sellQty = parsed.qty;
          const sellAmount = parsed.amount;
          h.qty = Math.max(0, h.qty - sellQty);
          if (isTxOnThisDay) {
            netInflowForDay -= sellAmount;
          }
        }
      });

      Object.values(holdingsForDay).forEach((h) => {
        if (h.qty <= 0) return;
        const mult = h.category === "saham" ? 100 : 1;
        modalForDay += h.qty * h.avgPrice * mult;
        
        let finalPrice = getLivePrice({ category: h.category, code: h.code, price: h.avgPrice } as Investment);
        
        const daysSinceBuy = Math.max(1, Math.floor((new Date().getTime() - h.earliestTxDate) / (1000 * 60 * 60 * 24)));
        const daysFromBuyToCurrentPoint = Math.floor((timeMs - h.earliestTxDate) / (1000 * 60 * 60 * 24));
        
        let simulatedPrice = finalPrice;
        
        if (timeMs < h.earliestTxDate) {
           const noiseSeed = i + h.code.charCodeAt(0) + (h.code.charCodeAt(h.code.length-1) || 0);
           const noise = Math.sin(noiseSeed) * 0.008;
           simulatedPrice = h.avgPrice * (1 + noise);
        } else if (i > 0) {
           const progress = Math.max(0, Math.min(1, daysFromBuyToCurrentPoint / daysSinceBuy));
           const basePrice = h.avgPrice + (finalPrice - h.avgPrice) * progress;
           const noiseSeed = i + h.code.charCodeAt(0) + (h.code.charCodeAt(h.code.length-1) || 0);
           const noise = Math.sin(noiseSeed) * 0.005;
           simulatedPrice = basePrice * (1 + noise);
        }

        valueForDay += h.qty * simulatedPrice * mult;
      });

      const totalEquity = valueForDay;
      const portfolioReturn = modalForDay > 0 ? ((valueForDay - modalForDay) / modalForDay) * 100 : 0;
      
      const progress = numDays > 0 ? (numDays - i) / numDays : 1;
      const wave = Math.sin(progress * Math.PI * 3) * 6 + Math.sin(progress * Math.PI * 7) * 2;
      const ihsgReturn = progress * targetIhsg + wave;

      data.push({
        name: format(date, "dd MMM", { locale: localeId }),
        value: totalEquity,
        modal: modalForDay,
        netInflow: netInflowForDay,
        portfolioReturn,
        ihsgReturn,
        rawDate: date,
      });
    }
    return data;
  }, [numDays, allTransactions, quotes, marketData.COMPOSITE?.change]);

  const getInitials = (name: string) =>
    name.substring(0, 2).toUpperCase() || "US";

  const filteredAndSortedInvestments = useMemo(() => {
    let result = [...activeInvestments];

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
  }, [activeInvestments, filterCategory, sortBy, quotes]);

  const COLORS = useMemo(() => [
    "#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", 
    "#14B8A6", "#6366f1", "#EC4899", "#f97316"
  ], []);

  const formatYAxis = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}M`;
    if (val >= 1000) return `${(val / 1000).toLocaleString("id-ID", { maximumFractionDigits: 0 })}K`;
    return val.toString();
  };

  const dailyRows = useMemo(() => {
    const rows = [];
    const len = chartData.length;
    for (let idx = len - 1; idx >= 0; idx--) {
      const d = chartData[idx];
      let pnl = 0;
      let pnlPercent = 0;
      if (idx > 0) {
        const prev = chartData[idx - 1];
        pnl = (d.value - prev.value) - (d.netInflow || 0);
        pnlPercent = prev.value > 0 ? (pnl / prev.value) * 100 : 0;
      } else {
        pnl = d.value - d.modal;
        pnlPercent = d.modal > 0 ? (pnl / d.modal) * 100 : 0;
      }
      rows.push({
        dateLabel: d.name,
        equity: d.value,
        pnl,
        pnlPercent,
        rawDate: d.rawDate,
      });
    }
    return rows;
  }, [chartData]);

  const monthlyRows = useMemo(() => {
    const groups: Record<string, { monthKey: string; dateLabel: string; finalValue: number; initialValue: number; totalNetInflow: number; rawDate: Date }> = {};
    
    chartData.forEach((d) => {
      const date = d.rawDate;
      const monthKey = format(date, "yyyy-MM");
      const label = format(date, "MMM yy", { locale: localeId });
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          monthKey,
          dateLabel: label,
          finalValue: d.value,
          initialValue: d.value,
          totalNetInflow: d.netInflow || 0,
          rawDate: date,
        };
      } else {
        groups[monthKey].finalValue = d.value;
        groups[monthKey].totalNetInflow += (d.netInflow || 0);
      }
    });
    
    const sortedMonths = Object.values(groups).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    return sortedMonths.map((m, idx) => {
      const prevMonthVal = idx > 0 ? sortedMonths[idx - 1].finalValue : m.initialValue;
      const pnl = (m.finalValue - prevMonthVal) - m.totalNetInflow;
      const pnlPercent = prevMonthVal > 0 ? (pnl / prevMonthVal) * 100 : 0;
      return {
        dateLabel: m.dateLabel,
        equity: m.finalValue,
        pnl,
        pnlPercent,
        monthKey: m.monthKey,
      };
    }).reverse(); // newest first
  }, [chartData]);

  const allocationData = useMemo(() => {
    let list: any[] = [];
    if (allocationViewBy === "aset") {
      list = filteredAndSortedInvestments
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
      list = Object.values(aggregated).sort((a, b) => b.value - a.value);
    }
    return list;
  }, [filteredAndSortedInvestments, allocationViewBy, quotes]);

  const ownedStocks = useMemo(() => {
    return activeInvestments.filter((inv) => inv.category === "saham");
  }, [activeInvestments]);

  const actionsInvestments = (
    <div className="flex items-center gap-2">
      <ActionBtn variant="secondary" icon={<TrendingUp className="w-4 h-4 text-app-accent1" />} onClick={() => setIsSimulatorOpen(true)} title={language === "en" ? "ARA/ARB Simulation" : "Simulasi ARA/ARB"}>
        {language === "en" ? "ARA/ARB Sim" : "Simulasi ARA/ARB"}
      </ActionBtn>
      <ActionBtn variant="secondary" icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-app-accent1' : ''}`} />} onClick={handleRefresh} disabled={isRefreshing} title={language === "en" ? "Refresh Data" : "Refresh Data"}>
        {language === "en" ? "Refresh" : "Refresh"}
      </ActionBtn>
      <ActionBtn variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openPortfolioModal} title={language === "en" ? "Add Portfolio" : "Tambah Portofolio"}>
        {language === "en" ? "Add Portfolio" : "Tambah Portofolio"}
      </ActionBtn>
    </div>
  );

  const mobileActionsInvestments = (
    <div className="flex items-center gap-1.5">
      <ActionBtn variant="secondary" icon={<TrendingUp className="w-4 h-4 text-app-accent1" />} onClick={() => setIsSimulatorOpen(true)} title={language === "en" ? "ARA/ARB Simulation" : "Simulasi ARA/ARB"} />
      <ActionBtn variant="secondary" icon={<RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-app-accent1' : ''}`} />} onClick={handleRefresh} disabled={isRefreshing} title={language === "en" ? "Refresh Data" : "Refresh Data"} />
      <ActionBtn variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openPortfolioModal} title={language === "en" ? "Add Portfolio" : "Tambah Portofolio"} />
    </div>
  );

  return (
    <PageShell
      title={language === "en" ? "Your Investments" : "Investasi Anda"}
      subtitle={language === "en" ? "Here is the summary of your investment performance." : "Berikut ringkasan performa investasi Anda."}
      actions={actionsInvestments}
      mobileActions={mobileActionsInvestments}
    >
      {/* Sub-tab Navigation */}
      <div className="flex bg-app-card/60 backdrop-blur-md p-1.5 rounded-2xl border border-app-border/60 self-start mb-6 md:mb-8 gap-1.5 relative z-10 shrink-0 shadow-lg shadow-black/5">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`px-5 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "dashboard"
              ? "bg-app-accent1 text-app-bg shadow-md"
              : "text-app-text/60 hover:text-app-text-bright hover:bg-app-hover/50"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {language === "en" ? "Summary" : "Ringkasan"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("holding")}
          className={`px-5 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "holding"
              ? "bg-app-accent1 text-app-bg shadow-md"
              : "text-app-text/60 hover:text-app-text-bright hover:bg-app-hover/50"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          {language === "en" ? "Portfolio & Audit" : "Portofolio & Audit"}
          {auditedHoldings.length > 0 && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeTab === "holding" ? "bg-app-bg text-app-accent1" : "bg-app-accent1 text-app-bg"}`}>
              {auditedHoldings.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("ai_insights");
            if (!aiInsightsData) fetchAiInsights(investStyle);
          }}
          className={`px-5 py-2.5 rounded-[14px] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "ai_insights"
              ? "bg-app-accent1 text-app-bg shadow-md"
              : "text-app-text/60 hover:text-app-text-bright hover:bg-app-hover/50"
          }`}
        >
          <Sparkles className={`w-4 h-4 ${activeTab === "ai_insights" ? "text-app-bg" : "text-app-accent1"} animate-pulse`} />
          {language === "en" ? "AI Insights & Stock Picks" : "AI Insights & Rekomendasi Saham"}
        </button>
      </div>

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in slide-in-from-bottom-2 duration-500 w-full mb-6">
          
          {/* COLUMN 1: LEFT PANEL (lg:col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6 w-full">
            
            {/* UNIFIED HERO CHART CARD */}
            <HoverCard className="bg-app-card rounded-[20px] p-6 border border-app-border/60 flex flex-col shadow-lg shadow-black/10 relative overflow-hidden w-full">
              
              {/* Header with Mode Toggle & Period Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
                <div className="flex items-center bg-app-bg p-1 rounded-xl border border-app-border self-start">
                  <button
                    type="button"
                    onClick={() => setHeroChartView("equity")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      heroChartView === "equity"
                        ? "bg-app-card text-app-accent1 shadow-sm border border-app-border"
                        : "text-app-text/60 hover:text-app-text-bright"
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" /> Total Equity
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroChartView("return")}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      heroChartView === "return"
                        ? "bg-app-card text-app-accent1 shadow-sm border border-app-border"
                        : "text-app-text/60 hover:text-app-text-bright"
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" /> Return vs IHSG
                  </button>
                </div>

                <div className="flex gap-1 bg-app-bg p-1 rounded-xl border border-app-border self-start sm:self-auto">
                  {(["1W", "1M", "3M", "YTD", "1Y", "All"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setChartPeriod(p)}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-all cursor-pointer ${
                        chartPeriod === p
                          ? "bg-app-accent1 text-app-bg shadow-sm"
                          : "text-app-text/60 hover:text-app-text-bright hover:bg-app-hover/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Stats Row */}
              <div className="relative z-10 flex flex-wrap items-baseline justify-between gap-2 mb-4 pb-3 border-b border-app-border/50">
                {heroChartView === "equity" ? (
                  <div>
                    <span className="text-app-text/60 text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                      Total Nilai Equity Saat Ini
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-app-text-bright font-mono">
                        Rp {totalBalance.toLocaleString("id-ID")}
                      </span>
                      <span className={`text-xs font-semibold font-mono ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`}>
                        {incomeToday >= 0 ? "+" : ""}Rp {incomeToday.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-app-text/60 text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                        Return Portofolio
                      </span>
                      <span className={`text-xl font-bold font-mono ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`}>
                        {incomeToday >= 0 ? "+" : ""}{(expenseToday > 0 ? ((incomeToday / expenseToday) * 100).toFixed(2) : 0)}%
                      </span>
                    </div>
                    <div className="h-7 w-px bg-app-border" />
                    <div>
                      <span className="text-app-text/60 text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                        IHSG Benchmark
                      </span>
                      <span className={`text-xl font-bold font-mono ${marketData.COMPOSITE?.change >= 0 ? "text-app-success" : "text-app-danger"}`}>
                        {marketData.COMPOSITE?.change >= 0 ? "+" : ""}{marketData.COMPOSITE?.change?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Single Chart Canvas */}
              <div className="h-[220px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  {heroChartView === "equity" ? (
                    <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotalEquity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-app-success)" stopOpacity={0.25} />
                          <stop offset="100%" stopColor="var(--color-app-success)" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-app-border)" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "var(--color-app-text)" }}
                        dy={5}
                        opacity={0.5}
                      />
                      <YAxis
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "var(--color-app-text)" }}
                        tickFormatter={formatYAxis}
                        opacity={0.5}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-app-card)",
                          border: "1px solid var(--color-app-border)",
                          borderRadius: "12px",
                        }}
                        itemStyle={{
                          fontSize: 11,
                          color: "var(--color-app-text-bright)",
                        }}
                        labelStyle={{
                          fontSize: 11,
                          color: "var(--color-app-text)",
                          marginBottom: 2,
                        }}
                        formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Equity"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--color-app-success)"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorTotalEquity)"
                      />
                    </AreaChart>
                  ) : (
                    <LineChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-app-border)" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "var(--color-app-text)" }}
                        dy={5}
                        opacity={0.5}
                      />
                      <YAxis
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: "var(--color-app-text)" }}
                        tickFormatter={(val) => `${val.toFixed(0)}%`}
                        opacity={0.5}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "var(--color-app-card)",
                          border: "1px solid var(--color-app-border)",
                          borderRadius: "12px",
                        }}
                        itemStyle={{
                          fontSize: 11,
                          color: "var(--color-app-text-bright)",
                        }}
                        labelStyle={{
                          fontSize: 11,
                          color: "var(--color-app-text)",
                          marginBottom: 2,
                        }}
                        formatter={(value: number, name: string) => [
                          `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
                          name === "portfolioReturn" ? "Portfolio" : "IHSG"
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="portfolioReturn"
                        name="portfolioReturn"
                        stroke="var(--color-app-success)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="ihsgReturn"
                        name="ihsgReturn"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
            </HoverCard>

            {/* CARD: AI INVESTMENT INSIGHTS & STOCK ADVISOR BANNER */}
            <HoverCard className="bg-gradient-to-br from-app-card via-app-card to-app-accent1/5 rounded-[20px] p-6 border border-app-accent1/30 flex flex-col shadow-lg shadow-black/10 relative overflow-hidden w-full group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BrainCircuit className="w-24 h-24 text-app-accent1" />
              </div>

              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-app-accent1/10 text-app-accent1 border border-app-accent1/20">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-app-text/60">
                      AI Investment Advisor
                    </h3>
                    <p className="text-sm font-bold text-app-text-bright">
                      Pantau Alur & Rekomendasi Saham
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-app-accent1/10 text-app-accent1 border border-app-accent1/20">
                  Gaya: {investStyle.toUpperCase()}
                </span>
              </div>

              <p className="text-xs text-app-text/80 line-clamp-2 mb-4 leading-relaxed relative z-10">
                {aiInsightsData?.portfolioHealth?.summary ||
                  `Analisis AI memantau ekuitas Rp ${totalBalance.toLocaleString("id-ID")} Anda dan memberikan saran emiten saham pilihan terbaik sesuai gaya ${investStyle}.`}
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-app-border/50 relative z-10 mt-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-app-text/60">Skor Kesehatan:</span>
                  <span className="text-xs font-extrabold font-mono text-app-accent1 bg-app-accent1/10 px-2 py-0.5 rounded-md">
                    {aiInsightsData?.portfolioHealth?.score || 78}/100
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("ai_insights");
                    if (!aiInsightsData) fetchAiInsights(investStyle);
                  }}
                  className="text-xs font-bold text-app-accent1 hover:text-app-accent1/80 flex items-center gap-1 transition-all cursor-pointer group-hover:translate-x-0.5"
                >
                  <span>Buka AI Insights</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </HoverCard>

          </div>

          {/* COLUMN 2: MIDDLE PANEL - TOTAL EQUITY RETURN (lg:col-span-3) */}
          <div className="lg:col-span-3 w-full">
            <HoverCard className="bg-app-card rounded-[20px] p-6 border border-app-border/60 flex flex-col shadow-lg shadow-black/10 relative overflow-hidden w-full h-[620px]">
              
              
              <div className="relative z-10 flex flex-col gap-3 shrink-0 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-app-text/70 text-[10px] font-semibold uppercase tracking-wider">
                    Total Equity Return
                  </span>
                  <div className="relative group">
                    <Info className="w-3.5 h-3.5 text-app-text/50 hover:text-app-text cursor-pointer" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-app-card border border-app-border p-2 rounded-lg shadow-xl text-[10px] text-app-text/80 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 leading-relaxed">
                      Catatan performa harian/bulanan nilai investasi dan P&L Anda.
                    </div>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex justify-between items-center">
                  <div className="flex bg-app-bg p-0.5 rounded-lg border border-app-border">
                    <button
                      type="button"
                      onClick={() => setEquityReturnViewMode("daily")}
                      className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                        equityReturnViewMode === "daily"
                          ? "bg-app-card text-app-accent1 shadow-sm"
                          : "text-app-text/60 hover:text-app-text-bright"
                      }`}
                    >
                      Daily
                    </button>
                    <button
                      type="button"
                      onClick={() => setEquityReturnViewMode("monthly")}
                      className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                        equityReturnViewMode === "monthly"
                          ? "bg-app-card text-app-accent1 shadow-sm"
                          : "text-app-text/60 hover:text-app-text-bright"
                      }`}
                    >
                      Monthly
                    </button>
                  </div>
                  <span className="text-[10px] font-semibold text-app-text/50 capitalize font-sans">
                    {chartPeriod === "YTD" ? "Year to Date" : chartPeriod === "All" ? "All Time" : `Last ${chartPeriod}`}
                  </span>
                </div>
              </div>

              {/* Scrollable Table */}
              <div className="flex-1 overflow-y-auto pr-1 relative z-10 border border-app-border rounded-xl bg-app-bg/15">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-app-bg border-b border-app-border text-app-text/60 font-semibold font-sans uppercase tracking-wider text-[9px] sticky top-0 z-10">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-right">Equity</th>
                      <th className="py-2.5 px-3 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-border/30 text-[11px]">
                    {equityReturnViewMode === "daily" ? (
                      dailyRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-app-text/50 font-sans">
                            Belum ada data
                          </td>
                        </tr>
                      ) : (
                        dailyRows.map((row, i) => (
                          <tr key={i} className="hover:bg-app-hover/30 transition-colors">
                            <td className="py-2.5 px-3 text-app-text/75 font-sans font-semibold">
                              {format(row.rawDate, "dd MMM yy", { locale: localeId })}
                            </td>
                            <td className="py-2.5 px-3 text-right text-app-text-bright">
                              {row.equity.toLocaleString("id-ID")}
                            </td>
                            <td className={`py-2.5 px-3 text-right font-semibold ${row.pnl >= 0 ? "text-app-success" : "text-app-danger"}`}>
                              <div>{row.pnl >= 0 ? "+" : ""}{row.pnl.toLocaleString("id-ID")}</div>
                              <div className="text-[9px] font-normal opacity-85">({row.pnl >= 0 ? "+" : ""}{row.pnlPercent.toFixed(2)}%)</div>
                            </td>
                          </tr>
                        ))
                      )
                    ) : (
                      monthlyRows.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-app-text/50 font-sans">
                            Belum ada data
                          </td>
                        </tr>
                      ) : (
                        monthlyRows.map((row, i) => (
                          <tr key={i} className="hover:bg-app-hover/30 transition-colors">
                            <td className="py-3 px-3 text-app-text/75 font-sans font-semibold">
                              {row.dateLabel}
                            </td>
                            <td className="py-3 px-3 text-right text-app-text-bright font-semibold">
                              {row.equity.toLocaleString("id-ID")}
                            </td>
                            <td className={`py-3 px-3 text-right font-semibold ${row.pnl >= 0 ? "text-app-success" : "text-app-danger"}`}>
                              <div>{row.pnl >= 0 ? "+" : ""}{row.pnl.toLocaleString("id-ID")}</div>
                              <div className="text-[9px] font-normal opacity-85">({row.pnl >= 0 ? "+" : ""}{row.pnlPercent.toFixed(2)}%)</div>
                            </td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </HoverCard>
          </div>

          {/* COLUMN 3: RIGHT PANEL - PORTFOLIO ALLOCATION (lg:col-span-4) */}
          <div className="lg:col-span-4 w-full">
            <HoverCard className="bg-app-card rounded-[20px] p-6 border border-app-border/60 flex flex-col shadow-lg shadow-black/10 relative overflow-hidden w-full min-h-[620px]">
              
              
              <div className="relative z-10 flex justify-between items-center shrink-0 mb-4">
                <span className="text-app-text/70 text-[10px] font-semibold uppercase tracking-wider">
                  Portfolio Allocation
                </span>

                {/* Category Toggle */}
                <div className="flex bg-app-bg p-0.5 rounded-lg border border-app-border">
                  <button
                    type="button"
                    onClick={() => setAllocationViewBy("aset")}
                    className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                      allocationViewBy === "aset"
                        ? "bg-app-card text-app-accent1 shadow-sm"
                        : "text-app-text/60 hover:text-app-text-bright"
                    }`}
                  >
                    Stocks
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllocationViewBy("kategori")}
                    className={`px-3 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                      allocationViewBy === "kategori"
                        ? "bg-app-card text-app-accent1 shadow-sm"
                        : "text-app-text/60 hover:text-app-text-bright"
                    }`}
                  >
                    Sub-Sector
                  </button>
                </div>
              </div>

              {/* Doughnut Chart */}
              {(() => {
                const totalAllocValue = allocationData.reduce((sum, item) => sum + item.value, 0);

                if (totalAllocValue === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center text-app-text/50 text-xs py-8 border border-dashed border-app-border rounded-xl relative z-10 bg-app-bg/10 min-h-[300px]">
                      <TrendingUp className="w-8 h-8 text-app-text/30 mb-2 animate-waggle" />
                      Belum ada instrumen investasi
                    </div>
                  );
                }

                return (
                  <div className="relative z-10 flex flex-col flex-1">
                    <div className="flex justify-center items-center h-[200px] relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={90}
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
                              borderRadius: "12px",
                            }}
                            itemStyle={{
                              fontSize: 12,
                              color: "var(--color-app-text-bright)",
                            }}
                            formatter={(value: number) => [`Rp ${value.toLocaleString("id-ID")}`, "Value"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center px-4 max-w-[140px]">
                        <span className="text-[15px] font-semibold text-app-text-bright break-words leading-tight font-mono">
                          Rp {totalAllocValue.toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-app-text/50 mt-1 font-semibold">
                          {allocationData.length} {allocationViewBy === "aset" ? "Stocks" : "Sub-Sectors"}
                        </span>
                      </div>
                    </div>

                    {/* Allocation list with progress bars */}
                    <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 max-h-[300px]">
                      {allocationData.map((item, index) => {
                        const percentage = totalAllocValue > 0 ? ((item.value / totalAllocValue) * 100) : 0;
                        const color = COLORS[index % COLORS.length];

                        return (
                          <div key={item.id} className="flex flex-col gap-1.5 group">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-app-card border border-app-border flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                  <AssetLogo logoid={item.logoid} code={item.name} description={item.description} />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-app-text-bright">{item.name}</span>
                                  <span className="text-[9px] text-app-text/50 font-mono">Rp {item.value.toLocaleString("id-ID")}</span>
                                </div>
                              </div>
                              <span className="font-semibold text-app-text-bright font-mono">{percentage.toFixed(2)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-app-border/20 rounded-full overflow-hidden relative">
                              <div 
                                className="h-full rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${percentage}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </HoverCard>
          </div>

        </div>
      )}

      {activeTab !== "dashboard" && activeTab !== "ai_insights" && (
        <>
          {(() => {
        const getMarketChangeVal = (item: any) => {
          if (!item || item.change === undefined) return 0;
          let c = Number(item.change);
          if (Math.abs(c) > 15 && item.price && item.price > 100) {
            const prev = item.price - c;
            c = prev > 0 ? (c / prev) * 100 : 0;
          }
          return c;
        };

        const ihsgChange = getMarketChangeVal(marketData.COMPOSITE);
        const usdidrChange = getMarketChangeVal(marketData.USDIDR);

        return (
          <>
            {/* WIDGETS (STACK ON MOBILE, GRID ON DESKTOP) */}
            <div className="flex flex-col gap-3.5 mb-6 md:grid md:grid-cols-3 md:gap-5 md:mb-8">
              {/* TOTAL INVESTASI */}
              <HoverCard className="bg-app-card rounded-[20px] p-6 border border-app-border/60 flex items-center justify-between shadow-lg shadow-black/10 relative overflow-hidden cursor-pointer w-full min-h-[100px]">
                <div className="flex items-center gap-5 relative z-10 w-full min-w-0">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center ${incomeToday >= 0 ? "bg-app-success/10" : "bg-app-danger/10"}`}>
                    <BarChart3 className={`w-7 h-7 ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-app-text/50 text-[11px] font-bold uppercase tracking-widest mb-1">
                      Total Investasi
                    </p>
                    <p className="text-2xl font-bold text-app-text-bright font-mono leading-tight truncate">
                      Rp {totalBalance.toLocaleString("id-ID")}
                    </p>
                    <div className={`flex items-center gap-1.5 mt-2 text-[12px] font-semibold ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"}`}>
                      {incomeToday >= 0 ? (
                        <>
                          <TrendingUp className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">Berjalan baik</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 shrink-0" /> <span className="whitespace-nowrap">Sedang menurun</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0 text-app-text/30 relative z-10 ml-2" />
              </HoverCard>

              {/* RETURN */}
              <HoverCard className="bg-app-card rounded-[20px] border border-app-border/60 flex shadow-lg shadow-black/10 overflow-hidden relative cursor-pointer w-full min-h-[100px]">
                <div className="flex-1 p-5 border-r border-app-border/60 flex flex-col justify-center relative z-10 min-w-0">
                   <p className="text-app-text/50 text-[11px] font-bold uppercase tracking-widest mb-1">Modal Awal</p>
                   <p className="text-lg font-bold text-app-text-bright font-mono leading-tight truncate">Rp {expenseToday.toLocaleString("id-ID")}</p>
                </div>
                <div className="flex-1 p-5 flex flex-col justify-center relative z-10 min-w-0">
                   <p className="text-app-text/50 text-[11px] font-bold uppercase tracking-widest mb-1">Sekarang</p>
                   <p className={`text-lg font-bold ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"} font-mono leading-tight truncate`}>
                     Rp {totalBalance.toLocaleString("id-ID")}
                   </p>
                   <div className={`text-[11px] font-semibold mt-1 ${incomeToday >= 0 ? "text-app-success" : "text-app-danger"} leading-tight font-mono whitespace-nowrap truncate`}>
                      {incomeToday >= 0 ? "+" : ""}Rp {incomeToday.toLocaleString("id-ID")} ({incomeToday >= 0 ? "+" : ""}{expenseToday > 0 ? ((incomeToday / expenseToday) * 100).toFixed(2) : "0.00"}%)
                   </div>
                </div>
              </HoverCard>

              {/* PASAR: IHSG & KURS RUPIAH */}
              <HoverCard className="bg-app-card rounded-[20px] border border-app-border/60 flex shadow-lg shadow-black/10 overflow-hidden relative cursor-pointer w-full min-h-[100px]">
                <div className="flex-1 p-3.5 sm:p-5 border-r border-app-border/60 hover:bg-app-hover transition-colors cursor-pointer flex flex-col justify-center relative z-10 min-w-0">
                   <div className="flex justify-between items-center mb-0.5">
                     <p className="text-app-text/60 text-[10px] font-bold uppercase tracking-wider">IHSG</p>
                     {ihsgChange >= 0 ? (
                       <TrendingUp className="w-3.5 h-3.5 shrink-0 text-app-success" />
                     ) : (
                       <TrendingDown className="w-3.5 h-3.5 shrink-0 text-app-danger" />
                     )}
                   </div>
                   <p className="text-base sm:text-lg font-bold text-app-text-bright font-mono leading-tight truncate">
                     {marketData.COMPOSITE?.price?.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "7.245,12"}
                   </p>
                   <div className={`flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] font-semibold ${ihsgChange >= 0 ? "text-app-success" : "text-app-danger"} font-mono`}>
                     {ihsgChange >= 0 ? "+" : ""}{ihsgChange.toFixed(2)}%
                   </div>
                </div>
                <a
                   href="https://www.google.com/search?q=1+dolar"
                   target="_blank"
                   rel="noopener noreferrer"
                   className="flex-1 p-3.5 sm:p-5 hover:bg-app-hover transition-colors cursor-pointer flex flex-col justify-center relative z-10 min-w-0"
                >
                   <div className="flex justify-between items-center mb-0.5">
                     <p className="text-app-text/60 text-[10px] font-bold uppercase tracking-wider">USD/IDR</p>
                     {usdidrChange >= 0 ? (
                       <TrendingUp className="w-3.5 h-3.5 shrink-0 text-app-danger" />
                     ) : (
                       <TrendingDown className="w-3.5 h-3.5 shrink-0 text-app-success" />
                     )}
                   </div>
                   <p className="text-base sm:text-lg font-bold text-app-text-bright font-mono leading-tight truncate">
                     {marketData.USDIDR?.price?.toLocaleString("id-ID") || "16.250"}
                   </p>
                   <div className={`flex items-center gap-1 mt-1 text-[10px] sm:text-[11px] font-semibold ${usdidrChange >= 0 ? "text-app-danger" : "text-app-success"} font-mono`}>
                     {usdidrChange >= 0 ? "+" : ""}{usdidrChange.toFixed(2)}%
                   </div>
                </a>
              </HoverCard>
            </div>
          </>
        );
      })()}

      {/* MAIN SECTIONS */}
      <div className="flex flex-col gap-6 mb-6">
        {/* PERFORMA INVESTASI */}
        <div className="bg-app-card rounded-[20px] p-6 sm:p-8 border border-app-border/60 flex flex-col shadow-lg shadow-black/10 relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-6 md:mb-8 relative z-10">
            <h2 className="text-app-text-bright text-xl sm:text-2xl font-bold tracking-tight">
              Performa Investasi
            </h2>
            <div className="flex items-center gap-2">
              <div className="bg-app-bg rounded-full p-1 border border-app-border flex">
                <button
                  onClick={() => setChartPeriod("1W")}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${chartPeriod === "1W" ? "bg-app-accent1 text-app-bg shadow-md" : "bg-app-bg/50 text-app-text/60 hover:bg-app-hover hover:text-app-text-bright"}`}
                >
                  7 Hari
                </button>
                <button
                  onClick={() => setChartPeriod("1M")}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${chartPeriod === "1M" ? "bg-app-accent1 text-app-bg shadow-md" : "bg-app-bg/50 text-app-text/60 hover:bg-app-hover hover:text-app-text-bright"}`}
                >
                  30 Hari
                </button>
              </div>
            </div>
          </div>

            <div className="bg-app-card p-6 rounded-[20px] border border-app-border/60 shadow-lg shadow-black/10 flex-1 min-h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
              <AreaChart
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
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="none"
                  fill={`url(#colorValue-${chartPeriod})`}
                  fillOpacity={0.15}
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
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PORTOFOLIO */}
        <div className="bg-app-card rounded-[20px] p-6 sm:p-8 border border-app-border/60 flex flex-col shadow-lg shadow-black/10 relative overflow-hidden">
          
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-6 relative z-10">
            <div className="flex flex-col gap-1.5 w-full md:w-auto">
              <h2 className="text-app-text-bright text-xl sm:text-2xl font-bold tracking-tight">
                Portofolio Investasi
              </h2>
              <div className="flex bg-app-bg p-1 rounded-xl border border-app-border self-start">
                <button
                  type="button"
                  onClick={() => setPortfolioViewMode("daftar")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    portfolioViewMode === "daftar"
                      ? "bg-app-card text-app-accent1 shadow-sm border border-app-border"
                      : "text-app-text/60 hover:text-app-text-bright border border-transparent"
                  }`}
                >
                  <List className="w-3.5 h-3.5" /> Kepemilikan Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setPortfolioViewMode("audit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    portfolioViewMode === "audit"
                      ? "bg-app-card text-app-accent1 shadow-sm border border-app-border"
                      : "text-app-text/60 hover:text-app-text-bright border border-transparent"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" /> Audit Riwayat
                  {auditedHoldings.length > 0 && (
                    <span className="bg-app-accent1 text-app-bg text-[9px] px-1.5 py-0.5 rounded-full font-semibold">
                      {auditedHoldings.length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPortfolioViewMode("alokasi")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    portfolioViewMode === "alokasi"
                      ? "bg-app-card text-app-accent1 shadow-sm border border-app-border"
                      : "text-app-text/60 hover:text-app-text-bright border border-transparent"
                  }`}
                >
                  <PieChartIcon className="w-3.5 h-3.5" /> Alokasi
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {portfolioViewMode !== "audit" && (
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
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase transition-all whitespace-nowrap ${
                        filterCategory === f.id
                          ? "bg-app-card text-app-text-bright shadow-sm border border-app-border"
                          : "text-app-text/60 hover:text-app-text-bright border border-transparent"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
                
                <div className="relative group">
                  <button className="flex items-center gap-2 bg-app-bg px-3 py-2 rounded-xl border border-app-border text-[10px] font-semibold uppercase hover:bg-app-card transition-colors">
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

          {portfolioViewMode === "audit" ? (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              {/* Audit Stats Summary */}
              {(() => {
                let totalTxModal = 0;
                let totalTxCurrentValue = 0;
                let totalActualSpent = 0;
                let totalRealizedPL = 0;
                let totalWins = 0;
                let totalLosses = 0;

                auditedHoldings.forEach((h) => {
                  const mult = h.category === "saham" ? 100 : 1;
                  const livePrice = getLivePrice({ category: h.category, code: h.code, qty: h.qty, price: h.avgBuyPrice, id: "" } as Investment);
                  const costBasis = h.qty * h.avgBuyPrice * mult;
                  const currentVal = h.qty * livePrice * mult;

                  totalTxModal += costBasis;
                  totalTxCurrentValue += currentVal;
                  totalActualSpent += h.totalBuyAmount;
                  totalRealizedPL += h.realizedPL;
                  totalWins += h.wins;
                  totalLosses += h.losses;
                });

                const totalTxProfit = totalTxCurrentValue - totalTxModal;
                const totalTxProfitPct = totalTxModal > 0 ? (totalTxProfit / totalTxModal) * 100 : 0;
                const totalTrades = totalWins + totalLosses;
                const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;

                return (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-app-bg/40 border border-app-border p-4 rounded-2xl">
                        <p className="text-[10px] font-semibold text-app-text/50 uppercase tracking-wider mb-1">
                          Modal Kepemilikan (Cost Basis)
                        </p>
                        <p className="text-lg font-semibold text-app-text-bright font-mono">
                          Rp {Math.round(totalTxModal).toLocaleString("id-ID")}
                        </p>
                        <p className="text-[10px] text-app-text/50 mt-1">
                          Berdasarkan sisa unit & harga beli rata-rata
                        </p>
                      </div>

                      <div className="bg-app-bg/40 border border-app-border p-4 rounded-2xl">
                        <p className="text-[10px] font-semibold text-app-text/50 uppercase tracking-wider mb-1">
                          Nilai Pasar Saat Ini
                        </p>
                        <p className="text-lg font-semibold text-app-text-bright font-mono">
                          Rp {Math.round(totalTxCurrentValue).toLocaleString("id-ID")}
                        </p>
                        <p className={`text-[10px] font-semibold mt-1 font-mono ${totalTxProfit >= 0 ? "text-app-success" : "text-app-danger"}`}>
                          {totalTxProfit >= 0 ? "+" : ""}Rp {Math.round(totalTxProfit).toLocaleString("id-ID")} ({totalTxProfit >= 0 ? "+" : ""}{totalTxProfitPct.toFixed(2)}%)
                        </p>
                      </div>

                      <div className="bg-app-bg/40 border border-app-border p-4 rounded-2xl">
                        <p className="text-[10px] font-semibold text-app-text/50 uppercase tracking-wider mb-1">
                          Arus Kas Bersih Keluar
                        </p>
                        <p className="text-lg font-semibold text-app-text-bright font-mono">
                          Rp {Math.round(totalActualSpent).toLocaleString("id-ID")}
                        </p>
                        <p className="text-[10px] text-app-text/50 mt-1">
                          Total pembelian dikurangi total penjualan
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-app-bg/40 border border-app-border p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-semibold text-app-text/50 uppercase tracking-wider mb-1">
                            Keuntungan Realisasi (Realized Profit/Loss)
                          </p>
                          <p className={`text-lg font-semibold font-mono ${totalRealizedPL >= 0 ? "text-app-success" : "text-app-danger"}`}>
                            {totalRealizedPL >= 0 ? "+" : ""}Rp {Math.round(totalRealizedPL).toLocaleString("id-ID")}
                          </p>
                        </div>
                        <p className="text-[10px] text-app-text/50 mt-2">
                          Total keuntungan/kerugian riil dari transaksi penjualan yang telah direalisasikan
                        </p>
                      </div>

                      <div className="bg-app-bg/40 border border-app-border p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-semibold text-app-text/50 uppercase tracking-wider mb-1">
                            Akurasi Transaksi Jual (Win/Loss Rate)
                          </p>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-lg font-semibold text-app-text-bright font-mono">
                              {winRate.toFixed(1)}% Win Rate
                            </span>
                            <span className="text-xs text-app-text/60 font-mono">
                              ({totalWins} Win / {totalLosses} Lose)
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-app-border/30 h-1.5 rounded-full overflow-hidden mt-3 relative">
                          <div 
                            className="bg-app-success h-full" 
                            style={{ width: `${totalTrades > 0 ? winRate : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Audited Assets Table */}
              <div className="border border-app-border rounded-2xl overflow-hidden bg-app-bg/25">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[850px]">
                    <thead>
                      <tr className="bg-app-bg border-b border-app-border text-app-text/60 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-4 px-4">Instrumen</th>
                        <th className="py-4 px-4 text-right">Kuantitas</th>
                        <th className="py-4 px-4 text-right">Avg Beli</th>
                        <th className="py-4 px-4 text-right">Harga Live</th>
                        <th className="py-4 px-4 text-right">Hasil Jual (Realized)</th>
                        <th className="py-4 px-4 text-right">Nilai Sekarang</th>
                        <th className="py-4 px-4 text-right">Return (P/L)</th>
                        <th className="py-4 px-4 text-center">Status Portofolio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-app-border/40 text-app-text/80">
                      {auditedHoldings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-app-text/50">
                            Belum ada riwayat transaksi yang diaudit
                          </td>
                        </tr>
                      ) : (
                        auditedHoldings.map((h) => {
                          const mult = h.category === "saham" ? 100 : 1;
                          const unitName = h.category === "saham" ? "Lot" : h.category === "crypto" ? "Koin" : "Gram";
                          const livePrice = getLivePrice({ category: h.category, code: h.code, qty: h.qty, price: h.avgBuyPrice, id: "" } as Investment);
                          const costBasis = h.qty * h.avgBuyPrice * mult;
                          const currentVal = h.qty * livePrice * mult;
                          const unrealizedPL = currentVal - costBasis;
                          const unrealizedPLPct = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
                          const isProfit = unrealizedPL >= 0;

                          const matchedInv = investments.find(inv => inv.code === h.code);
                          const manualQty = matchedInv ? matchedInv.qty : 0;
                          const isMatching = Math.abs(manualQty - h.qty) < 0.001;
                          const diffUnits = manualQty - h.qty;

                          return (
                            <tr key={`${h.category}-${h.code}`} className="hover:bg-app-hover/30 transition-colors">
                              <td className="py-3 px-4 font-bold text-app-text-bright font-mono">{h.code}</td>
                              <td className="py-3 px-4 text-right font-mono">{h.qty.toLocaleString("id-ID")} {unitName}</td>
                              <td className="py-3 px-4 text-right font-mono">Rp {Math.round(h.avgBuyPrice).toLocaleString("id-ID")}</td>
                              <td className="py-3 px-4 text-right font-mono">Rp {Math.round(livePrice).toLocaleString("id-ID")}</td>
                              <td className={`py-3 px-4 text-right font-mono font-semibold ${h.realizedPL >= 0 ? "text-app-success" : "text-app-danger"}`}>
                                {h.realizedPL >= 0 ? "+" : ""}Rp {Math.round(h.realizedPL).toLocaleString("id-ID")}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-semibold text-app-text-bright">
                                Rp {Math.round(currentVal).toLocaleString("id-ID")}
                              </td>
                              <td className={`py-3 px-4 text-right font-mono font-bold ${isProfit ? "text-app-success" : "text-app-danger"}`}>
                                {isProfit ? "+" : ""}Rp {Math.round(unrealizedPL).toLocaleString("id-ID")} ({isProfit ? "+" : ""}{unrealizedPLPct.toFixed(2)}%)
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isMatching ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-app-success/15 text-app-success border border-app-success/20">
                                    Sesuai (Match)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                                    Selisih {diffUnits > 0 ? `+${diffUnits}` : diffUnits}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : portfolioViewMode === "alokasi" ? (
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col">
                <div className="flex bg-app-card border border-app-border rounded-lg p-1 mb-2 shrink-0 mx-1">
                  <button
                    onClick={() => setAllocationViewBy("aset")}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                      allocationViewBy === "aset"
                        ? "bg-app-bg text-app-text-bright shadow-sm"
                        : "text-app-text/50 hover:text-app-text"
                    }`}
                  >
                    Semua Aset
                  </button>
                  <button
                    onClick={() => setAllocationViewBy("kategori")}
                    className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
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
                          <span className="text-xl font-semibold text-app-text-bright">Rp {totalAllocValue.toLocaleString("id-ID")}</span>
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
                                      <span className="font-semibold text-sm text-app-text-bright">{item.name}</span>
                                      <span className="text-xs text-app-text/60 font-medium">Rp {item.value.toLocaleString("id-ID")}</span>
                                    </div>
                                  </div>
                                </div>
                                <span className="font-semibold text-[15px] text-app-text-bright">{percentage.toFixed(2)}%</span>
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
                              <h3 className="font-semibold text-app-text-bright leading-tight">
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
                               <span className={`text-xs font-semibold ${pl >= 0 ? "text-app-success" : "text-app-danger"}`}>
                                 {pl >= 0 ? "+" : ""}Rp {(inv.qty * pl * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")} ({pl >= 0 ? "+" : ""}{plPercent.toFixed(2)}%)
                               </span>
                             </div>
                           )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-app-border flex justify-between items-center">
                          <div>
                            <div className="text-[10px] text-app-text/60 font-semibold uppercase tracking-wider mb-1">Modal Awal</div>
                            <div className="text-sm font-semibold text-app-text-bright">Rp {(inv.price * inv.qty * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-app-text/60 font-semibold uppercase tracking-wider mb-1">Nilai Sekarang</div>
                            <div className={`text-sm font-semibold ${pl >= 0 ? "text-app-success" : "text-app-danger"}`}>Rp {(livePrice * inv.qty * (inv.category === "saham" ? 100 : 1)).toLocaleString("id-ID")}</div>
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
            className="mt-4 flex items-center justify-center p-4 rounded-2xl border border-dashed border-app-border hover:border-app-text/50 transition cursor-pointer text-app-text/70 text-sm font-medium w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Portofolio
          </button>
        </div>
      </div>

      {/* REMOVED DUPLICATE AUDIT BLOCK */}

        </>
      )}

      {/* AI INSIGHTS & STOCK RECOMMENDATIONS VIEW */}
      {activeTab === "ai_insights" && (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 mb-8">
          {/* TOP HEADER & RE-ANALYZE BAR */}
          <div className="bg-app-card rounded-[20px] p-6 border border-app-border/60 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-black/10 relative overflow-hidden">
            <div className="flex items-start gap-3.5 relative z-10">
              <div className="p-3 rounded-2xl bg-app-accent1/10 text-app-accent1 border border-app-accent1/20 shrink-0">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-app-text-bright">
                    AI Investment Insights & Rekomendasi Saham
                  </h2>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-app-accent1 text-app-bg uppercase">
                    Powered by Gemini
                  </span>
                </div>
                <p className="text-xs text-app-text/70 max-w-2xl">
                  Sistem cerdas AI yang memantau alur kesehatan portofolio Anda, mengidentifikasi kelebihan & risiko, serta memberikan saran emiten saham IHSG terbaik berdasarkan gaya investasi Anda.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fetchAiInsights(investStyle)}
              disabled={isAiInsightsLoading}
              className="px-4 py-2.5 rounded-xl bg-app-accent1 text-app-bg text-xs font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-md shrink-0 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isAiInsightsLoading ? "animate-spin" : ""}`} />
              <span>{isAiInsightsLoading ? "Menganalisis AI..." : "Analisis Ulang Portofolio"}</span>
            </button>
          </div>

          {/* INVESTMENT STYLE SELECTOR (Gaya Investasi) */}
          <div className="bg-app-card rounded-[20px] p-6 border border-app-border/60 shadow-lg shadow-black/10 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-app-text-bright flex items-center gap-2">
                  <Target className="w-4 h-4 text-app-accent1" />
                  Pilih Gaya Investasi Anda (Investment Style)
                </h3>
                <p className="text-xs text-app-text/60">
                  Rekomendasi saham dan strategi akan disesuaikan secara presisi dengan gaya pilihan Anda.
                </p>
              </div>
              <span className="text-xs font-medium text-app-text/60">
                Terpilih: <strong className="text-app-accent1 uppercase">{investStyle}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                {
                  id: "growth",
                  title: "Growth Compounder",
                  sub: "Capital Gain & Market Leaders",
                  icon: TrendingUp,
                  desc: "Emiten pemimpin pasar dengan pertumbuhan laba konsisten."
                },
                {
                  id: "dividend",
                  title: "Dividend Hunter",
                  sub: "Passive Income Cashflow",
                  icon: DollarSign,
                  desc: "Yield dividen royal >5-10% untuk pendapatan rutin."
                },
                {
                  id: "value",
                  title: "Value Investor",
                  sub: "Diskon & Margin of Safety",
                  icon: ShieldCheck,
                  desc: "Saham fundamental bagus yang dijual murah di bawah PBV/PER."
                },
                {
                  id: "swing",
                  title: "Swing / Momentum",
                  sub: "Trading Taktis Volatil",
                  icon: Zap,
                  desc: "Memanfaatkan momentum pergerakan harga & tren jangka pendek."
                },
                {
                  id: "moderate",
                  title: "Moderat & Seimbang",
                  sub: "Saham, Emas & Reksadana",
                  icon: Layers,
                  desc: "Pengembangan modal seimbang dengan perlindungan penurunan."
                },
                {
                  id: "conservative",
                  title: "Konservatif / Aman",
                  sub: "Proteksi Modal Utama",
                  icon: Award,
                  desc: "Fokus menjaga nilai kekayaan dari inflasi dengan risiko minim."
                }
              ].map((styleOpt) => {
                const isSelected = investStyle === styleOpt.id;
                const IconComp = styleOpt.icon;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() => {
                      setInvestStyle(styleOpt.id as any);
                      fetchAiInsights(styleOpt.id);
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "bg-app-accent1/10 border-app-accent1 text-app-text-bright shadow-sm ring-1 ring-app-accent1"
                        : "bg-app-bg/50 border-app-border text-app-text/70 hover:border-app-text/30 hover:bg-app-bg"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-app-accent1 text-app-bg flex items-center justify-center text-[10px]">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isSelected ? "bg-app-accent1 text-app-bg" : "bg-app-card text-app-text/60"}`}>
                        <IconComp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-app-text-bright line-clamp-1">
                        {styleOpt.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-app-text/60 line-clamp-2 leading-tight">
                      {styleOpt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI LOADING / ERROR STATES */}
          {isAiInsightsLoading && (
            <div className="bg-app-card rounded-[20px] p-12 border border-app-border/60 shadow-lg shadow-black/10 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-app-accent1/30 border-t-app-accent1 animate-spin" />
                <BrainCircuit className="w-6 h-6 text-app-accent1 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-app-text-bright mb-1">
                  Gemini AI Sedang Menganalisis Portofolio Anda...
                </h4>
                <p className="text-xs text-app-text/60">
                  Memantau alur modal, menghitung rasio diversifikasi, dan mencari emiten saham terbaik untuk gaya "{investStyle.toUpperCase()}".
                </p>
              </div>
            </div>
          )}

          {aiInsightsError && !isAiInsightsLoading && (
            <div className="bg-app-danger/10 border border-app-danger/30 rounded-2xl p-4 flex items-center justify-between text-xs text-app-danger">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{aiInsightsError}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchAiInsights(investStyle)}
                className="px-3 py-1 rounded-lg bg-app-danger text-white text-xs font-semibold cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* MAIN AI CONTENT DISPLAY */}
          {aiInsightsData && !isAiInsightsLoading && (
            <>
              {/* SECTION 1: PORTFOLIO FLOW INSIGHTS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* HEALTH SCORE GAUGE & SUMMARY */}
                <div className="lg:col-span-6 bg-app-card rounded-[20px] p-6 border border-app-border/60 flex flex-col gap-4 shadow-lg shadow-black/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-app-accent1/10 text-app-accent1">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-app-text-bright">
                        Kesehatan & Alur Portofolio
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-app-accent1/10 text-app-accent1 border border-app-accent1/20">
                      {aiInsightsData.portfolioHealth?.statusLabel || "Sehat"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-app-bg border border-app-border">
                    <div className="flex flex-col items-center justify-center p-3.5 bg-app-card rounded-xl border border-app-border shrink-0 min-w-[90px]">
                      <span className="text-[10px] font-bold uppercase text-app-text/60 tracking-wider">Skor AI</span>
                      <span className="text-2xl font-extrabold font-mono text-app-accent1">
                        {aiInsightsData.portfolioHealth?.score || 78}
                      </span>
                      <span className="text-[9px] text-app-text/40">/ 100</span>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="w-full bg-app-border/50 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-app-accent1 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${Math.min(100, Math.max(10, aiInsightsData.portfolioHealth?.score || 78))}%` }}
                        />
                      </div>
                      <p className="text-xs text-app-text/80 leading-relaxed line-clamp-3">
                        {aiInsightsData.portfolioHealth?.summary}
                      </p>
                    </div>
                  </div>

                  {/* RECOMMENDED STRATEGIC ACTION */}
                  <div className="p-4 rounded-xl bg-app-accent1/5 border border-app-accent1/20 flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-app-accent1 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-app-accent1 block mb-0.5">
                        Langkah Strategis Berikutnya:
                      </span>
                      <p className="text-xs text-app-text/80 leading-relaxed">
                        {aiInsightsData.portfolioHealth?.recommendedAction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* STRENGTHS & RISKS BREAKDOWN */}
                <div className="lg:col-span-6 bg-app-card rounded-[20px] p-6 border border-app-border/60 flex flex-col gap-4 shadow-lg shadow-black/10">
                  <h3 className="text-sm font-bold text-app-text-bright flex items-center gap-2">
                    <Info className="w-4 h-4 text-app-accent1" />
                    Diagnostik Alur Investasi
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    {/* STRENGTHS */}
                    <div className="p-4 rounded-2xl bg-app-success/5 border border-app-success/20 flex flex-col gap-2">
                      <span className="text-xs font-bold text-app-success flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Kelebihan
                      </span>
                      <ul className="flex flex-col gap-2">
                        {(aiInsightsData.portfolioHealth?.strengths || []).map((st: string, idx: number) => (
                          <li key={idx} className="text-xs text-app-text/80 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-app-success shrink-0 mt-1.5" />
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* RISKS */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex flex-col gap-2">
                      <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Risiko & Area Perbaikan
                      </span>
                      <ul className="flex flex-col gap-2">
                        {(aiInsightsData.portfolioHealth?.risksAndWeaknesses || []).map((rw: string, idx: number) => (
                          <li key={idx} className="text-xs text-app-text/80 flex items-start gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                            <span>{rw}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* DIVERSIFICATION SUMMARY */}
                  <div className="p-3.5 rounded-xl bg-app-bg border border-app-border text-xs text-app-text/70 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-app-accent1 shrink-0" />
                    <span>{aiInsightsData.portfolioHealth?.diversificationAnalysis}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: AI STOCK RECOMMENDATIONS */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-base font-bold text-app-text-bright flex items-center gap-2">
                      <Bot className="w-5 h-5 text-app-accent1" />
                      Rekomendasi Saham Pilihan AI (Gaya {investStyle.toUpperCase()})
                    </h3>
                    <p className="text-xs text-app-text/60">
                      Emiten saham IHSG berkualitas yang paling sesuai dengan gaya investasi Anda saat ini.
                    </p>
                  </div>
                  <span className="text-xs font-medium text-app-text/50">
                    {aiInsightsData.stockRecommendations?.length || 0} Emiten Direkomendasikan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(aiInsightsData.stockRecommendations || []).map((stock: any, idx: number) => {
                    const riskColor =
                      stock.riskLevel === "Rendah" || stock.riskLevel === "Sangat Rendah"
                        ? "bg-app-success/10 text-app-success border-app-success/20"
                        : stock.riskLevel === "Tinggi"
                        ? "bg-app-danger/10 text-app-danger border-app-danger/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20";

                    return (
                      <div
                        key={idx}
                        className="bg-app-card rounded-[20px] p-5 border border-app-border/60 hover:border-app-accent1/50 transition-all shadow-lg shadow-black/5 hover:shadow-black/10 flex flex-col justify-between gap-4 group relative overflow-hidden"
                      >
                        <div className="flex flex-col gap-3">
                          {/* CARD HEADER */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-xl bg-app-accent1 text-app-bg text-xs font-extrabold tracking-wide">
                                {stock.code}
                              </span>
                              {stock.candidateScore && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold flex items-center gap-1">
                                  <Award className="w-3 h-3" /> Skor {stock.candidateScore}/100
                                </span>
                              )}
                              <span className="text-[10px] font-semibold text-app-text/60 truncate max-w-[100px]">
                                {stock.sector}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskColor}`}>
                              {stock.riskLevel}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-bold text-app-text-bright line-clamp-1">
                              {stock.name}
                            </h4>
                          </div>

                          {/* HOLDING PERIOD BADGE */}
                          <div className="flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-app-accent1/5 border border-app-accent1/20 text-[11px] font-semibold text-app-text-bright">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-app-accent1 shrink-0" />
                              <span>Lama Hold: <strong className="text-app-accent1">{stock.holdingPeriod || "6 - 12 Bulan"}</strong></span>
                            </span>
                          </div>

                          {/* METRICS ROW */}
                          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-app-bg border border-app-border text-center">
                            <div>
                              <span className="text-[9px] text-app-text/50 font-semibold block uppercase">Target</span>
                              <span className="text-xs font-bold font-mono text-app-text-bright">{stock.targetPrice}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-app-text/50 font-semibold block uppercase">Upside</span>
                              <span className="text-xs font-bold font-mono text-app-success">{stock.estimatedUpside}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-app-text/50 font-semibold block uppercase">Dividen</span>
                              <span className="text-xs font-bold font-mono text-app-accent1">{stock.dividendYield || "-"}</span>
                            </div>
                          </div>

                          {/* STRENGTHS & RISKS */}
                          {(stock.strengths || stock.risks) && (
                            <div className="grid grid-cols-1 gap-1.5 p-2.5 rounded-xl bg-app-bg border border-app-border text-[10px]">
                              {stock.strengths && (
                                <div className="flex items-start gap-1.5 text-app-success">
                                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span className="font-medium text-app-text/80"><strong className="text-app-success">Kelebihan:</strong> {stock.strengths}</span>
                                </div>
                              )}
                              {stock.risks && (
                                <div className="flex items-start gap-1.5 text-app-danger">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span className="font-medium text-app-text/80"><strong className="text-app-danger">Risiko:</strong> {stock.risks}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* FIT FOR GOAL & DIVERSIFICATION */}
                          {(stock.fitForGoal || stock.diversificationImpact) && (
                            <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-app-card/60 border border-app-border/80 text-[10px] text-app-text/80">
                              {stock.fitForGoal && (
                                <div>
                                  <strong className="text-app-accent1">Sesuai Tujuan:</strong> {stock.fitForGoal}
                                </div>
                              )}
                              {stock.diversificationImpact && (
                                <div>
                                  <strong className="text-app-text-bright">Dampak Diversifikasi:</strong> {stock.diversificationImpact}
                                </div>
                              )}
                            </div>
                          )}

                          {/* TRADING & EXITS: TP, SL, TRAILING STOP */}
                          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-app-bg border border-app-border">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-app-text/50 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-app-accent1" /> Target Exit & Proteksi Risiko
                            </span>
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-app-success/5 border border-app-success/15">
                                <span className="text-[10px] font-bold text-app-success flex items-center gap-1">
                                  <Target className="w-3 h-3" /> TP (Take Profit):
                                </span>
                                <span className="font-bold font-mono text-app-success text-[11px]">
                                  {stock.takeProfit || stock.targetPrice || "-"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-app-danger/5 border border-app-danger/15">
                                <span className="text-[10px] font-bold text-app-danger flex items-center gap-1">
                                  <ShieldAlert className="w-3 h-3" /> SL (Stop Loss):
                                </span>
                                <span className="font-bold font-mono text-app-danger text-[11px]">
                                  {stock.stopLoss || "-"}
                                </span>
                              </div>

                              <div className="flex items-start justify-between gap-1 p-1.5 rounded-lg bg-app-accent1/5 border border-app-accent1/15">
                                <span className="text-[10px] font-bold text-app-accent1 flex items-center gap-1 shrink-0 mt-0.5">
                                  <Zap className="w-3 h-3" /> TS (Trailing Stop):
                                </span>
                                <span className="font-semibold text-app-text/80 text-[10px] text-right line-clamp-2">
                                  {stock.trailingStop || "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* MATCH REASON */}
                          <div className="p-3 rounded-xl bg-app-accent1/5 border border-app-accent1/15 flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-app-accent1 uppercase flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Alasan Cocok:
                            </span>
                            <p className="text-[11px] text-app-text/80 leading-relaxed line-clamp-3">
                              {stock.matchReason}
                            </p>
                          </div>

                          {/* ENTRY STRATEGY */}
                          <div className="p-3 rounded-xl bg-app-bg border border-app-border flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-app-text/60 uppercase flex items-center gap-1">
                              <Target className="w-3 h-3 text-app-accent1" /> Area Beli / Strategi:
                            </span>
                            <p className="text-[11px] text-app-text/70 leading-relaxed line-clamp-2">
                              {stock.entryStrategy}
                            </p>
                          </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <button
                          type="button"
                          onClick={() => {
                            setPortoTxType("beli");
                            setPortoCategory(stock.category === "emas" ? "emas" : "saham");
                            setPortoCode(stock.code);
                            setPortoQty("10");
                            const numPrice = parseFloat((stock.targetPrice || "").replace(/[^0-9]/g, "")) || 0;
                            setPortoPrice(numPrice > 0 ? numPrice.toString() : "");
                            setIsPortfolioModalOpen(true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-app-accent1/10 hover:bg-app-accent1 hover:text-app-bg text-app-accent1 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-app-accent1/20"
                        >
                          <span>Simulasikan / Beli</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal Simulasi ARA/ARB */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-app-card text-app-text w-full max-w-5xl rounded-[20px] shadow-2xl border border-app-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg shrink-0">
              <h2 className="text-lg font-semibold text-app-text-bright flex items-center gap-2">
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
          <div className="bg-app-card text-app-text w-full max-w-md rounded-[20px] shadow-2xl border border-app-border/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
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
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
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
                        className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 ${
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
                        <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                                    className="p-3 hover:bg-app-hover cursor-pointer border-b border-app-border last:border-0 flex flex-col"
                                  >
                                    <span className="font-semibold text-app-text-bright text-sm">
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
                          <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                          <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                        <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                                    className="p-3 hover:bg-app-hover cursor-pointer border-b border-app-border last:border-0 flex flex-col"
                                  >
                                    <span className="font-semibold text-app-text-bright text-sm">
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
                          <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                          <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                          <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                          <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                    <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                        <div className="mt-2 text-xs text-app-text/60 bg-app-bg p-3 rounded-xl border border-app-border">
                          Kepemilikan: <span className="font-semibold text-app-text-bright">{found.qty} {found.category === "saham" ? "Lot" : found.category === "crypto" ? "Koin" : "Gram"}</span> dengan rata-rata beli <span className="font-semibold text-app-text-bright">Rp {found.price.toLocaleString("id-ID")}</span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                      <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                    <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
                      {portoTxType === "beli" ? "Bayar dari Rekening" : "Terima di Rekening"}
                    </label>
                    <select
                      value={portoAccountId}
                      onChange={(e) => {
                      setPortoAccountId(e.target.value);
                      localStorage.setItem('lastAccountId_investasi', e.target.value);
                    }}
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
                      <span className="text-xs font-semibold uppercase tracking-wider text-app-text/70">Ada Biaya Transaksi (Fee)?</span>
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
                        <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                <label className="text-[10px] uppercase font-semibold tracking-wider mb-2 block">
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
                  className="flex-1 py-4 rounded-2xl font-semibold text-sm bg-app-hover hover:bg-app-border/50 text-app-text transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 rounded-2xl font-semibold text-sm bg-app-accent1 text-app-bg hover:opacity-90 transition-opacity shadow-lg"
                >
                  {portoEditId ? "Simpan Perubahan" : portoTxType === "beli" ? "Simpan Pembelian" : "Simpan Penjualan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
