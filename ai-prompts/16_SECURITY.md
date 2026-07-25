# 16 - Security Standards

## 🔒 Standar Keamanan & Proteksi Data

- **Server-Side API Keys**: `GEMINI_API_KEY` tidak pernah dikirim ke browser client.
- **Firebase Security Rules**: Akses database Firestore dibatasi sesuai aturan otentikasi.
- **No Sensitive Logs**: Dilarang mencetak kredensial atau informasi keuangan pengguna pada log publik.
