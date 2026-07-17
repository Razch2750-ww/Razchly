import React, { useState, useEffect } from "react";
import { Plus, HandCoins, Calendar, Info, Trash2, CreditCard, ArrowRightLeft, Wallet, Calculator, Eye, CheckCircle, ChevronUp, Pencil } from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { sendDeviceNotification } from "../utils/notification";
import { Account, Loan } from "../types";
import { parseNumberInput, formatNumberInput } from "../utils/numberFormat";
import { toast } from "react-hot-toast";
import { motion } from "motion/react";
import { HoverCard, ScrollReveal, StaggerContainer, StaggerItem, TextReveal } from "./MotionWrappers";
import { PageShell, ActionBtn, EmptyState, FieldLabel } from "./PageShell";

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
  if (loan.hasTenor === false) return null;
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
  if (loan.hasTenor === false) return [];
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

const LoanCard: React.FC<{ loan: Loan, deleteLoan: (id: string) => Promise<void> | void, onEdit: (loan: Loan) => void, accounts: Account[] }> = ({ loan, deleteLoan, onEdit, accounts }) => {
  const { user } = useStore();
  const details = calculateLoanDetails(loan);
  const paidAmount = loan.paidAmount || 0;
  const remaining = details.totalPayment - paidAmount;
  const paidCount = loan.paidPaymentsCount || 0;
  
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || "");
  const [isManualPayment, setIsManualPayment] = useState(false);
  const [manualAmount, setManualAmount] = useState("");
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const nextPaymentDate = getNextPaymentDate(loan);
  const isToday = nextPaymentDate ? new Date().toDateString() === nextPaymentDate.toDateString() : false;
  const progress = details.totalPayment > 0 ? (paidAmount / details.totalPayment) * 100 : 0;
  const isPaidOff = remaining <= 0;

  const schedule = generateSchedule(loan, details);
  const isLend = loan.type === 'lend';

  const handlePay = async (amount: number, isPayoff = false) => {
    if (!user) return;
    if (amount <= 0) {
      toast.error("Jumlah tidak valid");
      return;
    }
    if (!selectedAccountId) {
      toast.error(isLend ? "Pilih rekening penerimaan" : "Pilih rekening pembayaran");
      return;
    }
    const acc = accounts.find(a => a.id === selectedAccountId);
    if (!isLend && (!acc || acc.balance < amount)) {
      toast.error("Saldo tidak mencukupi");
      return;
    }

    try {
      const batch = writeBatch(db);
      
      const accRef = doc(db, "users", user.uid, "accounts", selectedAccountId);
      if (isLend) {
        batch.update(accRef, { balance: (acc?.balance || 0) + amount });
      } else {
        batch.update(accRef, { balance: (acc?.balance || 0) - amount });
      }

      const tsxRef = doc(collection(db, "users", user.uid, "transactions"));
      batch.set(tsxRef, {
        type: isLend ? "income" : "expense",
        amount: amount,
        accountId: selectedAccountId,
        date: Date.now(),
        note: isLend ? `Penerimaan Piutang: ${loan.name}` : `Pembayaran Pinjaman: ${loan.name}`,
        categoryId: isLend ? "loan-repayment-income" : "loan-payment",
        categoryName: isLend ? "Terima Piutang" : "Bayar Pinjaman",
        categoryIcon: "HandCoins"
      });

      const loanRef = doc(db, "users", user.uid, "loans", loan.id);
      const newPaidAmount = paidAmount + amount;
      const isFullyPaid = newPaidAmount >= details.totalPayment || isPayoff;
      
      batch.update(loanRef, {
        paidAmount: isFullyPaid ? details.totalPayment : newPaidAmount,
        paidPaymentsCount: paidCount + 1,
        status: isFullyPaid ? "paid" : "active"
      });

      await batch.commit();

      sendDeviceNotification(
        isLend ? "Penerimaan Piutang Berhasil 💸" : "Pembayaran Pinjaman Berhasil 💸",
        isLend
          ? `Penerimaan cicilan untuk "${loan.name}" sebesar Rp ${amount.toLocaleString("id-ID")} berhasil dicatat.`
          : `Pembayaran untuk pinjaman "${loan.name}" sebesar Rp ${amount.toLocaleString("id-ID")} berhasil dicatat.`
      );

      toast.success(isLend ? "Penerimaan berhasil dicatat" : "Pembayaran berhasil");
      setIsManualPayment(false);
      setManualAmount("");
    } catch (err) {
      console.error(err);
      toast.error(isLend ? "Gagal mencatat penerimaan" : "Gagal melakukan pembayaran");
    }
  };
  
  if (isPaidOff && !isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="bg-app-card rounded-2xl border border-app-border p-4 shadow-sm flex justify-between items-center opacity-70 group hover:opacity-100 transition-opacity cursor-pointer animate-in fade-in duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-app-success/10 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-app-success" />
          </div>
          <div>
            <h2 className="font-bold text-app-text-bright text-base">
              {loan.name} <span className="text-xs font-normal opacity-50">({isLend ? 'Piutang' : 'Pinjaman'})</span>
            </h2>
            <p className="text-xs text-app-text/60">Rp{details.totalPrincipal.toLocaleString("id-ID")} • Lunas</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(loan); }} 
            className="p-2 text-app-accent1 hover:bg-app-accent1/10 rounded-full transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteLoan(loan.id); }} 
            className="p-2 text-app-danger hover:bg-app-danger/10 rounded-full transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const labelPrefix = isLend ? "Piutang" : "Pinjaman";
  const totalPrincipalLabel = isLend ? "Total Dipinjamkan" : "Total Pinjaman";
  const totalPaymentLabel = isLend ? "Total Diterima" : "Total Bayar";
  const installmentLabel = isLend ? "Cicilan Piutang" : "Cicilan";
  const paidAmountLabel = isLend ? "Sudah Diterima" : "Sudah Dibayar";
  const remainingLabel = isLend ? "Sisa Piutang" : "Sisa Hutang";
  const selectAccountLabel = isLend ? "Pilih Rekening Penerimaan" : "Pilih Rekening Pembayaran";
  const payBtnLabel = isLend ? "Terima Sekarang" : "Bayar Sekarang";
  const payManualLabel = isLend ? "Terima Manual" : "Bayar Manual";
  const payManualAmountLabel = isLend ? "Nominal Penerimaan Manual" : "Nominal Pembayaran Manual";

  return (
    <HoverCard className={`bg-app-card rounded-[24px] border ${isLend ? 'border-app-success/20 hover:border-app-success/40' : 'border-app-accent1/20 hover:border-app-accent1/40'} p-5 shadow-sm flex flex-col relative overflow-hidden group transition-colors w-full`}>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          {isLend ? (
            <HandCoins className="w-5 h-5 text-app-success" />
          ) : (
            <CreditCard className="w-5 h-5 text-app-accent1" />
          )}
          <h2 className="font-bold text-app-text-bright text-lg">
            {loan.name} <span className="text-xs font-normal opacity-50">({isLend ? 'Piutang' : 'Pinjaman'})</span>
          </h2>
        </div>
        <div className="flex items-center gap-1 relative z-20">
          {isPaidOff && (
            <button 
              onClick={() => setIsExpanded(false)} 
              className={`p-1.5 text-app-text/70 ${isLend ? 'hover:bg-app-success/10' : 'hover:bg-app-accent1/10'} rounded-full transition-colors`}
              title="Tutup detail"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(loan); }} 
            className={`p-1.5 ${isLend ? 'text-app-success hover:bg-app-success/10' : 'text-app-accent1 hover:bg-app-accent1/10'} rounded-full transition-colors`}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); deleteLoan(loan.id); }} 
            className="p-1.5 text-app-danger hover:bg-app-danger/10 rounded-full transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-app-bg/50 rounded-xl p-4 space-y-3 border border-app-border/50">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-app-text/70 mb-1">{totalPrincipalLabel}</p>
            <p className="font-semibold text-app-text-bright">Rp{details.totalPrincipal.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-xs text-app-text/70 mb-1">Bunga</p>
            <p className="font-semibold text-app-text-bright">Rp{details.totalInterest.toLocaleString("id-ID")}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-app-border/50">
          <div>
            <p className="text-xs text-app-text/70 mb-1">{totalPaymentLabel}</p>
            <p className="font-semibold text-app-success">Rp{details.totalPayment.toLocaleString("id-ID")}</p>
          </div>
          {loan.hasTenor !== false && (
            <div>
              <p className="text-xs text-app-text/70 mb-1">{installmentLabel}</p>
              <p className="font-semibold text-app-warning">
                Rp{Math.round(details.installment).toLocaleString("id-ID")}/{loan.paymentMethod === 'harian' ? 'hari' : loan.paymentMethod === 'mingguan' ? 'minggu' : 'bulan'}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-app-border/50">
          <div>
            <p className="text-xs text-app-text/70 mb-1">{paidAmountLabel}</p>
            <p className="font-semibold text-app-success">Rp{paidAmount.toLocaleString("id-ID")}</p>
          </div>
          <div>
            <p className="text-xs text-app-text/70 mb-1">{remainingLabel}</p>
            <p className="font-semibold text-app-danger">Rp{remaining.toLocaleString("id-ID")}</p>
          </div>
        </div>

        {loan.hasTenor !== false && (
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
        )}
      </div>

      <div className="flex justify-between items-center mt-4 mb-1">
        <span className="text-xs text-app-text/70">Progress</span>
        <span className="text-xs font-medium text-app-text-bright">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-app-bg rounded-full h-1.5 mb-5 overflow-hidden border border-app-border/50">
        <div 
          className={`${isLend ? 'bg-app-success' : 'bg-app-accent1'} h-1.5 rounded-full transition-all duration-500`} 
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} 
        />
      </div>

      {((loan.hasTenor !== false && nextPaymentDate) || (loan.hasTenor === false && loan.dueDate)) && (
        <div className="bg-app-bg/50 rounded-xl p-3 border border-app-border/50 flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-app-text/70" />
            <span className="text-sm text-app-text-bright">
              {loan.hasTenor === false ? "Jatuh Tempo: " : ""}
              {loan.hasTenor === false 
                ? new Date(loan.dueDate!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                : nextPaymentDate!.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              }
            </span>
          </div>
          {(() => {
            const todayDate = new Date();
            todayDate.setHours(0, 0, 0, 0);
            const targetDate = loan.hasTenor === false ? new Date(loan.dueDate!) : nextPaymentDate!;
            const nextDateNoTime = new Date(targetDate);
            nextDateNoTime.setHours(0, 0, 0, 0);
            const diffTime = nextDateNoTime.getTime() - todayDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
              return (
                <span className="text-xs font-medium bg-app-warning/20 text-app-warning px-2 py-1 rounded-md">
                  Hari ini
                </span>
              );
            } else if (diffDays < 0) {
              return (
                <span className="text-xs font-medium bg-app-danger/20 text-app-danger px-2 py-1 rounded-md">
                  Terlewat {Math.abs(diffDays)} hari
                </span>
              );
            } else {
              return (
                <span className={`text-xs font-medium ${isLend ? 'bg-app-success/20 text-app-success' : 'bg-app-accent1/20 text-app-accent1'} px-2 py-1 rounded-md`}>
                  {diffDays} hari lagi
                </span>
              );
            }
          })()}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs text-app-text/70 mb-1">{selectAccountLabel}</label>
        <div className={`flex items-center gap-2 bg-app-bg border ${isLend ? 'border-app-success/20 focus-within:border-app-success/50' : 'border-app-accent1/20 focus-within:border-app-accent1/50'} rounded-xl px-3 py-2`}>
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
          <label className="block text-xs text-app-text/70 mb-1">{payManualAmountLabel}</label>
          <div className="flex gap-2">
            <input 
              type="number"
              value={manualAmount}
              onChange={(e) => setManualAmount(e.target.value)}
              placeholder="Contoh: 100000"
              className={`flex-1 bg-transparent border border-app-border rounded-lg px-3 py-2 text-sm text-app-text-bright outline-none ${isLend ? 'focus:border-app-success' : 'focus:border-app-accent1'}`}
            />
            <button 
              onClick={() => handlePay(Number(manualAmount))}
              disabled={!manualAmount || Number(manualAmount) <= 0}
              className={`${isLend ? 'bg-app-success' : 'bg-app-accent1'} text-app-bg px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50`}
            >
              {isLend ? "Terima" : "Bayar"}
            </button>
          </div>
          <p className="text-[10px] text-app-text/50 mt-1">Sisa yang harus {isLend ? "diterima" : "dibayar"}: Rp{remaining.toLocaleString('id-ID')}</p>
        </div>
      )}

      {isPaidOff ? (
        <div className="bg-app-success/10 text-app-success p-3 rounded-xl border border-app-success/20 flex items-center justify-center gap-2 font-bold text-sm">
          <CheckCircle className="w-5 h-5" />
          {labelPrefix} Lunas
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {loan.hasTenor !== false && (
            <button 
              onClick={() => handlePay(Math.round(details.installment))}
              className="flex items-center justify-center gap-2 py-2.5 bg-app-success text-app-bg rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Wallet className="w-4 h-4" /> {payBtnLabel}
            </button>
          )}
          <button 
            onClick={() => setIsManualPayment(!isManualPayment)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors border ${isManualPayment ? 'bg-app-hover border-app-border text-app-text-bright' : 'bg-app-bg border-app-border text-app-text-bright hover:bg-app-hover'}`}
          >
            <Calculator className="w-4 h-4" /> {payManualLabel}
          </button>
          {loan.hasTenor !== false && (
            <button 
              onClick={() => setIsScheduleOpen(true)}
              className="flex items-center justify-center gap-2 py-2.5 bg-app-bg border border-app-border text-app-text-bright rounded-xl font-medium text-sm hover:bg-app-hover transition-colors"
            >
              <Eye className="w-4 h-4" /> Lihat Jadwal
            </button>
          )}
          <button 
            onClick={() => handlePay(remaining, true)}
            className="flex items-center justify-center gap-2 py-2.5 bg-app-bg border border-app-danger/50 text-app-danger rounded-xl font-medium text-sm hover:bg-app-danger/10 transition-colors"
          >
            <CheckCircle className="w-4 h-4" /> {isLend ? "Selesaikan" : "Lunasi"}
          </button>
        </div>
      )}

      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1C1C1E] border border-app-border/40 rounded-[24px] w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
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
    </HoverCard>
  );
}

export default function Loans() {
  const { user } = useStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);

  // Form states
  const [type, setType] = useState<"borrow" | "lend">("borrow");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [hasInterest, setHasInterest] = useState(false);
  const [interestType, setInterestType] = useState<"percentage" | "nominal">("percentage");
  const [interestValue, setInterestValue] = useState("");
  
  const [hasTenor, setHasTenor] = useState(true);
  const [tenorUnit, setTenorUnit] = useState<"hari" | "minggu" | "bulan">("hari");
  const [tenorDuration, setTenorDuration] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"harian" | "mingguan" | "bulanan">("harian");
  const [paymentDay, setPaymentDay] = useState("Senin");
  const [paymentDate, setPaymentDate] = useState(1);

  const [depositToAccount, setDepositToAccount] = useState(false);
  const [deductFromAccount, setDeductFromAccount] = useState(false);
  const [accountId, setAccountId] = useState("");

  const [autoDebit, setAutoDebit] = useState(false);
  const [autoDebitAccountId, setAutoDebitAccountId] = useState("");

  const [dueDateEnabled, setDueDateEnabled] = useState(false);
  const [dueDateVal, setDueDateVal] = useState("");

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
    setEditingLoan(null);
    setType("borrow");
    setName("");
    setAmount("");
    setHasInterest(false);
    setHasTenor(true);
    setInterestType("percentage");
    setInterestValue("");
    setTenorUnit("hari");
    setTenorDuration("");
    setPaymentMethod("harian");
    setPaymentDay("Senin");
    setPaymentDate(1);
    setDepositToAccount(false);
    setDeductFromAccount(false);
    setAutoDebit(false);
    setDueDateEnabled(false);
    setDueDateVal("");
    setCalculationResult(null);
    setIsModalOpen(true);
  };

  const openEditModal = (loan: Loan) => {
    setEditingLoan(loan);
    setType(loan.type || "borrow");
    setName(loan.name);
    setAmount(formatNumberInput(String(loan.amount)));
    setHasInterest(loan.hasInterest || false);
    setInterestType(loan.interestType || "percentage");
    setInterestValue(loan.interestValue ? (loan.interestType === "nominal" ? formatNumberInput(String(loan.interestValue)) : String(loan.interestValue)) : "");
    
    setHasTenor(loan.hasTenor !== false);
    setTenorUnit(loan.tenorUnit || "hari");
    setTenorDuration(loan.tenorDuration ? String(loan.tenorDuration) : "");
    setPaymentMethod(loan.paymentMethod || "harian");
    setPaymentDay(loan.paymentDay || "Senin");
    setPaymentDate(loan.paymentDate || 1);
    
    setDepositToAccount(loan.depositToAccount || false);
    setDeductFromAccount(loan.deductFromAccount || false);
    setAccountId(loan.accountId || (accounts[0]?.id || ""));
    
    setAutoDebit(loan.autoDebit || false);
    setAutoDebitAccountId(loan.autoDebitAccountId || (accounts[0]?.id || ""));
    
    setDueDateEnabled(!!loan.dueDate);
    setDueDateVal(loan.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : "");

    const details = calculateLoanDetails(loan);
    setCalculationResult(details);
    setIsModalOpen(true);
  };

  const closeAddModal = () => {
    setIsModalOpen(false);
    setEditingLoan(null);
  };

  const handleCalculate = () => {
    const numAmount = parseNumberInput(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error(type === 'lend' ? "Jumlah piutang tidak valid" : "Jumlah pinjaman tidak valid");
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

    if (!hasTenor) {
      setCalculationResult({
        totalPrincipal: numAmount,
        totalInterest: interestAmount,
        totalPayment: totalPay,
        installment: 0,
        totalDays: 0,
        paymentsCount: 0
      });
      return;
    }

    const duration = parseInt(tenorDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      toast.error("Tenor tidak valid");
      return;
    }

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
      toast.error(type === 'lend' ? "Nama piutang harus diisi" : "Nama pinjaman harus diisi");
      return;
    }

    const numAmount = parseNumberInput(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error(type === 'lend' ? "Jumlah piutang tidak valid" : "Jumlah pinjaman tidak valid");
      return;
    }

    let duration = 0;
    if (hasTenor) {
      duration = parseInt(tenorDuration, 10);
      if (isNaN(duration) || duration <= 0) {
        toast.error("Tenor tidak valid");
        return;
      }
    }

    const isEdit = !!editingLoan;
    const loanRef = isEdit 
      ? doc(db, "users", user.uid, "loans", editingLoan.id)
      : doc(collection(db, "users", user.uid, "loans"));
    
    const loanData: any = {
      name: name || (type === 'lend' ? "Pemberian Pinjaman" : "Pinjaman"),
      amount: numAmount,
      hasInterest,
      hasTenor,
      depositToAccount: type === 'borrow' ? depositToAccount : false,
      deductFromAccount: type === 'lend' ? deductFromAccount : false,
      autoDebit: type === 'borrow' ? autoDebit : false,
      status: editingLoan ? editingLoan.status : "active",
      paidAmount: editingLoan ? (editingLoan.paidAmount || 0) : 0,
      paidPaymentsCount: editingLoan ? (editingLoan.paidPaymentsCount || 0) : 0,
      type: type,
    };

    if (!isEdit) {
      loanData.createdAt = Date.now();
    } else {
      loanData.createdAt = editingLoan.createdAt;
    }

    if (hasTenor) {
      loanData.tenorUnit = tenorUnit;
      loanData.tenorDuration = duration;
      loanData.paymentMethod = paymentMethod;
      if (paymentMethod === "mingguan") loanData.paymentDay = paymentDay;
      if (paymentMethod === "bulanan") loanData.paymentDate = paymentDate;
      loanData.dueDate = 0;
    } else {
      loanData.tenorUnit = "";
      loanData.tenorDuration = 0;
      loanData.paymentMethod = "";
      if (dueDateVal) {
        loanData.dueDate = new Date(dueDateVal).getTime();
      } else {
        loanData.dueDate = 0;
      }
    }

    if (hasInterest) {
      const intVal = parseNumberInput(interestValue);
      if (!intVal || intVal <= 0) {
        toast.error("Nilai bunga tidak valid");
        return;
      }
      loanData.interestType = interestType;
      loanData.interestValue = intVal;
    } else {
      loanData.interestType = "";
      loanData.interestValue = 0;
    }

    if (type === 'borrow' && depositToAccount) {
      if (!accountId) {
        toast.error("Pilih rekening tujuan");
        return;
      }
      loanData.accountId = accountId;
    } else if (type === 'lend' && deductFromAccount) {
      if (!accountId) {
        toast.error("Pilih rekening sumber");
        return;
      }
      loanData.accountId = accountId;
    } else {
      loanData.accountId = "";
    }
    
    if (type === 'borrow' && autoDebit) {
      if (!autoDebitAccountId) {
        toast.error("Pilih rekening potongan");
        return;
      }
      loanData.autoDebitAccountId = autoDebitAccountId;
    } else {
      loanData.autoDebitAccountId = "";
    }

    try {
      const batch = writeBatch(db);
      
      if (isEdit) {
        batch.set(loanRef, loanData, { merge: true });
      } else {
        batch.set(loanRef, loanData);
      }

      // If deposit to account (for borrow), we must increase account balance AND add a transaction
      // But for edit, only do this if depositToAccount was newly enabled (meaning it wasn't enabled before)
      const shouldDeposit = type === 'borrow' && depositToAccount && accountId && (!isEdit || !editingLoan.depositToAccount);

      if (shouldDeposit) {
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
          note: `Pencairan Pinjaman: ${loanData.name}`,
          categoryId: "loan-income",
          categoryName: "Pinjaman",
          categoryIcon: "HandCoins"
        });
      }

      // If deduct from account (for lending), we must decrease account balance AND add a transaction
      // But for edit, only do this if deductFromAccount was newly enabled (meaning it wasn't enabled before)
      const shouldDeduct = type === 'lend' && deductFromAccount && accountId && (!isEdit || !editingLoan.deductFromAccount);

      if (shouldDeduct) {
        const accRef = doc(db, "users", user.uid, "accounts", accountId);
        const accDoc = await getDoc(accRef);
        if (accDoc.exists()) {
          const currentBal = accDoc.data().balance || 0;
          if (currentBal < numAmount) {
            toast.error("Saldo rekening tidak mencukupi");
            return;
          }
          batch.update(accRef, { balance: currentBal - numAmount });
        }

        const tsxRef = doc(collection(db, "users", user.uid, "transactions"));
        batch.set(tsxRef, {
          type: "expense",
          amount: numAmount,
          accountId: accountId,
          date: Date.now(),
          note: `Pemberian Pinjaman: ${loanData.name}`,
          categoryId: "loan-expense",
          categoryName: "Pemberian Pinjaman",
          categoryIcon: "HandCoins"
        });
      }

      await batch.commit();

      const successTitle = type === 'lend'
        ? (isEdit ? "Piutang Berhasil Diubah 📝" : "Piutang Baru Ditambahkan 📋")
        : (isEdit ? "Pinjaman Berhasil Diubah 📝" : "Pinjaman Baru Ditambahkan 📋");

      const successMsg = type === 'lend'
        ? `Piutang "${loanData.name}" sebesar Rp ${numAmount.toLocaleString("id-ID")} berhasil ${isEdit ? "diubah" : "ditambahkan"}.`
        : `Pinjaman "${loanData.name}" sebesar Rp ${numAmount.toLocaleString("id-ID")} berhasil ${isEdit ? "diubah" : "ditambahkan"}.`;

      sendDeviceNotification(successTitle, successMsg);

      toast.success(type === 'lend' ? "Data piutang berhasil disimpan" : "Data pinjaman berhasil disimpan");
      closeAddModal();
    } catch (err) {
      console.error("Failed to save loan", err);
      toast.error(isEdit ? "Gagal mengubah data" : "Gagal menyimpan data");
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

  const mobileActionsLoans = (
    <ActionBtn variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
      Tambah
    </ActionBtn>
  );
  const desktopActionsLoans = (
    <ActionBtn variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
      Tambah Pinjaman
    </ActionBtn>
  );

  return (
    <PageShell
      title="Pinjaman"
      subtitle="Kelola data pinjaman beserta bunga dan auto debit."
      mobileActions={mobileActionsLoans}
      actions={desktopActionsLoans}
    >

      {loans.length === 0 ? (
        <EmptyState
          icon={<HandCoins className="w-6 h-6" />}
          title="Belum ada pinjaman"
          description="Catat pinjaman atau piutang untuk memantau arus kasnya."
          action={<ActionBtn variant="primary" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>Tambah Pinjaman</ActionBtn>}
        />
      ) : (
        <StaggerContainer className="columns-1 md:columns-2 lg:columns-3 gap-6 w-full">
          {[...loans]
            .sort((a, b) => {
              const aRemaining = calculateLoanDetails(a).totalPayment - (a.paidAmount || 0);
              const bRemaining = calculateLoanDetails(b).totalPayment - (b.paidAmount || 0);
              const aPaid = aRemaining <= 0;
              const bPaid = bRemaining <= 0;
              if (aPaid && !bPaid) return 1;
              if (!aPaid && bPaid) return -1;
              
              const aNextPayment = getNextPaymentDate(a);
              const bNextPayment = getNextPaymentDate(b);
              
              if (aNextPayment && bNextPayment) {
                return aNextPayment.getTime() - bNextPayment.getTime();
              } else if (aNextPayment) {
                return -1;
              } else if (bNextPayment) {
                return 1;
              }
              
              return b.createdAt - a.createdAt;
            })
            .map(loan => (
              <StaggerItem key={loan.id} className="inline-block w-full mb-6 break-inside-avoid">
                <LoanCard loan={loan} deleteLoan={deleteLoan} onEdit={openEditModal} accounts={accounts} />
              </StaggerItem>
            ))}
        </StaggerContainer>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto pt-20">
          <div className="bg-app-card text-app-text w-full max-w-md rounded-[24px] shadow-2xl border border-app-border/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h2 className="text-lg font-semibold text-app-text-bright">
                {editingLoan ? (type === 'lend' ? "Edit Piutang" : "Edit Pinjaman") : (type === 'lend' ? "Tambah Piutang" : "Tambah Pinjaman")}
              </h2>
              <button
                onClick={closeAddModal}
                className="p-2 hover:bg-app-hover rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={saveLoan} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
              {/* Tipe Selector */}
              {!editingLoan && (
                <div className="flex bg-app-bg p-1 rounded-xl border border-app-border gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setType("borrow");
                      setName("");
                      setDepositToAccount(false);
                      setDeductFromAccount(false);
                    }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${type === "borrow" ? "bg-app-accent1 text-app-bg shadow-sm" : "text-app-text hover:text-app-text-bright"}`}
                  >
                    Saya Pinjam (Hutang)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType("lend");
                      setName("");
                      setDepositToAccount(false);
                      setDeductFromAccount(false);
                    }}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${type === "lend" ? "bg-app-success text-app-bg shadow-sm" : "text-app-text hover:text-app-text-bright"}`}
                  >
                    Saya Pinjamkan (Piutang)
                  </button>
                </div>
              )}

              {/* Nama Pinjaman/Piutang */}
              <div>
                <label className="block text-xs font-medium text-app-text/70 mb-2">
                  {type === 'lend' ? "Nama Piutang" : "Nama Pinjaman"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'lend' ? "Contoh: Pinjaman ke Budi" : "Contoh: KPR / Motor"}
                  className="w-full bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                />
              </div>

              {/* Jumlah Pinjaman/Piutang */}
              <div>
                <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">
                  {type === 'lend' ? "Jumlah yang Dipinjamkan (Rp)" : "Jumlah Pinjaman (Rp)"}
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

              {/* Tenor Toggle */}
              <div className="bg-app-bg p-4 rounded-xl border border-app-border mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-bold text-app-text-bright block">Ada Tenor & Jadwal?</label>
                    <span className="text-xs text-app-text/60">Tentukan batas waktu dan jadwal cicilan</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextHasTenor = !hasTenor;
                      setHasTenor(nextHasTenor);
                      if (nextHasTenor) {
                        setDueDateEnabled(false);
                      }
                    }}
                    className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${hasTenor ? 'bg-app-accent1' : 'bg-app-border'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${hasTenor ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {hasTenor && (
                <>
                  {/* Tenor */}
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">
                      Tenor {type === 'lend' ? "Piutang" : "Pinjaman"}
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
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">
                      Metode {type === 'lend' ? "Terima" : "Bayar"}
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
                </>
              )}

              {/* Optional Payment Date (Jatuh tempo pelunasan) - when no tenor/installments */}
              {!hasTenor && (
                <div className="bg-app-bg p-4 rounded-xl border border-app-border space-y-2">
                  <div>
                    <label className="text-sm font-bold text-app-text-bright block">Tanggal Pembayaran (Jatuh Tempo)</label>
                    <span className="text-xs text-app-text/60">Bisa diisi atau dikosongkan jika tidak ada jatuh tempo</span>
                  </div>
                  
                  <input 
                    type="date"
                    value={dueDateVal}
                    onChange={(e) => setDueDateVal(e.target.value)}
                    className="w-full bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1 mt-1"
                  />
                </div>
              )}

              {/* Saldo Masuk (Only for Borrow) */}
              {type === 'borrow' && (
                <div className="bg-app-bg p-4 rounded-xl border border-app-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-sm font-bold text-app-text-bright block">Saldo Masuk?</label>
                      <span className="text-xs text-app-text/60">Tambahkan langsung ke saldo rekening</span>
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
              )}

              {/* Potong dari Rekening (Only for Lend / Meminjamkan) */}
              {type === 'lend' && (
                <div className="bg-app-bg p-4 rounded-xl border border-app-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <label className="text-sm font-bold text-app-text-bright block">Potong dari Rekening?</label>
                      <span className="text-xs text-app-text/60">Kurangi saldo dari rekening sumber dana</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeductFromAccount(!deductFromAccount)}
                      className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${deductFromAccount ? 'bg-app-success' : 'bg-app-border'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${deductFromAccount ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  
                  {deductFromAccount && (
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full mt-2 bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                    >
                      <option value="" disabled className="bg-[#1C1C1E] text-white">Pilih Rekening Sumber</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id} className="bg-[#1C1C1E] text-white">{acc.name} (Rp {acc.balance.toLocaleString('id-ID')})</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Auto Debit (Only for Borrow) */}
              {type === 'borrow' && (
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
              )}

              {/* Hasil Perhitungan */}
              {calculationResult && (
                <div className="bg-app-card p-4 rounded-xl border border-app-border space-y-4">
                  <h3 className="font-bold text-app-text-bright">
                    {type === 'lend' ? "Hasil Penerimaan" : "Hasil Perhitungan"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-app-text/70 mb-1">
                        {type === 'lend' ? "Total Dipinjamkan" : "Total Pinjaman"}
                      </p>
                      <p className="font-bold text-app-text-bright">Rp {calculationResult.totalPrincipal.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-app-text/70 mb-1">Bunga</p>
                      <p className="font-bold text-app-text-bright">Rp {calculationResult.totalInterest.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-app-text/70 mb-1">
                        {type === 'lend' ? "Total Penerimaan" : "Total Bayar"}
                      </p>
                      <p className="font-bold text-app-success">Rp {calculationResult.totalPayment.toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-app-text/70 mb-1">
                        {type === 'lend' ? "Penerimaan Cicilan" : "Cicilan"}
                      </p>
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
                  {type === 'lend' ? "Hitung Penerimaan" : "Hitung Cicilan"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-app-success text-app-bg hover:opacity-90 transition-opacity"
                >
                  {editingLoan ? "Simpan Perubahan" : (type === 'lend' ? "Simpan Piutang" : "Simpan Pinjaman")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageShell>
  );
}
