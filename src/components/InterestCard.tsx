import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Percent, TrendingUp, Calendar, ArrowRight, Play, RefreshCw, Wallet } from 'lucide-react';
import { Account, Transaction } from '../types';
import { calculateInterestMetrics, processInterestForAccount } from '../utils/interestUtils';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

interface InterestCardProps {
  accounts: Account[];
  transactions: Transaction[];
  onOpenModal: () => void;
  onRefresh?: () => void;
}

export default function InterestCard({
  accounts,
  transactions,
  onOpenModal,
  onRefresh,
}: InterestCardProps) {
  const { user, hideBalances } = useStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const interestAccounts = accounts.filter((a) => a.interestEnabled);
  const metrics = calculateInterestMetrics(accounts, transactions);

  const formatCurrency = (val: number, forceSign?: string) => {
    if (hideBalances) {
      return `${forceSign || ''}Rp ••••••••`;
    }
    return `${forceSign || ''}Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleProcessToday = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isProcessing) return;

    if (interestAccounts.length === 0) {
      toast.error('Belum ada rekening dengan fitur bunga ON. Aktifkan di Pengaturan Rekening.');
      return;
    }

    setIsProcessing(true);
    try {
      let totalAmount = 0;
      let count = 0;

      for (const acc of interestAccounts) {
        const res = await processInterestForAccount(user.uid, acc, true);
        if (res.added) {
          totalAmount += res.amount;
          count++;
        }
      }

      if (count > 0) {
        toast.success(`Bunga +${formatCurrency(totalAmount)} berhasil masuk ke rekening berbunga!`);
        if (onRefresh) onRefresh();
      } else {
        toast.error('Gagal memproses bunga atau bunga Rp0.');
      }
    } catch (err) {
      console.error('Error processing interest:', err);
      toast.error('Gagal memproses bunga.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (interestAccounts.length === 0) {
    return (
      <div 
        onClick={onOpenModal}
        className="p-5 rounded-[22px] bg-app-card border border-app-border flex flex-col justify-between hover:border-app-accent1/40 transition-all cursor-pointer group relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-app-accent1/10 text-app-accent1 border border-app-accent1/20">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-app-text-bright">Bunga Rekening Otomatis</h3>
              <p className="text-[11px] text-app-text/60">Saldo dinamis dengan compound harian</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-app-text/40 group-hover:text-app-accent1 group-hover:translate-x-0.5 transition-all" />
        </div>
        <div className="p-3 rounded-xl bg-app-bg/50 border border-app-border text-xs text-app-text/70 flex items-center justify-between">
          <span>Pengaturan bunga belum aktif pada rekening.</span>
          <span className="text-app-accent1 font-semibold underline">Aktifkan Sekarang</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-[22px] bg-app-card border border-app-border flex flex-col justify-between shadow-sm relative overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-app-accent1/10 text-app-accent1 border border-app-accent1/20">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-app-text-bright">Bunga Rekening Otomatis</h3>
              <span className="px-2 py-0.5 rounded-full bg-app-success/15 text-app-success text-[10px] font-bold">
                {interestAccounts.length} Rekening
              </span>
            </div>
            <p className="text-[11px] text-app-text/60">Perhitungan berbasis saldo dinamis harian</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleProcessToday}
            disabled={isProcessing}
            className="flex items-center gap-1.5 bg-app-accent1 text-app-bg px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
            title="Proses Bunga Hari Ini"
          >
            {isProcessing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            <span className="hidden sm:inline">{isProcessing ? 'Memproses...' : 'Proses Hari Ini'}</span>
          </motion.button>

          <button
            onClick={onOpenModal}
            className="p-1.5 text-app-text/60 hover:text-app-accent1 hover:bg-app-hover rounded-xl transition-colors cursor-pointer"
            title="Lihat Detail Bunga"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        <div className="p-3 rounded-xl bg-app-bg border border-app-border">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-app-text/60 mb-0.5">
            <Calendar className="w-3 h-3 text-app-accent1" />
            <span>Hari Ini</span>
          </div>
          <p className="text-xs sm:text-sm font-bold font-mono text-app-success truncate flex items-center">
            {formatCurrency(metrics.bungaHariIni, '+')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-app-bg border border-app-border">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-app-text/60 mb-0.5">
            <TrendingUp className="w-3 h-3 text-app-accent1" />
            <span>Bulan Ini</span>
          </div>
          <p className="text-xs sm:text-sm font-bold font-mono text-app-accent1 truncate flex items-center">
            {formatCurrency(metrics.bungaBulanIni, '+')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-app-bg border border-app-border">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-app-text/60 mb-0.5">
            <Percent className="w-3 h-3 text-app-accent1" />
            <span>Tahun Ini</span>
          </div>
          <p className="text-xs sm:text-sm font-bold font-mono text-app-text-bright truncate flex items-center">
            {formatCurrency(metrics.bungaTahunIni, '+')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-app-bg border border-app-border">
          <div className="flex items-center gap-1 text-[10px] uppercase font-semibold text-app-text/60 mb-0.5">
            <Wallet className="w-3 h-3 text-app-accent1" />
            <span>Saldo + Bunga</span>
          </div>
          <p className="text-xs sm:text-sm font-bold font-mono text-app-text-bright truncate flex items-center">
            {formatCurrency(metrics.totalSaldoSetelahBunga)}
          </p>
        </div>
      </div>

      {/* Account badges preview */}
      <div 
        onClick={onOpenModal}
        className="flex items-center justify-between text-[11px] text-app-text/60 bg-app-bg/60 p-2.5 rounded-xl border border-app-border hover:border-app-accent1/30 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          <span className="font-semibold text-app-text-bright">Rekening Bunga:</span>
          <span className="truncate">
            {interestAccounts.map((a) => `${a.name} (${a.interestRate}% p.a.)`).join(', ')}
          </span>
        </div>
        <span className="text-app-accent1 font-semibold shrink-0 flex items-center gap-1">
          <span>Detail & Riwayat</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
