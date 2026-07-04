import { create } from 'zustand';
import { User } from 'firebase/auth';
import { WorkSchedule } from '../types';

interface AppState {
  user: User | null;
  authChecked: boolean;
  themeId: string;
  language: string;
  customFontBase64: string | null;
  customFontName: string | null;
  grabCashAccount: string;
  grabDompetAccount: string;
  grabHematAccount: string;
  monthlySavingsTargets: number[];
  dailyIncomeTarget: number;
  dailyIncomeTargets: number[];
  dailyExpenseLimit: number;
  dailyExpenseLimits: number[];
  isGlobalAddModalOpen: boolean;
  isGlobalGrabModalOpen: boolean;
  workSchedule: WorkSchedule;
  attendancePeriodStart: number;
  attendancePeriodEnd: number;
  salarySettings: {
    gajiPokok: number;
    uangHarian: number;
    uangKerajinan: number;
    uangMakan: number;
    uangTunjangan: number;
    uangLemburPerJam: number;
    lemburHours: number;
  };
  setUser: (user: User | null) => void;
  setAuthChecked: (checked: boolean) => void;
  setThemeId: (id: string) => void;
  setLanguage: (lang: string) => void;
  setCustomFont: (base64: string | null, name: string | null) => void;
  setGrabAccounts: (cash: string, dompet: string, hemat: string) => void;
  setMonthlySavingsTargets: (targets: number[]) => void;
  setDailyIncomeTarget: (target: number) => void;
  setDailyIncomeTargets: (targets: number[]) => void;
  setDailyExpenseLimit: (limit: number) => void;
  setDailyExpenseLimits: (targets: number[]) => void;
  setGlobalAddModalOpen: (open: boolean) => void;
  setGlobalGrabModalOpen: (open: boolean) => void;
  setWorkSchedule: (schedule: WorkSchedule) => void;
  setAttendancePeriodStart: (day: number) => void;
  setAttendancePeriodEnd: (day: number) => void;
  setSalarySettings: (settings: any) => void;
}

const DEFAULT_SCHEDULE: WorkSchedule = {
  days: {
    '1': { isActive: true, start: '08:00', end: '17:00' }, // Monday
    '2': { isActive: true, start: '08:00', end: '17:00' }, // Tuesday
    '3': { isActive: true, start: '08:00', end: '17:00' }, // Wednesday
    '4': { isActive: true, start: '08:00', end: '17:00' }, // Thursday
    '5': { isActive: true, start: '08:00', end: '17:00' }, // Friday
    '6': { isActive: true, start: '08:00', end: '15:00' }, // Saturday
    '0': { isActive: false, start: '08:00', end: '17:00' }  // Sunday
  }
};

export const useStore = create<AppState>((set) => ({
  user: null,
  authChecked: false,
  themeId: 'slate-stone', // Default theme
  language: 'id', // target language is indonesian
  customFontBase64: localStorage.getItem('customFontBase64'),
  customFontName: localStorage.getItem('customFontName'),
  grabCashAccount: '',
  grabDompetAccount: '',
  grabHematAccount: '',
  monthlySavingsTargets: [],
  dailyIncomeTarget: 0,
  dailyIncomeTargets: [],
  dailyExpenseLimit: 0,
  dailyExpenseLimits: [],
  isGlobalAddModalOpen: false,
  isGlobalGrabModalOpen: false,
  workSchedule: DEFAULT_SCHEDULE,
  attendancePeriodStart: 19,
  attendancePeriodEnd: 18,
  salarySettings: {
    gajiPokok: 0,
    uangHarian: 0,
    uangKerajinan: 0,
    uangMakan: 0,
    uangTunjangan: 0,
    uangLemburPerJam: 0,
    lemburHours: 0,
  },
  setUser: (user) => set({ user }),
  setAuthChecked: (checked) => set({ authChecked: checked }),
  setThemeId: (id) => set({ themeId: id }),
  setLanguage: (lang) => set({ language: lang }),
  setCustomFont: (base64, name) => {
    if (base64 && name) {
      localStorage.setItem('customFontBase64', base64);
      localStorage.setItem('customFontName', name);
    } else {
      localStorage.removeItem('customFontBase64');
      localStorage.removeItem('customFontName');
    }
    set({ customFontBase64: base64, customFontName: name });
  },
  setGrabAccounts: (cash, dompet, hemat) => set({ grabCashAccount: cash, grabDompetAccount: dompet, grabHematAccount: hemat }),
  setMonthlySavingsTargets: (targets) => set({ monthlySavingsTargets: targets }),
  setDailyIncomeTarget: (target) => set({ dailyIncomeTarget: target }),
  setDailyIncomeTargets: (targets) => set({ dailyIncomeTargets: targets }),
  setDailyExpenseLimit: (limit) => set({ dailyExpenseLimit: limit }),
  setDailyExpenseLimits: (targets) => set({ dailyExpenseLimits: targets }),
  setGlobalAddModalOpen: (open) => set({ isGlobalAddModalOpen: open }),
  setGlobalGrabModalOpen: (open) => set({ isGlobalGrabModalOpen: open }),
  setWorkSchedule: (schedule) => set({ workSchedule: schedule }),
  setAttendancePeriodStart: (day) => set({ attendancePeriodStart: day }),
  setAttendancePeriodEnd: (day) => set({ attendancePeriodEnd: day }),
  setSalarySettings: (settings) => set({ salarySettings: settings })
}));
