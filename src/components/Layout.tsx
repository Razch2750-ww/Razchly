import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Wallet, Settings, Menu, PlusCircle, ArrowLeftRight, LogOut, X, TrendingUp, Plus, Car, Target, Scan, HandCoins, CalendarCheck, Cpu } from 'lucide-react';
import { useStore } from '../store/useStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import Transactions from './Transactions';

const NAV_ITEMS = [
  { path: '/', label: 'Beranda', icon: Home },
  { path: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { path: '/investments', label: 'Investasi', icon: TrendingUp },
  { path: '/ai-trading', label: 'AI Trading', icon: Cpu },
  { path: '/loans', label: 'Pinjaman', icon: HandCoins },
  { path: '/attendance', label: 'Absensi', icon: CalendarCheck },
  { path: '/grab', label: 'Grab', icon: Car },
  { path: '/savings', label: 'Target', icon: Target },
  { path: '/analyze', label: 'Analisis', icon: Scan },
  { path: '/settings', label: 'Pengaturan', icon: Settings },
];

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const navigate = useNavigate();
  const { user, setGlobalAddModalOpen, setGlobalGrabModalOpen } = useStore();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex h-screen w-full bg-app-bg text-app-text overflow-hidden relative font-sans">
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 border-r border-app-border bg-app-bg ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className={`py-6 border-b border-app-border/50 mb-4 flex items-center justify-center ${isSidebarOpen ? 'px-6 !justify-start' : 'px-0'}`}>
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
            <img src="/icon.svg" alt="Razchly Logo" className="w-[80%] h-[80%] object-contain" />
          </div>
          {isSidebarOpen && <span className="font-bold text-app-text-bright text-xl tracking-tight ml-3">Razchly</span>}
        </div>
        
        <nav className="flex-1 px-4 flex flex-col gap-2">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`flex items-center w-full py-2 my-2 text-xs border border-app-border rounded-lg hover:bg-app-hover transition-colors opacity-70 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
            <Menu className={`w-4 h-4 ${isSidebarOpen ? 'mr-2' : ''}`} />
            {isSidebarOpen && "Toggle Sidebar"}
          </button>
          {NAV_ITEMS.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              className={({ isActive }) => `flex items-center gap-4 py-3 rounded-xl transition-all ${isActive ? 'bg-app-card text-app-text-bright border border-app-border shadow-sm' : 'hover:bg-app-hover cursor-pointer'} ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && <span className="truncate font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 mt-auto">
          <button onClick={handleLogout} className={`flex items-center w-full py-3 rounded-xl hover:bg-app-hover transition-colors text-app-danger ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
             <LogOut className="w-5 h-5 shrink-0" />
             {isSidebarOpen && <span className="ml-4">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 relative bg-app-bg flex flex-col">
        <Outlet />
        <Transactions modalOnly />
      </main>

      {/* Mobile Floating Action Buttons */}
      {isFabOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40"
          onClick={() => setIsFabOpen(false)}
        />
      )}
      <div className="md:hidden fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3">
        {isFabOpen && (
          <>
            <button 
              onClick={() => {
                setIsFabOpen(false);
                navigate('/ai-trading');
              }}
              className="w-12 h-12 rounded-full bg-app-card border border-app-border text-app-accent1 shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity animate-in slide-in-from-bottom-5 fade-in duration-200"
              title="AI Trading"
            >
              <Cpu className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setIsFabOpen(false);
                navigate('/attendance');
              }}
              className="w-12 h-12 rounded-full bg-app-card border border-app-border text-app-text-bright shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity animate-in slide-in-from-bottom-5 fade-in duration-200"
            >
              <CalendarCheck className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setIsFabOpen(false);
                setGlobalGrabModalOpen(true);
              }}
              className="w-12 h-12 rounded-full bg-app-success text-app-bg shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity animate-in slide-in-from-bottom-5 fade-in duration-200"
            >
              <Car className="w-5 h-5" />
            </button>
            <button 
              onClick={() => {
                setIsFabOpen(false);
                setGlobalAddModalOpen(true);
              }}
              className="w-12 h-12 rounded-full bg-app-accent1 text-app-bg shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity animate-in slide-in-from-bottom-5 fade-in duration-200"
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </>
        )}
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 rounded-full bg-app-accent1 text-app-bg shadow-lg flex items-center justify-center hover:opacity-90 transition-all duration-300 ${isFabOpen ? 'rotate-45' : ''}`}
        >
          <Plus className="w-8 h-8" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-app-border bg-app-card px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-around items-center z-50">
        {NAV_ITEMS.filter(item => ['/', '/transactions', '/investments', '/loans'].includes(item.path)).map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${isActive ? 'text-app-accent1 font-medium' : 'text-app-text/60'}`}
          >
            <item.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px]">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
