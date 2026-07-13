import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Wallet, Settings, Menu, PlusCircle, ArrowLeftRight, LogOut, X, TrendingUp, Plus, Car, Target, Scan, HandCoins, CalendarCheck, Cpu } from 'lucide-react';
import { motion } from 'motion/react';
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
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [hoveredMobilePath, setHoveredMobilePath] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, hiddenTabs, setGlobalAddModalOpen, setGlobalGrabModalOpen } = useStore();

  const visibleNavItems = NAV_ITEMS.filter((item) => !hiddenTabs.includes(item.path));

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
        
        <nav className="flex-1 px-4 flex flex-col gap-2 relative">
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className={`flex items-center w-full py-2 my-2 text-xs border border-app-border rounded-lg hover:bg-app-hover transition-all opacity-70 ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}>
            <Menu className={`w-4 h-4 ${isSidebarOpen ? 'mr-2' : ''}`} />
            {isSidebarOpen && "Toggle Sidebar"}
          </button>
          {visibleNavItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(null)}
              className={({ isActive }) => `relative flex items-center gap-4 py-3 rounded-xl transition-all ${isActive ? 'text-app-text-bright' : 'hover:text-app-text-bright cursor-pointer'} ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'}`}
              title={item.label}
            >
              {/* Dynamic Sliding Capsule Background for Active Item */}
              {item.path === window.location.pathname && (
                <motion.div 
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 bg-app-card border border-app-border rounded-xl shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              {/* Dynamic Hover Sliding Background */}
              {item.path !== window.location.pathname && hoveredPath === item.path && (
                <motion.div 
                  layoutId="sidebar-hover-bg"
                  className="absolute inset-0 bg-app-hover rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              
              {/* Elegant dynamic vertical accent line on the left */}
              {item.path === window.location.pathname && (
                <motion.div 
                  layoutId="sidebar-accent-line"
                  className="absolute left-0 top-3 bottom-3 w-1 bg-app-accent1 rounded-r-md"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}

              <item.icon className="w-5 h-5 shrink-0 relative z-10" />
              {isSidebarOpen && <span className="truncate font-medium relative z-10">{item.label}</span>}
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
        {NAV_ITEMS.filter(item => ['/', '/transactions', '/investments', '/loans'].includes(item.path) && !hiddenTabs.includes(item.path)).map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            onMouseEnter={() => setHoveredMobilePath(item.path)}
            onMouseLeave={() => setHoveredMobilePath(null)}
            className={({ isActive }) => `relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${isActive ? 'text-app-accent1 font-medium' : 'text-app-text/60'}`}
          >
            <item.icon className="w-5 h-5 mb-1 relative z-10" />
            <span className="text-[10px] relative z-10">{item.label}</span>
            
            {/* Dynamic Sliding Underline for Mobile active navigation */}
            {item.path === window.location.pathname && (
              <motion.div 
                layoutId="mobile-nav-underline"
                className="absolute bottom-1.5 left-2 right-2 h-[3px] bg-app-accent1 rounded-full shadow-[0_1px_4px_rgba(var(--accent1-color),0.4)]"
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
            
            {/* Dynamic sliding line for hovered navigation */}
            {item.path !== window.location.pathname && hoveredMobilePath === item.path && (
              <motion.div 
                layoutId="mobile-nav-hover-line"
                className="absolute bottom-1.5 left-4 right-4 h-[2px] bg-app-accent1/30 rounded-full"
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              />
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
