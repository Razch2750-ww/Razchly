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
  { path: '/ai-trading', labelKey: 'nav.aiTrading', icon: Cpu },
  { path: '/loans', labelKey: 'nav.loans', icon: HandCoins },
  { path: '/attendance', labelKey: 'nav.attendance', icon: CalendarCheck },
  { path: '/grab', labelKey: 'nav.grab', icon: Car },
  { path: '/savings', labelKey: 'nav.savings', icon: Target },
  { path: '/analyze', labelKey: 'nav.analyze', icon: Scan },
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
    <div className="flex h-screen w-full bg-app-bg text-app-text overflow-hidden relative font-sans">
      
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 border-r border-app-border/60 bg-app-bg ${isSidebarOpen ? 'w-64' : 'w-[72px]'}`}>
        {/* Logo */}
        <div className={`h-16 flex items-center shrink-0 border-b border-app-border/40 ${isSidebarOpen ? 'px-5 gap-3' : 'justify-center px-0'}`}>
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
                `relative flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive
                  ? 'text-app-text-bright'
                  : 'text-app-text/60 hover:text-app-text-bright cursor-pointer'
                }
                ${!isSidebarOpen ? 'justify-center px-0' : 'px-3'}`
              }
              title={!isSidebarOpen ? t(item.labelKey) : undefined}
            >
              {/* Active pill background */}
              {item.path === window.location.pathname && (
                <motion.div 
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 bg-app-accent1/12 border border-app-accent1/20 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              {/* Hover background */}
              {item.path !== window.location.pathname && hoveredPath === item.path && (
                <motion.div 
                  layoutId="sidebar-hover-bg"
                  className="absolute inset-0 bg-app-hover/80 rounded-xl -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Icon with active accent ring instead of side stripe */}
              <span className={`relative flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-all duration-200 ${
                item.path === window.location.pathname
                  ? 'bg-app-accent1/15 text-app-accent1'
                  : 'text-current'
              }`}>
                <item.icon className="w-4.5 h-4.5" />
              </span>
              {isSidebarOpen && (
                <span className="truncate text-sm font-medium relative z-10">{t(item.labelKey)}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-app-border/40 mt-auto">
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
      <div className="md:hidden fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] left-1/2 z-50 pointer-events-none">
        <AnimatePresence>
          {isFabOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0, scale: 0.3, x: '-50%', y: 28 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% - 104px)', y: 'calc(-50% - 60px)' }}
                exit={{ opacity: 0, scale: 0.3, x: '-50%', y: 28 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0 }}
                className="absolute w-12 h-12 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    navigate('/ai-trading');
                  }}
                  className="w-12 h-12 rounded-full bg-app-card border border-app-border text-[#6BA6EB] shadow-lg flex items-center justify-center hover:opacity-90 transition-transform active:scale-95"
                >
                  <Cpu className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1.5 text-app-text-bright font-medium text-[10px] whitespace-nowrap drop-shadow-md bg-app-bg/80 px-2 py-0.5 rounded-full border border-app-border/50">{t('nav.aiTrading')}</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.3, x: '-50%', y: 28 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% - 41px)', y: 'calc(-50% - 112px)' }}
                exit={{ opacity: 0, scale: 0.3, x: '-50%', y: 28 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.05 }}
                className="absolute w-12 h-12 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    navigate('/attendance');
                  }}
                  className="w-12 h-12 rounded-full bg-app-card border border-app-border text-app-text-bright shadow-lg flex items-center justify-center hover:opacity-90 transition-transform active:scale-95"
                >
                  <CalendarCheck className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1.5 text-app-text-bright font-medium text-[10px] whitespace-nowrap drop-shadow-md bg-app-bg/80 px-2 py-0.5 rounded-full border border-app-border/50">{t('nav.attendance')}</span>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.3, x: '-50%', y: 28 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% + 41px)', y: 'calc(-50% - 112px)' }}
                exit={{ opacity: 0, scale: 0.3, x: '-50%', y: 28 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.1 }}
                className="absolute w-12 h-12 flex flex-col items-center pointer-events-auto" 
              >
                <button 
                  onClick={() => {
                    setIsFabOpen(false);
                    setGlobalGrabModalOpen(true);
                  }}
                  className="w-12 h-12 rounded-full bg-app-success text-app-bg shadow-lg flex items-center justify-center hover:opacity-90 transition-transform active:scale-95"
                >
                  <Car className="w-5 h-5" />
                </button>
                <span className="absolute top-full mt-1.5 text-app-text-bright font-medium text-[10px] whitespace-nowrap drop-shadow-md bg-app-bg/80 px-2 py-0.5 rounded-full border border-app-border/50">{t('nav.grab')}</span>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.3, x: '-50%', y: 28 }}
                animate={{ opacity: 1, scale: 1, x: 'calc(-50% + 104px)', y: 'calc(-50% - 60px)' }}
                exit={{ opacity: 0, scale: 0.3, x: '-50%', y: 28 }}
                transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.15 }}
                className="absolute w-12 h-12 flex flex-col items-center pointer-events-auto" 
              >
              <button 
                onClick={() => {
                  setIsFabOpen(false);
                  setGlobalAddModalOpen(true);
                }}
                className="w-12 h-12 rounded-full bg-[#6BA6EB] text-[#0D1421] shadow-lg flex items-center justify-center hover:opacity-90 transition-transform active:scale-95"
              >
                <ArrowLeftRight className="w-5 h-5" />
              </button>
              <span className="absolute top-full mt-1.5 text-app-text-bright font-medium text-[10px] whitespace-nowrap drop-shadow-md bg-app-bg/80 px-2 py-0.5 rounded-full border border-app-border/50">{t('common.add')}</span>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* FAB Background Cutout */}
      <div className="md:hidden fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[72px] h-[72px] bg-app-bg rounded-full z-40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border-t border-app-border" style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }} />

      {/* Main FAB */}
      <div className="md:hidden fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[55]">
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-14 h-14 rounded-full bg-[#6BA6EB] text-app-bg shadow-lg flex items-center justify-center hover:opacity-90 transition-all duration-300 ${isFabOpen ? 'rotate-45' : ''}`}
        >
          <Plus className="w-8 h-8 text-[#0D1421]" />
        </button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-app-border bg-app-card px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex justify-between items-center z-30">
        <div className="flex justify-around items-center flex-1">
          {mobileNavItems.slice(0, 2).map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              onMouseEnter={() => setHoveredMobilePath(item.path)}
              onMouseLeave={() => setHoveredMobilePath(null)}
              className={({ isActive }) => `relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${isActive ? 'text-[#6BA6EB] font-medium' : 'text-app-text/60'}`}
            >
              <item.icon className="w-5 h-5 mb-1 relative z-10" />
              <span className="text-[10px] relative z-10">{t(item.labelKey)}</span>
              
              {/* Dynamic Sliding Underline for Mobile active navigation */}
              {item.path === window.location.pathname && (
                <motion.div 
                  layoutId="mobile-nav-underline"
                  className="absolute bottom-1.5 left-2 right-2 h-[3px] bg-[#6BA6EB] rounded-full shadow-[0_1px_4px_rgba(107,166,235,0.4)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              
              {/* Dynamic sliding line for hovered navigation */}
              {item.path !== window.location.pathname && hoveredMobilePath === item.path && (
                <motion.div 
                  layoutId="mobile-nav-hover-line"
                  className="absolute bottom-1.5 left-4 right-4 h-[2px] bg-[#6BA6EB]/30 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </NavLink>
          ))}
        </div>
        <div className="w-[72px] shrink-0" /> {/* Spacer for FAB */}
        <div className="flex justify-around items-center flex-1">
          {mobileNavItems.slice(2).map((item) => (
            <NavLink 
              key={item.path} 
              to={item.path}
              onMouseEnter={() => setHoveredMobilePath(item.path)}
              onMouseLeave={() => setHoveredMobilePath(null)}
              className={({ isActive }) => `relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all ${isActive ? 'text-[#6BA6EB] font-medium' : 'text-app-text/60'}`}
            >
              <item.icon className="w-5 h-5 mb-1 relative z-10" />
              <span className="text-[10px] relative z-10">{t(item.labelKey)}</span>
              
              {/* Dynamic Sliding Underline for Mobile active navigation */}
              {item.path === window.location.pathname && (
                <motion.div 
                  layoutId="mobile-nav-underline"
                  className="absolute bottom-1.5 left-2 right-2 h-[3px] bg-[#6BA6EB] rounded-full shadow-[0_1px_4px_rgba(107,166,235,0.4)]"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
              
              {/* Dynamic sliding line for hovered navigation */}
              {item.path !== window.location.pathname && hoveredMobilePath === item.path && (
                <motion.div 
                  layoutId="mobile-nav-hover-line"
                  className="absolute bottom-1.5 left-4 right-4 h-[2px] bg-[#6BA6EB]/30 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
