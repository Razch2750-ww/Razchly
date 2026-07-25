# 05 - Coding Standards

## 💻 Standar Penulisan Kode

1. **TypeScript**:
   - Gunakan `interface` untuk definisi struktur objek data.
   - Hindari `any` dan `const enum`.

2. **React Components**:
   - Gunakan *Functional Components* dengan React Hooks.
   - Hindari infinite re-renders di `useEffect` dengan menggunakan nilai primitif dalam array dependensi.

3. **Express Backend**:
   - Selalu berikan blok `try-catch` pada endpoint `/api/*`.
   - Kembalikan status HTTP yang sesuai (`200 OK`, `400 Bad Request`, `500 Internal Server Error`).
