# 06 - Folder Structure

```
├── server.ts                   # Backend Express & API Route Proxy
├── index.html                  # Entry Point HTML
├── vite.config.ts              # Vite & Tailwind Config
├── package.json                # Dependencies & Scripts
├── src/
│   ├── App.tsx                 # Root Component & Global State Manager
│   ├── main.tsx                # Client Entry Point
│   ├── types.ts                # Master Typescript Interfaces
│   ├── index.css               # Global Styles & Tailwind Directives
│   ├── lib/
│   │   ├── firebase.ts         # Inisialisasi SDK Firebase Firestore & Auth
│   │   └── utils.ts            # Helper formatting nominal & tanggal
│   └── components/
│       ├── Layout.tsx          # Wrapper Navigation Layout
│       ├── Dashboard.tsx       # Konsolidasi Saldo & Cashflow
│       ├── Transactions.tsx    # Manajemen Transaksi
│       ├── Investments.tsx     # Multi-Asset Portfolio & AI Advisor
│       ├── AiTrading.tsx       # AI Trading Simulator & MQL5 Generator
│       ├── Loans.tsx           # Debt & Pinjaman Manager
│       ├── Attendance.tsx      # Work Schedule & Attendance Log
│       ├── GrabDetails.tsx     # Modul Khusus Mitra Grab Driver
│       ├── SavingsTarget.tsx   # Target Tabungan
│       ├── ImageAnalysis.tsx   # OCR Receipt Scanner
│       └── Settings.tsx        # Preference & Theme Controls
└── ai-prompts/                # Suite Prompt Dokumentasi AI Complete
```
