# 🚀 Razchly - Ekosistem Keuangan & Asisten Produktivitas Pribadi Berbasis AI

**Razchly** adalah aplikasi asisten keuangan pribadi, pelacakan investasi, simulasi trading algoritmik, serta asisten produktivitas harian yang canggih dan komprehensif. Dirancang khusus dengan antarmuka yang sangat elegan, responsif, dan didukung oleh kecerdasan buatan (AI) terdepan, Razchly menjadi pusat kendali (Central Command Center) untuk mengelola aset, produktivitas, dan perencanaan finansial Anda secara cerdas.

---

## 🌟 Keterangan & Modul Utama Aplikasi

### 1. 📊 Dashboard Keuangan Konsolidasian
Pusat ringkasan informasi finansial Anda secara real-time:
- **Pelacakan Saldo & Akun**: Kelola berbagai rekening bank, dompet digital, hingga kas fisik dari satu tempat.
- **Arus Kas Masuk & Keluar**: Pencatatan otomatis dan manual untuk pengeluaran serta pemasukan dengan visualisasi kategori yang intuitif.
- **Target Tabungan (Savings Target)**: Setel sasaran tabungan, lengkap dengan persentase progres dan estimasi sisa waktu pencapaian target.

### 2. 📈 Portofolio & Grafik Investasi Multi-Aset
Pantau pertumbuhan kekayaan Anda di berbagai instrumen investasi (Saham, Kripto, Emas):
- **Grafik Tren Interaktif**: Visualisasi pergerakan nilai portofolio dalam rentang waktu **7 Hari** dan **30 Hari** menggunakan grafik garis dinamis.
- **Gradien & Indikator Warna Responsif**: Warna grafik berubah secara cerdas (hijau untuk tren naik, merah untuk tren turun) berdasarkan perbandingan nilai terkini dengan nilai sebelumnya.
- **Alokasi Aset**: Grafik lingkaran (Pie Chart) interaktif yang merinci proporsi investasi berdasarkan kategori untuk memudahkan diversifikasi.
- **Kalkulator Simulasi ARA/ARB**: Hitung batas Auto Rejection Atas (ARA) dan Auto Rejection Bawah (ARB) untuk saham-saham di Bursa Efek Indonesia berdasarkan fraksi harga terbaru.

### 3. 🤖 Asisten Trading AI & Simulator Algoritmik
Modul trading tingkat lanjut bagi pemula hingga profesional:
- **Pilihan Engine Kecerdasan Buatan**: Gunakan model AI canggih seperti **ALICE** dan **GEMINI** atau algoritma **QUANTUM 6L** untuk menghasilkan analisis dan sinyal trading.
- **Manajemen Risiko Profesional**: Setel ambang batas proteksi secara presisi, termasuk *Stop Loss (SL)*, *Take Profit (TP)*, komisi transaksi, dan batasan *slippage*.
- **Backtesting Historis**: Uji performa strategi trading Anda menggunakan data historis dalam berbagai pilihan rentang hari.
- **Integrasi Webhook & MQL5**: Dukungan penuh untuk integrasi sistem otomatis dengan MetaTrader 5 (MT5) atau platform Bybit menggunakan konfigurasi parameter indikator teknis seperti EMA, Bollinger Bands (BB), RSI, MFI, dan ATR.

### 4. 🚗 Asisten Grab Partner & Produktivitas Mitra
Modul khusus yang dirancang untuk mengoptimalkan kinerja dan pendapatan bagi para mitra Grab Driver/Partner:
- **Pencatatan Pendapatan**: Kelola detail pendapatan harian, potongan platform, tips, dan bonus.
- **Pemisahan Akun Otomatis**: Alokasikan pendapatan langsung ke akun Grab Cash, Grab Dompet, maupun Grab Hemat sesuai preferensi.
- **Jadwal Kerja & Istirahat**: Atur jam operasional harian untuk menjaga keseimbangan kerja dan meminimalkan kelelahan.

### 5. 📅 Presensi & Jadwal Kerja (Attendance Tracker)
Sistem pencatatan waktu kerja mandiri yang akurat:
- **Check-In & Check-Out**: Catat waktu mulai dan selesai bekerja setiap hari hanya dengan satu ketukan.
- **Catatan Harian**: Tambahkan detail pekerjaan atau pencapaian harian pada setiap log kehadiran.
- **Analisis Waktu**: Pantau total jam kerja efektif harian, mingguan, atau bulanan.

### 6. 💸 Manajemen Pinjaman & Hutang (Loans)
Pantau kewajiban dan piutang Anda agar tetap sehat secara finansial:
- **Metode Bunga Fleksibel**: Mendukung perhitungan bunga nominal langsung maupun persentase periodik.
- **Detail Tenor**: Atur durasi pembayaran (bulan/hari) dengan tanggal jatuh tempo yang presisi.
- **Fitur Debet Otomatis (Auto-Debit)**: Hubungkan pinjaman ke rekening bank tertentu di dalam sistem untuk simulasi pembayaran otomatis.

### 7. 👁️ Analisis Gambar Berbasis AI (Image Analysis)
Ekstraksi data transaksi pintar menggunakan kamera atau unggahan gambar:
- **Pemindai Struk/Kuitansi**: Cukup unggah foto struk belanja, kuitansi, atau invoice.
- **Analisis Instan AI Gemini**: AI secara otomatis mengekstrak nominal transaksi, tanggal belanja, daftar item, hingga merekomendasikan kategori transaksi yang sesuai untuk langsung dimasukkan ke dalam catatan keuangan.

---

## 💎 Keunggulan Utama Razchly

* **🔒 Keamanan Data Tingkat Tinggi**: Menggunakan proksi server-side (`/api/*`) untuk semua panggilan API eksternal (termasuk API Gemini), sehingga API Key sensitif Anda tetap tersembunyi dengan aman dan tidak pernah terekspos ke sisi klien (browser).
* **☁️ Sinkronisasi Cloud Instan**: Didukung oleh Firebase Firestore dan Firebase Authentication untuk penyimpanan data yang tahan lama, aman, dan dapat diakses dari mana saja.
* **🎨 Desain UI Premium & Modern**: Tampilan bertema gelap (Cosmic Slate) yang sangat menawan, nyaman di mata, memanfaatkan ruang negatif secara proporsional, serta dilengkapi animasi mikro yang halus dan elegan bertenaga **Motion** (Framer Motion).
* **📊 Visualisasi Data Interaktif**: Grafik modern bertenaga **Recharts** dan **D3.js** yang sangat responsif, dilengkapi detail titik aktif (*active dot*) serta garis gradien warna tren otomatis.
* **🛠️ Fleksibilitas Tinggi**: Aplikasi ini menggabungkan pencatatan harian, kalkulasi finansial profesional, simulasi trading bertenaga kecerdasan buatan, hingga pelacak produktivitas mitra kerja lapangan dalam satu ekosistem terpadu.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Animasi & Transisi**: Motion (Framer Motion)
- **Visualisasi & Grafik**: Recharts, D3
- **Backend / Server**: Express.js, tsx, Node.js (bundled with esbuild to standalone CommonJS)
- **Database & Otentikasi**: Firebase Auth, Firebase Firestore
- **Kecerdasan Buatan**: @google/genai SDK (Gemini API Server-Side Integration)

---

## 🚀 Cara Menjalankan Aplikasi Secara Lokal

### Prasyarat
Pastikan Anda sudah menginstal [Node.js](https://nodejs.org/) (versi 18+) di perangkat Anda.

### Langkah-langkah
1. **Instal Dependensi**:
   ```bash
   npm install
   ```
2. **Konfigurasi Environment**:
   Salin file `.env.example` menjadi `.env` dan masukkan API Key serta kredensial Firebase Anda:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. **Jalankan Mode Pengembangan (Development)**:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` di browser Anda.
4. **Kompilasi & Build Produksi**:
   ```bash
   npm run build
   ```
5. **Jalankan Aplikasi Produksi**:
   ```bash
   npm run start
   ```

---

*Razchly — Mengelola finansial, mengasah investasi, dan memantau produktivitas harian secara lebih cerdas bertenaga AI.*
