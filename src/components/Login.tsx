import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { ArrowRight, ChartNoAxesCombined, Layers3, Loader2, ScanLine } from 'lucide-react';
import { useTranslation } from '../utils/translations';

export default function Login() {
  const { t } = useTranslation();
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
    <main className="relative grid min-h-[100dvh] overflow-hidden bg-app-bg text-app-text lg:grid-cols-[1.15fr_0.85fr]">
      <section className="relative hidden min-h-[100dvh] flex-col justify-between border-r border-app-border p-12 lg:flex xl:p-16">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-accent1/10">
            <img src="/icon.svg" alt="" className="h-7 w-7" />
          </div>
          <span className="text-xl font-semibold tracking-[-0.035em] text-app-text-bright">Razchly</span>
        </div>

        <div className="max-w-[680px] py-16">
          <h1 className="max-w-[620px] text-balance text-[clamp(2.8rem,5vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-app-text-bright">
            Uang Anda, terbaca dengan tenang.
          </h1>
          <p className="mt-7 max-w-[52ch] text-base leading-7 text-app-text/64">{t('login.subtitle')}</p>
        </div>

        <div className="grid max-w-[760px] grid-cols-3 gap-6 border-t border-app-border pt-6">
          {capabilities.map((item) => (
            <div key={item.text} className="space-y-3">
              <item.icon className="h-5 w-5 text-app-accent1" strokeWidth={1.5} />
              <p className="text-sm leading-6 text-app-text/62">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-10 lg:px-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-app-accent1/10">
              <img src="/icon.svg" alt="" className="h-7 w-7" />
            </div>
            <span className="text-xl font-semibold tracking-[-0.035em] text-app-text-bright">Razchly</span>
          </div>

          <h2 className="text-3xl font-semibold tracking-[-0.035em] text-app-text-bright">Masuk ke ruang finansial Anda</h2>
          <p className="mt-3 max-w-[38ch] text-sm leading-6 text-app-text/60">Gunakan akun Google untuk sinkronisasi, atau masuk sebagai tamu untuk mencoba.</p>

          <div className="mt-8 space-y-3">
            <button onClick={handleGoogle} disabled={loading} className="group flex h-12 w-full items-center justify-between rounded-xl bg-app-accent1 px-4 text-sm font-semibold text-app-bg disabled:cursor-not-allowed disabled:opacity-50">
              <span className="flex items-center gap-2.5">{loading && <Loader2 className="h-4 w-4 animate-spin" />} {t('login.googleBtn')}</span>
              {!loading && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
            </button>
            <button onClick={handleAnon} disabled={loading} className="flex h-12 w-full items-center justify-center rounded-xl border border-app-border bg-app-card text-sm font-medium text-app-text-bright hover:bg-app-hover disabled:cursor-not-allowed disabled:opacity-50">
              {t('login.guestBtn')}
            </button>
          </div>

          {error && <div role="alert" className="mt-5 w-full rounded-xl border border-app-danger/25 bg-app-danger/10 p-3 text-left text-xs leading-relaxed text-app-danger">{error}</div>}

          <p className="mt-6 text-xs leading-5 text-app-text/42">Data tamu tersimpan pada sesi perangkat ini. Masuk dengan Google untuk menggunakan akun Anda kembali di perangkat lain.</p>
        </div>
      </section>
    </main>
  );
}
