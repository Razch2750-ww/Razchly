# 🚀 Razchly - Ekosistem Keuangan & Asisten Produktivitas Pribadi Berbasis AI

**Razchly** adalah aplikasi asisten keuangan pribadi, pelacakan investasi multi-aset, simulasi trading algoritmik, serta asisten produktivitas harian yang canggih dan komprehensif. Dirancang khusus dengan antarmuka yang sangat elegan, responsif, dan didukung oleh kecerdasan buatan (AI) terdepan, Razchly menjadi pusat kendali (*Central Command Center*) untuk mengelola aset, produktivitas, dan perencanaan finansial Anda secara cerdas dan terintegrasi.

---

## 🌟 Modul & Fitur Komprehensif Aplikasi

### 1. 📊 Dashboard Keuangan & Konsolidasi Aset (`/`)
Pusat ringkasan informasi finansial Anda secara real-time:
- **Pelacakan Saldo & Akun Multi-Kategori**: Kelola berbagai rekening bank, dompet digital (e-wallet), kas fisik, hingga akun investasi dari satu tempat.
- **Rangkuman Arus Kas (Cash Flow)**: Visualisasi perbandingan total pemasukan vs pengeluaran dalam grafik yang dinamis dan mudah dipahami.
- **Akun Berbunga (Interest Engine)**: Perhitungan bunga harian otomatis untuk akun tabungan/deposito berbunga.
- **Quick Account & Custom Category Creator**: Tambahkan akun baru atau buat kategori transaksi kustom lengkap dengan pemilih ikon dan warna kustom.
- **Pengingat Target Finansial (Global Goal Notifier)**: Banner pemberitahuan otomatis saat progres tabungan mencapai milestone penting.

### 2. 💳 Manajemen Transaksi & Alur Kas (`/transactions`)
Pencatatan keuangan harian yang fleksibel dan detail:
- **Pencatatan 3 Arah**: Catat Pengeluaran (*Expense*), Pemasukan (*Income*), serta Transfer Antar-Rekening (*Transfer*).
- **Filter & Pencarian Lanjutan**: Filter transaksi berdasarkan Jenis, Rentang Tanggal, Kategori, dan Akun terkait.
- **Manajemen Kategori Kustom**: Kelola kategori transaksi dengan ikon interaktif dari Lucide-React.
- **Riwayat & Edit Transaksi**: Edit, hapus, atau tinjau kembali seluruh catatan transaksi secara rinci.

### 3. 📈 Portofolio & AI Investment Advisor Multi-Aset (`/investments`)
Pantau pertumbuhan kekayaan Anda di berbagai instrumen investasi (Saham IHSG, Kripto, Emas) dengan analisis AI mendalam:
- **Grafik Tren Interaktif Multi-Durasi**: Visualisasi pergerakan nilai portofolio dalam rentang waktu **7 Hari** dan **30 Hari** menggunakan grafik garis dinamis bertenaga Recharts.
- **Gradien & Indikator Warna Responsif**: Warna grafik berubah secara cerdas (hijau untuk tren naik, merah untuk tren turun) berdasarkan statistik *return*.
- **Alokasi Aset & Diversifikasi Sektor**: Grafik lingkaran (Pie Chart) interaktif yang merinci proporsi investasi berdasarkan kategori dan sektor untuk mengukur risiko konsentrasi.
- **🤖 AI Investment Advisor & Portfolio Analyst**:
  - **Skor Kesehatan Portofolio (0–100)**: Analisis komprehensif atas kesehatan aset, diversifikasi sektor, *cash allocation*, fundamental, hingga tren dividen.
  - **Kandidat Emiten Teratas (Top Candidates)**: Pemilihan 3–6 emiten saham/instrumen terbaik dengan Skor Kesesuaian (0–100), kelebihan utama, risiko, kesesuaian tujuan investasi, dan dampak diversifikasi.
  - **Panduan Trading & Manajemen Risiko Presisi**:
    - **Lama Memegang (Holding Period)**: Estimasi durasi memegang emiten (misal: *6-12 Bulan*, *1-3 Tahun*, atau *1-3 Minggu Swing*).
    - **Target Take Profit (TP)**: Target tingkat keuntungan bertahap (TP1 / TP2).
    - **Batas Stop Loss (SL)**: Batas kerugian disiplin beserta persentase risiko.
    - **Strategi Trailing Stop (TS)**: Mekanisme penguncian profit otomatis berjenjang.
- **Kalkulator Simulasi ARA/ARB**: Hitung batas Auto Rejection Atas (ARA) dan Auto Rejection Bawah (ARB) untuk saham-saham di Bursa Efek Indonesia berdasarkan fraksi harga terbaru.

### 4. 🤖 Asisten Trading AI & Simulator Algoritmik (`/ai-trading`)
Modul trading tingkat lanjut bagi pemula hingga profesional:
- **Pilihan Engine Kecerdasan Buatan**: Gunakan model AI canggih seperti **ALICE** dan **GEMINI** atau algoritma **QUANTUM 6L** untuk menghasilkan analisis dan sinyal trading.
- **Manajemen Risiko Profesional**: Setel ambang batas proteksi secara presisi, termasuk *Stop Loss (SL)*, *Take Profit (TP)*, komisi transaksi, dan batasan *slippage*.
- **Backtesting Historis**: Uji performa strategi trading Anda menggunakan data historis dalam berbagai pilihan rentang hari.
- **Integrasi Webhook & MQL5**: Dukungan penuh untuk integrasi sistem otomatis dengan MetaTrader 5 (MT5) atau platform Bybit menggunakan konfigurasi parameter indikator teknis seperti EMA, Bollinger Bands (BB), RSI, MFI, dan ATR.
- **Grafik Teknikal Live**: Integrasi widget TradingView untuk analisis grafik harga real-time.

### 5. 💸 Manajemen Pinjaman & Hutang / Loans (`/loans`)
Pantau kewajiban (Hutang) dan piutang Anda agar tetap sehat secara finansial:
- **Pelacakan 2 Arah**: Catat pinjaman yang Anda berikan (*Lent/Piutang*) maupun pinjaman yang Anda terima (*Borrowed/Hutang*).
- **Metode Bunga Fleksibel**: Perhitungan bunga nominal tetap maupun persentase periodik.
- **Detail Tenor & Jatuh Tempo**: Atur durasi pembayaran (bulan/hari) lengkap dengan hitung mundur tanggal jatuh tempo.
- **Fitur Debet Otomatis (Auto-Debit)**: Hubungkan pinjaman ke rekening bank tertentu di dalam sistem untuk simulasi pembayaran otomatis saat pelunasan.

### 6. 📅 Presensi & Jadwal Kerja / Attendance Tracker (`/attendance`)
Sistem pencatatan waktu kerja mandiri yang akurat:
- **Check-In & Check-Out Instan**: Catat waktu mulai dan selesai bekerja setiap hari hanya dengan satu ketukan.
- **Catatan & PencaPaian Harian**: Tambahkan detail pekerjaan atau pencapaian harian pada setiap log kehadiran.
- **Analisis Jam Kerja Efektif**: Pantau total jam kerja efektif harian, mingguan, atau bulanan serta statistik hari kerja.
- **Kalkulasi Gaji & Lembur**: Integrasi dengan pengaturan standar gaji harian/bulanan dan tarif lembur.

### 7. 🚗 Asisten Grab Partner & Produktivitas Mitra (`/grab`)
Modul khusus yang dirancang untuk mengoptimalkan kinerja dan pendapatan bagi para mitra Grab Driver/Partner:
- **Pencatatan Pendapatan Rinci**: Kelola detail pendapatan harian, potongan platform, tips, dan bonus.
- **Pemisahan Akun Otomatis**: Alokasikan pendapatan langsung ke akun Grab Cash, Grab Dompet, maupun Grab Hemat sesuai preferensi.
- **Mesin Hitung Akses Hemat Otomatis**: Perhitungan kalkulasi pemotongan harian otomatis berdasarkan jumlah orderan hemat harian.
- **Jadwal Kerja & Istirahat**: Atur jam operasional harian untuk menjaga keseimbangan kerja dan meminimalkan kelelahan.

### 8. 🎯 Target Tabungan / Savings Targets (`/savings`)
Wujudkan impian finansial Anda dengan perencanaan terstruktur:
- **Multi-Target Savings**: Buat beberapa target tabungan sekaligus (misal: *Dana Darurat*, *Liburan*, *DP Rumah*).
- **Progres Visual & Estimasi**: Batang progres interaktif lengkap dengan persentase dan estimasi sisa waktu pencapaian target.
- **Alokasi Dana Terhubung**: Alokasikan tabungan dari akun tertentu untuk memantau akumulasi modal secara presisi.

### 9. 👁️ Analisis Struk & Gambar Berbasis AI / Image Analysis (`/analyze`)
Ekstraksi data transaksi pintar menggunakan kamera atau unggahan gambar:
- **Pemindai Struk/Kuitansi**: Cukup unggah foto struk belanja, kuitansi, atau invoice.
- **Analisis Instan AI Gemini**: AI secara otomatis mengekstrak nominal transaksi, tanggal belanja, daftar item, hingga merekomendasikan kategori transaksi yang sesuai untuk langsung dimasukkan ke dalam catatan keuangan.

### 10. ⚙️ Pengaturan & Kustomisasi / Settings (`/settings`)
Pusat kustomisasi antarmuka dan preferensi aplikasi:
- **Tema Visual Variatif**: Pilih dari berbagai skema warna gelap/terang premium (*Slate Stone*, *Cosmic Slate*, *Dracula Soft*, *Emerald Glow*, *Cyberpunk Dusk*, dll).
- **Dukungan Multi-Bahasa**: Peralihan bahasa secara instan antara Bahasa Indonesia dan Bahasa Inggris.
- **Kustomisasi Navigasi**: Sembunyikan atau tampilkan tab navigasi sesuai kebutuhan harian Anda.
- **Ekspor Data & Manajemen Akun**: Ekspor catatan keuangan dan kelola profil pengguna secara aman.

---

## 💎 Keunggulan Utama Razchly

* **🔒 Keamanan Data Tingkat Tinggi**: Menggunakan proksi server-side (`/api/*`) untuk semua panggilan API eksternal (termasuk API Gemini), sehingga API Key sensitif Anda tetap tersembunyi dengan aman dan tidak pernah terekspos ke sisi klien (browser).
* **☁️ Sinkronisasi Cloud Instan**: Didukung oleh Firebase Firestore dan Firebase Authentication untuk penyimpanan data yang tahan lama, aman, dan dapat diakses dari mana saja.
* **🎨 Desain UI Premium & Modern**: Tampilan bertema gelap (*Cosmic Slate*) yang sangat menawan, nyaman di mata, memanfaatkan ruang negatif secara proporsional, serta dilengkapi animasi mikro yang halus bertenaga **Motion** (Framer Motion).
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

## 🤖 AI Documentation & Prompt Suite (`ai-prompts/`)

Proyek ini dilengkapi dengan suite dokumentasi dan prompt terstruktur di folder `/ai-prompts/` untuk panduan pengembangan berbasis AI:

| File / Folder | Fungsi & Deskripsi |
| :--- | :--- |
| `00_PROJECT_OVERVIEW.md` | Gambaran umum proyek, visi, misi, & nilai tambah |
| `01_TECH_STACK.md` | Stack teknologi lengkap (React 19, Express, Firebase, Gemini 3.6) |
| `02_PROJECT_RULES.md` | Aturan ketat coding, kebersihan UI, & proteksi API Key |
| `03_DESIGN_SYSTEM.md` | System warna Cosmic Slate, typography, & border radius |
| `04_UI_UX_GUIDELINES.md` | Responsivitas mobile, touch targets, & visual feedback |
| `05_CODING_STANDARDS.md` | Standar TypeScript, React hooks, & Express error handling |
| `06_FOLDER_STRUCTURE.md` | Struktur direktori lengkap proyek |
| `07_COMPONENT_LIBRARY.md` | Pustaka komponen UI & widget |
| `08_PAGES.md` | Pemetaan rute halaman & tab navigasi |
| `09_FEATURES/` | Dokumentasi detail 8 modul fitur utama |
| `10_DATABASE.md` | Schema Firebase Firestore |
| `11_API.md` | Dokumentasi endpoint backend Express (`/api/*`) |
| `12_STATE_MANAGEMENT.md` | Arsitektur React state terpusat & Firestore sync |
| `13_I18N.md` | Internasionalisasi (Bahasa Indonesia & English) |
| `14_PWA.md` | Kesiapan Mobile & PWA UX |
| `15_PERFORMANCE.md` | Optimalisasi bundling esbuild & lazy init SDK |
| `16_SECURITY.md` | Standard keamanan & enkripsi Kunci API |
| `17_TESTING.md` | Panduan pengujian, linting, & QA |
| `18_DEPLOYMENT.md` | Panduan kompilasi & deploy Cloud Run |
| `19_CHANGELOG.md` | Riwayat rilis & pembaruan versi |
| `20_TODO.md` | Roadmap pengembangan masa depan |
| `AI_MASTER_PROMPT.md` | System Prompt Master untuk AI Coder |

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
