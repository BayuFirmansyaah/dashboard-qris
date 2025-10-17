# QRIS Payment Generator

Simple QRIS payment generator menggunakan library `my-qris` sesuai dokumentasi resmi.

## 📁 Struktur Direktori

```
qris-transaction/
├── server.js              # Main server file
├── qris-generator.js       # QRIS template generator
├── package.json           # Dependencies
├── base_template.png       # Template image untuk QRIS
├── public/                 # Static files
│   ├── simple.html        # Simple payment generator interface
│   ├── qris-auto.html     # Auto-extract interface
│   └── generated/         # Generated QRIS files
├── uploads/               # Temporary uploaded files
└── utils/                 # Testing & utility files
    ├── test-*.js          # Test files
    ├── debug-*.js         # Debug scripts
    └── qris-parser.js     # Custom parser (backup)
```

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start server:**
   ```bash
   npm start
   ```

3. **Open browser:**
   - Simple version: `http://localhost:3000/simple.html`
   - Auto-extract version: `http://localhost:3000/qris-auto.html`

## 📡 API Endpoints

### POST `/simple-payment`
Generate payment QRIS menggunakan my-qris library dengan cara yang benar.

**Request:**
- `qrisImage`: File gambar QRIS (multipart/form-data)
- `amount`: Nominal pembayaran (number)
- `adminFee`: Biaya admin (number, optional)

**Response:**
```json
{
  "success": true,
  "message": "QRIS payment berhasil dibuat",
  "qrCodeData": "data:image/png;base64,...",
  "paymentAmount": 50000,
  "adminFee": 2500,
  "totalAmount": 52500,
  "qrisString": "00020101021..."
}
```

### POST `/generate-qris` (Legacy)
Generate QRIS dengan template image.

## 📚 Library Usage

Menggunakan `my-qris` library sesuai dokumentasi:

```javascript
import { makeQRPayment, generateQRDataUrl, readQRCodeFromFile } from "my-qris";

// Read QRIS from image
const qris = await readQRCodeFromFile("path/to/image.jpg");

// Create payment QRIS
const paymentQRIS = makeQRPayment({
  qrCode: qris,
  amount: 50000,
  fee: 0,
  feeType: "fixed"
});

// Generate QR code image
const qrDataUrl = await generateQRDataUrl(paymentQRIS);
```

## 🔧 Development

### Testing
Test files tersimpan di folder `utils/`:
- `utils/test-myqris-direct.js` - Test library langsung
- `utils/test-simple-endpoint.js` - Test API endpoint
- `utils/debug-qr-scanning.js` - Debug QR scanning issues

### Run Tests
```bash
node utils/test-myqris-direct.js
```

## ✅ Features

- ✅ Upload gambar QRIS
- ✅ Auto-extract merchant data
- ✅ Generate payment QRIS dengan amount
- ✅ Download QR code sebagai PNG
- ✅ Responsive web interface
- ✅ Error handling yang robust
- ✅ Clean file management

## 🏗️ Tech Stack

- **Backend:** Node.js, Express.js
- **QRIS Processing:** my-qris library
- **Image Processing:** Jimp, qrcode-reader
- **Frontend:** Bootstrap 5, Vanilla JavaScript
- **File Upload:** Multer

## 📝 Notes

- QR codes yang dihasilkan seharusnya bisa di-scan oleh aplikasi banking/e-wallet
- Library `my-qris` menggunakan standar CRC16 untuk validasi QRIS
- Server otomatis membersihkan file upload setelah diproses