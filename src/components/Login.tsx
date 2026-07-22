import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Wallet } from 'lucide-react';
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
    <div className="min-h-[100dvh] bg-app-bg text-app-text flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center text-center">
        <div className="w-20 h-20 mb-8 rounded-[18px] overflow-hidden shadow-2xl shadow-app-accent1/20 border border-app-border">
          <img src="/icon.svg" alt="Razchly Logo" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-semibold mb-2">Razchly</h1>
        <p className="text-app-text/60 mb-10">{t('login.subtitle')}</p>

        <div className="w-full space-y-4">
          <button 
            onClick={handleGoogle} 
            disabled={loading}
            className="w-full py-4 rounded-xl bg-app-text text-app-bg font-semibold hover:opacity-90 transition-opacity flex justify-center items-center"
          >
            {t('login.googleBtn')}
          </button>
          
          <button 
            onClick={handleAnon}
            disabled={loading}
            className="w-full py-4 rounded-xl border-2 border-app-text/20 font-semibold hover:bg-app-text/5 transition-colors flex justify-center items-center"
          >
            {t('login.guestBtn')}
          </button>
        </div>
        
        {error && <p className="mt-6 text-red-500 text-sm">{error}</p>}
      </div>
    </div>
  );
}
