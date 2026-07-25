# 15 - Performance Optimization

## ⚡ Optimalisasi Performa & Kecepatan

1. **Standalone CJS Server**: Membundle `server.ts` dengan `esbuild` ke `dist/server.cjs` untuk cold-start kontainer Cloud Run yang sangat cepat.
2. **Lazy Initialization**: Menginisialisasi SDK Gemini hanya saat API dipanggil.
3. **Debounced Resizing**: Menggunakan `ResizeObserver` terdebonce pada grafik Recharts/D3 untuk performa rendering yang mulus.
