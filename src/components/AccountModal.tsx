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
  const [isSaving, setIsSaving] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      if (account) {
        setName(account.name);
        setBalance(formatNumberInput(account.balance.toString()));
        setIcon(account.icon || 'wallet');
      } else {
        setName('');
        setBalance('');
        setIcon('wallet');
      }
    }
  }, [isOpen, account]);

  if (!isOpen && !shouldRender) return null;

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !balance || isSaving) return;

    const numBalance = parseNumberInput(balance);
    if (isNaN(numBalance)) return;

    setIsSaving(true);
    try {
      if (account) {
        const docRef = doc(db, 'users', user.uid, 'accounts', account.id);
        await updateDoc(docRef, { name, balance: numBalance, icon });
        toast.success("Rekening berhasil diperbarui");
      } else {
        const accountsRef = collection(db, 'users', user.uid, 'accounts');
        await addDoc(accountsRef, {
          name, 
          balance: numBalance,
          icon,
          createdAt: Date.now()
        });
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
                  Saldo Awal (Rp)
                </label>
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
