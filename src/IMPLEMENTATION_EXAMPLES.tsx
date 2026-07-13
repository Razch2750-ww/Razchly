/**
 * CONTOH IMPLEMENTASI - PREMIUM EFFECTS INTEGRATION
 * =================================================
 * 
 * File ini menunjukkan cara mengintegrasikan semua 5 efek premium
 * ke dalam berbagai komponen aplikasi Razchly
 */

// ============================================
// EXAMPLE 1: DASHBOARD WITH ALL EFFECTS
// ============================================

/*
import React, { useEffect, useState } from 'react';
import { 
  TextReveal, 
  SkeletonLoader, 
  ParallaxBackground,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  EmptyState,
  ErrorState
} from '@/components/MotionWrappers';
import { TrendingUp, Plus } from 'lucide-react';

export function DashboardWithPremiumEffects() {
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setTransactions([
        { id: 1, title: 'Groceries', amount: 50 },
        { id: 2, title: 'Transport', amount: 25 },
        { id: 3, title: 'Food', amount: 35 },
      ]);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      {/* EFFECT 1: Text Reveal - Hero Section */}
      <TextReveal
        text="Dashboard Keuangan Anda"
        className="text-4xl font-bold mb-2"
        duration={0.6}
        staggerDelay={0.08}
      />

      {/* EFFECT 4: Parallax Background */}
      <ParallaxBackground
        backgroundImage="/dashboard-hero.jpg"
        speed={0.3}
        className="rounded-lg mb-6 h-48 overflow-hidden"
      >
        <ScrollReveal className="p-8 h-full flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-white mb-2">Total Balance</h2>
          <p className="text-white/80">Rp 2.500.000</p>
        </ScrollReveal>
      </ParallaxBackground>

      {/* Staggered cards loading */}
      {isLoading ? (
        // EFFECT 2: Skeleton Loader - Shimmer
        <SkeletonLoader type="card" count={3} />
      ) : transactions.length === 0 ? (
        // EFFECT 5: Empty State with Micro-Animation
        <EmptyState
          icon={<TrendingUp size={48} />}
          title="Belum Ada Transaksi"
          description="Mulai catat transaksi harian Anda sekarang"
          action={<button className="btn-premium">+ Tambah Transaksi</button>}
          animated={true}
        />
      ) : (
        // EFFECT 1 + Motion: Staggered reveal
        <StaggerContainer>
          {transactions.map((tx) => (
            <StaggerItem key={tx.id}>
              <ScrollReveal className="mb-3">
                <div className="p-4 rounded-lg border border-app-border hover:bg-app-hover transition-colors">
                  <h4 className="font-semibold">{tx.title}</h4>
                  <p className="text-sm text-app-text/60">Rp {tx.amount}</p>
                </div>
              </ScrollReveal>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
*/

// ============================================
// EXAMPLE 2: TRANSACTIONS TAB WITH FORMS
// ============================================

/*
import React, { useState } from 'react';
import {
  TextReveal,
  FloatingFormGroup,
  EmptyState,
  ParallaxBackground,
  PremiumButton,
  ErrorState
} from '@/components/MotionWrappers';
import { FileText, AlertCircle } from 'lucide-react';

export function TransactionsTabWithForms() {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    notes: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Validate and submit
    try {
      // API call here
      await new Promise(r => setTimeout(r, 1000));
      setFormData({ title: '', amount: '', category: '', notes: '' });
    } catch (err) {
      setErrors({ submit: 'Gagal menyimpan transaksi' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-md">
      {/* EFFECT 1: Text Reveal Header */}
      <TextReveal
        text="Tambah Transaksi Baru"
        className="text-2xl font-bold mb-4"
      />

      {/* EFFECT 3: Floating Form Labels with Soft Glow */}
      <div className="space-y-4">
        <FloatingFormGroup
          id="title"
          label="Judul Transaksi"
          placeholder=""
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          error={errors.title}
        />

        <FloatingFormGroup
          id="amount"
          label="Jumlah (Rp)"
          type="number"
          placeholder=""
          value={formData.amount}
          onChange={(e) => handleChange('amount', e.target.value)}
          error={errors.amount}
        />

        <FloatingFormGroup
          id="category"
          label="Kategori"
          placeholder=""
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          error={errors.category}
        />

        <FloatingFormGroup
          id="notes"
          label="Catatan (Opsional)"
          placeholder=""
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          multiline={true}
          rows={3}
        />

        {errors.submit && (
          <ErrorState
            icon={<AlertCircle size={32} />}
            title="Kesalahan"
            message={errors.submit}
            animated={false}
          />
        )}

        <PremiumButton
          onClick={handleSubmit}
          disabled={isSubmitting}
          variant="primary"
          size="lg"
          className="w-full"
        >
          {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
        </PremiumButton>
      </div>
    </div>
  );
}
*/

// ============================================
// EXAMPLE 3: INVESTMENTS WITH SKELETON LOADER
// ============================================

/*
import React, { useState, useEffect } from 'react';
import {
  TextReveal,
  SkeletonLoader,
  ScrollReveal,
  StaggerContainer,
  StaggerItem,
  EmptyState,
  HoverCard
} from '@/components/MotionWrappers';
import { TrendingUp, Plus } from 'lucide-react';

export function InvestmentsWithSkeletons() {
  const [isLoading, setIsLoading] = useState(true);
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    // Simulate API loading
    setTimeout(() => {
      setIsLoading(false);
      setInvestments([
        { id: 1, name: 'Saham A', value: 5000000, return: '+12%' },
        { id: 2, name: 'Mutual Fund B', value: 3000000, return: '+8%' },
      ]);
    }, 2500);
  }, []);

  return (
    <div className="p-6">
      {/* EFFECT 1: Text Reveal */}
      <TextReveal
        text="Portfolio Investasi"
        className="text-3xl font-bold mb-6"
      />

      {/* EFFECT 2: Skeleton while loading */}
      {isLoading ? (
        <SkeletonLoader type="card" count={3} className="space-y-4" />
      ) : investments.length === 0 ? (
        // EFFECT 5: Empty State
        <EmptyState
          icon={<Plus size={48} />}
          title="Portfolio Kosong"
          description="Mulai investasi Anda sekarang"
          action={<button className="btn-premium">Tambah Investasi</button>}
        />
      ) : (
        // Cards with HoverCard effect + stagger
        <StaggerContainer className="space-y-4">
          {investments.map((inv) => (
            <StaggerItem key={inv.id}>
              <HoverCard className="rounded-lg p-6 bg-app-card border border-app-border">
                <ScrollReveal>
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{inv.name}</h3>
                      <p className="text-sm text-app-text/60">
                        Rp {inv.value.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className={inv.return.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                      {inv.return}
                    </div>
                  </div>
                </ScrollReveal>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}
*/

// ============================================
// EXAMPLE 4: SETTINGS FORM WITH FLOATING INPUTS
// ============================================

/*
import React, { useState } from 'react';
import {
  TextReveal,
  FloatingFormGroup,
  ParallaxBackground,
  PremiumButton,
  ScrollReveal
} from '@/components/MotionWrappers';

export function SettingsWithFloatingInputs() {
  const [settings, setSettings] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    currency: 'IDR',
    language: 'id',
  });

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
  };

  return (
    <div className="max-w-2xl">
      {/* EFFECT 1: Text Reveal */}
      <TextReveal
        text="Pengaturan Akun"
        className="text-3xl font-bold mb-6"
      />

      {/* EFFECT 4: Parallax Section */}
      <ParallaxBackground
        backgroundImage="/settings-banner.jpg"
        speed={0.2}
        className="rounded-lg mb-8 h-40 p-8"
      >
        <ScrollReveal>
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">Profile Anda</h2>
            <p className="opacity-90">Kelola informasi akun dan preferensi</p>
          </div>
        </ScrollReveal>
      </ParallaxBackground>

      {/* EFFECT 3: Floating Form Inputs */}
      <div className="space-y-6">
        <ScrollReveal delay={0.1}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informasi Pribadi</h3>
            
            <FloatingFormGroup
              id="name"
              label="Nama Lengkap"
              value={settings.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />

            <FloatingFormGroup
              id="email"
              label="Email"
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Preferensi</h3>
            
            <FloatingFormGroup
              id="currency"
              label="Mata Uang"
              value={settings.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
            />

            <FloatingFormGroup
              id="language"
              label="Bahasa"
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
            />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3} className="pt-4">
          <PremiumButton
            onClick={handleSave}
            variant="primary"
            size="lg"
            className="w-full"
          >
            Simpan Pengaturan
          </PremiumButton>
        </ScrollReveal>
      </div>
    </div>
  );
}
*/

// ============================================
// EXAMPLE 5: ERROR & EMPTY STATES
// ============================================

/*
import React from 'react';
import {
  EmptyState,
  ErrorState,
  TextReveal,
  PremiumButton
} from '@/components/MotionWrappers';
import { ShoppingCart, AlertTriangle, Zap } from 'lucide-react';

export function ErrorAndEmptyStates() {
  return (
    <div className="space-y-12 p-6">
      {/* Empty State Example */}
      <div>
        <TextReveal text="Empty State" className="text-2xl font-bold mb-6" />
        <EmptyState
          icon={<ShoppingCart size={56} />}
          title="Keranjang Kosong"
          description="Anda belum menambahkan transaksi ke keranjang"
          action={
            <button className="btn-premium">
              Mulai Tambah Transaksi
            </button>
          }
          animated={true}
        />
      </div>

      {/* Error State Example */}
      <div>
        <TextReveal text="Error State" className="text-2xl font-bold mb-6" />
        <ErrorState
          icon={<AlertTriangle size={56} />}
          title="Gagal Memuat Data"
          message="Koneksi internet Anda terputus. Silakan coba lagi."
          action={
            <button className="btn-premium">Coba Lagi</button>
          }
          animated={true}
        />
      </div>

      {/* No Permission State */}
      <div>
        <TextReveal text="No Permission" className="text-2xl font-bold mb-6" />
        <ErrorState
          icon={<Zap size={56} />}
          title="Akses Ditolak"
          message="Anda tidak memiliki izin untuk mengakses halaman ini"
          action={
            <button className="btn-premium">Kembali ke Dashboard</button>
          }
          animated={true}
        />
      </div>
    </div>
  );
}
*/

// ============================================
// EXAMPLE 6: PARALLAX WITH HOVER CARDS
// ============================================

/*
import React from 'react';
import {
  ParallaxBackground,
  HoverCard,
  ScrollReveal,
  TextReveal
} from '@/components/MotionWrappers';
import { CreditCard, Wallet, PiggyBank } from 'lucide-react';

export function ParallaxWithHoverCards() {
  const cards = [
    { icon: Wallet, title: 'Saldo', value: 'Rp 5.000.000' },
    { icon: TrendingUp, title: 'Investasi', value: 'Rp 10.000.000' },
    { icon: PiggyBank, title: 'Tabungan', value: 'Rp 3.500.000' },
  ];

  return (
    <ParallaxBackground
      backgroundImage="/accounts-bg.jpg"
      speed={0.3}
      className="rounded-xl overflow-hidden p-8"
    >
      <div className="mb-8">
        <TextReveal
          text="Akun Anda"
          className="text-3xl font-bold text-white mb-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <ScrollReveal key={idx} delay={idx * 0.1}>
              <HoverCard className="bg-white/10 backdrop-blur-xl p-6 rounded-lg text-white">
                <Icon size={32} className="mb-4 opacity-80" />
                <h3 className="font-semibold mb-1">{card.title}</h3>
                <p className="text-sm opacity-90">{card.value}</p>
              </HoverCard>
            </ScrollReveal>
          );
        })}
      </div>
    </ParallaxBackground>
  );
}
*/

export default {};
