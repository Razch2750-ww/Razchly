import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { themes } from '../themes';
import { doc, updateDoc, collection, onSnapshot, query, where, getDocs, writeBatch, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Palette, Globe, Check, Car, User as UserIcon, ChevronDown, ChevronUp, Plus, Edit2, Trash2, Wallet, X, Type, Star, Eye, EyeOff, LayoutGrid, Sparkles, Calendar, ArrowLeftRight, TrendingUp, Cpu, HandCoins, CalendarCheck, Target, Scan } from 'lucide-react';
import { Account, Transaction, Category } from '../types';
import { auth } from '../lib/firebase';
import { updateProfile } from 'firebase/auth';
import { AccountIcon, ACCOUNT_ICONS, getAccountIconDetails } from './AccountIcon';
import { CategoryIcon } from './CategoryIcon';
import { CategoryModal } from './CategoryModal';
import { toast } from 'react-hot-toast';
import { AccountModal } from './AccountModal';
import { motion } from "motion/react";
import { HoverCard, ScrollReveal, StaggerContainer, StaggerItem, TextReveal } from "./MotionWrappers";
import { PageShell, ActionBtn } from "./PageShell";

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../utils/translations';

export default function Settings() {
  const { user, themeId, setThemeId, language, setLanguage, grabCashAccount, grabDompetAccount, grabHematAccount, setGrabAccounts, setGlobalAddModalOpen, setGlobalGrabModalOpen, customFontName, setCustomFont, workSchedule, setWorkSchedule, attendancePeriodStart, setAttendancePeriodStart, attendancePeriodEnd, setAttendancePeriodEnd, hiddenTabs, setHiddenTabs } = useStore();
  const { t } = useTranslation();
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
    jadwal: false,
    bahasa: false,
    tema: false,
    font: false,
    navigasi: false
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
        jadwal: false,
        bahasa: false,
        tema: false,
        font: false,
        navigasi: false,
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
      toast.success(t('settings.rekening.successDelete'));
      setAccountToDelete(null);
    } catch (err) {
       console.error('Error deleting account', err);
       toast.error(t('settings.rekening.failDelete'));
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
      toast.success(t('settings.profil.success'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('settings.profil.fail'));
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
      toast.success(t('settings.rekening.successPrimary'));
    } catch (error) {
      console.error('Error setting primary account', error);
      toast.error(t('settings.rekening.failPrimary'));
    }
  };

  const handleToggleExclude = async (account: Account) => {
    if (!user) return;
    try {
      const accountRef = doc(db, 'users', user.uid, 'accounts', account.id);
      await updateDoc(accountRef, { excludeFromTotal: !account.excludeFromTotal });
      toast.success(account.excludeFromTotal ? t('settings.rekening.successInclude') : t('settings.rekening.successExclude'));
    } catch (error) {
      console.error('Error toggling exclude status', error);
      toast.error(t('settings.rekening.failToggle'));
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
      toast.success(t('settings.kategori.successDelete'));
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Error deleting category', err);
      toast.error(t('settings.kategori.failDelete'));
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
      toast.success(t('settings.kategori.successDefault'));
    } catch (err) {
      console.error("Error setting default categories", err);
      toast.error(t('settings.kategori.failDefault'));
    }
  };

  const handleThemeChange = async (newThemeId: string) => {
    setThemeId(newThemeId);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { theme: newThemeId });
        toast.success(t('settings.tema.success'));
      } catch (err) {
        console.error('Error updating theme', err);
        toast.error(t('settings.tema.fail'));
      }
    }
  };

  const handleLanguageChange = async (newLang: string) => {
    setLanguage(newLang);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { language: newLang });
        toast.success(t('settings.bahasa.success'));
      } catch (err) {
         console.error('Error updating language', err);
         toast.error(t('settings.bahasa.fail'));
      }
    }
  };

  const handleToggleTab = async (path: string) => {
    if (user) {
      try {
        const isCurrentlyHidden = hiddenTabs.includes(path);
        const newHiddenTabs = isCurrentlyHidden
          ? hiddenTabs.filter(p => p !== path)
          : [...hiddenTabs, path];
        
        await updateDoc(doc(db, 'users', user.uid), { hiddenTabs: newHiddenTabs });
        setHiddenTabs(newHiddenTabs);
        toast.success(isCurrentlyHidden ? t('settings.navigasi.successShow') : t('settings.navigasi.successHide'));
      } catch (err) {
         console.error('Error updating hidden tabs', err);
         toast.error(t('settings.navigasi.fail'));
      }
    }
  };

  const [pendingFontFile, setPendingFontFile] = useState<{name: string, base64: string} | null>(null);

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.ttf') && !file.name.endsWith('.otf')) {
      toast.error(t('settings.font.failType'));
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
              toast.success(t('settings.grab.success'));
          } catch (e) {
              console.error('Error updating grab setting', e);
              toast.error(t('settings.grab.fail'));
          }
      }
  };

  const handleWorkScheduleChange = async (dayKey: string, field: 'isActive' | 'start' | 'end', value: any) => {
    if (!workSchedule) return;
    
    const newSchedule = {
      ...workSchedule,
      days: {
        ...workSchedule.days,
        [dayKey]: {
          ...workSchedule.days[dayKey],
          [field]: value
        }
      }
    };
    
    setWorkSchedule(newSchedule);
    
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { workSchedule: newSchedule });
        toast.success(t('settings.jadwal.successSchedule'));
      } catch (e) {
        console.error('Error updating work schedule', e);
        toast.error(t('settings.jadwal.failSchedule'));
      }
    }
  };

  const handleAttendancePeriodStartChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 31) val = 31;
    setAttendancePeriodStart(val);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { attendancePeriodStart: val });
        toast.success(t('settings.jadwal.successPeriodStart'));
      } catch (err) {
        console.error('Error updating attendance period start', err);
        toast.error(t('settings.jadwal.failPeriodStart'));
      }
    }
  };

  const handleAttendancePeriodEndChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 1;
    if (val < 1) val = 1;
    if (val > 31) val = 31;
    setAttendancePeriodEnd(val);
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { attendancePeriodEnd: val });
        toast.success(t('settings.jadwal.successPeriodEnd'));
      } catch (err) {
        console.error('Error updating attendance period end', err);
        toast.error(t('settings.jadwal.failPeriodEnd'));
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
    <PageShell title={t('settings.title')} subtitle={t('settings.subtitle')}>

      <ScrollReveal className="flex-1 space-y-6 pb-10">
        
        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          
          <button type="button" onClick={() => toggleSection('profil')} className={`relative z-10 w-full flex items-center justify-between ${sections.profil ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-semibold text-app-text-bright">{t('settings.profil.title')}</h2>
            </div>
            {sections.profil ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.profil && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div>
              <label className="text-xs font-medium text-app-text/70 mb-1.5 block">{t('settings.profil.nameLabel')}</label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright placeholder-app-text/30" placeholder={t('settings.profil.placeholderName') || "Masukkan nama..."} />
            </div>
            <div>
              <label className="text-xs font-medium text-app-text/70 mb-1.5 block">{t('settings.profil.photoLabel')}</label>
              <input type="url" value={photoURL} onChange={e => setPhotoURL(e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-4 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright placeholder-app-text/30" placeholder="https://..." />
            </div>
            <div className="pt-2">
              <button type="submit" disabled={isUpdatingProfile} className="bg-app-accent1 disabled:opacity-800 disabled:cursor-not-allowed hover:bg-opacity-90 text-white px-6 py-3 rounded-lg text-sm font-bold transition-colors">
                {isUpdatingProfile ? t('settings.profil.savingBtn') : t('settings.profil.saveBtn')}
              </button>
            </div>
          </form>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/10 via-transparent to-transparent pointer-events-none opacity-[37.5%]" />
          <button type="button" onClick={() => toggleSection('rekening')} className={`relative z-10 w-full flex items-center justify-between ${sections.rekening ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-semibold text-app-text-bright">{t('settings.rekening.title')}</h2>
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
                <span>{t('settings.rekening.addBtn')}</span>
              </button>
            </div>
            
            {accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-app-text/50 py-10">
                <Wallet className="w-12 h-12 mb-4 opacity-[37.5%]" />
                <p className="text-sm">{t('settings.rekening.noAccounts')}</p>
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
                           title={acc.excludeFromTotal ? t('settings.rekening.includeTitle') : t('settings.rekening.excludeTitle')}
                        >
                          {acc.excludeFromTotal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => handleSetPrimary(acc.id)} 
                          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${acc.isPrimary ? 'text-app-accent1' : 'text-app-text hover:bg-app-hover'}`}
                          title={acc.isPrimary ? t('settings.rekening.primaryTitle') : t('settings.rekening.makePrimary')}
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
                      <p className="text-[10px] uppercase tracking-wider font-bold text-app-text mb-1 block">{t('settings.rekening.currentBalance')}</p>
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
        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          
          <button type="button" onClick={() => toggleSection('kategori')} className={`relative z-10 w-full flex items-center justify-between ${sections.kategori ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">{t('settings.kategori.title')}</h2>
            </div>
            {sections.kategori ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.kategori && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-app-success uppercase tracking-wider">{t('settings.kategori.incomeTitle')}</h3>
                <div className="flex gap-2">
                  {categories.length === 0 && (
                    <button 
                      onClick={generateDefaultCategories}
                      className="flex items-center gap-2 px-3 py-1.5 bg-app-accent1/10 hover:bg-app-accent1/20 border border-app-accent1/30 text-app-accent1 rounded-full transition-colors text-xs font-bold"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('settings.kategori.createDefault')}</span>
                    </button>
                  )}
                  <button 
                    onClick={() => openCategoryAddModal('income')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-app-bg hover:bg-app-hover border border-app-border text-app-text rounded-full transition-colors text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('common.add')}</span>
                  </button>
                </div>
              </div>
              {categories.filter(c => c.type === 'income').length === 0 ? (
                 <p className="text-sm text-app-text/60 text-center py-4 bg-app-bg rounded-xl border border-app-border">{t('settings.kategori.noIncome')}</p>
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
                <h3 className="text-sm font-bold text-app-danger uppercase tracking-wider">{t('settings.kategori.expenseTitle')}</h3>
                <button 
                  onClick={() => openCategoryAddModal('expense')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-app-bg hover:bg-app-hover border border-app-border text-app-text rounded-full transition-colors text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('common.add')}</span>
                </button>
              </div>
              {categories.filter(c => c.type === 'expense').length === 0 ? (
                 <p className="text-sm text-app-text/60 text-center py-4 bg-app-bg rounded-xl border border-app-border">{t('settings.kategori.noExpense')}</p>
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

        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          
          <button type="button" onClick={() => toggleSection('grab')} className={`relative z-10 w-full flex items-center justify-between ${sections.grab ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Car className="w-5 h-5 text-app-success" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">{t('settings.grab.title')}</h2>
            </div>
            {sections.grab ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.grab && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-in slide-in-from-top-2 duration-200">
            <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">{t('settings.grab.cashLabel')}</label>
                <select value={grabCashAccount} onChange={e => handleGrabSettingChange('grabCashAccount', e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright">
                  <option value="" disabled>{t('settings.grab.cashPlaceholder') || "Pilih Rekening Cash"}</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>
            <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">{t('settings.grab.dompetLabel')}</label>
                <select value={grabDompetAccount} onChange={e => handleGrabSettingChange('grabDompetAccount', e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright">
                  <option value="" disabled>{t('settings.grab.dompetPlaceholder') || "Pilih Rekening Dompet"}</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
            </div>
            <div className="md:col-span-2 pt-2 border-t border-app-border/50">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">{t('settings.grab.hematLabel')}</label>
                        <select value={grabHematAccount} onChange={e => handleGrabSettingChange('grabHematAccount', e.target.value)} className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright">
                          <option value="" disabled>{t('settings.grab.hematPlaceholder') || "Pilih Rekening Hemat"}</option>
                          {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                </div>
            </div>
          </div>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          
          <button type="button" onClick={() => toggleSection('jadwal')} className={`relative z-10 w-full flex items-center justify-between ${sections.jadwal ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-app-warning" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">{t('settings.jadwal.title')}</h2>
            </div>
            {sections.jadwal ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>
          
          {sections.jadwal && workSchedule && (
          <div className="flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">{t('settings.jadwal.startPeriodLabel')}</label>
                <input type="number" min="1" max="31" value={attendancePeriodStart} onChange={handleAttendancePeriodStartChange} className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright" />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">{t('settings.jadwal.endPeriodLabel')}</label>
                <input type="number" min="1" max="31" value={attendancePeriodEnd} onChange={handleAttendancePeriodEndChange} className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright" />
              </div>
            </div>
            <p className="text-xs text-app-text/50">{t('settings.jadwal.exampleText')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {['1', '2', '3', '4', '5', '6', '0'].map((day) => {
               const dayNames = {
                 '1': t('settings.jadwal.monday') || 'Senin',
                 '2': t('settings.jadwal.tuesday') || 'Selasa',
                 '3': t('settings.jadwal.wednesday') || 'Rabu',
                 '4': t('settings.jadwal.thursday') || 'Kamis',
                 '5': t('settings.jadwal.friday') || 'Jumat',
                 '6': t('settings.jadwal.saturday') || 'Sabtu',
                 '0': t('settings.jadwal.sunday') || 'Minggu'
               };
               const ds = workSchedule.days[day];
               if (!ds) return null;
               return (
                  <div key={day} className="bg-app-bg p-3 rounded-xl border border-app-border flex flex-col gap-3">
                     <div className="flex items-center justify-between">
                        <span className="font-bold text-app-text-bright">{dayNames[day as keyof typeof dayNames]}</span>
                        <button
                          type="button"
                          onClick={() => handleWorkScheduleChange(day, 'isActive', !ds.isActive)}
                          className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${ds.isActive ? 'bg-app-success' : 'bg-app-border'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${ds.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                     </div>
                     {ds.isActive && (
                        <div className="flex gap-2">
                           <div className="flex-1">
                              <label className="text-[10px] uppercase font-bold tracking-wider mb-1 block text-app-text/70">{t('settings.jadwal.startLabel') || 'Mulai'}</label>
                              <input type="time" value={ds.start} onChange={e => handleWorkScheduleChange(day, 'start', e.target.value)} className="w-full bg-app-card border border-app-border rounded-lg px-2 py-2 text-sm focus:border-app-accent1 outline-none text-app-text-bright" />
                           </div>
                           <div className="flex-1">
                              <label className="text-[10px] uppercase font-bold tracking-wider mb-1 block text-app-text/70">{t('settings.jadwal.endLabel') || 'Selesai'}</label>
                              <input type="time" value={ds.end} onChange={e => handleWorkScheduleChange(day, 'end', e.target.value)} className="w-full bg-app-card border border-app-border rounded-lg px-2 py-2 text-sm focus:border-app-accent1 outline-none text-app-text-bright" />
                           </div>
                        </div>
                     )}
                  </div>
               );
            })}
          </div>
          </div>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          
          <button type="button" onClick={() => toggleSection('bahasa')} className={`relative z-10 w-full flex items-center justify-between ${sections.bahasa ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">{t('settings.bahasa.title')}</h2>
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

        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          
          <button type="button" onClick={() => toggleSection('tema')} className={`relative z-10 w-full flex items-center justify-between ${sections.tema ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">{t('settings.tema.title')}</h2>
            </div>
            {sections.tema ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>

          {sections.tema && (
          <div className="space-y-8 animate-in slide-in-from-top-2 duration-200">
            {(Object.entries(groupedThemes) as [string, typeof themes][]).map(([category, catThemes]) => (
              <div key={category}>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-app-text mb-4">
                  {category === 'light' ? t('settings.tema.light') : category === 'dark' ? t('settings.tema.dark') : 'Amoled'}
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

        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          
          <button type="button" onClick={() => toggleSection('navigasi')} className={`relative z-10 w-full flex items-center justify-between ${sections.navigasi ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">{t('settings.navigasi.title')}</h2>
            </div>
            {sections.navigasi ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>

          {sections.navigasi && (
          <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
            <p className="text-sm text-app-text/70 mb-2">
              {t('settings.navigasi.description')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[
                { path: '/transactions', labelKey: 'nav.transactions', icon: ArrowLeftRight },
                { path: '/investments', labelKey: 'nav.investments', icon: TrendingUp },
                { path: '/ai-trading', labelKey: 'nav.aiTrading', icon: Cpu },
                { path: '/loans', labelKey: 'nav.loans', icon: HandCoins },
                { path: '/attendance', labelKey: 'nav.attendance', icon: CalendarCheck },
                { path: '/grab', labelKey: 'nav.grab', icon: Car },
                { path: '/savings', labelKey: 'nav.savings', icon: Target },
                { path: '/analyze', labelKey: 'nav.analyze', icon: Scan },
              ].map((tab) => {
                const isHidden = hiddenTabs.includes(tab.path);
                return (
                  <div key={tab.path} className="flex items-center justify-between p-4 rounded-2xl bg-app-bg/50 border border-app-border">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-app-card border border-app-border">
                        <tab.icon className="w-4 h-4 text-app-accent1" />
                      </div>
                      <span className="text-sm font-semibold text-app-text-bright">{t(tab.labelKey)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleTab(tab.path)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        isHidden
                          ? 'border-app-danger/30 bg-app-danger/10 text-app-danger hover:bg-app-danger/20'
                          : 'border-app-success/30 bg-app-success/10 text-app-success hover:bg-app-success/20'
                      }`}
                    >
                      {isHidden ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          {t('settings.navigasi.hideLabel') || 'SEMBUNYI'}
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          {t('settings.navigasi.showLabel') || 'TAMPIL'}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </section>

        <section className="bg-app-card p-6 rounded-[24px] border border-app-border/40 shadow-xl transition-all relative overflow-hidden">
          
          <button type="button" onClick={() => toggleSection('font')} className={`relative z-10 w-full flex items-center justify-between ${sections.font ? 'mb-6 border-b border-app-border pb-4' : ''}`}>
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-app-accent1" />
              <h2 className="text-sm font-bold uppercase tracking-widest text-app-text-bright">{t('settings.font.title')}</h2>
            </div>
            {sections.font ? <ChevronUp className="w-5 h-5 text-app-text/50" /> : <ChevronDown className="w-5 h-5 text-app-text/50" />}
          </button>

          {sections.font && (
          <div className="animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-app-text/70 mb-0">{t('settings.font.description')}</p>
            </div>
            <div className="flex flex-col gap-4">
              <label className="w-full bg-app-bg px-4 py-8 rounded-2xl border border-dashed border-app-border hover:border-app-accent1 hover:bg-app-accent1/5 cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors">
                <input type="file" accept=".ttf,.otf" className="hidden" onChange={handleFontUpload} />
                <Type className="w-8 h-8 text-app-accent1 opacity-80" />
                <span className="text-sm font-semibold text-app-text-bright">{t('settings.font.uploadBtn')}</span>
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
                    <button onClick={() => setPendingFontFile(null)} className="px-4 py-2 text-xs font-bold text-app-text/70 hover:text-app-text-bright transition-colors">{t('common.cancel')}</button>
                    <button onClick={handleApplyFont} className="px-4 py-2 bg-app-accent1 hover:opacity-90 text-app-bg text-xs font-bold rounded-xl transition-colors shadow-sm">
                      {t('settings.font.applyBtn')}
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
                    {t('settings.font.removeBtn')}
                  </button>
                </div>
              )}
            </div>
          </div>
          )}
        </section>
      </ScrollReveal>

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
          <div className="bg-app-card text-app-text w-full max-w-sm rounded-[24px] shadow-2xl border border-app-border/40 p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-app-text-bright mb-2">
              {language === 'en' ? 'Delete Category?' : 'Hapus Kategori?'}
            </h3>
            <p className="text-sm text-app-text/70 mb-6">
              {language === 'en' ? 'This action cannot be undone.' : 'Tindakan ini tidak dapat dibatalkan.'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-3 bg-app-bg border border-app-border text-app-text-bright rounded-xl font-semibold hover:bg-app-hover transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleDeleteCategory}
                className="flex-1 py-3 bg-app-danger text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-app-danger/20"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Account Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-app-card text-app-text w-full max-w-sm rounded-[24px] shadow-2xl border border-app-border/40 p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-app-text-bright mb-2">
              {language === 'en' ? 'Delete Account?' : 'Hapus Rekening?'}
            </h3>
            <p className="text-sm text-app-text/70 mb-6">
              {language === 'en' 
                ? 'This action cannot be undone. All transactions bound to this account may be affected.' 
                : 'Tindakan ini tidak dapat dibatalkan. Semua transaksi yang terikat dengan rekening ini mungkin terdampak.'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setAccountToDelete(null)}
                className="flex-1 py-3 bg-app-bg border border-app-border text-app-text-bright rounded-xl font-semibold hover:bg-app-hover transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={confirmDeleteAccount}
                className="flex-1 py-3 bg-app-danger text-white rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-app-danger/20"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
