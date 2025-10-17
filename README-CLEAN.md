# QRIS Transaction Generator - Cleaned Structure

## 📁 Struktur Bersih

Struktur aplikasi telah dibersihkan dari file HTML yang tidak berguna. Sekarang hanya tersisa file yang benar-benar diperlukan:

### 🌐 Public Files (Cleaned)
```
public/
├── index.html           # Landing page - pilihan metode generate
├── qris-auto.html       # Quick Generate - input minimal
├── qris-advanced.html   # Template Realistis - seperti QRIS bank asli
├── script-auto.js       # JavaScript untuk auto mode
├── style.css           # Stylesheet utama
├── generated/          # Folder hasil QR yang di-generate
└── uploads/            # Folder upload gambar QRIS asli
```

### 🚀 Dua Mode Utama

#### 1. **Quick Generate** (`qris-auto.html`)
- **Input:** Total bayar + Biaya admin
- **Fitur:** Auto extract data merchant dari QRIS asli
- **Target:** Penggunaan sehari-hari yang cepat
- **Flow:** Upload QRIS → Input nominal → Generate otomatis

#### 2. **Template Realistis** (`qris-advanced.html`) 
- **Input:** Data lengkap + customization
- **Fitur:** Template yang menyerupai QRIS bank asli
- **Target:** Keperluan profesional
- **Referensi:** Menggunakan logika dari `utils/generate-advanced-qris.js`

### 🗑️ File yang Dihapus
File HTML berikut telah dihapus karena duplikasi fitur:
- ❌ `index-old.html` - Versi lama yang kompleks
- ❌ `index-simple.html` - Duplikasi fitur
- ❌ `simple.html` - Duplikasi dengan bootstrap
- ❌ `generate.html` - Duplikasi fitur
- ❌ `script-simple.js` - JavaScript yang tidak terpakai
- ❌ `script.js` - JavaScript yang tidak terpakai

### 🎯 Workflow Utama

1. **Akses:** Buka `http://localhost:3000` atau `public/index.html`
2. **Pilih Mode:**
   - Quick Generate untuk penggunaan cepat
   - Template Realistis untuk hasil profesional
3. **Generate:** Input data → Generate QRIS sesuai kebutuhan

### 🔧 Technical Notes

- **Backend:** `server.js` menghandle API endpoints
- **Utils:** Folder `utils/` berisi logic generate yang actual
- **Templates:** Advanced mode menggunakan template realistis
- **Storage:** Generated files disimpan di `public/generated/`

Struktur sekarang jauh lebih clean dan focused! 🎉