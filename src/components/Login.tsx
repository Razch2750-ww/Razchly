import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Loader2 } from 'lucide-react';
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

  return (
    <div className="min-h-[100dvh] bg-app-bg text-app-text flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-sm w-full flex flex-col items-center text-center">
        <div className="w-14 h-14 mb-6 rounded-xl overflow-hidden border border-app-border bg-app-card flex items-center justify-center shadow-sm">
          <img src="/icon.svg" alt="Razchly Logo" className="w-9 h-9 object-contain" />
        </div>
        
        <h1 className="text-2xl font-bold text-app-text-bright tracking-tight mb-1">Razchly</h1>
        <p className="text-app-text/60 text-sm mb-8 leading-relaxed">{t('login.subtitle')}</p>

        <div className="w-full space-y-3">
          <button 
            onClick={handleGoogle} 
            disabled={loading}
            className="w-full h-11 rounded-lg bg-app-accent1 text-app-bg font-semibold hover:opacity-90 active:scale-[0.99] transition-all flex justify-center items-center gap-2 text-sm shadow-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{t('login.googleBtn')}</span>
          </button>
          
          <button 
            onClick={handleAnon}
            disabled={loading}
            className="w-full h-11 rounded-lg border border-app-border bg-app-card hover:bg-app-hover text-app-text-bright font-medium active:scale-[0.99] transition-all flex justify-center items-center gap-2 text-sm shadow-sm disabled:opacity-50"
          >
            <span>{t('login.guestBtn')}</span>
          </button>
        </div>
        
        {error && (
          <div className="mt-6 p-3 rounded-lg bg-app-danger/10 border border-app-danger/20 text-app-danger text-xs leading-relaxed w-full text-left">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

