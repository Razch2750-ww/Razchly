import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { X } from 'lucide-react';
import { AccountIcon, ACCOUNT_ICONS } from './AccountIcon';
import { Account } from '../types';
import { useStore } from '../store/useStore';
import { formatNumberInput, parseNumberInput } from '../utils/numberFormat';
import { toast } from 'react-hot-toast';

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

  useEffect(() => {
    if (isOpen) {
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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-app-card text-app-text w-full max-w-md rounded-[24px] shadow-2xl border border-app-border/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-bg">
          <h2 className="text-lg font-semibold text-app-text-bright">{account ? 'Edit Rekening' : 'Tambah Rekening'}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-app-hover rounded-full transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={saveAccount} className="p-6 space-y-5">
          <div>
            <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block">Ikon Rekening</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {ACCOUNT_ICONS.map((iconItem) => (
                <button
                  key={iconItem.id}
                  type="button"
                  onClick={() => setIcon(iconItem.id)}
                  className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all ${icon === iconItem.id ? 'border-app-accent1 bg-app-accent1/10 shadow-sm' : 'border-transparent hover:bg-app-hover'}`}
                >
                  <AccountIcon iconId={iconItem.id} className="w-8 h-8" />
                </button>
              ))}
            </div>
          </div>
          <div className="floating-label-group">
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="floating-label-input"
              placeholder="Contoh: BCA, Dompet, GoPay"
              id="acc-name"
              required
            />
            <label htmlFor="acc-name" className="floating-label-text">Nama Rekening</label>
          </div>
          <div className="floating-label-group">
            <input 
              type="text" 
              inputMode="numeric"
              value={balance} 
              onChange={e => setBalance(formatNumberInput(e.target.value))}
              className="floating-label-input font-mono text-xl font-bold"
              placeholder="0"
              id="acc-balance"
              required
            />
            <label htmlFor="acc-balance" className="floating-label-text">Saldo Awal (Rp)</label>
          </div>
          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-4 rounded-2xl font-bold text-sm bg-app-hover hover:bg-app-border/50 text-app-text transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 py-4 rounded-2xl font-bold text-sm bg-app-accent1 text-app-bg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
