import React, { useState, useEffect } from "react";
import { Plus, HandCoins, Calendar, Info, Trash2, CreditCard, ArrowRightLeft, Wallet, Calculator, Eye, CheckCircle } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { Account, Loan } from "../types";
import { parseNumberInput, formatNumberInput } from "../utils/numberFormat";

import { toast } from "react-hot-toast";

function calculateLoanDetails(loan: Loan) {
  const duration = loan.tenorDuration;
  const numAmount = loan.amount;
  let intVal = loan.interestValue || 0;
  
  const interestAmount = loan.hasInterest ? (loan.interestType === 'percentage' ? (numAmount * intVal / 100) : intVal) : 0;
  const totalPay = numAmount + interestAmount;

  let days = duration;
  if (loan.tenorUnit === 'minggu') days = duration * 7;
  if (loan.tenorUnit === 'bulan') days = duration * 30;

  let payCount = days;
  if (loan.paymentMethod === 'mingguan') payCount = Math.ceil(days / 7);
  if (loan.paymentMethod === 'bulanan') payCount = Math.ceil(days / 30);

  if (payCount <= 0) payCount = 1;

  return {
    totalPrincipal: numAmount,
    totalInterest: interestAmount,
    totalPayment: totalPay,
    installment: totalPay / payCount,
    totalDays: days,
    paymentsCount: payCount
  };
}

function getNextPaymentDate(loan: Loan) {
  const createdDate = new Date(loan.createdAt);
  let nextDate = new Date(createdDate);
  const paidCount = loan.paidPaymentsCount || 0;

  if (loan.paymentMethod === 'harian') {
    nextDate.setDate(createdDate.getDate() + paidCount + 1);
  } else if (loan.paymentMethod === 'mingguan') {
    nextDate.setDate(createdDate.getDate() + (paidCount + 1) * 7);
    // Rough estimate for the next week
  } else if (loan.paymentMethod === 'bulanan') {
    nextDate.setMonth(createdDate.getMonth() + paidCount + 1);
    if (loan.paymentDate) {
      nextDate.setDate(loan.paymentDate);
    }
  }
  return nextDate;
}

function generateSchedule(loan: Loan, details: any) {
  const schedule = [];
  const createdDate = new Date(loan.createdAt);

  for (let i = 0; i < details.paymentsCount; i++) {
    let nextDate = new Date(createdDate);
    if (loan.paymentMethod === 'harian') {
      nextDate.setDate(createdDate.getDate() + i + 1);
    } else if (loan.paymentMethod === 'mingguan') {
      nextDate.setDate(createdDate.getDate() + (i + 1) * 7);
    } else if (loan.paymentMethod === 'bulanan') {
      nextDate.setMonth(createdDate.getMonth() + i + 1);
      if (loan.paymentDate) {
        nextDate.setDate(loan.paymentDate);
      }
    }
    
    schedule.push({
      id: i + 1,
      date: nextDate,
      amount: details.installment,
      isPaid: i < (loan.paidPaymentsCount || 0)
    });
  }
  return schedule;
}

function LoanCard({ loan, deleteLoan, accounts }: { loan: Loan, deleteLoan: (id: string) => void, accounts: Account[] }) {
  const { user } = useStore();
  const details = calculateLoanDetails(loan);
  const paidAmount = loan.paidAmount || 0;
  const remaining = details.totalPayment - paidAmount;
  const paidCount = loan.paidPaymentsCount || 0;
  
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [isManualPayment, setIsManualPayment] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const nextPaymentDate = getNextPaymentDate(loan);
  const isToday = new Date().toDateString() === nextPaymentDate.toDateString();
  const progress = details.totalPayment > 0 ? (paidAmount / details.totalPayment) * 100 : 0;
  const isPaidOff = remaining <= 0;

  const schedule = generateSchedule(loan, details);

  const handlePay = async (amount: number, isPayoff = false) => {
    if (!user) return;
    if (amount <= 0) {
      toast.error("Jumlah tidak valid");
      return;
    }
    if (!selectedAccountId) {
      toast.error("Pilih rekening pembayaran");
      return;
    }
    const acc = accounts.find(a => a.id === selectedAccountId);
    if (!acc || acc.balance < amount) {
      toast.error("Saldo tidak mencukupi");
      return;
    }

    try {
      const batch = writeBatch(db);
      
      const accRef = doc(db, "users", user.uid, "accounts", selectedAccountId);
      batch.update(accRef, { balance: acc.balance - amount });

      const tsxRef = doc(collection(db, "users", user.uid, "transactions"));
      batch.set(tsxRef, {
        type: "expense",
        amount: amount,
        accountId: selectedAccountId,
        date: Date.now(),
        note: `Pembayaran Pinjaman: ${loan.name}`,
        categoryId: "loan-payment",
        categoryName: "Bayar Pinjaman",
        categoryIcon: "HandCoins"
      });

      const loanRef = doc(db, "users", user.uid, "loans", loan.id);
      const newPaidAmount = paidAmount + amount;
      const isFullyPaid = newPaidAmount >= details.totalPayment || isPayoff;
      
      batch.update(loanRef, {
        paidAmount: newPaidAmount,
        paidPaymentsCount: paidCount + 1,
        status: isFullyPaid ? "paid" : "active"
      });

      await batch.commit();
      toast.success("Pembayaran berhasil");
      setIsManualPayment(false);
      setManualAmount("");
    } catch (err) {
      console.error(err);
      toast.error("Gagal melakukan pembayaran");
    }
  };
  
  return (
    <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-sm flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-app-accent1" />
          <h2 className="font-bold text-app-text-bright text-lg">{loan.name}</h2>
        </div>
        <button onClick={() => deleteLoan(loan.id)} className="p-1.5 text-app-danger hover:bg-app-danger/10 rounded-full transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-app-bg/50 rounded-xl p-4 space-y-3 border border-app-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-app-text/70 mb-1">Total Pinjaman</p>
            <p className="font-semibold text-app-text-bright">Rp{details.totalPrincipal.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-xs text-app-text/70 mb-1">Bunga</p>
            <p className="font-semibold text-app-text-bright">Rp{details.totalInterest.toLocaleString("id-ID")}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-app-border/50">
          <div>
            <p className="text-xs text-app-text/70 mb-1">Total Bayar</p>
            <p className="font-semibold text-app-success">Rp{details.totalPayment.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-xs text-app-text/70 mb-1">Cicilan</p>
            <p className="font-semibold text-app-warning">
              Rp{Math.round(details.installment).toLocaleString("id-ID")}/{loan.paymentMethod === 'harian' ? 'hari' : loan.paymentMethod === 'mingguan' ? 'minggu' : 'bulan'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-app-border/50">
          <div>
            <p className="text-xs text-app-text/70 mb-1">Sudah Dibayar</p>
            <p className="font-semibold text-app-success">Rp{paidAmount.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-xs text-app-text/70 mb-1">Sisa Hutang</p>
            <p className="font-semibold text-app-danger">Rp{remaining.toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-app-border/50">
          <div className="flex flex-col">
            <p className="text-xs text-app-text/70">Tenor: {loan.tenorDuration} {loan.tenorUnit}</p>
            {loan.paymentMethod === 'mingguan' && loan.paymentDay && (
              <p className="text-[10px] text-app-text/50">Tiap {loan.paymentDay}</p>
            )}
            {loan.paymentMethod === 'bulanan' && loan.paymentDate && (
              <p className="text-[10px] text-app-text/50">Tanggal {loan.paymentDate}</p>
            )}
          </div>
          <p className="text-xs text-app-text/70">{paidCount} / {details.paymentsCount}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 mb-1">
        <span className="text-xs text-app-text/70">Progress</span>
        <span className="text-xs font-medium text-app-text-bright">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-app-bg rounded-full h-1.5 mb-5 overflow-hidden border border-app-border/50">
        <div 
          className="bg-app-accent1 h-1.5 rounded-full transition-all duration-500" 
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
        />
      </div>

      <div className="bg-app-bg/50 rounded-xl p-3 border border-app-border/50 flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-app-text/70" />
          <span className="text-sm text-app-text-bright">
            {nextPaymentDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
        {isToday && (
          <span className="text-xs font-medium bg-app-warning/20 text-app-warning px-2 py-1 rounded-md">
            Hari ini
          </span>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-xs text-app-text/70 mb-1">Pilih Rekening Pembayaran</label>
        <div className="flex items-center gap-2 bg-app-bg border border-app-border rounded-xl px-3 py-2">
          <Wallet className="w-4 h-4 text-app-text/50" />
          <select 
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-app-text-bright w-full"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id} className="bg-[#1C1C1E] text-white">
                {acc.name} - Rp{acc.balance.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isManualPayment && (
        <div className="mb-4 bg-app-bg p-3 rounded-xl border border-app-border">
          <label className="block text-xs text-app-text/70 mb-1">Nominal Pembayaran Manual</label>
          <div className="flex gap-2">
            <input 
              type="number"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="Contoh: 100000"
              className="flex-1 bg-transparent border border-app-border rounded-lg px-3 py-2 text-sm text-app-text-bright outline-none focus:border-app-accent1"
            />
            <button 
              onClick={() => handlePay(Number(manualAmount))}
              disabled={!manualAmount || Number(manualAmount) <= 0}
              className="bg-app-accent1 text-app-bg px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              Bayar
            </button>
          </div>
          <p className="text-[10px] text-app-text/50 mt-1">Sisa yang harus dibayar: Rp{remaining.toLocaleString('id-ID')}</p>
        </div>
      )}

      {isPaidOff ? (
        <div className="bg-app-success/10 text-app-success p-3 rounded-xl border border-app-success/20 flex items-center justify-center gap-2 font-bold text-sm">
          <CheckCircle className="w-5 h-5" />
          Pinjaman Lunas
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => handlePay(Math.round(details.installment))}
            className="flex items-center justify-center gap-2 py-2.5 bg-app-success text-app-bg rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Wallet className="w-4 h-4" /> Bayar Sekarang
          </button>
          <button 
            onClick={() => setIsManualPayment(!isManualPayment)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors border ${isManualPayment ? 'bg-app-hover border-app-border text-app-text-bright' : 'bg-app-bg border-app-border text-app-text-bright hover:bg-app-hover'}`}
          >
            <Calculator className="w-4 h-4" /> Bayar Manual
          </button>
          <button 
            onClick={() => setIsScheduleOpen(true)}
            className="flex items-center justify-center gap-2 py-2.5 bg-app-bg border border-app-border text-app-text-bright rounded-xl font-medium text-sm hover:bg-app-hover transition-colors"
          >
            <Eye className="w-4 h-4" /> Lihat Jadwal
          </button>
          <button 
            onClick={() => handlePay(remaining, true)}
            className="flex items-center justify-center gap-2 py-2.5 bg-app-bg border border-app-danger/50 text-app-danger rounded-xl font-medium text-sm hover:bg-app-danger/10 transition-colors"
          >
            <CheckCircle className="w-4 h-4" /> Lunasi
          </button>
        </div>
      )}

      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C1C1E] border border-app-border rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-app-border flex justify-between items-center">
              <h3 className="font-bold text-app-text-bright">Jadwal Pembayaran</h3>
              <button onClick={() => setIsScheduleOpen(false)} className="text-app-text/50 hover:text-app-text-bright">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {schedule.map((item) => (
                <div key={item.id} className={`flex items-center justify-between p-3 rounded-xl border ${item.isPaid ? 'bg-app-success/10 border-app-success/20' : 'bg-app-bg border-app-border'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.isPaid ? 'bg-app-success text-app-bg' : 'bg-app-card text-app-text/50'}`}>
                      {item.isPaid ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">{item.id}</span>}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${item.isPaid ? 'text-app-success' : 'text-app-text-bright'}`}>
                        Rp{Math.round(item.amount).toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-app-text/70">
                        {item.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  {item.isPaid && (
                    <span className="text-xs font-bold text-app-success uppercase tracking-wider">Lunas</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Loans() {
  const { user } = useStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [hasInterest, setHasInterest] = useState(false);
  const [interestType, setInterestType] = useState<"percentage" | "nominal">("percentage");
  const [interestValue, setInterestValue] = useState("");
  
  const [tenorUnit, setTenorUnit] = useState<"hari" | "minggu" | "bulan">("hari");
  const [tenorDuration, setTenorDuration] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"harian" | "mingguan" | "bulanan">("harian");
  const [paymentDay, setPaymentDay] = useState("Senin");
  const [paymentDate, setPaymentDate] = useState(1);

  const [depositToAccount, setDepositToAccount] = useState(false);
  const [accountId, setAccountId] = useState("");

  const [autoDebit, setAutoDebit] = useState(false);
  const [autoDebitAccountId, setAutoDebitAccountId] = useState("");

  const [calculationResult, setCalculationResult] = useState<{
    totalPrincipal: number;
    totalInterest: number;
    totalPayment: number;
    installment: number;
    totalDays: number;
    paymentsCount: number;
  } | null>(null);

  useEffect(() => {
    setCalculationResult(null);
  }, [amount, hasInterest, interestType, interestValue, tenorUnit, tenorDuration, paymentMethod]);

  useEffect(() => {
    if (!user) return;
    
    // Fetch Accounts
    const accUnsub = onSnapshot(collection(db, "users", user.uid, "accounts"), (snap) => {
      const accts: Account[] = [];
      snap.forEach((d) => accts.push({ id: d.id, ...d.data() } as Account));
      setAccounts(accts);
      if (accts.length > 0) {
        if (!accountId) setAccountId(accts[0].id);
        if (!autoDebitAccountId) setAutoDebitAccountId(accts[0].id);
      }
    });

    // Fetch Loans
    const loanUnsub = onSnapshot(collection(db, "users", user.uid, "loans"), (snap) => {
      const fetched: Loan[] = [];
      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Loan));
      // sort by created date descending
      fetched.sort((a, b) => b.createdAt - a.createdAt);
      setLoans(fetched);
    });

    return () => {
      accUnsub();
      loanUnsub();
    };
  }, [user]);

  const openAddModal = () => {
    setName("");
    setAmount("");
    setHasInterest(false);
    setInterestType("percentage");
    setInterestValue("");
    setTenorUnit("hari");
    setTenorDuration("");
    setPaymentMethod("harian");
    setPaymentDay("Senin");
    setPaymentDate(1);
    setDepositToAccount(false);
    setAutoDebit(false);
    setIsModalOpen(true);
  };

  const closeAddModal = () => {
    setIsModalOpen(false);
  };

  const handleCalculate = () => {
    const numAmount = parseNumberInput(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Jumlah pinjaman tidak valid");
      return;
    }

    const duration = parseInt(tenorDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      toast.error("Tenor tidak valid");
      return;
    }

    let intVal = 0;
    if (hasInterest) {
      intVal = parseNumberInput(interestValue);
      if (!intVal || intVal <= 0) {
        toast.error("Nilai bunga tidak valid");
        return;
      }
    }

    const interestAmount = hasInterest ? (interestType === 'percentage' ? (numAmount * intVal / 100) : intVal) : 0;
    const totalPay = numAmount + interestAmount;

    let days = duration;
    if (tenorUnit === 'minggu') days = duration * 7;
    if (tenorUnit === 'bulan') days = duration * 30;

    let payCount = days;
    if (paymentMethod === 'mingguan') payCount = Math.ceil(days / 7);
    if (paymentMethod === 'bulanan') payCount = Math.ceil(days / 30);

    if (payCount <= 0) payCount = 1;

    setCalculationResult({
      totalPrincipal: numAmount,
      totalInterest: interestAmount,
      totalPayment: totalPay,
      installment: totalPay / payCount,
      totalDays: days,
      paymentsCount: payCount
    });
  };

  const saveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      toast.error("Nama pinjaman harus diisi");
      return;
    }

    const numAmount = parseNumberInput(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Jumlah pinjaman tidak valid");
      return;
    }

    const duration = parseInt(tenorDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      toast.error("Tenor tidak valid");
      return;
    }

    const newLoanRef = doc(collection(db, "users", user.uid, "loans"));
    
    const loanData: any = {
      name: name || "Pinjaman",
      amount: numAmount,
      hasInterest,
      tenorUnit,
      tenorDuration: duration,
      paymentMethod,
      ...(paymentMethod === "mingguan" && { paymentDay }),
      ...(paymentMethod === "bulanan" && { paymentDate }),
      depositToAccount,
      autoDebit,
      createdAt: Date.now(),
      status: "active",
      paidAmount: 0,
      paidPaymentsCount: 0
    };

    if (hasInterest) {
      const intVal = parseNumberInput(interestValue);
      if (!intVal || intVal <= 0) {
        toast.error("Nilai bunga tidak valid");
        return;
      }
      loanData.interestType = interestType;
      loanData.interestValue = intVal;
    }

    if (depositToAccount) {
      if (!accountId) {
        toast.error("Pilih rekening tujuan");
        return;
      }
      loanData.accountId = accountId;
    }
    
    if (autoDebit) {
      if (!autoDebitAccountId) {
        toast.error("Pilih rekening potongan");
        return;
      }
      loanData.autoDebitAccountId = autoDebitAccountId;
    }

    try {
      const batch = writeBatch(db);
      batch.set(newLoanRef, loanData);

      // If deposit to account, we must increase account balance AND add a transaction
      if (depositToAccount && accountId) {
        const accRef = doc(db, "users", user.uid, "accounts", accountId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) {
          const currentBal = accDoc.data().balance || 0;
          batch.update(accRef, { balance: currentBal + numAmount });
        }

        const tsxRef = doc(collection(db, "users", user.uid, "transactions"));
        batch.set(tsxRef, {
          type: "income",
          amount: numAmount,
          accountId: accountId,
          date: Date.now(),
          note: "Pencairan Pinjaman",
          categoryId: "loan-income",
          categoryName: "Pinjaman",
          categoryIcon: "HandCoins"
        });
      }

      await batch.commit();
      toast.success("Pinjaman berhasil disimpan");
      closeAddModal();
    } catch (err) {
      console.error("Failed to save loan", err);
      toast.error("Gagal menyimpan pinjaman");
    }
  };

  const deleteLoan = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "loans", id));
      toast.success("Pinjaman dihapus");
    } catch (error) {
      toast.error("Gagal menghapus pinjaman");
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text animate-in fade-in zoom-in-95 duration-300">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1">
              Pinjaman Anda
            </h1>
            <p className="text-app-text/70 text-sm">
              Kelola data pinjaman Anda beserta bunga dan pengaturan auto debit.
            </p>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={openAddModal}
              className="px-3 h-10 rounded-full bg-app-accent1 hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm font-bold text-sm"
              title="Tambah Pinjaman"
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 hidden md:flex">
          <button
            onClick={openAddModal}
            className="px-4 h-10 rounded-full bg-app-accent1 hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm font-bold text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pinjaman
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loans.map(loan => (
          <LoanCard key={loan.id} loan={loan} deleteLoan={deleteLoan} accounts={accounts} />
        ))}
        {loans.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-app-text/50 border border-dashed border-app-border rounded-3xl">
            <HandCoins className="w-12 h-12 mb-3 text-app-text/30" />
            <p>Belum ada data pinjaman.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-20">
          <div className="bg-app-card text-app-text w-full max-w-md rounded-3xl shadow-2xl border border-app-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h2 className="text-lg font-semibold text-app-text-bright">
                Tambah Pinjaman
              </h2>
              <button
                onClick={closeAddModal}
                className="p-2 hover:bg-app-hover rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={saveLoan} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Nama Pinjaman */}
              <div>
                <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">
                  Nama Pinjaman
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: KPR / Motor"
                  className="w-full bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                />
              </div>

              {/* Jumlah Pinjaman */}
              <div>
                <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">
                  Jumlah Pinjaman (Rp)
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(formatNumberInput(e.target.value))}
                  placeholder="0"
                  className="w-full bg-app-bg border border-app-border text-app-text-bright text-lg font-bold rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                />
              </div>

              {/* Bunga */}
              <div className="bg-app-bg p-4 rounded-xl border border-app-border">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-bold text-app-text-bright">Ada Bunga?</label>
                  <button
                    type="button"
                    onClick={() => setHasInterest(!hasInterest)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${hasInterest ? 'bg-app-accent1' : 'bg-app-border'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${hasInterest ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                
                {hasInterest && (
                  <div className="space-y-3 pt-3 border-t border-app-border/50">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setInterestType("percentage")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${interestType === "percentage" ? "bg-app-accent1 text-app-bg" : "bg-app-card text-app-text"}`}
                      >
                        Persentase (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterestType("nominal")}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${interestType === "nominal" ? "bg-app-accent1 text-app-bg" : "bg-app-card text-app-text"}`}
                      >
                        Nominal (Rp)
                      </button>
                    </div>
                    <input
                      type="text"
                      value={interestValue}
                      onChange={(e) => setInterestValue(interestType === "nominal" ? formatNumberInput(e.target.value) : e.target.value)}
                      placeholder={interestType === "percentage" ? "10" : "50.000"}
                      className="w-full bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                    />
                  </div>
                )}
              </div>

              {/* Tenor */}
              <div>
                <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">
                  Tenor Pinjaman
                </label>
                <div className="flex gap-2 mb-3">
                  {["hari", "minggu", "bulan"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTenorUnit(t as any)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize ${tenorUnit === t ? "bg-app-accent1 text-app-bg" : "bg-app-bg border border-app-border text-app-text"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={tenorDuration}
                  onChange={(e) => setTenorDuration(e.target.value)}
                  placeholder={`Berapa ${tenorUnit}?`}
                  className="w-full bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1 mb-5"
                />
              </div>

              {/* Metode Pembayaran */}
              <div>
                <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">
                  Metode Bayar
                </label>
                <div className="flex gap-2 mb-3">
                  {["harian", "mingguan", "bulanan"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPaymentMethod(t as any)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize ${paymentMethod === t ? "bg-app-accent1 text-app-bg" : "bg-app-bg border border-app-border text-app-text"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {paymentMethod === "mingguan" && (
                  <div className="mt-3">
                    <select
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-full bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                    >
                      {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => (
                        <option key={day} value={day} className="bg-[#1C1C1E] text-white">{day}</option>
                      ))}
                    </select>
                  </div>
                )}
                {paymentMethod === "bulanan" && (
                  <div className="mt-3">
                    <select
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(Number(e.target.value))}
                      className="w-full bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => (
                        <option key={date} value={date} className="bg-[#1C1C1E] text-white">Tanggal {date}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Saldo Masuk */}
              <div className="bg-app-bg p-4 rounded-xl border border-app-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-bold text-app-text-bright block">Saldo Masuk?</label>
                    <span className="text-xs text-app-text/60">Tambahkan ke saldo rekening</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDepositToAccount(!depositToAccount)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${depositToAccount ? 'bg-app-accent1' : 'bg-app-border'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${depositToAccount ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                
                {depositToAccount && (
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full mt-2 bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                  >
                    <option value="" disabled className="bg-[#1C1C1E] text-white">Pilih Rekening Tujuan</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-[#1C1C1E] text-white">{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Auto Debit */}
              <div className="bg-app-bg p-4 rounded-xl border border-app-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-sm font-bold text-app-text-bright block">Auto Debit?</label>
                    <span className="text-xs text-app-text/60">Potong saldo otomatis saat jatuh tempo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAutoDebit(!autoDebit)}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${autoDebit ? 'bg-app-accent1' : 'bg-app-border'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${autoDebit ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                
                {autoDebit && (
                  <select
                    value={autoDebitAccountId}
                    onChange={(e) => setAutoDebitAccountId(e.target.value)}
                    className="w-full mt-2 bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                  >
                    <option value="" disabled className="bg-[#1C1C1E] text-white">Pilih Rekening Potongan</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-[#1C1C1E] text-white">{acc.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Hasil Perhitungan */}
              {calculationResult && (
                <div className="bg-app-card p-4 rounded-xl border border-app-border space-y-4">
                  <h3 className="font-bold text-app-text-bright">Hasil Perhitungan</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-app-text/70 mb-1">Total Pinjaman</p>
                      <p className="font-bold text-app-text-bright">Rp {calculationResult.totalPrincipal.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-app-text/70 mb-1">Bunga</p>
                      <p className="font-bold text-app-text-bright">Rp {calculationResult.totalInterest.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-app-text/70 mb-1">Total Bayar</p>
                      <p className="font-bold text-app-success">Rp {calculationResult.totalPayment.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-app-text/70 mb-1">Cicilan</p>
                      <p className="font-bold text-app-warning">Rp {calculationResult.installment.toLocaleString("id-ID", { maximumFractionDigits: 0 })} / {paymentMethod === "harian" ? "hari" : paymentMethod === "mingguan" ? "minggu" : "bulan"}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-app-border/50">
                    <p className="text-xs text-app-text/70">Tenor: {tenorDuration} {tenorUnit} ({calculationResult.paymentsCount}x pembayaran)</p>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-3.5 rounded-xl font-bold text-sm bg-app-card hover:bg-app-hover border border-app-border text-app-text transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleCalculate}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-app-accent1 text-app-bg hover:opacity-90 transition-opacity"
                >
                  Hitung Cicilan
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-app-success text-app-bg hover:opacity-90 transition-opacity"
                >
                  Simpan Pinjaman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
