# 12 - State Management

## 🧠 Arsitektur State React Terpusat

- **Single Source of Truth**: State dikelola secara terpusat di `App.tsx` (accounts, transactions, investments, loans, savings, attendance).
- **Real-Time Sync**: Firestore listener `onSnapshot` menyinkronkan data perubahan secara otomatis.
- **Offline Fallback**: `localStorage` sebagai tempat cadangan saat tidak terkoneksi jaringan.
