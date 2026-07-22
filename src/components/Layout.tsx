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
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-40 bg-app-bg/60 backdrop-blur-md"
            onClick={() => setIsFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Expanded FAB Menu Items (Arc Layout) */}
      <div className="md:hidden fixed bottom-[calc(30px+env(safe-area-inset-bottom))] left-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {isFabOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0, scale: 0.3, x: '-50%', y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% - 104px)', y: 'calc(-50% - 60px)' }}
                exit={{ opacity: 0, scale: 0.3, x: '-50%', y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0 }}
                className="absolute w-12 h-12 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    navigate('/analyze');
                  }}
                  className="w-12 h-12 rounded-full bg-app-glass border border-app-border text-app-accent1 shadow-lg flex items-center justify-center hover:opacity-90 transition-transform active:scale-[0.98]"
                >
                  <Scan className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1.5 text-app-text-bright font-medium text-[10px] whitespace-nowrap drop-shadow-md bg-app-bg/80 px-2 py-0.5 rounded-full border border-app-border">{t('nav.analyze')}</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.3, x: '-50%', y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% - 41px)', y: 'calc(-50% - 112px)' }}
                exit={{ opacity: 0, scale: 0.3, x: '-50%', y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.05 }}
                className="absolute w-12 h-12 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    navigate('/attendance');
                  }}
                  className="w-12 h-12 rounded-full bg-app-glass border border-app-border text-app-text-bright shadow-lg flex items-center justify-center hover:opacity-90 transition-transform active:scale-[0.98]"
                >
                  <CalendarCheck className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1.5 text-app-text-bright font-medium text-[10px] whitespace-nowrap drop-shadow-md bg-app-bg/80 px-2 py-0.5 rounded-full border border-app-border">{t('nav.attendance')}</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.3, x: '-50%', y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% + 41px)', y: 'calc(-50% - 112px)' }}
                exit={{ opacity: 0, scale: 0.3, x: '-50%', y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.1 }}
                className="absolute w-12 h-12 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    setGlobalGrabModalOpen(true);
                  }}
                  className="w-12 h-12 rounded-full bg-app-success text-app-bg shadow-lg flex items-center justify-center hover:opacity-90 transition-transform active:scale-[0.98]"
                >
                  <Car className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1.5 text-app-text-bright font-medium text-[10px] whitespace-nowrap drop-shadow-md bg-app-bg/80 px-2 py-0.5 rounded-full border border-app-border">{t('nav.grab')}</span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.3, x: '-50%', y: 0 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% + 104px)', y: 'calc(-50% - 60px)' }}
                exit={{ opacity: 0, scale: 0.3, x: '-50%', y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.15 }}
                className="absolute w-12 h-12 flex flex-col items-center pointer-events-auto" 
              >
              <button 
                onClick={() => {
                  setIsFabOpen(false);
                  setGlobalAddModalOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-app-accent1 text-[#0D1421] shadow-lg flex items-center justify-center hover:opacity-90 transition-transform active:scale-[0.98]"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
              <span className="absolute top-full mt-1.5 text-app-text-bright font-medium text-[10px] whitespace-nowrap drop-shadow-md bg-app-bg/80 px-2 py-0.5 rounded-full border border-app-border">{t('common.add')}</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation & FAB */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
        
        {/* Custom Bottom Bar Background */}
        <div className="absolute inset-0 drop-shadow-[0_-4px_15px_rgba(0,0,0,0.1)] pointer-events-none">
          <div className="absolute inset-0 rounded-t-[28px] overflow-hidden">
            <div 
              className="absolute inset-0 bg-app-card/75 backdrop-blur-2xl"
              style={{
                maskImage: `linear-gradient(black, black), url("data:image/svg+xml,%3Csvg width='120' height='72' viewBox='0 0 120 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 0 L 8 0 A 12 12 0 0 1 20 11.5 A 40 40 0 0 0 100 11.5 A 12 12 0 0 1 112 0 L 120 0 L 120 72 L 0 72 Z' fill='black' /%3E%3C/svg%3E"), linear-gradient(black, black)`,
                maskPosition: 'left top, center top, right top',
                maskSize: 'calc(50% - 60px) 100%, 120px 100%, calc(50% - 60px) 100%',
                maskRepeat: 'no-repeat, no-repeat, no-repeat',
                WebkitMaskImage: `linear-gradient(black, black), url("data:image/svg+xml,%3Csvg width='120' height='72' viewBox='0 0 120 72' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 0 L 8 0 A 12 12 0 0 1 20 11.5 A 40 40 0 0 0 100 11.5 A 12 12 0 0 1 112 0 L 120 0 L 120 72 L 0 72 Z' fill='black' /%3E%3C/svg%3E"), linear-gradient(black, black)`,
                WebkitMaskPosition: 'left top, center top, right top',
                WebkitMaskSize: 'calc(50% - 60px) 100%, 120px 100%, calc(50% - 60px) 100%',
                WebkitMaskRepeat: 'no-repeat, no-repeat, no-repeat',
              }}
            >
              <div className="absolute top-0 left-0 right-[calc(50%+60px)] h-[1px] bg-app-border/40"></div>
              <div className="absolute top-0 right-0 left-[calc(50%+60px)] h-[1px] bg-app-border/40"></div>
              <svg className="absolute top-0 left-1/2 -translate-x-1/2 text-app-border/40" width="120" height="72" viewBox="0 0 120 72">
                <path d="M 0 0.5 L 8 0.5 A 11.5 11.5 0 0 1 20 12 A 40.5 40.5 0 0 0 100 12 A 11.5 11.5 0 0 1 112 0.5 L 120 0.5" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bottom Bar Content */}
        <nav className="h-[72px] pointer-events-auto flex justify-between items-center px-2 pb-[env(safe-area-inset-bottom)] relative z-10">
          <div className="flex w-[40%] justify-around h-full">
            {mobileNavItems.slice(0, 2).map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                onMouseEnter={() => setHoveredMobilePath(item.path)}
                onMouseLeave={() => setHoveredMobilePath(null)}
                className={({ isActive }) => `relative flex flex-col items-center justify-center w-full h-full transition-all ${isActive ? 'text-[#A888FF] font-medium' : 'text-app-text/50'}`}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="w-6 h-6 mb-1 relative z-10" />
                    <span className="text-[11px] relative z-10 tracking-wide">{t(item.labelKey)}</span>
                    
                    {/* Dynamic Sliding Underline for Mobile active navigation */}
                    {item.path === window.location.pathname && (
                      <motion.div 
                        layoutId="mobile-nav-underline"
                        className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-10 h-[3px] bg-[#A888FF] rounded-full shadow-[0_1px_6px_rgba(168,136,255,0.5)]"
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
          
          <div className="w-[20%] flex justify-center h-full relative">
            {/* FAB Placeholder space */}
          </div>
          
          <div className="flex w-[40%] justify-around h-full">
            {mobileNavItems.slice(2, 4).map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                onMouseEnter={() => setHoveredMobilePath(item.path)}
                onMouseLeave={() => setHoveredMobilePath(null)}
                className={({ isActive }) => `relative flex flex-col items-center justify-center w-full h-full transition-all ${isActive ? 'text-[#A888FF] font-medium' : 'text-app-text/50'}`}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="w-6 h-6 mb-1 relative z-10" />
                    <span className="text-[11px] relative z-10 tracking-wide">{t(item.labelKey)}</span>
                    
                    {item.path === window.location.pathname && (
                      <motion.div 
                        layoutId="mobile-nav-underline"
                        className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-10 h-[3px] bg-[#A888FF] rounded-full shadow-[0_1px_6px_rgba(168,136,255,0.5)]"
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Central FAB */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-[calc(30px+env(safe-area-inset-bottom))] pointer-events-auto z-20">
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-[64px] h-[64px] rounded-full bg-[#A888FF] text-black shadow-[0_4px_15px_rgba(168,136,255,0.4)] flex items-center justify-center hover:opacity-90 transition-all duration-300 ${isFabOpen ? 'rotate-45' : ''}`}
          >
            <Plus className="w-10 h-10" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
