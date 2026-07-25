# 04 - UI/UX Guidelines

## 📱 Panduan Antarmuka & Pengalaman Pengguna

1. **Responsif Desktop & Mobile**:
   - Mobile-first layout menggunakan Tailwind breakpoints (`sm:`, `md:`, `lg:`).
   - Target sentuh (*touch target*) tombol di perangkat mobile minimal 44px.

2. **Format Label & Teks**:
   - Teks pada button, chip, dan badge WAJIB berada pada satu baris (`white-space: nowrap`).
   - Angka keuangan, return, dan harga saham wajib ditampilkan dengan format Rupiah `Rp` dan persentase yang jelas.

3. **Umpan Balik Visual (Visual Feedback)**:
   - Gunakan animasi transisi halus dengan `motion/react`.
   - Sediakan indikator *loading spinner* saat AI Gemini memproses analisis portofolio atau ekstraksi gambar struk.
