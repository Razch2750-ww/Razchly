# 02 - Project Rules

## 📋 Aturan Utama Proyek

1. **Keamanan API Key**:
   - `GEMINI_API_KEY` dan kredensial rahasia WAJIB diproses server-side (`server.ts`).
   - Dilarang mengekspos API Key ke kode browser (`src/`).

2. **Styling & UI**:
   - Wajib menggunakan Tailwind CSS dengan skema tema Cosmic Slate (`bg-[#0f172a]`).
   - Dilarang menggunakan gradien ungu-biru arbitrary, glassmorphism berlebihan, atau font Inter standar.
   - Gunakan font Monospace untuk nominal angka uang dan persen.

3. **Integritas Kode & TypeScript**:
   - Dilarang menggunakan tipe `any`. Selalu perbarui `/src/types.ts`.
   - Gunakan top-level imports secara eksplisit.
