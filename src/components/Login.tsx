import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Wallet } from 'lucide-react';
import { TextReveal, PremiumButton } from './MotionWrappers';
import { motion } from 'motion/react';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
      setLoading(false);
    }
  };

  const handleAnon = async () => {
    try {
      setLoading(true);
      setError('');
      await signInAnonymously(auth);
    } catch (err: any) {
      setError(err.message || 'Gagal login anonim');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Parallax background effect */}
      <div 
        className="absolute inset-0 -z-10 opacity-5"
        data-parallax-speed="0.3"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />

      <div className="max-w-md w-full flex flex-col items-center text-center">
        {/* Logo with subtle float animation */}
        <motion.div
          className="w-20 h-20 mb-8 rounded-3xl overflow-hidden shadow-2xl shadow-app-accent1/20 border border-app-border"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          data-float-duration="4"
        >
          <img src="/icon.svg" alt="Razchly Logo" className="w-full h-full object-cover" />
        </motion.div>

        {/* Brand name with text reveal */}
        <div className="mb-2">
          <TextReveal 
            text="Razchly" 
            className="text-4xl font-bold"
            duration={0.6}
            staggerDelay={0.1}
          />
        </div>

        {/* Tagline with fade-in */}
        <motion.p 
          className="text-app-text/60 mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Catat keuangan harianmu dengan mudah dan aman.
        </motion.p>

        {/* Action buttons with stagger */}
        <motion.div 
          className="w-full space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <PremiumButton
            onClick={handleGoogle}
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {loading ? 'Sedang masuk...' : 'Masuk dengan Google'}
          </PremiumButton>
          
          <button 
            onClick={handleAnon}
            disabled={loading}
            className="w-full py-3 rounded-lg border-2 border-app-text/20 font-semibold hover:bg-app-text/5 transition-colors flex justify-center items-center btn-premium"
          >
            {loading ? 'Sedang masuk...' : 'Lanjutkan sebagai Tamu'}
          </button>
        </motion.div>
        
        {/* Error message with animation */}
        {error && (
          <motion.p 
            className="mt-6 text-red-500 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
}
