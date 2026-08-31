import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight, CalendarCheck, Car, ChevronLeft, Cpu, HandCoins, Home,
  CornerDownLeft, LogOut, Menu, Plus, Scan, Search, Settings, Target, TrendingUp, X,
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
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isActionSheetOpen, setActionSheetOpen] = useState(false);
  const [isCommandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const commandDialogRef = useRef<HTMLElement | null>(null);
  const commandTriggerRef = useRef<HTMLElement | null>(null);
  const actionDialogRef = useRef<HTMLElement | null>(null);
  const actionTriggerRef = useRef<HTMLButtonElement | null>(null);
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
  const currentItem = NAV_ITEMS.find((item) => item.path === location.pathname) || NAV_ITEMS[0];
  const todayLabel = new Intl.DateTimeFormat("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date());

  const openAction = (action: "transaction" | "grab" | "scan" | "attendance") => {
    setActionSheetOpen(false);
    if (action === "transaction") setGlobalAddModalOpen(true);
    if (action === "grab") setGlobalGrabModalOpen(true);
    if (action === "scan") navigate("/analyze");
    if (action === "attendance") navigate("/attendance");
  };

  const firstName = user?.displayName?.split(" ")[0] || "User";
  const commandItems = [
    ...visibleNavItems.map((item) => ({
      id: item.path,
      label: t(item.labelKey),
      detail: "Buka halaman",
      icon: item.icon,
      action: () => navigate(item.path),
    })),
    {
      id: "add-transaction",
      label: "Tambah transaksi",
      detail: "Catat pemasukan, pengeluaran, atau transfer",
      icon: Plus,
      action: () => setGlobalAddModalOpen(true),
    },
    {
      id: "add-grab",
      label: "Catat penghasilan Grab",
      detail: "Buka formulir transaksi Grab",
      icon: Car,
      action: () => setGlobalGrabModalOpen(true),
    },
  ];
  const filteredCommandItems = commandItems.filter((item) => {
    const needle = commandQuery.trim().toLocaleLowerCase("id-ID");
    return !needle || `${item.label} ${item.detail}`.toLocaleLowerCase("id-ID").includes(needle);
  });

  const openCommandPalette = () => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    commandTriggerRef.current = document.activeElement as HTMLElement | null;
    setCommandOpen(true);
  };

  const closeCommandPalette = (restoreFocus = true) => {
    setCommandOpen(false);
    setCommandQuery("");
    if (restoreFocus) window.requestAnimationFrame(() => commandTriggerRef.current?.focus());
  };

  const closeActionSheet = (restoreFocus = true) => {
    setActionSheetOpen(false);
    if (restoreFocus) window.requestAnimationFrame(() => actionTriggerRef.current?.focus());
  };

  useEffect(() => {
    if (!isActionSheetOpen) return;
    window.requestAnimationFrame(() => actionDialogRef.current?.focus());
  }, [isActionSheetOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "");

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isCommandOpen) closeCommandPalette();
        else openCommandPalette();
        return;
      }
      if (!isTyping && event.key === "/") {
        event.preventDefault();
        openCommandPalette();
        return;
      }
      if (event.key === "Escape" && isCommandOpen) {
        event.preventDefault();
        closeCommandPalette();
        return;
      }
      if (event.key === "Escape" && isActionSheetOpen) {
        event.preventDefault();
        closeActionSheet();
        return;
      }

      const activeDialog = isCommandOpen ? commandDialogRef.current : isActionSheetOpen ? actionDialogRef.current : null;
      if (event.key === "Tab" && activeDialog) {
        const focusable = Array.from(
          activeDialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === activeDialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActionSheetOpen, isCommandOpen]);

  const runCommand = (action: () => void) => {
    closeCommandPalette(false);
    action();
  };

  return (
    <div className="razchly-shell relative flex h-[100dvh] w-full overflow-hidden font-sans">
      <a href="#main-content" className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-app-accent1 px-4 py-2 text-sm font-semibold text-app-bg focus:translate-y-0">
        Lewati ke konten
      </a>

      <aside inert={isCommandOpen || isActionSheetOpen ? true : undefined} className={`app-shell-rail hidden shrink-0 flex-col transition-[width] duration-300 md:flex ${isSidebarOpen ? "w-[224px]" : "w-[82px]"}`}>
        <div className={`flex h-[78px] shrink-0 items-center border-b border-app-border ${isSidebarOpen ? "px-5" : "justify-center"}`}>
          <div className="flex items-center gap-3 text-app-accent1">
            <span className="font-ledger flex h-10 w-10 shrink-0 items-center justify-center text-[28px] leading-none" aria-hidden="true">R</span>
            {isSidebarOpen && <span className="font-ledger text-[22px] tracking-[-0.02em]">Razchly</span>}
          </div>
        </div>

        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3 py-3" aria-label="Navigasi utama">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              aria-label={t(item.labelKey)}
              className={({ isActive }) => `app-nav-item relative flex min-h-12 items-center transition-colors ${isSidebarOpen ? "gap-3 px-3.5" : "justify-center px-0"} ${isActive ? "bg-app-hover text-app-accent1" : "text-app-text hover:bg-app-hover hover:text-app-text-bright"}`}
              title={!isSidebarOpen ? t(item.labelKey) : undefined}
            >
              {({ isActive }) => (
                <>
                  <item.icon className="h-[19px] w-[19px] shrink-0" strokeWidth={isActive ? 1.9 : 1.45} />
                  {isSidebarOpen && <span className="truncate text-[13px] font-medium">{t(item.labelKey)}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-app-border p-3">
          <NavLink to="/settings" aria-label="Buka pengaturan profil" className={`mb-1 flex min-h-11 items-center text-app-text hover:bg-app-hover hover:text-app-text-bright ${isSidebarOpen ? "gap-3 px-3" : "justify-center"}`}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-app-accent1/50 bg-app-accent1/10 text-xs font-semibold text-app-accent1">
              {user?.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : firstName[0]}
            </div>
            {isSidebarOpen && <span className="min-w-0 flex-1 truncate text-sm font-medium">{firstName}</span>}
          </NavLink>
          <button type="button" onClick={() => signOut(auth)} aria-label={t("nav.logout")} className={`flex min-h-11 w-full items-center text-app-text hover:bg-app-danger/10 hover:text-app-danger ${isSidebarOpen ? "gap-3 px-3" : "justify-center"}`}>
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.6} />
            {isSidebarOpen && <span className="text-[13px] font-medium">{t("nav.logout")}</span>}
          </button>
          <button type="button" onClick={() => setSidebarOpen((value) => !value)} className={`mt-2 flex min-h-9 w-full items-center text-app-text hover:bg-app-hover hover:text-app-text-bright ${isSidebarOpen ? "gap-3 px-3" : "justify-center"}`} aria-label={isSidebarOpen ? t("nav.collapse") : "Buka menu"}>
            {isSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            {isSidebarOpen && <span className="text-xs">{t("nav.collapse")}</span>}
          </button>
        </div>
      </aside>

      <main inert={isCommandOpen || isActionSheetOpen ? true : undefined} id="main-content" className="app-shell-main relative flex min-w-0 max-w-full flex-1 flex-col overflow-hidden md:pb-0">
        <header className="app-command-bar hidden h-[78px] shrink-0 grid-cols-[minmax(0,1fr)_minmax(260px,420px)_auto] items-center gap-6 px-7 md:grid">
          <div className="min-w-0">
            <p className="font-ledger truncate text-[20px] text-app-accent1">{t(currentItem.labelKey)}</p>
            <p className="mt-0.5 truncate text-[11px] text-app-text">Ruang kerja finansial pribadi</p>
          </div>
          <button
            type="button"
            onClick={openCommandPalette}
            className="command-trigger flex h-10 min-w-0 items-center gap-3 px-3 text-left text-app-text hover:text-app-text-bright"
            aria-label="Buka pencarian dan perintah"
            aria-haspopup="dialog"
          >
            <Search className="h-4 w-4 shrink-0" strokeWidth={1.6} />
            <span className="min-w-0 flex-1 truncate text-xs">Cari halaman atau tindakan</span>
            <kbd className="shrink-0 text-[10px] text-app-text/70">Ctrl K</kbd>
          </button>
          <div className="flex items-center divide-x divide-app-border text-xs text-app-text">
            <time className="px-5 tabular-nums">{todayLabel}</time>
            <span className="flex items-center gap-2 px-5"><span className="h-2 w-2 rounded-full bg-app-success" aria-hidden="true" /> Sinkron</span>
            <NavLink to="/settings" className="ml-5 flex items-center gap-2.5 text-app-text hover:text-app-text-bright" aria-label="Buka profil">
              <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-app-accent1 text-xs font-semibold text-app-on-accent">
                {user?.photoURL ? <img src={user.photoURL} alt="" className="h-full w-full object-cover" /> : firstName[0]}
              </span>
              <span className="max-w-28 truncate">{firstName}</span>
            </NavLink>
          </div>
        </header>
        <motion.div key={location.pathname} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }} className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <Outlet />
        </motion.div>
        {(isGlobalAddModalOpen || isGlobalGrabModalOpen) && (
          <Suspense fallback={<span className="sr-only" role="status">Memuat formulir transaksi</span>}>
            <Transactions modalOnly />
          </Suspense>
        )}
      </main>

      <AnimatePresence>
        {isCommandOpen && (
          <div className="fixed inset-0 z-50 hidden items-start justify-center px-6 pt-[14vh] md:flex">
            <motion.button
              type="button"
              aria-label="Tutup pencarian dan perintah"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="app-overlay absolute inset-0"
              onClick={() => closeCommandPalette()}
            />
            <motion.section
              initial={reduceMotion ? false : { opacity: 0, y: -12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="command-palette relative w-full max-w-[640px] overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="command-palette-title"
              ref={commandDialogRef}
            >
              <h2 id="command-palette-title" className="sr-only">Cari halaman atau jalankan tindakan</h2>
              <label className="command-search flex min-h-16 items-center gap-3 px-5">
                <Search className="h-5 w-5 shrink-0" strokeWidth={1.5} />
                <input
                  autoFocus
                  type="search"
                  value={commandQuery}
                  onChange={(event) => setCommandQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || !filteredCommandItems[0]) return;
                    event.preventDefault();
                    runCommand(filteredCommandItems[0].action);
                  }}
                  placeholder="Ketik halaman atau tindakan..."
                  className="h-16 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-app-text-bright outline-none placeholder:text-app-text/48"
                />
                <kbd className="text-[10px] text-app-text/48">Esc</kbd>
              </label>
              <div className="max-h-[52vh] overflow-y-auto p-2" aria-label="Hasil perintah">
                {filteredCommandItems.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-app-text/58">Tidak ada halaman atau tindakan yang cocok.</p>
                ) : filteredCommandItems.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => runCommand(item.action)}
                    className="command-result group flex min-h-[60px] w-full items-center gap-4 px-3.5 text-left"
                    data-first-result={index === 0 ? "true" : undefined}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center text-app-accent1">
                      <item.icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-app-text-bright">{item.label}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-app-text/55">{item.detail}</span>
                    </span>
                    <CornerDownLeft className="h-4 w-4 text-app-text/25 group-hover:text-app-accent1" strokeWidth={1.5} />
                  </button>
                ))}
              </div>
              <footer className="command-footer flex items-center justify-between px-5 py-3 text-[10px] text-app-text/48">
                <span>Tekan / untuk membuka</span>
                <span>{filteredCommandItems.length} pilihan</span>
              </footer>
            </motion.section>
          </div>
        )}
        {isActionSheetOpen && (
          <>
            <motion.button type="button" aria-label="Tutup menu tambah" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="fixed inset-0 z-40 bg-black/75 md:hidden" onClick={() => closeActionSheet()} />
            <motion.section id="quick-action-sheet" ref={actionDialogRef} tabIndex={-1} initial={reduceMotion ? false : { y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.16, 1, 0.3, 1] }} className="app-action-sheet mobile-quick-sheet fixed inset-x-0 bottom-0 z-50 px-4 pt-3 md:hidden" role="dialog" aria-modal="true" aria-labelledby="quick-action-title">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-app-text/25" />
              <div className="mb-4 flex items-center justify-between">
                <h2 id="quick-action-title" className="text-lg font-semibold tracking-tight text-app-text-bright">Tambah aktivitas</h2>
                <button type="button" onClick={() => closeActionSheet()} className="flex h-10 w-10 items-center justify-center rounded-xl text-app-text/60 hover:bg-app-hover hover:text-app-text-bright" aria-label="Tutup">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 divide-y divide-app-border border-y border-app-border">
                {[
                  { id: "transaction" as const, label: t("common.add"), detail: t("nav.transactions"), icon: ArrowLeftRight },
                  { id: "grab" as const, label: t("nav.grab"), detail: "Catat penghasilan", icon: Car },
                  { id: "scan" as const, label: t("nav.analyze"), detail: "Baca struk", icon: Scan },
                  { id: "attendance" as const, label: t("nav.attendance"), detail: "Catat jam kerja", icon: CalendarCheck },
                ].map((action) => (
                  <button type="button" key={action.id} onClick={() => openAction(action.id)} className="flex min-h-[68px] items-center gap-3 px-1 text-left text-app-text-bright hover:bg-app-hover">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center text-app-accent1"><action.icon className="h-5 w-5" strokeWidth={1.7} /></span>
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold text-app-text-bright">{action.label}</span><span className="block truncate text-[11px] text-app-text/55">{action.detail}</span></span>
                  </button>
                ))}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <div inert={isActionSheetOpen ? true : undefined} className="app-mobile-dock-wrap fixed inset-x-0 bottom-0 z-40 md:hidden">
        <nav className="app-mobile-dock mobile-dock-grid relative grid grid-cols-5 items-center px-1" aria-label="Navigasi mobile">
          {mobileNavItems.slice(0, 2).map((item) => <MobileNavItem key={item.path} item={item} label={t(item.labelKey)} />)}
          <button ref={actionTriggerRef} type="button" onClick={() => isActionSheetOpen ? closeActionSheet() : setActionSheetOpen(true)} className="mobile-dock-add mx-auto flex h-full min-w-0 flex-col items-center justify-center gap-1 text-app-accent1" aria-label="Tambah" aria-expanded={isActionSheetOpen} aria-controls="quick-action-sheet">
            <span className="mobile-dock-add-icon flex items-center justify-center rounded-[14px] bg-app-accent1 text-app-on-accent">
              <Plus className={`h-6 w-6 transition-transform duration-300 ${isActionSheetOpen ? "rotate-45" : ""}`} strokeWidth={2.2} />
            </span>
            <span className="mobile-dock-label">Tambah</span>
          </button>
          {mobileNavItems.slice(2, 4).map((item) => <MobileNavItem key={item.path} item={item} label={t(item.labelKey)} />)}
        </nav>
      </div>
    </div>
  );
}

function MobileNavItem({ item, label }: { item: (typeof NAV_ITEMS)[number]; label: string }) {
  return (
    <NavLink to={item.path} end={item.path === "/"} aria-label={label} className={({ isActive }) => `mobile-dock-item relative flex h-full min-w-0 flex-col items-center justify-center gap-1 px-0.5 transition-colors ${isActive ? "text-app-accent1" : "text-app-text"}`}>
      {({ isActive }) => <><item.icon className="mobile-dock-icon" strokeWidth={isActive ? 2 : 1.45} /><span className="mobile-dock-label max-w-full truncate">{label}</span></>}
    </NavLink>
  );
}
