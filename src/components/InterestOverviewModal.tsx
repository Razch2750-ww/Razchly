import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Percent, TrendingUp, Calendar, Wallet, Play, RefreshCw, CheckCircle2, History } from 'lucide-react';
import { Account, Transaction } from '../types';
import { calculateInterestMetrics, processInterestForAccount } from '../utils/interestUtils';
import { useStore } from '../store/useStore';
import toast from 'react-hot-toast';

interface InterestOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  transactions: Transaction[];
  onRefresh?: () => void;
}

export default function InterestOverviewModal({
  isOpen,
  onClose,
  accounts,
  transactions,
  onRefresh,
}: InterestOverviewModalProps) {
  const { user, hideBalances } = useStore();
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const interestAccounts = accounts.filter((a) => a.interestEnabled);
  const activeAccountId = selectedAccountId === 'all' ? undefined : selectedAccountId;

  const metrics = calculateInterestMetrics(accounts, transactions, activeAccountId);

  const formatCurrency = (val: number) => {
    if (hideBalances) return '••••••••';
    return `Rp ${val.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleManualProcess = async () => {
    if (!user || isProcessing) return;

    if (interestAccounts.length === 0) {
      toast.error('Belum ada rekening dengan fitur bunga ON. Aktifkan di Pengaturan Rekening.');
      return;
    }

    setIsProcessing(true);
    try {
      let totalAmount = 0;
      let count = 0;

      const targetAccounts = activeAccountId
        ? interestAccounts.filter((a) => a.id === activeAccountId)
        : interestAccounts;

      for (const acc of targetAccounts) {
        const res = await processInterestForAccount(user.uid, acc, true);
        if (res.added) {
          totalAmount += res.amount;
          count++;
        }
      }

      if (count > 0) {
        const targetName = activeAccountId 
          ? targetAccounts[0]?.name 
          : `${count} rekening berbunga`;
        toast.success(
          `Bunga +${formatCurrency(totalAmount)} berhasil masuk ke rekening ${targetName}!`
        );
        if (onRefresh) onRefresh();
      } else {
        toast.error('Gagal memproses bunga atau bunga Rp0.');
      }
    } catch (err) {
      console.error('Error manual interest processing:', err);
      toast.error('Gagal memproses bunga.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl bg-app-card border border-app-border rounded-3xl p-6 shadow-2xl my-8 overflow-hidden text-app-text"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-app-border mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-app-accent1/10 text-app-accent1 border border-app-accent1/20">
                <Percent className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-app-text-bright">Perhitungan Bunga Rekening</h2>
                <p className="text-xs text-app-text/60">Saldo dinamis dengan compound harian otomatis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-app-text/60 hover:text-app-text hover:bg-app-hover rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Account Filter Bar & Simulation Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 bg-app-bg/50 p-3 rounded-2xl border border-app-border">
            <div className="flex items-center gap-2 flex-1">
              <Wallet className="w-4 h-4 text-app-accent1 shrink-0" />
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-app-card border border-app-border rounded-xl px-3 py-2 text-xs font-semibold text-app-text-bright focus:border-app-accent1 outline-none transition-colors appearance-none cursor-pointer"
              >
                <option value="all">Semua Rekening Bunga ({interestAccounts.length})</option>
                {interestAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.interestRate || 0}% p.a.)
                  </option>
                ))}
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleManualProcess}
              disabled={isProcessing || interestAccounts.length === 0}
              className="flex items-center justify-center gap-2 bg-app-accent1 text-app-bg px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>{isProcessing ? 'Memproses...' : 'Proses Bunga Hari Ini'}</span>
            </motion.button>
          </div>

          {/* 4 Required Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {/* 1. Bunga Hari Ini */}
            <div className="p-4 rounded-2xl bg-app-bg border border-app-border flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-app-text/60 mb-1">
                  Bunga Hari Ini
                </p>
                <p className="text-sm sm:text-base font-bold font-mono text-app-success truncate">
                  +{formatCurrency(metrics.bungaHariIni)}
                </p>
              </div>
              <div className="mt-2 text-[10px] text-app-text/50 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-app-accent1 shrink-0" />
                <span>Estimasi Harian</span>
              </div>
            </div>

            {/* 2. Total Bunga Bulan Berjalan */}
            <div className="p-4 rounded-2xl bg-app-bg border border-app-border flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-app-text/60 mb-1">
                  Total Bulan Ini
                </p>
                <p className="text-sm sm:text-base font-bold font-mono text-app-accent1 truncate">
                  +{formatCurrency(metrics.bungaBulanIni)}
                </p>
              </div>
              <div className="mt-2 text-[10px] text-app-text/50 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-app-accent1 shrink-0" />
                <span>Akumulasi Bulan</span>
              </div>
            </div>

            {/* 3. Total Bunga Tahun Berjalan */}
            <div className="p-4 rounded-2xl bg-app-bg border border-app-border flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-app-text/60 mb-1">
                  Total Tahun Ini
                </p>
                <p className="text-sm sm:text-base font-bold font-mono text-app-text-bright truncate">
                  +{formatCurrency(metrics.bungaTahunIni)}
                </p>
              </div>
              <div className="mt-2 text-[10px] text-app-text/50 flex items-center gap-1">
                <Percent className="w-3 h-3 text-app-accent1 shrink-0" />
                <span>Akumulasi Tahun</span>
              </div>
            </div>

            {/* 4. Total Saldo Setelah Bunga */}
            <div className="p-4 rounded-2xl bg-app-bg border border-app-border flex flex-col justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-app-text/60 mb-1">
                  Saldo + Bunga
                </p>
                <p className="text-sm sm:text-base font-bold font-mono text-app-text-bright truncate">
                  {formatCurrency(metrics.totalSaldoSetelahBunga)}
                </p>
              </div>
              <div className="mt-2 text-[10px] text-app-text/50 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-app-success shrink-0" />
                <span>Saldo Dinamis</span>
              </div>
            </div>
          </div>

          {/* Active Interest Accounts Summary Table / Badges */}
          {interestAccounts.length > 0 && (
            <div className="mb-6 p-4 rounded-2xl bg-app-bg/60 border border-app-border">
              <p className="text-xs font-bold text-app-text-bright mb-2">Rekening Aktif Dengan Bunga:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-28 overflow-y-auto pr-1">
                {interestAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-2.5 rounded-xl bg-app-card border border-app-border/80 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <p className="font-semibold text-app-text-bright truncate">{acc.name}</p>
                      <p className="text-[10px] text-app-text/60">
                        {acc.interestRate}% p.a. • {acc.interestMethod === 'monthly' ? 'Bulanan' : acc.interestMethod === 'yearly' ? 'Tahunan' : 'Harian Compound'}
                      </p>
                    </div>
                    <span className="font-mono font-semibold text-app-accent1 shrink-0">
                      {formatCurrency(acc.balance)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Riwayat Transaksi Bunga */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-app-text-bright flex items-center gap-2">
                <History className="w-4 h-4 text-app-accent1" />
                <span>Riwayat Transaksi Bunga ({metrics.riwayatTransaksiBunga.length})</span>
              </h3>
            </div>

            {metrics.riwayatTransaksiBunga.length === 0 ? (
              <div className="p-8 text-center text-app-text/50 rounded-2xl bg-app-bg border border-app-border">
                <Percent className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Belum ada riwayat transaksi bunga.</p>
                <p className="text-[11px] text-app-text/40 mt-1">
                  Klik &quot;Proses Bunga Hari Ini&quot; untuk mensimulasikan penambahan bunga.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {metrics.riwayatTransaksiBunga.map((t) => {
                  const acc = accounts.find((a) => a.id === t.accountId);
                  return (
                    <div
                      key={t.id || t.date}
                      className="p-3 rounded-2xl bg-app-bg border border-app-border flex items-center justify-between hover:border-app-accent1/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="p-2 rounded-xl bg-app-success/10 text-app-success shrink-0">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-semibold text-app-text-bright truncate">{t.note}</p>
                          <p className="text-[10px] text-app-text/50">
                            {formatDate(t.date)} {acc ? `• ${acc.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-bold font-mono text-app-success shrink-0">
                        +{formatCurrency(t.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
