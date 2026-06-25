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
import { format, isSameDay, subDays, startOfDay, endOfDay, isWithinInterval, startOfMonth, endOfMonth, isSameMonth } from "date-fns";
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
  Plus
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
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

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
      const oDate = new Date(o.date);
      const today = new Date();
      if (filterType === "hari_ini") {
        return isSameDay(oDate, today);
      } else if (filterType === "7_hari") {
        return oDate.getTime() >= subDays(today, 7).getTime();
      } else if (filterType === "bulanan") {
        return isSameMonth(oDate, today);
      } else if (filterType === "custom") {
        const start = startOfDay(new Date(customStartDate));
        const end = endOfDay(new Date(customEndDate));
        return isWithinInterval(oDate, { start, end });
      }
      return true;
    });
  }, [grabOrders, filterType, customStartDate, customEndDate]);

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
      const today = new Date();
      for (let i = 0; i <= 24; i++) {
        const d = new Date(today);
        d.setHours(i, 0, 0, 0);
        dataMap[format(d, "HH:mm")] = 0;
      }
      filteredOrders.forEach((o) => {
        const hr = format(new Date(o.date), "HH:00");
        if (dataMap[hr] !== undefined) dataMap[hr] += o.nominalBersih;
      });
    } else {
      // grouping by days
      let numDays = 7;
      if (filterType === "bulanan") numDays = parseInt(format(endOfMonth(new Date()), "dd")) - 1;
      if (filterType === "custom") {
          const s = startOfDay(new Date(customStartDate));
          const e = endOfDay(new Date(customEndDate));
          numDays = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)));
      }
      
      const endD = filterType === "bulanan" ? endOfMonth(new Date()) : filterType === "custom" ? new Date(customEndDate) : new Date();
      const startD = filterType === "bulanan" ? startOfMonth(new Date()) : subDays(endD, numDays);
      
      for (let i = 0; i <= numDays; i++) {
        dataMap[format(subDays(endD, numDays - i), "dd MMM")] = 0;
      }
      filteredOrders.forEach((o) => {
        const dayStr = format(new Date(o.date), "dd MMM");
        if (dataMap[dayStr] !== undefined) dataMap[dayStr] += o.nominalBersih;
      });
    }
    
    return Object.keys(dataMap).map((k) => ({ name: k, amount: dataMap[k] }));
  }, [filteredOrders, filterType, customEndDate, customStartDate]);

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
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6 shrink-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1 tracking-tight">
            Analisis Grab
          </h1>
          <p className="text-app-text/70 text-sm">
            Pantau dan analisis pendapatan dan statistik dari aktivitas Grab Anda.
          </p>
        </div>

        <div className="flex items-center gap-4 hidden md:flex">
          <button onClick={() => setGlobalGrabModalOpen(true)} className="w-10 h-10 rounded-full bg-app-success hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm" title="Transaksi Grab">
            <Car className="w-5 h-5" />
          </button>
          <button onClick={() => setGlobalAddModalOpen(true)} className="w-10 h-10 rounded-full bg-app-accent1 hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm" title="Tambah Transaksi">
            <Plus className="w-5 h-5" />
          </button>
          <Link to="/settings" className="px-4 h-10 rounded-full bg-app-card flex items-center justify-center text-sm font-semibold text-app-text-bright border border-app-border gap-2 hover:bg-app-hover cursor-pointer transition-colors">
            <span className="opacity-800">{user?.displayName?.toUpperCase() || "USER"}</span>
            <div className="w-6 h-6 rounded-full bg-app-accent1 text-xs font-bold flex items-center justify-center text-app-bg overflow-hidden flex-shrink-0">
               {user?.photoURL ? (
                 <img src={user?.photoURL} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 user?.displayName?.substring(0, 2).toUpperCase() || "US"
               )}
            </div>
          </Link>
        </div>
      </header>

      {/* Filter */}
      <div className="flex items-center gap-1 bg-app-card p-1 rounded-full border border-app-border mb-6 overflow-x-auto no-scrollbar w-full">
        {["hari_ini", "7_hari", "bulanan", "custom"].map((ft) => (
          <button
            key={ft}
            onClick={() => setFilterType(ft as any)}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterType === ft ? "bg-app-accent1 text-white shadow-sm" : "bg-transparent text-app-text/60 hover:text-app-text-bright"}`}
          >
            {ft === "hari_ini" ? "Hari Ini" : ft === "7_hari" ? "7 Hari" : ft === "bulanan" ? "Bulanan" : "Kustom"}
          </button>
        ))}
      </div>

      {filterType === "custom" && (
        <div className="flex items-center gap-4 mb-8 bg-app-card p-4 rounded-2xl border border-app-border animate-in zoom-in-95 duration-200">
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">Mulai</label>
            <input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">Sampai</label>
            <input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright" />
          </div>
        </div>
      )}

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* TOTAL PENDAPATAN */}
        <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-success/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <TrendingUp className="w-16 h-16 text-app-success" />
             </div>
             <p className="text-app-text/70 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-2 relative z-10">
                Total Pendapatan
             </p>
             <h3 className="text-xl md:text-3xl font-bold text-app-text-bright relative z-10">
               Rp {totalNominal.toLocaleString("id-ID")}
             </h3>
        </div>

        {/* TOTAL ORDERAN */}
        <div className="bg-app-card rounded-3xl p-6 border border-app-border shadow-sm flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <Receipt className="w-16 h-16 text-blue-500" />
             </div>
             <p className="text-app-text/70 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-2 relative z-10">
                Total Orderan
             </p>
             <h3 className="text-xl md:text-3xl font-bold text-app-text-bright relative z-10">
               {totalOrders}
             </h3>
        </div>

        {/* TOTAL HEMAT */}
        <div className="bg-app-card border border-app-border rounded-3xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Tags className="w-16 h-16 text-app-accent1" />
             </div>
            <p className="text-app-text/70 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-2 relative z-10">
              Total Order Hemat
            </p>
            <h3 className="text-xl md:text-3xl font-bold text-app-text-bright relative z-10">
              {hematOrdersFound}
            </h3>
        </div>

        {/* NOMINAL POTONGAN HEMAT */}
        <div className="bg-app-card border border-app-danger/30 rounded-3xl p-6 shadow-sm flex flex-col justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-danger/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <PiggyBank className="w-16 h-16 text-app-danger" />
             </div>
             <p className="text-app-danger/80 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-2 relative z-10">
                Nominal Potongan Hemat
             </p>
             <h3 className="text-xl md:text-3xl font-bold text-app-danger relative z-10">
               -Rp {simulatedHematDeduction.toLocaleString("id-ID")}
             </h3>
        </div>
      </div>

      {/* TOTAL PER KATEGORI */}
      <h3 className="text-xl font-bold text-app-text-bright mb-4 flex items-center gap-2">
        <Car className="w-5 h-5 text-app-accent1" /> Total per Kategori
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {categoryStats.map((cat) => (
          <div key={cat.label} className="bg-app-card border border-app-border rounded-2xl p-4 shadow-sm flex flex-col items-center text-center hover:border-app-accent1/50 transition-colors relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/5 via-transparent to-transparent pointer-events-none opacity-80 block" />
            <div className="relative z-10 w-full">
              <p className="text-app-text/70 text-xs font-bold uppercase tracking-wider mb-2">{cat.label}</p>
              <h4 className="text-app-success font-bold mb-1">Rp {cat.total.toLocaleString("id-ID")}</h4>
              <p className="text-[10px] text-app-text/50">{cat.count} Orderan</p>
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
      <div className="bg-app-card border border-app-border rounded-3xl p-6 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-80 block" />
        <h3 className="text-lg font-bold text-app-text-bright mb-6 flex items-center gap-2 relative z-10">
          <LineChartIcon className="w-5 h-5 text-app-accent1" /> Grafik Pendapatan
        </h3>
        <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                   <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--color-app-success)" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="var(--color-app-success)" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-app-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--color-app-text)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  opacity={0.5}
                />
                <YAxis
                  stroke="var(--color-app-text)"
                  fontSize={10}
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

