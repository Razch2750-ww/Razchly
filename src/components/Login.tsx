import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ArrowRight, ChartNoAxesCombined, Layers3, Loader2, ScanLine } from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { motion, useReducedMotion } from 'motion/react';

export default function Login() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || t('login.errorGoogle'));
      setLoading(false);
    }
  };

  const handleAnon = async () => {
    try {
      setLoading(true);
      setError('');
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message || t('login.errorAnon'));
      setLoading(false);
    }
  };

  const capabilities = [
    { icon: Layers3, text: 'Rekening, transaksi, pinjaman, dan target dalam satu tempat' },
    { icon: ChartNoAxesCombined, text: 'Pantau arus kas dan portofolio dengan angka yang jelas' },
    { icon: ScanLine, text: 'Catat transaksi lebih cepat dengan pemindai struk' },
  ];

  return (
    <main className="route-login login-ledger relative grid min-h-[100dvh] overflow-hidden lg:grid-cols-[1.16fr_0.84fr]">
      <section className="relative hidden min-h-[100dvh] flex-col justify-between px-12 py-10 lg:flex xl:px-16 xl:py-12">
        <div className="flex items-center justify-between border-b border-app-border pb-6">
          <span className="font-ledger text-[28px] text-app-accent1">Razchly</span>
          <span className="text-xs text-app-text">Personal finance ledger</span>
        </div>

        <div className="grid grid-cols-[1.1fr_.9fr] items-end gap-10 py-10 xl:gap-16">
          <div>
          <h1 className="max-w-[620px] text-balance text-[clamp(3.4rem,5.4vw,6rem)] font-normal leading-[0.91] tracking-[-0.035em] text-app-text-bright">
            Keputusan uang dimulai dari angka yang jernih.
          </h1>
          <p className="mt-7 max-w-[50ch] text-sm leading-7 text-app-text">{t('login.subtitle')}</p>
          </div>

          <motion.div
            initial={reduceMotion ? false : { clipPath: 'inset(0 0 100% 0)', y: 16 }}
            animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="login-statement p-6"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-app-text">Ritme bulan ini</p>
            <p className="font-ledger mt-3 text-[34px] leading-none text-app-text-bright">+Rp 4.820.000</p>
            <dl className="mt-6 divide-y divide-app-border border-y border-app-border text-xs">
              <div className="flex justify-between py-3"><dt className="text-app-text">Pemasukan</dt><dd className="font-mono font-semibold text-app-success">Rp 12.500.000</dd></div>
              <div className="flex justify-between py-3"><dt className="text-app-text">Pengeluaran</dt><dd className="font-mono font-semibold text-app-danger">Rp 7.680.000</dd></div>
              <div className="flex justify-between py-3"><dt className="text-app-text">Target</dt><dd className="font-mono font-semibold text-app-text-bright">68% tercapai</dd></div>
            </dl>
            <p className="mt-4 text-[11px] leading-5 text-app-text">Contoh tampilan. Data aktual hanya muncul setelah Anda masuk.</p>
          </motion.div>
        </div>

        <div className="grid max-w-[900px] grid-cols-3 divide-x divide-app-border border-t border-app-border pt-6">
          {capabilities.map((item) => (
            <div key={item.text} className="space-y-3 px-5 first:pl-0 last:pr-0">
              <item.icon className="h-5 w-5 text-app-accent1" strokeWidth={1.45} />
              <p className="text-xs leading-5 text-app-text">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="login-sheet flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-14 flex items-center justify-between border-b border-app-border pb-5 lg:hidden">
            <span className="font-ledger text-[28px] text-app-accent1">Razchly</span>
            <span className="text-[11px] text-app-text">Keuangan pribadi</span>
          </div>

          <h2 className="font-ledger max-w-[12ch] text-[clamp(2.5rem,8vw,4rem)] leading-[0.98] tracking-[-0.025em] text-app-text-bright">Masuk ke ledger Anda.</h2>
          <p className="mt-5 max-w-[38ch] text-sm leading-6 text-app-text">Gunakan Google untuk sinkronisasi lintas perangkat, atau masuk sebagai tamu untuk mencoba.</p>

          <div className="mt-8 space-y-3">
            <button type="button" onClick={handleGoogle} disabled={loading} className="group flex h-[52px] w-full items-center justify-between rounded-[12px] bg-app-accent1 px-4 text-sm font-semibold text-app-on-accent disabled:cursor-not-allowed disabled:opacity-50">
              <span className="flex items-center gap-2.5">{loading && <Loader2 className="h-4 w-4 animate-spin" />} {t('login.googleBtn')}</span>
              {!loading && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
            </button>
            <button type="button" onClick={handleAnon} disabled={loading} className="flex h-[52px] w-full items-center justify-center rounded-[12px] border border-app-border bg-transparent text-sm font-medium text-app-text-bright hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50">
              {t('login.guestBtn')}
            </button>
          </div>

          {error && <div role="alert" className="mt-5 w-full rounded-xl border border-app-danger/30 bg-app-danger/10 p-3 text-left text-xs leading-relaxed text-app-danger">{error}</div>}

          <p className="mt-7 border-t border-app-border pt-5 text-xs leading-5 text-app-text">Data tamu tersimpan pada sesi perangkat ini. Masuk dengan Google untuk menggunakan akun Anda kembali di perangkat lain.</p>
        </div>
      </section>
    </main>
  );
}
