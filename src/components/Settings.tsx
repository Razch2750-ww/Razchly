import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { themes } from '../themes';
import { doc, updateDoc, collection, onSnapshot, query, where, getDocs, writeBatch, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Palette, Globe, Check, Car, User as UserIcon, ChevronDown, ChevronUp, Plus, Edit2, Trash2, Wallet, X, Type, Star, Eye, EyeOff, LayoutGrid, Sparkles } from 'lucide-react';
import { Account, Transaction, Category } from '../types';
import { auth } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { AccountIcon, ACCOUNT_ICONS, getAccountIconDetails } from './AccountIcon';
import { CategoryIcon } from './CategoryIcon';
import { CategoryModal } from './CategoryModal';
import { toast } from 'react-hot-toast';

import { AccountModal } from './AccountModal';

import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Settings() {
  const { user, themeId, setThemeId, language, setLanguage, grabCashAccount, grabDompetAccount, grabHematAccount, setGrabAccounts, setGlobalAddModalOpen, setGlobalGrabModalOpen, customFontName, setCustomFont } = useStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [sections, setSections] = useState({
    profil: false,
    rekening: false,
    kategori: false,
    tabungan: false,
    grab: false,
    bahasa: false,
    tema: false,
    font: false
  });

  useEffect(() => {
    const expandSection = (location.state as any)?.expandSection;
    if (expandSection === 'profile') {
      setSections(prev => ({ ...prev, profil: true }));
    } else if (expandSection === 'accounts') {
      setSections(prev => ({ ...prev, rekening: true }));
    } else if (expandSection === 'categories') {
      setSections(prev => ({ ...prev, kategori: true }));
    }
  }, [location.state]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryModalType, setCategoryModalType] = useState<'income' | 'expense'>('expense');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => {
      const isCurrentlyOpen = prev[section];
      return {
        profil: false,
        rekening: false,
        kategori: false,
        tabungan: false,
        grab: false,
        bahasa: false,
        tema: false,
        font: false,
        [section]: !isCurrentlyOpen
      };
    });
  };

  const openAddModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const confirmDeleteAccount = async () => {
    if (!user || !accountToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'accounts', accountToDelete));
      toast.success("Rekening berhasil dihapus");
      setAccountToDelete(null);
    } catch (err) {
       console.error('Error deleting account', err);
       toast.error("Gagal menghapus rekening");
    }
  };

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsUpdatingProfile(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName,
        photoURL: photoURL
      });
      toast.success('Profil berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      const accountsRef = collection(db, 'users', user.uid, 'accounts');
      
      accounts.forEach(acc => {
        if (acc.id === accountId) {
          batch.update(doc(accountsRef, acc.id), { isPrimary: true });
        } else if (acc.isPrimary) {
          batch.update(doc(accountsRef, acc.id), { isPrimary: false });
        }
      });
      
      await batch.commit();
      toast.success("Rekening utama berhasil diubah");
    } catch (error) {
      console.error('Error setting primary account', error);
      toast.error("Gagal mengubah rekening utama");
    }
  };

  const handleToggleExclude = async (account: Account) => {
    if (!user) return;
    try {
      const accountRef = doc(db, 'users', user.uid, 'accounts', account.id);
      await updateDoc(accountRef, { excludeFromTotal: !account.excludeFromTotal });
      toast.success(account.excludeFromTotal ? "Saldo disertakan dalam total" : "Saldo dikecualikan dari total");
    } catch (error) {
      console.error('Error toggling exclude status', error);
      toast.error("Gagal mengubah status pengecualian");
    }
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribeAccounts = onSnapshot(collection(db, 'users', user.uid, 'accounts'), (snap) => {
      const accts: Account[] = [];
      snap.forEach(d => accts.push({ id: d.id, ...d.data() } as Account));
      setAccounts(accts);
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'users', user.uid, 'categories'), (snap) => {
      const cats: Category[] = [];
      snap.forEach(d => cats.push({ id: d.id, ...d.data() } as Category));
      setCategories(cats);
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeCategories();
    };
  }, [user]);

  const handleDeleteCategory = async () => {
    if (!user || !categoryToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'categories', categoryToDelete));
      toast.success("Kategori berhasil dihapus");
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category', err);
      toast.error("Gagal menghapus kategori");
    }
  };

  const openCategoryEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryModalType(cat.type);
    setIsCategoryModalOpen(true);
  };

  const openCategoryAddModal = (type: 'income' | 'expense') => {
    setEditingCategory(null);
    setCategoryModalType(type);
    setIsCategoryModalOpen(true);
  };

  const generateDefaultCategories = async () => {
    if (!user) return;
    const defaultIncome = [
      { name: "Gaji", icon: "dollar-sign", type: "income" },
      { name: "Investasi", icon: "trending-up", type: "income" },
      { name: "Bonus", icon: "gift", type: "income" }
    ];
    const defaultExpense = [
      { name: "Makanan", icon: "coffee", type: "expense" },
      { name: "Transportasi", icon: "car", type: "expense" },
      { name: "Belanja", icon: "shopping-bag", type: "expense" },
      { name: "Tagihan", icon: "zap", type: "expense" },
      { name: "Kesehatan", icon: "heart", type: "expense" }
    ];

    try {
      const batch = writeBatch(db);
      [...defaultIncome, ...defaultExpense].forEach(cat => {
        const docRef = doc(collection(db, 'users', user.uid, 'categories'));
        batch.set(docRef, { ...cat, createdAt: Date.now() });
      });
      await batch.commit();
      toast.success("Kategori default berhasil ditambahkan");
    } catch (err) {
      console.error("Error setting default categories", err);
      toast.error("Gagal menambahkan kategori default");
    }
  };

  const handleThemeChange = async (newThemeId: string) => {
    setThemeId(newThemeId);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { theme: newThemeId });
        toast.success("Tema berhasil diperbarui");
      } catch (err) {
        console.error('Error updating theme', err);
        toast.error("Gagal memperbarui tema");
      }
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { language: newLang });
        toast.success("Bahasa berhasil diperbarui");
      } catch (err) {
         console.error('Error updating language', err);
         toast.error("Gagal memperbarui bahasa");
      }
    }
  };

  const [pendingFontFile, setPendingFontFile] = useState<{name: string, base64: string} | null>(null);

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.ttf') && !file.name.endsWith('.otf')) {
      toast.error('Hanya file .ttf atau .otf yang diperbolehkan');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPendingFontFile({ name: file.name, base64 });
    };
    reader.readAsDataURL(file);
  };
  
  const handleApplyFont = () => {
    if (pendingFontFile) {
        setCustomFont(pendingFontFile.base64, pendingFontFile.name);
        setPendingFontFile(null);
    }
  }

  const handleRemoveFont = () => {
    setCustomFont(null, null);
    setPendingFontFile(null);
  };

  const handleGrabSettingChange = async (field: 'grabCashAccount' | 'grabDompetAccount' | 'grabHematAccount', value: string) => {
      const newSettings = {
          grabCashAccount: field === 'grabCashAccount' ? value : grabCashAccount,
          grabDompetAccount: field === 'grabDompetAccount' ? value : grabDompetAccount,
          grabHematAccount: field === 'grabHematAccount' ? value : grabHematAccount
      };
      setGrabAccounts(newSettings.grabCashAccount, newSettings.grabDompetAccount, newSettings.grabHematAccount);
      
      if (user) {
          try {
              await updateDoc(doc(db, 'users', user.uid), { [field]: value });
              toast.success("Pengaturan Grab berhasil diperbarui");
          } catch (e) {
              console.error('Error updating grab setting', e);
              toast.error("Gagal memperbarui pengaturan Grab");
          }
      }
  };

  const groupedThemes = themes.reduce((acc, theme) => {
    acc[theme.category] = acc[theme.category] || [];
    acc[theme.category].push(theme);
    return acc;
  }, {} as Record<string, typeof themes>);

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase() || 'US';

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1 tracking-tight">Pengaturan</h1>
          <p className="text-sm text-app-text/70">Sesuaikan profil, rekening, dan preferensi aplikasi Anda.</p>
        </div>
        
        <div className="flex items-center gap-4 hidden md:flex">
          <button onClick={() => { setGlobalGrabModalOpen(true); navigate('/transactions'); }} className="w-10 h-10 rounded-full bg-app-success hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm" title="Transaksi Grab">
             <Car className="w-5 h-5" />
          </button>
          <button onClick={() => { setGlobalAddModalOpen(true); navigate('/transactions'); }} className="w-10 h-10 rounded-full bg-app-accent1 hover:opacity-90 flex items-center justify-center text-app-bg transition-opacity shadow-sm" title="Tambah Transaksi">
             <Plus className="w-5 h-5" />
          </button>
          <Link to="/settings" className="px-4 h-10 rounded-full bg-app-card flex items-center justify-center text-sm font-semibold text-app-text-bright border border-app-border gap-2 hover:bg-app-hover cursor-pointer transition-colors">
            <span className="opacity-800">{user?.displayName?.toUpperCase() || 'USER'}</span>
            <div className="w-6 h-6 rounded-full bg-app-accent1 text-xs font-bold flex items-center justify-center text-app-bg overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.displayName || 'USER')
              )}
            </div>
          </Link>
        </div>
      </header>

      <div className="flex-1 space-y-6 pb-10">
        
        <section className="bg-app-card p-6 rounded-3xl border border-app-border shadow-xl transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <button type="button" onClick={() => toggleSection('profil')} className={`relative z-10 w-full flex items-center justify-between ${sections.profil ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">Profil</h2>
            </div>
            {sections.profil ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.profil && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">Nama Lengkap / Sapaan</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright placeholder-app-text/30" placeholder="Masukkan nama..." />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">URL Foto Profil</label>
              <input type="url" value={photoURL} onChange={e => setPhotoURL(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright placeholder-app-text/30" placeholder="https://..." />
            </div>
            <div className="pt-2">
              <button type="submit" disabled={isUpdatingProfile} className="bg-app-accent1 disabled:opacity-800 disabled:cursor-not-allowed hover:bg-opacity-90 text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors">
                {isUpdatingProfile ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </div>
          </form>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-3xl border border-app-border shadow-xl transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <button type="button" onClick={() => toggleSection('rekening')} className={`relative z-10 w-full flex items-center justify-between ${sections.rekening ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">Daftar Rekening</h2>
            </div>
            {sections.rekening ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.rekening && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-end mb-4">
              <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-app-accent1 text-app-bg px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Rekening</span>
              </button>
            </div>
            
            {accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-app-text/50 py-10">
                <Wallet className="w-12 h-12 mb-4 opacity-[37.5%]" />
                <p className="text-sm">Belum ada rekening. Tambahkan satu untuk memulai.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {accounts.map(acc => {
                  const iconDetails = getAccountIconDetails(acc.icon);
                  const hasCustomColor = iconDetails?.color;
                  return (
                  <div key={acc.id} className="p-4 rounded-2xl bg-app-bg border border-app-border flex flex-col justify-between hover:border-app-accent1/50 transition-colors relative overflow-hidden group">
                    {hasCustomColor ? (
                      <div 
                        className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-80 block"
                        style={{ background: `linear-gradient(to bottom right, color-mix(in srgb, ${iconDetails.color} 25%, transparent), transparent, transparent)` }}
                      />
                    ) : (
                      <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${iconDetails?.type === 'cash' ? 'from-app-success/15' : 'from-app-accent1/15'} via-transparent to-transparent pointer-events-none opacity-80 block`} />
                    )}
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <AccountIcon iconId={acc.icon} className="w-8 h-8" />
                        <h3 className="text-sm text-app-text-bright font-semibold truncate">{acc.name}</h3>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleExclude(acc)}
                          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${acc.excludeFromTotal ? 'text-app-text/50' : 'text-app-text hover:bg-app-hover'}`}
                          title={acc.excludeFromTotal ? 'Pengecualian Total (Disembunyikan)' : 'Sertakan dalam Total'}
                        >
                          {acc.excludeFromTotal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => handleSetPrimary(acc.id)} 
                          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${acc.isPrimary ? 'text-app-accent1' : 'text-app-text hover:bg-app-hover'}`}
                          title={acc.isPrimary ? 'Rekening Utama' : 'Jadikan Utama'}
                        >
                          <Star className={`w-3.5 h-3.5 ${acc.isPrimary ? 'fill-current' : ''}`} />
                        </button>
                        <button onClick={() => openEditModal(acc)} className="p-2 hover:bg-app-hover rounded-lg transition-colors text-app-text" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setAccountToDelete(acc.id)} className="p-2 hover:bg-app-danger/10 rounded-lg transition-colors text-app-danger" title="Hapus">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] uppercase tracking-wider font-bold text-app-text mb-1 block">Saldo Saat Ini</p>
                      <p className="text-xl font-bold font-mono text-app-text-bright truncate">
                        Rp {acc.balance.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </section>

        {/* SECTION: DAFTAR KATEGORI */}
        <section className="bg-app-card p-6 rounded-3xl border border-app-border shadow-xl transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <button type="button" onClick={() => toggleSection('kategori')} className={`relative z-10 w-full flex items-center justify-between ${sections.kategori ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">Daftar Kategori</h2>
            </div>
            {sections.kategori ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.kategori && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-app-success uppercase tracking-wider">Kategori Pemasukan</h3>
                <div className="flex gap-2">
                  {categories.length === 0 && (
                    <button 
                      onClick={generateDefaultCategories}
                      className="flex items-center gap-2 px-3 py-1.5 bg-app-accent1/10 hover:bg-app-accent1/20 border border-app-accent1/30 text-app-accent1 rounded-full transition-colors text-xs font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Buat Default</span>
                    </button>
                  )}
                  <button 
                    onClick={() => openCategoryAddModal('income')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-app-bg hover:bg-app-hover border border-app-border text-app-text rounded-full transition-colors text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
              {categories.filter(c => c.type === 'income').length === 0 ? (
                 <p className="text-sm text-app-text/60 text-center py-4 bg-app-bg rounded-xl border border-app-border">Belum ada kategori pemasukan.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {categories.filter(c => c.type === 'income').map(cat => (
                    <div key={cat.id} className="p-3 rounded-xl bg-app-bg border border-app-border flex items-center justify-between group">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-app-success/10 flex items-center justify-center shrink-0">
                           <CategoryIcon iconId={cat.icon} className="w-4 h-4 text-app-success" />
                        </div>
                        <span className="text-sm font-semibold text-app-text-bright truncate">{cat.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openCategoryEditModal(cat)} className="p-1.5 hover:bg-app-hover rounded transition-colors text-app-text">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCategoryToDelete(cat.id)} className="p-1.5 hover:bg-app-danger/10 rounded transition-colors text-app-danger">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-app-danger uppercase tracking-wider">Kategori Pengeluaran</h3>
                <button 
                  onClick={() => openCategoryAddModal('expense')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-app-bg hover:bg-app-hover border border-app-border text-app-text rounded-full transition-colors text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
              {categories.filter(c => c.type === 'expense').length === 0 ? (
                 <p className="text-sm text-app-text/60 text-center py-4 bg-app-bg rounded-xl border border-app-border">Belum ada kategori pengeluaran.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {categories.filter(c => c.type === 'expense').map(cat => (
                    <div key={cat.id} className="p-3 rounded-xl bg-app-bg border border-app-border flex items-center justify-between group">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-app-danger/10 flex items-center justify-center shrink-0">
                           <CategoryIcon iconId={cat.icon} className="w-4 h-4 text-app-danger" />
                        </div>
                        <span className="text-sm font-semibold text-app-text-bright truncate">{cat.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openCategoryEditModal(cat)} className="p-1.5 hover:bg-app-hover rounded transition-colors text-app-text">
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button onClick={() => setCategoryToDelete(cat.id)} className="p-1.5 hover:bg-app-danger/10 rounded transition-colors text-app-danger">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-3xl border border-app-border shadow-xl transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <button type="button" onClick={() => toggleSection('grab')} className={`relative z-10 w-full flex items-center justify-between ${sections.grab ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-app-success" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">Pengaturan Akun Grab</h2>
            </div>
            {sections.grab ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.grab && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-in slide-in-from-top-2 duration-200">
            <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">Penyimpanan Cash / Tunai</label>
                <select value={grabCashAccount} onChange={e => handleGrabSettingChange('grabCashAccount', e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright">
                  <option value="" disabled>Pilih Rekening Cash</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">Dompet Aplikasi (Grab/Ovo)</label>
                <select value={grabDompetAccount} onChange={e => handleGrabSettingChange('grabDompetAccount', e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright">
                  <option value="" disabled>Pilih Rekening Dompet</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>
            <div className="md:col-span-2 pt-2 border-t border-app-border/50">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">Akun Penarikan Akses Hemat</label>
                        <select value={grabHematAccount} onChange={e => handleGrabSettingChange('grabHematAccount', e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright">
                          <option value="" disabled>Pilih Rekening Hemat</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
          </div>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-3xl border border-app-border shadow-xl transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <button type="button" onClick={() => toggleSection('bahasa')} className={`relative z-10 w-full flex items-center justify-between ${sections.bahasa ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">Bahasa</h2>
            </div>
            {sections.bahasa ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.bahasa && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
            {[{ id: 'id', name: 'Bahasa Indonesia' }, { id: 'en', name: 'English' }].map(lang => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id)}
                className={`p-4 rounded-2xl flex items-center justify-between transition-all border ${
                  language === lang.id ? 'bg-app-accent1 text-app-bg border-app-accent1 shadow-md' : 'bg-app-bg border-app-border hover:border-app-accent1/50 text-app-text-bright'
                }`}
              >
                <span className="font-semibold text-sm">{lang.name}</span>
                {language === lang.id && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-3xl border border-app-border shadow-xl transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <button type="button" onClick={() => toggleSection('tema')} className={`relative z-10 w-full flex items-center justify-between ${sections.tema ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">Tema</h2>
            </div>
            {sections.tema ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>

          {sections.tema && (
          <div className="space-y-8 animate-in slide-in-from-top-2 duration-200">
            {(Object.entries(groupedThemes) as [string, typeof themes][]).map(([category, catThemes]) => (
              <div key={category}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-app-text mb-4">
                  {category === 'light' ? 'Terang' : category === 'dark' ? 'Gelap' : 'Amoled'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {catThemes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeChange(theme.id)}
                      className={`p-1 rounded-2xl border-2 transition-all ${themeId === theme.id ? 'border-app-accent1 scale-105 shadow-lg' : 'border-app-border hover:scale-105 hover:border-app-accent1/50'}`}
                    >
                      <div 
                        className="w-full h-24 rounded-xl flex flex-col p-3 relative overflow-hidden"
                        style={{ backgroundColor: theme.colors.bg, color: theme.colors.text }}
                      >
                        <span className="text-sm font-bold truncate z-10 text-left">{theme.name}</span>
                        <div className="flex-1"></div>
                        <div className="flex gap-2 z-10 w-full">
                          <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.accent1 }}></div>
                          {theme.colors.accent2 && (
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: theme.colors.accent2 }}></div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-3xl border border-app-border shadow-xl transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <button type="button" onClick={() => toggleSection('font')} className={`relative z-10 w-full flex items-center justify-between ${sections.font ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">Font Kustom</h2>
            </div>
            {sections.font ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>

          {sections.font && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-app-text/70 mb-0">Unggah file .ttf atau .otf untuk mengubah font utama aplikasi.</p>
            </div>
            <div className="flex flex-col gap-4">
              <label className="w-full bg-app-bg px-4 py-8 rounded-2xl border border-dashed border-app-border hover:border-app-accent1 hover:bg-app-accent1/5 cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors">
                <input type="file" accept=".ttf,.otf" className="hidden" onChange={handleFontUpload} />
                <Type className="w-8 h-8 text-app-accent1 opacity-80" />
                <span className="text-sm font-semibold text-app-text-bright">Pilih File Font Baru</span>
                <span className="text-xs text-app-text/50">Maks. ukuran 5MB</span>
              </label>

              {pendingFontFile && (
                <div className="flex items-center justify-between bg-app-card p-4 rounded-2xl border border-app-accent1 shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-app-accent1/10 rounded-xl">
                      <Check className="w-5 h-5 text-app-accent1 shrink-0" />
                    </div>
                    <div>
                      <p className="text-xs text-app-text/70 font-bold uppercase tracking-wider mb-1">Siap Diterapkan</p>
                      <p className="text-sm font-bold truncate text-app-text-bright">{pendingFontFile.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setPendingFontFile(null)} className="px-4 py-2 text-xs font-bold text-app-text/70 hover:text-app-text-bright transition-colors">BATAL</button>
                    <button onClick={handleApplyFont} className="px-4 py-2 bg-app-accent1 hover:opacity-90 text-app-bg text-xs font-bold rounded-xl transition-colors shadow-sm">
                      TERAPKAN
                    </button>
                  </div>
                </div>
              )}

              {customFontName && !pendingFontFile && (
                <div className="flex items-center justify-between bg-app-bg p-4 rounded-2xl border border-app-success/30 shadow-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-app-success/10 rounded-xl">
                      <Check className="w-5 h-5 text-app-success shrink-0" />
                    </div>
                    <div>
                      <p className="text-xs text-app-success font-bold uppercase tracking-wider mb-1">Font Aktif</p>
                      <p className="text-sm font-bold truncate text-app-text-bright">{customFontName}</p>
                    </div>
                  </div>
                  <button onClick={handleRemoveFont} className="px-4 py-2 hover:bg-app-danger/10 text-app-danger text-xs font-bold rounded-xl transition-colors shrink-0">
                    KEMBALIKAN KE DEFAULT
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
        </section>
      </div>

      {/* Modal Rekening */}
      <AccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        account={editingAccount} 
      />

      {/* Modal Kategori */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={editingCategory}
        type={categoryModalType}
      />

      {/* Confirm Delete Category Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-app-card text-app-text w-full max-w-sm rounded-3xl shadow-2xl border border-app-border p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-app-text-bright mb-2">Hapus Kategori?</h3>
            <p className="text-sm text-app-text/70 mb-6">Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-3 bg-app-bg border border-app-border text-app-text-bright rounded-xl font-semibold hover:bg-app-hover transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleDeleteCategory}
                className="flex-1 py-3 bg-app-danger text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-app-danger/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Account Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-app-card text-app-text w-full max-w-sm rounded-3xl shadow-2xl border border-app-border p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-app-text-bright mb-2">Hapus Rekening?</h3>
            <p className="text-sm text-app-text/70 mb-6">Tindakan ini tidak dapat dibatalkan. Semua transaksi yang terikat dengan rekening ini mungkin terdampak.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-3 bg-app-bg border border-app-border text-app-text-bright rounded-xl font-semibold hover:bg-app-hover transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDeleteAccount}
                className="flex-1 py-3 bg-app-danger text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-app-danger/20"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
