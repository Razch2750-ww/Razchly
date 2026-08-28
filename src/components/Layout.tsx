import React, { useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, Settings, Menu, PlusCircle, ArrowLeftRight, LogOut, X, TrendingUp, Plus, Car, Target, Scan, HandCoins, CalendarCheck, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import Transactions from './Transactions';
import { ParallaxBackground } from './MotionWrappers';
import { useTranslation } from '../utils/translations';

const NAV_ITEMS = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/transactions', labelKey: 'nav.transactions', icon: ArrowLeftRight },
  { path: '/investments', labelKey: 'nav.investments', icon: TrendingUp },
  { path: '/analyze', labelKey: 'nav.analyze', icon: Scan },
  { path: '/loans', labelKey: 'nav.loans', icon: HandCoins },
  { path: '/attendance', labelKey: 'nav.attendance', icon: CalendarCheck },
  { path: '/grab', labelKey: 'nav.grab', icon: Car },
  { path: '/savings', labelKey: 'nav.savings', icon: Target },
  { path: '/ai-trading', labelKey: 'nav.aiTrading', icon: Cpu },
  { path: '/settings', labelKey: 'nav.settings', icon: Settings },
];

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [hoveredPath, setHoveredPath] = useState<string | null>(null);
  const [hoveredMobilePath, setHoveredMobilePath] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useStore((state) => state.user);
  const hiddenTabs = useStore((state) => state.hiddenTabs);
  const setGlobalAddModalOpen = useStore((state) => state.setGlobalAddModalOpen);
  const setGlobalGrabModalOpen = useStore((state) => state.setGlobalGrabModalOpen);
  const { t } = useTranslation();
  const mainRef = useRef<HTMLElement>(null);

  const visibleNavItems = React.useMemo(() => {
    return NAV_ITEMS.filter((item) => !hiddenTabs.includes(item.path));
  }, [hiddenTabs]);

  const mobileNavItems = React.useMemo(() => {
    return NAV_ITEMS.filter(item => ['/', '/transactions', '/investments', '/loans'].includes(item.path) && !hiddenTabs.includes(item.path));
  }, [hiddenTabs]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-app-bg text-app-text overflow-hidden relative font-sans">
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 border-r border-app-border bg-app-bg ${isSidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        {/* Logo */}
        <div className={`h-16 flex items-center shrink-0 border-b border-app-border ${isSidebarOpen ? 'px-5 gap-3' : 'justify-center px-0'}`}>
          <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-app-accent1/10">
            <img src="/icon.svg" alt="Razchly Logo" className="w-[70%] h-[70%] object-contain" />
          </div>
          {isSidebarOpen && (
            <span className="font-extrabold text-app-text-bright text-lg tracking-tight leading-none">
              Razchly
            </span>
          )}
        </div>
        
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 relative">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className={`flex items-center w-full py-2.5 mb-3 text-[11px] font-semibold tracking-wide text-app-text/50 hover:text-app-text rounded-lg hover:bg-app-hover/60 transition-all ${!isSidebarOpen ? 'justify-center px-0' : 'px-3 gap-2'}`}
          >
            <Menu className="w-4 h-4 shrink-0" />
            {isSidebarOpen && t('nav.collapse')}
          </button>
          {visibleNavItems.map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              onMouseEnter={() => setHoveredPath(item.path)}
              onMouseLeave={() => setHoveredPath(null)}
              className={({ isActive }) =>
                `relative flex items-center gap-3 py-2 px-3 rounded-md transition-all duration-200
                ${isActive
                  ? 'text-app-text-bright bg-app-hover/50'
                  : 'text-app-text/60 hover:text-app-text-bright hover:bg-app-hover/30 cursor-pointer'
                }
                ${!isSidebarOpen ? 'justify-center px-0' : ''}`
              }
              title={!isSidebarOpen ? t(item.labelKey) : undefined}
            >
              
              {/* Icon */}
              <span className={`relative flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-all duration-200 ${
                item.path === window.location.pathname
                  ? 'text-app-accent1'
                  : 'text-current'
              }`}>
                <item.icon className="w-5 h-5" strokeWidth={1.5} />
              </span>
              {isSidebarOpen && (
                <span className="truncate text-[14px] font-normal tracking-tight relative z-10">{t(item.labelKey)}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-app-border mt-auto">
          <button
            onClick={handleLogout}
            className={`flex items-center w-full py-2.5 rounded-xl hover:bg-app-danger/10 transition-colors text-app-text/50 hover:text-app-danger ${
              !isSidebarOpen ? 'justify-center px-0' : 'px-3 gap-3'
            }`}
          >
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </span>
            {isSidebarOpen && <span className="text-sm font-medium">{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main ref={mainRef} className="flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-hidden pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0 relative bg-app-bg flex flex-col">
        <ParallaxBackground containerRef={mainRef} />
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          className="flex-1 w-full flex flex-col"
        >
          <Outlet />
        </motion.div>
        <Transactions modalOnly />
      </main>

      {/* Mobile Floating Action Buttons Overlay */}
      <AnimatePresence>
        {isFabOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Expanded FAB Menu Items (Arc Layout) */}
      <div className="md:hidden fixed bottom-[calc(24px+env(safe-area-inset-bottom))] left-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {isFabOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: '-50%', y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% - 96px)', y: 'calc(-50% - 56px)' }}
                exit={{ opacity: 0, scale: 0.8, x: '-50%', y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute w-11 h-11 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    navigate('/analyze');
                  }}
                  className="w-11 h-11 rounded-full bg-app-card border border-app-border text-app-accent1 shadow-md flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Scan className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1 text-app-text-bright font-medium text-[10px] whitespace-nowrap bg-app-card px-2 py-0.5 rounded-md border border-app-border shadow-sm">{t('nav.analyze')}</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: '-50%', y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% - 36px)', y: 'calc(-50% - 96px)' }}
                exit={{ opacity: 0, scale: 0.8, x: '-50%', y: 0 }}
                transition={{ duration: 0.15, delay: 0.02 }}
                className="absolute w-11 h-11 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    navigate('/attendance');
                  }}
                  className="w-11 h-11 rounded-full bg-app-card border border-app-border text-app-text-bright shadow-md flex items-center justify-center active:scale-95 transition-transform"
                >
                  <CalendarCheck className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1 text-app-text-bright font-medium text-[10px] whitespace-nowrap bg-app-card px-2 py-0.5 rounded-md border border-app-border shadow-sm">{t('nav.attendance')}</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: '-50%', y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% + 36px)', y: 'calc(-50% - 96px)' }}
                exit={{ opacity: 0, scale: 0.8, x: '-50%', y: 0 }}
                transition={{ duration: 0.15, delay: 0.04 }}
                className="absolute w-11 h-11 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    setGlobalGrabModalOpen(true);
                  }}
                  className="w-11 h-11 rounded-full bg-app-card border border-app-border text-app-success shadow-md flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Car className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1 text-app-text-bright font-medium text-[10px] whitespace-nowrap bg-app-card px-2 py-0.5 rounded-md border border-app-border shadow-sm">{t('nav.grab')}</span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: '-50%', y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% + 96px)', y: 'calc(-50% - 56px)' }}
                exit={{ opacity: 0, scale: 0.8, x: '-50%', y: 0 }}
                transition={{ duration: 0.15, delay: 0.06 }}
                className="absolute w-11 h-11 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    setGlobalAddModalOpen(true);
                  }}
                  className="w-11 h-11 rounded-full bg-app-accent1 text-app-bg shadow-md flex items-center justify-center active:scale-95 transition-transform"
                >
                  <ArrowLeftRight className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1 text-app-text-bright font-medium text-[10px] whitespace-nowrap bg-app-card px-2 py-0.5 rounded-md border border-app-border shadow-sm">{t('common.add')}</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation Bar & Elevated Centered Action */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-app-card border-t border-app-border relative">
          <nav className="h-16 flex justify-between items-center px-3 pb-[env(safe-area-inset-bottom)] relative">
            <div className="flex w-[40%] justify-around h-full items-center">
              {mobileNavItems.slice(0, 2).map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path}
                  className={({ isActive }) => 
                    `relative flex flex-col items-center justify-center w-full h-full py-1 transition-colors ${
                      isActive ? 'text-app-accent1 font-medium' : 'text-app-text/60 hover:text-app-text'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="w-5 h-5 mb-1 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                      <span className="text-[10px] tracking-tight leading-none">{t(item.labelKey)}</span>
                      {isActive && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-app-accent1 rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            
            {/* Center spacing for elevated action */}
            <div className="w-[20%] flex justify-center h-full relative" />
            
            <div className="flex w-[40%] justify-around h-full items-center">
              {mobileNavItems.slice(2, 4).map((item) => (
                <NavLink 
                  key={item.path} 
                  to={item.path}
                  className={({ isActive }) => 
                    `relative flex flex-col items-center justify-center w-full h-full py-1 transition-colors ${
                      isActive ? 'text-app-accent1 font-medium' : 'text-app-text/60 hover:text-app-text'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className="w-5 h-5 mb-1 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                      <span className="text-[10px] tracking-tight leading-none">{t(item.labelKey)}</span>
                      {isActive && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-app-accent1 rounded-full" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </nav>

          {/* Elevated Centered Action Button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-5 pointer-events-auto z-20">
            <button 
              onClick={() => setIsFabOpen(!isFabOpen)}
              className={`w-12 h-12 rounded-full bg-app-accent1 text-app-bg shadow-md border-2 border-app-bg flex items-center justify-center active:scale-95 transition-all duration-200 ${isFabOpen ? 'rotate-45' : ''}`}
              aria-label="Add transaction or action"
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
