# 18 - Deployment Guide

## 🚀 Panduan Deployment Produksi

1. **Build Step**:
   ```bash
   npm run build
   ```
2. **Start Production**:
   ```bash
   npm run start
   ```
   Aplikasi berjalan pada port `3000` dengan reverse proxy Express yang menyajikan statis file Vite dan API backend sekaligus.
