# 🌐 QRIS Generator Web Application

Aplikasi web untuk generate payment QR Code dari QRIS asli dengan tampilan GUI yang informatif dan user-friendly.

## 🚀 **Fitur Utama**

### ✅ **Upload & Validasi QRIS**
- Upload gambar QRIS asli (JPG, PNG, max 5MB)
- Drag & drop support
- Validasi format QRIS Indonesia yang ketat
- Preview gambar sebelum proses

### 💰 **Input Pembayaran**
- Nominal pembayaran (Rp 1.000 - Rp 10.000.000)
- Biaya admin (Rp 0 - Rp 100.000)
- Nama merchant (validasi karakter)
- Kota merchant (opsional)
- Merchant ID (opsional, auto-generate jika kosong)

### 🎨 **Generate & Download**
- Generate QRIS dengan template professional
- Preview hasil langsung di browser
- Download file PNG berkualitas tinggi
- Detail pembayaran yang informatif

## 🖥️ **Cara Menjalankan**

### 1. Install Dependencies
```bash
cd qris-transaction
npm install
```

### 2. Jalankan Server
```bash
npm start
# atau
node server.js
```

### 3. Buka Browser
```
http://localhost:3000
```

## 📁 **Struktur Project**

```
qris-transaction/
├── server.js                 # Express server
├── qris-generator.js         # QRIS generator class
├── base_template.png         # Template QRIS
├── package.json              # Dependencies
├── public/                   # Frontend files
│   ├── index.html           # Main HTML page
│   ├── script.js            # Frontend JavaScript
│   └── generated/           # Generated QRIS files
└── uploads/                 # Temporary upload files
```

## 🔧 **API Endpoints**

### `POST /generate-qris`
Generate QRIS dari upload file dan data pembayaran.

**Request:**
- `multipart/form-data`
- `qrisImage`: File gambar QRIS (required)
- `amount`: Nominal pembayaran (required)
- `adminFee`: Biaya admin (required)
- `merchantName`: Nama merchant (required)
- `merchantCity`: Kota merchant (optional)
- `merchantId`: Merchant ID (optional)

**Response Success:**
```json
{
  "success": true,
  "message": "QRIS berhasil digenerate!",
  "data": {
    "filename": "qris-1729094567890.png",
    "downloadUrl": "/generated/qris-1729094567890.png",
    "merchantName": "TOKO ELEKTRONIK JAYA",
    "merchantCity": "JAKARTA, DKI JAKARTA",
    "merchantId": "ID1729094567890",
    "amount": 25000,
    "adminFee": 2500,
    "totalAmount": 27500,
    "timestamp": "2025-10-16T14:56:07.890Z"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Gambar QRIS tidak valid",
  "details": "QR Code tidak dapat dibaca dari gambar yang diupload..."
}
```

### `GET /download/:filename`
Download file QRIS yang sudah digenerate.

### `GET /health`
Health check API.

## 🛡️ **Validasi & Keamanan**

### **Upload File:**
- Tipe file: JPG, PNG only
- Ukuran maksimal: 5MB
- Validasi QR Code dapat dibaca
- Validasi format QRIS Indonesia

### **Input Data:**
- Nominal: Rp 1.000 - Rp 10.000.000
- Admin fee: Rp 0 - Rp 100.000
- Merchant name: 3-50 karakter, karakter aman
- Merchant city: 3-50 karakter (opsional)
- Merchant ID: 10-20 karakter (opsional)

### **Error Handling:**
- Validasi input ketat dengan pesan error yang jelas
- File upload aman dengan filtering
- Auto-cleanup file temporary
- Error logging untuk debugging

## 🎨 **UI/UX Features**

### **Responsive Design:**
- Bootstrap 5 framework
- Mobile-friendly layout
- Tablet & desktop optimized

### **Interactive Elements:**
- Drag & drop file upload
- Real-time input validation
- Loading spinner dengan progress
- Preview image sebelum proses
- Auto-format currency input
- Auto-uppercase text input

### **Visual Feedback:**
- Success/error alerts dengan detail
- Preview hasil QRIS langsung
- Download button yang jelas
- Professional color scheme

## 📱 **Tampilan Website**

### **Header Section:**
- Logo dan title aplikasi
- Deskripsi singkat fungsi

### **Upload Section:**
- Drag & drop area dengan visual feedback
- Preview gambar yang diupload
- Validasi file real-time

### **Form Section:**
- Input nominal dengan format currency
- Input biaya admin
- Input data merchant dengan validasi
- Submit button dengan loading state

### **Result Section:**
- Preview QRIS yang digenerate
- Detail pembayaran (merchant, nominal, admin fee, total)
- Download button
- Generate lagi button

### **Info Cards:**
- Penjelasan fitur keamanan
- Download info
- Responsive design info

## ⚡ **Performance & Optimization**

### **Backend:**
- Async/await untuk non-blocking operations
- File cleanup otomatis
- Error handling comprehensive
- Memory-efficient image processing

### **Frontend:**
- Lazy loading untuk gambar besar
- Client-side validation untuk UX
- Progressive enhancement
- Optimized bundle size

## 🔍 **Testing**

### **Manual Testing:**
1. Upload QRIS yang valid ✅
2. Upload file non-QRIS ❌ (harus error)
3. Input nominal diluar range ❌ (harus error)
4. Input merchant name kosong ❌ (harus error)
5. Generate dan download ✅

### **Error Scenarios:**
- File terlalu besar (>5MB)
- File bukan gambar
- QR Code tidak terbaca
- Format QRIS tidak valid
- Input data tidak valid
- Server error handling

## 🚀 **Production Deployment**

### **Environment Variables:**
```bash
PORT=3000                    # Server port
NODE_ENV=production         # Environment
MAX_FILE_SIZE=5242880       # 5MB in bytes
```

### **PM2 Configuration:**
```bash
npm install -g pm2
pm2 start server.js --name qris-generator
pm2 startup
pm2 save
```

### **Nginx Reverse Proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 **Changelog**

### v1.0.0 (16 Oktober 2025)
- ✅ Initial release
- ✅ Web UI dengan Bootstrap 5
- ✅ Upload file dengan drag & drop
- ✅ Validasi QRIS Indonesia yang ketat
- ✅ Generate QRIS dengan template
- ✅ Download hasil PNG
- ✅ Responsive design
- ✅ Error handling comprehensive

---

## 📞 **Support & Issues**

Jika ada masalah atau pertanyaan:
1. Pastikan semua dependencies terinstall
2. Pastikan file `base_template.png` ada
3. Pastikan port 3000 tidak digunakan aplikasi lain
4. Cek log error di console browser dan server

**Server Log:** Terminal menunjukkan log real-time
**Browser DevTools:** F12 untuk cek error frontend

---

*QRIS Generator Web Application - Professional payment QR code generator with modern web interface*