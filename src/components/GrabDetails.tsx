import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { Transaction } from "../types";
import { format, isSameDay, subDays, addDays, startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth, isSameMonth, subMonths, addMonths } from "date-fns";
import { parseTxDate, safeFormatDate } from "../utils/dateUtils";
import { id as localeId } from "date-fns/locale";
import { Link } from "react-router-dom";
import {
  Car,
  TrendingDown,
  TrendingUp,
  LineChart as LineChartIcon,
  Receipt,
  PiggyBank,
  Tags,
  Plus,
  ChevronLeft,
  ChevronRight
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
import { TextReveal, HoverCard } from "./MotionWrappers";

interface ParsedGrabOrder {
  id: string;
  date: number;
  label: string;
  type: "tunai" | "nontunai";
  appDriver: number;
  appCust: number;
  cashDiterima: number;
  nominalBersih: number;
  rawNote: string;
}

export default function GrabDetails() {
  const { user, setGlobalAddModalOpen, setGlobalGrabModalOpen } = useStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<"hari_ini" | "7_hari" | "bulanan" | "custom">("hari_ini");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const handlePrev = () => {
    if (filterType === "hari_ini") setCurrentDate((prev) => subDays(prev, 1));
    else if (filterType === "7_hari") setCurrentDate((prev) => subDays(prev, 7));
    else if (filterType === "bulanan") setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNext = () => {
    if (filterType === "hari_ini") setCurrentDate((prev) => addDays(prev, 1));
    else if (filterType === "7_hari") setCurrentDate((prev) => addDays(prev, 7));
    else if (filterType === "bulanan") setCurrentDate((prev) => addMonths(prev, 1));
  };

  const getPeriodText = () => {
    if (filterType === "hari_ini") {
      if (isSameDay(currentDate, new Date())) return "Hari Ini - " + format(currentDate, "EEEE, d MMM yyyy", { locale: localeId });
      return format(currentDate, "EEEE, d MMM yyyy", { locale: localeId });
    }
    if (filterType === "7_hari") {
      const start = subDays(currentDate, 6);
      const startFormatted = format(start, "d MMM", { locale: localeId });
      const endFormatted = format(currentDate, "d MMM yyyy", { locale: localeId });
      return `${startFormatted} - ${endFormatted}`;
    }
    if (filterType === "bulanan") {
      if (isSameMonth(currentDate, new Date())) return "Bulan Ini - " + format(currentDate, "MMMM yyyy", { locale: localeId });
      return format(currentDate, "MMMM yyyy", { locale: localeId });
    }
    return "Custom";
  };

  useEffect(() => {
    if (!user) return;
    const tsxQ = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc")
    );
    const unsub = onSnapshot(tsxQ, (snap) => {
      const tsxs: Transaction[] = [];
      snap.forEach((d) => tsxs.push({ id: d.id, ...d.data() } as unknown as Transaction));
      setTransactions(tsxs);
    });
    return () => unsub();
  }, [user]);

  // Parse grab transactions
  const grabOrders = useMemo(() => {
    const orders: ParsedGrabOrder[] = [];
    transactions.forEach((t) => {
      if (t.note.startsWith("Grab Cash")) {
        const labelMatch = t.note.match(/Grab Cash \((.*?)\)/);
        const driverMatch = t.note.match(/Driver (\d+)/);
        const custMatch = t.note.match(/Cust (\d+)/);

        const label = labelMatch ? labelMatch[1] : "Reguler";
        const appDriver = driverMatch ? parseInt(driverMatch[1], 10) : 0;
        const appCust = custMatch ? parseInt(custMatch[1], 10) : 0;
        const cashDiterima = t.amount;
        const rawNote = t.note;

        const tip = Math.max(0, cashDiterima - appCust);
        const nominalBersih = appDriver + tip;

        orders.push({
          id: t.id,
          date: t.date,
          label,
          type: "tunai",
          appDriver,
          appCust,
          cashDiterima,
          nominalBersih,
          rawNote,
        });
      } else if (t.note.startsWith("Grab Non-Tunai")) {
        const labelMatch = t.note.match(/Grab Non-Tunai \((.*?)\)/);
        const label = labelMatch ? labelMatch[1] : "Reguler";

        orders.push({
          id: t.id,
          date: t.date,
          label,
          type: "nontunai",
          appDriver: t.amount,
          appCust: t.amount,
          cashDiterima: 0,
          nominalBersih: t.amount,
          rawNote: t.note,
        });
      }
    });
    return orders;
  }, [transactions]);

  const filteredOrders = useMemo(() => {
    return grabOrders.filter((o) => {
      const oDate = parseTxDate(o.date);
      if (filterType === "hari_ini") {
        return isSameDay(oDate, currentDate);
      } else if (filterType === "7_hari") {
        const start = startOfDay(subDays(currentDate, 6));
        const end = endOfDay(currentDate);
        return isWithinInterval(oDate, { start, end });
      } else if (filterType === "bulanan") {
        return isSameMonth(oDate, currentDate);
      } else if (filterType === "custom") {
        const start = startOfDay(parseTxDate(customStartDate));
        const end = endOfDay(parseTxDate(customEndDate));
        return isWithinInterval(oDate, { start, end });
      }
      return true;
    });
  }, [grabOrders, filterType, currentDate, customStartDate, customEndDate]);

  // Hemat deductions logic
  const hematOrdersFound = filteredOrders.filter((o) => o.label.toLowerCase().includes("hemat")).length;
  let simulatedHematDeduction = 0;
  if (hematOrdersFound >= 10) simulatedHematDeduction = 20000;
  else if (hematOrdersFound >= 7) simulatedHematDeduction = 18000;
  else if (hematOrdersFound >= 5) simulatedHematDeduction = 13500;
  else if (hematOrdersFound >= 3) simulatedHematDeduction = 8500;
  else if (hematOrdersFound >= 1) simulatedHematDeduction = 3000;

  // Chart Data
  const chartData = useMemo(() => {
    const dataMap: { [key: string]: number } = {};
    if (filterType === "hari_ini") {
      // display 24 hours
      const refDate = currentDate;
      for (let i = 0; i <= 24; i++) {
        const d = new Date(refDate);
        d.setHours(i, 0, 0, 0);
        dataMap[format(d, "HH:mm")] = 0;
      }
      filteredOrders.forEach((o) => {
        const hr = safeFormatDate(o.date, "HH:00");
        if (dataMap[hr] !== undefined) dataMap[hr] += o.nominalBersih;
      });
    } else {
      // grouping by days
      let numDays = 7;
      if (filterType === "bulanan") numDays = parseInt(format(endOfMonth(currentDate), "dd")) - 1;
      if (filterType === "custom") {
          const s = startOfDay(parseTxDate(customStartDate));
          const e = endOfDay(parseTxDate(customEndDate));
          numDays = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)));
      }

      const endD = filterType === "bulanan" ? endOfMonth(currentDate) : filterType === "custom" ? parseTxDate(customEndDate) : currentDate;
      const startD = filterType === "bulanan" ? startOfMonth(currentDate) : subDays(endD, numDays);

      for (let i = 0; i <= numDays; i++) {
        dataMap[format(subDays(endD, numDays - i), "dd MMM")] = 0;
      }
      filteredOrders.forEach((o) => {
        const dayStr = safeFormatDate(o.date, "dd MMM");
        if (dataMap[dayStr] !== undefined) dataMap[dayStr] += o.nominalBersih;
      });
    }

    return Object.keys(dataMap).map((k) => ({ name: k, amount: dataMap[k] }));
  }, [filteredOrders, filterType, currentDate, customEndDate, customStartDate]);

  const totalNominal = filteredOrders.reduce((sum, o) => sum + o.nominalBersih, 0);
  const totalOrders = filteredOrders.length;

  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {};
    filteredOrders.forEach((o) => {
      const cat = o.label;
      if (!stats[cat]) {
        stats[cat] = { count: 0, total: 0 };
      }
      stats[cat].count += 1;
      stats[cat].total += o.nominalBersih;
    });
    return Object.entries(stats)
      .map(([label, data]) => ({ label, ...data }))
      .sort((a, b) => b.total - a.total);
  }, [filteredOrders]);

  return (
    <div className="route-workbench page-register route-grab mx-auto flex h-full w-full max-w-7xl flex-1 flex-col overflow-y-auto bg-app-bg p-4 pb-32 text-app-text md:p-8 md:pb-8">
      {/* HEADER */}
      <header className="workbench-hero mb-6 flex shrink-0 flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="workbench-hero-copy">
          <p className="page-kicker" aria-hidden="true"><span>GR</span> Driver settlement</p>
          <h1 className="text-2xl text-app-text-bright md:text-3xl">
            <TextReveal text="Analisis Grab" />
          </h1>
          <p className="text-app-text/70 text-sm">
            Pantau dan analisis pendapatan dan statistik dari aktivitas Grab Anda.
          </p>
        </div>

        <button type="button" onClick={() => setGlobalGrabModalOpen(true)} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-app-accent1 px-4 text-sm font-semibold text-app-bg md:hidden" title="Transaksi Grab">
          <Car className="h-4 w-4" /> Catat Grab
        </button>

        <div className="workbench-hero-actions hidden items-center gap-2 md:flex">
          <button type="button" onClick={() => setGlobalGrabModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-app-accent1 px-4 text-sm font-semibold text-app-bg" title="Transaksi Grab">
            <Car className="w-4 h-4" /> Catat Grab
          </button>
          <button type="button" onClick={() => setGlobalAddModalOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-lg border border-app-border px-4 text-sm font-semibold text-app-text-bright" title="Tambah Transaksi">
            <Plus className="w-4 h-4" /> Transaksi
          </button>
          <Link to="/settings" className="flex h-11 items-center justify-center gap-2 rounded-lg border border-app-border px-3 text-sm font-semibold text-app-text-bright hover:bg-app-hover">
            <span>Profil</span>
            <div className="w-6 h-6 rounded-full bg-app-accent1 text-xs font-semibold flex items-center justify-center text-app-bg overflow-hidden flex-shrink-0">
               {user?.photoURL ? (
                 <img src={user?.photoURL} alt="" className="w-full h-full object-cover" />
               ) : (
                 user?.displayName?.substring(0, 2).toUpperCase() || "US"
               )}
            </div>
          </Link>
        </div>
      </header>

      {/* Filter */}
      <div className="bg-app-card rounded-xl p-1 flex items-center justify-between mb-6 border border-app-border w-full shrink-0">
        {["hari_ini", "7_hari", "bulanan", "custom"].map((ft) => (
          <button type="button"
            key={ft}
            onClick={() => {
              setFilterType(ft as any);
              setCurrentDate(new Date());
            }}
            className={`flex-1 py-2 rounded-xl text-[13px] font-semibold transition-colors ${filterType === ft ? "bg-app-accent1 text-app-bg" : "bg-transparent text-app-text/60 hover:text-app-text-bright"}`}
          >
            {ft === "hari_ini" ? "Harian" : ft === "7_hari" ? "Mingguan" : ft === "bulanan" ? "Bulanan" : "Custom"}
          </button>
        ))}
      </div>

      {/* Date Navigator / Custom Range */}
      {filterType === "custom" ? (
        <div className="flex items-center gap-2 mb-6 px-2 shrink-0 animate-in fade-in duration-200">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="flex-1 bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-3 py-2 outline-none focus:border-app-accent1"
          />
          <span className="text-app-text/50">-</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="flex-1 bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-3 py-2 outline-none focus:border-app-accent1"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between mb-6 px-2 shrink-0">
          <button type="button" onClick={handlePrev} className="p-1 hover:bg-app-hover rounded-full transition-colors cursor-pointer" aria-label="Periode sebelumnya">
            <ChevronLeft className="w-5 h-5 text-app-accent1" />
          </button>
          <span className="font-semibold text-sm text-app-text-bright">
            {getPeriodText()}
          </span>
          <button type="button" onClick={handleNext} className="p-1 hover:bg-app-hover rounded-full transition-colors cursor-pointer" aria-label="Periode berikutnya">
            <ChevronRight className="w-5 h-5 text-app-accent1" />
          </button>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="metric-register mb-8 grid grid-cols-2 gap-0 border-y border-app-border md:grid-cols-4">
        {/* TOTAL PENDAPATAN */}
        <HoverCard className="bg-app-card rounded-2xl p-6 border border-app-border flex flex-col justify-center relative overflow-hidden w-full">

             <div className="absolute top-0 right-0 p-4 opacity-10">
               <TrendingUp className="w-16 h-16 text-app-success" />
             </div>
             <p className="text-app-text/70 text-xs md:text-xs font-medium uppercase tracking-wider mb-2 relative z-10">
                Total Pendapatan
             </p>
             <h3 className="text-xl md:text-3xl font-semibold text-app-text-bright relative z-10 font-mono">
               Rp {totalNominal.toLocaleString("id-ID")}
             </h3>
        </HoverCard>

        {/* TOTAL ORDERAN */}
        <HoverCard className="bg-app-card rounded-2xl p-6 border border-app-border flex flex-col justify-center relative overflow-hidden w-full">

             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Receipt className="w-16 h-16 text-app-accent1" />
             </div>
             <p className="text-app-text/70 text-xs md:text-xs font-medium uppercase tracking-wider mb-2 relative z-10">
                Total Orderan
             </p>
             <h3 className="text-xl md:text-3xl font-semibold text-app-text-bright relative z-10 font-mono">
               {totalOrders}
             </h3>
        </HoverCard>

        {/* TOTAL HEMAT */}
        <HoverCard className="bg-app-card border border-app-border rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden w-full">

            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Tags className="w-16 h-16 text-app-accent1" />
             </div>
            <p className="text-app-text/70 text-xs md:text-xs font-medium uppercase tracking-wider mb-2 relative z-10">
              Total Order Hemat
            </p>
            <h3 className="text-xl md:text-3xl font-semibold text-app-text-bright relative z-10 font-mono">
              {hematOrdersFound}
            </h3>
        </HoverCard>

        {/* NOMINAL POTONGAN HEMAT */}
        <HoverCard className="bg-app-card border border-app-danger/30 rounded-2xl p-6 flex flex-col justify-center relative overflow-hidden w-full">

             <div className="absolute top-0 right-0 p-4 opacity-5">
               <PiggyBank className="w-16 h-16 text-app-danger" />
             </div>
             <p className="text-app-danger/80 text-xs md:text-xs font-medium uppercase tracking-wider mb-2 relative z-10">
                Nominal Potongan Hemat
             </p>
             <h3 className="text-xl md:text-3xl font-semibold text-app-danger relative z-10 font-mono">
               -Rp {simulatedHematDeduction.toLocaleString("id-ID")}
             </h3>
        </HoverCard>
      </div>

      {/* TOTAL PER KATEGORI */}
      <h3 className="text-xl font-semibold text-app-text-bright mb-4 flex items-center gap-2">
        <Car className="w-5 h-5 text-app-accent1" /> Total per Kategori
      </h3>
      <div className="category-register mb-8 grid grid-cols-2 gap-0 border-y border-app-border md:grid-cols-4">
        {categoryStats.map((cat) => (
          <div key={cat.label} className="bg-app-card border border-app-border rounded-2xl p-4 flex flex-col items-center text-center hover:border-app-accent1/50 transition-colors relative overflow-hidden">

            <div className="relative z-10 w-full">
              <p className="text-app-text/70 text-xs font-semibold uppercase tracking-wider mb-2">{cat.label}</p>
              <h4 className="text-app-success font-semibold mb-1">Rp {cat.total.toLocaleString("id-ID")}</h4>
              <p className="text-xs text-app-text/50">{cat.count} Orderan</p>
            </div>
          </div>
        ))}
        {categoryStats.length === 0 && (
          <div className="col-span-full p-4 text-center text-app-text/50 text-sm">
            Tidak ada orderan kategori di periode ini.
          </div>
        )}
      </div>

      {/* GRAFIK PENDAPATAN */}
      <div className="grab-cashflow-ledger relative mb-8 overflow-hidden border border-app-border bg-app-card p-6">

        <h3 className="text-lg font-semibold text-app-text-bright mb-6 flex items-center gap-2 relative z-10">
          <LineChartIcon className="w-5 h-5 text-app-accent1" /> Grafik Pendapatan
        </h3>
        <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-app-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-app-text)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  opacity={0.5}
                />
                <YAxis
                  stroke="var(--color-app-text)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `Rp ${(val / 1000)}k`}
                  opacity={0.5}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-app-card)",
                    borderColor: "var(--color-app-border)",
                    borderRadius: "16px",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    color: "var(--color-app-text-bright)",
                  }}
                  itemStyle={{ color: "var(--color-app-text-bright)" }}
                  formatter={(value: number) => [
                    `Rp ${value.toLocaleString("id-ID")}`,
                    "Pendapatan",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-app-success)"
                  strokeWidth={3}
                  dot={{ fill: "var(--color-app-success)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "var(--color-app-success)" }}
                />
              </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
