import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X } from 'lucide-react';
import { AccountIcon, ACCOUNT_ICONS } from './AccountIcon';
import { Account } from '../types';
import { useStore } from '../store/useStore';
import { formatNumberInput, parseNumberInput } from '../utils/numberFormat';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
}

export function AccountModal({ isOpen, onClose, account }: AccountModalProps) {
  const { user } = useStore();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('wallet');
  const [interestEnabled, setInterestEnabled] = useState(false);
  const [interestRate, setInterestRate] = useState('2.5');
  const [interestMethod, setInterestMethod] = useState<'daily_compound' | 'monthly' | 'yearly'>('daily_compound');
  const [isSaving, setIsSaving] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      if (account) {
        setName(account.name);
        setBalance(formatNumberInput(account.balance.toString()));
        setIcon(account.icon || 'wallet');
        setInterestEnabled(Boolean(account.interestEnabled));
        setInterestRate(account.interestRate ? account.interestRate.toString() : '2.5');
        setInterestMethod(account.interestMethod || 'daily_compound');
      } else {
        setName('');
        setBalance('');
        setIcon('wallet');
        setInterestEnabled(false);
        setInterestRate('2.5');
        setInterestMethod('daily_compound');
      }
    }
  }, [isOpen, account]);

  if (!isOpen && !shouldRender) return null;

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !balance || isSaving) return;

    const numBalance = parseNumberInput(balance);
    if (isNaN(numBalance)) return;

    const numInterestRate = interestEnabled ? parseFloat(interestRate.replace(',', '.')) || 0 : 0;

    setIsSaving(true);
    try {
      const todayStart = new Date(new Date().setHours(0,0,0,0)).getTime();
      const payload: any = {
        name,
        balance: numBalance,
        icon,
        interestEnabled,
        interestRate: numInterestRate,
        interestMethod: interestEnabled ? interestMethod : 'daily_compound',
      };

      if (account) {
        const docRef = doc(db, 'users', user.uid, 'accounts', account.id);
        if (interestEnabled && !account.lastInterestCalculationDate) {
          payload.lastInterestCalculationDate = todayStart;
        }
        await updateDoc(docRef, payload);
        toast.success("Rekening berhasil diperbarui");
      } else {
        const accountsRef = collection(db, 'users', user.uid, 'accounts');
        payload.createdAt = Date.now();
        payload.lastInterestCalculationDate = todayStart;
        await addDoc(accountsRef, payload);
        toast.success("Rekening baru berhasil ditambahkan");
      }
      onClose();
    } catch (err) {
      console.error('Error saving account', err);
      toast.error("Gagal menyimpan rekening");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence onExitComplete={() => setShouldRender(false)}>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md"
        >
          <motion.div
            key="dialog"
            initial={{ scale: 0.94, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 15 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="bg-app-card text-app-text w-full max-w-md rounded-[18px] shadow-2xl border border-app-border overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg/50">
              <h2 className="text-lg font-semibold text-app-text-bright">
                {account ? "Edit Rekening" : "Tambah Rekening"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-app-hover rounded-full transition-colors text-app-text/70 hover:text-app-text-bright cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveAccount} className="p-6 space-y-5">
              <div>
                <label className="text-[10px] uppercase font-semibold tracking-wider mb-2.5 block text-app-text/70">
                  Ikon Rekening
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {ACCOUNT_ICONS.map((iconItem) => (
                    <motion.button
                      key={iconItem.id}
                      type="button"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setIcon(iconItem.id)}
                      className={`flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        icon === iconItem.id
                          ? "border-app-accent1 bg-app-accent1/15 shadow-sm text-app-accent1"
                          : "border-app-border bg-app-bg/30 text-app-text/60 hover:text-app-text-bright hover:bg-app-hover"
                      }`}
                    >
                      <AccountIcon iconId={iconItem.id} className="w-7 h-7" />
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="floating-label-group">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="floating-label-input"
                  placeholder="Contoh: BCA, Dompet, GoPay"
                  id="acc-name"
                  required
                />
                <label htmlFor="acc-name" className="floating-label-text">
                  Nama Rekening
                </label>
              </div>

              <div className="floating-label-group">
                <input
                  type="text"
                  inputMode="numeric"
                  value={balance}
                  onChange={(e) => setBalance(formatNumberInput(e.target.value))}
                  className="floating-label-input font-mono text-xl font-semibold text-app-accent1 tracking-wide"
                  placeholder="0"
                  id="acc-balance"
                  required
                />
                <label htmlFor="acc-balance" className="floating-label-text">
                  Saldo Saat Ini / Awal (Rp)
                </label>
              </div>

              {/* Interest Settings Section */}
              <div className="p-4 rounded-2xl bg-app-bg/60 border border-app-border space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-app-text-bright">Hitung Bunga Otomatis</p>
                    <p className="text-[11px] text-app-text/60">Hitung & tambahkan bunga otomatis dari saldo dinamis</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interestEnabled}
                      onChange={(e) => setInterestEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-app-card border border-app-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-app-text/50 peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-app-accent1"></div>
                  </label>
                </div>

                {interestEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2 border-t border-app-border/50"
                  >
                    <div>
                      <label className="text-[10px] uppercase font-semibold tracking-wider mb-1.5 block text-app-text/70">
                        Bunga Tahunan (% p.a.)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={interestRate}
                          onChange={(e) => setInterestRate(e.target.value)}
                          placeholder="e.g. 2.5"
                          className="w-full bg-app-card border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text-bright focus:border-app-accent1 outline-none transition-colors"
                          required={interestEnabled}
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-app-text/50">
                          % / thn
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] uppercase font-semibold tracking-wider mb-1.5 block text-app-text/70">
                        Metode Bunga
                      </label>
                      <select
                        value={interestMethod}
                        onChange={(e) => setInterestMethod(e.target.value as any)}
                        className="w-full bg-app-card border border-app-border rounded-xl px-3.5 py-2.5 text-sm font-semibold text-app-text-bright focus:border-app-accent1 outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="daily_compound">Harian Compound (Saldo × % / 365)</option>
                        <option value="monthly">Bulanan</option>
                        <option value="yearly">Tahunan</option>
                      </select>
                    </div>

                    <div className="p-3 rounded-xl bg-app-accent1/10 border border-app-accent1/20 text-[11px] text-app-text/80 space-y-1">
                      <p className="font-semibold text-app-accent1">Sistem Saldo Dinamis:</p>
                      <p>• Bunga harian = Saldo Saat Ini × ({interestRate || '0'}% / 365)</p>
                      <p>• Saldo baru = Saldo Saat Ini + Bunga Harian</p>
                      <p>• Otomatis tercatat sebagai pemasukan bunga setiap hari.</p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-app-hover hover:bg-app-border/50 text-app-text transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSaving}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-sm bg-app-accent1 text-app-bg hover:opacity-95 transition-all shadow-lg shadow-app-accent1/10 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
