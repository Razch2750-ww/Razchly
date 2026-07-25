# 11 - API Documentation

## 🔌 Express Backend API Proxy (`server.ts`)

### Endpoints:
- `GET /api/market-prices`: Data real-time IHSG & indeks pasar modal dari Yahoo Finance.
- `POST /api/analyze-portfolio`: Pemrosesan analisis portofolio & AI Advisor menggunakan Gemini 3.6 Flash.
- `POST /api/analyze-receipt`: Ekstraksi gambar kuitansi/struk belanja bertenaga Gemini Vision.
- `POST /api/ai-trading-signal`: Sinyal trading otomatis & simulator strategi.
