import { lazy, Suspense, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight, CalendarCheck, Car, ChevronLeft, Cpu, HandCoins, Home,
  LogOut, Menu, Plus, Scan, Settings, Target, TrendingUp, X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { useTranslation } from "../utils/translations";

const Transactions = lazy(() => import("./Transactions"));

const NAV_ITEMS = [
  { path: "/", labelKey: "nav.home", icon: Home },
  { path: "/transactions", labelKey: "nav.transactions", icon: ArrowLeftRight },
  { path: "/investments", labelKey: "nav.investments", icon: TrendingUp },
  { path: "/analyze", labelKey: "nav.analyze", icon: Scan },
  { path: "/loans", labelKey: "nav.loans", icon: HandCoins },
  { path: "/attendance", labelKey: "nav.attendance", icon: CalendarCheck },
  { path: "/grab", labelKey: "nav.grab", icon: Car },
  { path: "/savings", labelKey: "nav.savings", icon: Target },
  { path: "/ai-trading", labelKey: "nav.aiTrading", icon: Cpu },
  { path: "/settings", labelKey: "nav.settings", icon: Settings },
];

export default function Layout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isActionSheetOpen, setActionSheetOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const user = useStore((state) => state.user);
  const hiddenTabs = useStore((state) => state.hiddenTabs);
  const setGlobalAddModalOpen = useStore((state) => state.setGlobalAddModalOpen);
  const setGlobalGrabModalOpen = useStore((state) => state.setGlobalGrabModalOpen);
  const isGlobalAddModalOpen = useStore((state) => state.isGlobalAddModalOpen);
  const isGlobalGrabModalOpen = useStore((state) => state.isGlobalGrabModalOpen);
  const { t } = useTranslation();
  const visibleNavItems = NAV_ITEMS.filter((item) => !hiddenTabs.includes(item.path));
  const mobileNavItems = visibleNavItems.filter((item) =>
    ["/", "/transactions", "/investments", "/loans"].includes(item.path));

  const openAction = (action: "transaction" | "grab" | "scan" | "attendance") => {
    setActionSheetOpen(false);
    if (action === "transaction") setGlobalAddModalOpen(true);
    if (action === "grab") setGlobalGrabModalOpen(true);
    if (action === "scan") navigate("/analyze");
    if (action === "attendance") navigate("/attendance");
  };

  const firstName = user?.displayName?.split(" ")[0] || "User";

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden bg-app-bg font-sans text-app-text">
      <a href="#main-content" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-app-accent1 px-4 py-2 text-sm font-semibold text-app-bg focus:translate-y-0">
        Lewati ke konten
      </a>

      <aside className={`app-shell-rail hidden shrink-0 flex-col border-r transition-[width] duration-300 md:flex ${isSidebarOpen ? "w-[236px]" : "w-[84px]"}`}>
        <div className={`flex h-[76px] shrink-0 items-center ${isSidebarOpen ? "px-6" : "justify-center"}`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-app-accent1/10">
              <img src="/icon.svg" alt="" className="h-6 w-6 object-contain" />
            </div>
            {isSidebarOpen && <span className="text-[18px] font-semibold tracking-[-0.03em] text-app-text-bright">Razchly</span>}
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3" aria-label="Navigasi utama">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              aria-label={t(item.labelKey)}
              className={({ isActive }) => `app-nav-item relative flex min-h-11 items-center rounded-xl transition-colors ${isSidebarOpen ? "gap-3 px-3.5" : "justify-center px-0"} ${isActive ? "bg-app-hover text-app-text-bright" : "text-app-text/62 hover:bg-app-hover/55 hover:text-app-text-bright"}`}
              title={!isSidebarOpen ? t(item.labelKey) : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`h-[19px] w-[19px] shrink-0 ${isActive ? "text-app-accent1" : ""}`} strokeWidth={1.6} />
                  {isSidebarOpen && <span className="truncate text-[13px] font-medium">{t(item.labelKey)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-app-border p-3">
          <NavLink to="/settings" aria-label="Buka pengaturan profil" className={`mb-1 flex min-h-11 items-center rounded-xl text-app-text/70 hover:bg-app-hover hover:text-app-text-bright ${isSidebarOpen ? "gap-3 px-3" : "justify-center"}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-app-accent1/12 text-xs font-semibold text-app-accent1">
              {user?.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : firstName[0]}
            </div>
            {isSidebarOpen && <span className="min-w-0 flex-1 truncate text-sm font-medium">{firstName}</span>}
          </NavLink>
          <button type="button" onClick={() => signOut(auth)} aria-label={t("nav.logout")} className={`flex min-h-11 w-full items-center rounded-xl text-app-text/55 hover:bg-app-danger/10 hover:text-app-danger ${isSidebarOpen ? "gap-3 px-3" : "justify-center"}`}>
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.6} />
            {isSidebarOpen && <span className="text-[13px] font-medium">{t("nav.logout")}</span>}
          </button>
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} className={`mt-2 flex min-h-9 w-full items-center rounded-xl text-app-text/45 hover:bg-app-hover hover:text-app-text ${isSidebarOpen ? "gap-3 px-3" : "justify-center"}`} aria-label={isSidebarOpen ? t("nav.collapse") : "Buka menu"}>
            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            {isSidebarOpen && <span className="text-xs">{t("nav.collapse")}</span>}
          </button>
        </div>
      </aside>

      <main id="main-content" className="relative flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-app-bg pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <motion.div key={location.pathname} initial={reduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }} className="flex min-h-full w-full flex-1 flex-col">
          <Outlet />
        </motion.div>
        {(isGlobalAddModalOpen || isGlobalGrabModalOpen) && (
          <Suspense fallback={<span className="sr-only" role="status">Memuat formulir transaksi</span>}>
            <Transactions modalOnly />
          </Suspense>
        )}
      </main>

      <AnimatePresence>
        {isActionSheetOpen && (
          <>
            <motion.button type="button" aria-label="Tutup menu tambah" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="fixed inset-0 z-40 bg-black/75 md:hidden" onClick={() => setActionSheetOpen(false)} />
            <motion.section initial={reduceMotion ? false : { y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.16, 1, 0.3, 1] }} className="app-action-sheet fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 md:hidden" role="dialog" aria-modal="true" aria-labelledby="quick-action-title">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-text/25" />
              <div className="mb-4 flex items-center justify-between">
                <h2 id="quick-action-title" className="text-lg font-semibold tracking-tight text-app-text-bright">Tambah aktivitas</h2>
                <button type="button" onClick={() => setActionSheetOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-xl text-app-text/60 hover:bg-app-hover hover:text-app-text-bright" aria-label="Tutup">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "transaction" as const, label: t("common.add"), detail: t("nav.transactions"), icon: ArrowLeftRight },
                  { id: "grab" as const, label: t("nav.grab"), detail: "Catat penghasilan", icon: Car },
                  { id: "scan" as const, label: t("nav.analyze"), detail: "Baca struk", icon: Scan },
                  { id: "attendance" as const, label: t("nav.attendance"), detail: "Catat jam kerja", icon: CalendarCheck },
                ].map((action) => (
                  <button type="button" key={action.id} onClick={() => openAction(action.id)} className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-app-border bg-app-bg/50 p-3 text-left hover:border-app-accent1/40 hover:bg-app-hover">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-app-accent1/12 text-app-accent1"><action.icon className="h-5 w-5" strokeWidth={1.7} /></span>
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-app-text-bright">{action.label}</span><span className="block truncate text-[11px] text-app-text/55">{action.detail}</span></span>
                  </button>
                ))}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <nav className="relative grid h-[68px] grid-cols-5 items-center border-t border-app-border bg-app-card px-1 pb-[env(safe-area-inset-bottom)]" aria-label="Navigasi mobile">
          {mobileNavItems.slice(0, 2).map((item) => <MobileNavItem key={item.path} item={item} label={t(item.labelKey)} />)}
          <button type="button" onClick={() => setActionSheetOpen((value) => !value)} className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-app-accent1 text-app-bg" aria-label="Tambah" aria-expanded={isActionSheetOpen}>
            <Plus className={`h-6 w-6 transition-transform duration-300 ${isActionSheetOpen ? "rotate-45" : ""}`} strokeWidth={2.2} />
          </button>
          {mobileNavItems.slice(2, 4).map((item) => <MobileNavItem key={item.path} item={item} label={t(item.labelKey)} />)}
        </nav>
      </div>
    </div>
  );
}

function MobileNavItem({ item, label }: { item: (typeof NAV_ITEMS)[number]; label: string }) {
  return (
    <NavLink to={item.path} end={item.path === "/"} aria-label={label} className={({ isActive }) => `relative flex h-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[11px] transition-colors ${isActive ? "text-app-accent1" : "text-app-text/58"}`}>
      {({ isActive }) => <><item.icon className="h-5 w-5" strokeWidth={isActive ? 2 : 1.55} /><span className="max-w-full truncate">{label}</span>{isActive && <span className="absolute bottom-0 h-0.5 w-6 rounded-full bg-app-accent1" />}</>}
    </NavLink>
  );
}
