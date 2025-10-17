import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import myQrisPackage from "my-qris";
import { QRISGenerator } from './qris-generator.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';
import QRCode from 'qrcode';

const { readQRCodeFromFile, readQRCodeFromURL, makeQRPayment, generateQRDataUrl } = myQrisPackage;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

// Konfigurasi template advanced untuk QRIS yang lebih realistis
const ADVANCED_TEMPLATE_CONFIG = {
  merchantName: {
    x: 0,
    y: 175,
    width: 735,
    height: 50,
    clearArea: false,
    font: 'FONT_SANS_32_BLACK',
    align: 'center'
  },
  nmid: {
    x: 0,
    y: 245,
    width: 735,
    height: 30,
    clearArea: false,
    font: 'FONT_SANS_16_BLACK',
    align: 'center'
  },
  areaCode: {
    x: 0,
    y: 290,
    width: 735,
    height: 25,
    clearArea: false,
    font: 'FONT_SANS_16_BLACK',
    align: 'center'
  },
  qrCode: {
    x: 196, // Center of 735px width untuk ukuran 342px
    y: 350,
    size: 342, // Diperbesar 120% (285 * 1.2 = 342)
    clearArea: true,
    margin: 10
  },
  amount: {
    x: 0,
    y: 720, // Turunkan posisi dari 680 ke 720
    width: 735,
    height: 40,
    clearArea: false,
    font: 'FONT_SANS_32_BLACK',
    align: 'center'
  },
  timestamp: {
    x: 50,
    y: 985,
    width: 300,
    height: 25,
    clearArea: false,
    font: 'FONT_SANS_14_BLACK',
    align: 'left'
  },
  city: {
    x: 0,
    y: 215,
    width: 735,
    height: 25,
    clearArea: true,
    font: 'FONT_SANS_14_BLACK',
    align: 'center'
  }
};

// Function untuk parsing QRIS string yang lebih advanced
function parseAdvancedQRIS(qrisString) {
  try {
    const merchantInfo = {
      name: 'MERCHANT QRIS',
      city: 'INDONESIA',
      merchantId: 'ID0000000000000',
      areaCode: 'A01',
      countryCode: 'ID',
      currencyCode: '360'
    };

    if (qrisString && qrisString.length > 0) {
      // Extract merchant name (tag 59)
      const merchantNameMatch = qrisString.match(/59(\d{2})(.{1,}?)60/);
      if (merchantNameMatch) {
        const length = parseInt(merchantNameMatch[1]);
        const rawName = merchantNameMatch[2];
        if (rawName.length >= length) {
          merchantInfo.name = rawName.substring(0, length).trim().toUpperCase();
        }
      }

      // Extract merchant city (tag 60)  
      const merchantCityMatch = qrisString.match(/60(\d{2})(.{1,}?)61/);
      if (merchantCityMatch) {
        const length = parseInt(merchantCityMatch[1]);
        const rawCity = merchantCityMatch[2];
        if (rawCity.length >= length) {
          merchantInfo.city = rawCity.substring(0, length).trim().toUpperCase();
        }
      }

      // Extract merchant ID dari berbagai tag
      // Try tag 26 first (often contains merchant info)
      let merchantIdFound = false;
      const tag26Match = qrisString.match(/26(\d{2})(.{1,}?)27/);
      if (tag26Match) {
        const tag26Data = tag26Match[2];
        // Look for subtag 01 within tag 26
        const subTag01Match = tag26Data.match(/01(\d{2})(.{1,}?)02/);
        if (subTag01Match) {
          const length = parseInt(subTag01Match[1]);
          const rawId = subTag01Match[2];
          if (rawId.length >= length) {
            merchantInfo.merchantId = rawId.substring(0, length);
            merchantIdFound = true;
          }
        }
      }

      // If not found in tag 26, try other common locations
      if (!merchantIdFound) {
        // Try extracting from other merchant account information tags
        const merchantAccountMatch = qrisString.match(/(ID\d{13,15})/);
        if (merchantAccountMatch) {
          merchantInfo.merchantId = merchantAccountMatch[1];
        }
      }

      // Extract country code (tag 58)
      const countryMatch = qrisString.match(/58(\d{2})(.{1,}?)59/);
      if (countryMatch) {
        const length = parseInt(countryMatch[1]);
        const rawCountry = countryMatch[2];
        if (rawCountry.length >= length) {
          merchantInfo.countryCode = rawCountry.substring(0, length);
        }
      }

      // Extract currency code (tag 53)
      const currencyMatch = qrisString.match(/53(\d{2})(.{1,}?)54/);
      if (currencyMatch) {
        const length = parseInt(currencyMatch[1]);
        const rawCurrency = currencyMatch[2];
        if (rawCurrency.length >= length) {
          merchantInfo.currencyCode = rawCurrency.substring(0, length);
        }
      }
    }

    return merchantInfo;
  } catch (error) {
    console.log("⚠️ Warning: Could not parse QRIS string fully, using defaults:", error.message);
    return {
      name: 'MERCHANT QRIS',
      city: 'INDONESIA',
      merchantId: 'ID0000000000000',
      areaCode: 'A01',
      countryCode: 'ID',
      currencyCode: '360'
    };
  }
}

// Function untuk membuat QRIS advanced dengan template
async function createAdvancedQRIS(qrCodeData, merchantInfo, templatePath) {
  try {
    console.log("📷 Loading advanced template...");
    const template = await Jimp.read(templatePath);
    
    console.log(`📐 Template dimensions: ${template.getWidth()}x${template.getHeight()}`);
    
    // Load fonts
    const fonts = {
      'FONT_SANS_14_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK),
      'FONT_SANS_16_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
      'FONT_SANS_32_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    };
    
    // Generate QR code dengan konfigurasi advanced
    console.log("🔲 Generating advanced QR code...");
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: ADVANCED_TEMPLATE_CONFIG.qrCode.size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    
    const newQRImage = await Jimp.read(qrCodeBuffer);
    
    // Helper function untuk clear area
    async function clearArea(image, config) {
      if (config.clearArea) {
        const clearRect = new Jimp(config.width, config.height, '#FFFFFF');
        image.composite(clearRect, config.x, config.y);
      }
    }
    
    // Helper function untuk add text
    async function addText(image, text, config) {
      const font = fonts[config.font];
      const alignmentX = config.align === 'center' ? Jimp.HORIZONTAL_ALIGN_CENTER : Jimp.HORIZONTAL_ALIGN_LEFT;
      
      image.print(font, config.x, config.y, {
        text: text,
        alignmentX: alignmentX,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, config.width);
    }
    
    // 1. Replace merchant name
    console.log("✏️ Adding merchant name...");
    await clearArea(template, ADVANCED_TEMPLATE_CONFIG.merchantName);
    await addText(template, merchantInfo.name, ADVANCED_TEMPLATE_CONFIG.merchantName);
    
    // 2. Replace NMID
    console.log("🆔 Adding NMID...");
    await clearArea(template, ADVANCED_TEMPLATE_CONFIG.nmid);
    await addText(template, `NMID : ${merchantInfo.merchantId}`, ADVANCED_TEMPLATE_CONFIG.nmid);
    
    // 3. Replace area code
    console.log("🔤 Adding area code...");
    await clearArea(template, ADVANCED_TEMPLATE_CONFIG.areaCode);
    await addText(template, merchantInfo.areaCode || "A01", ADVANCED_TEMPLATE_CONFIG.areaCode);
    
    // 4. Replace QR Code
    console.log("🔄 Replacing QR code...");
    const qrConfig = ADVANCED_TEMPLATE_CONFIG.qrCode;
    
    // Clear QR area with white background
    const qrBackground = new Jimp(
      qrConfig.size + (qrConfig.margin * 2), 
      qrConfig.size + (qrConfig.margin * 2), 
      '#FFFFFF'
    );
    template.composite(qrBackground, qrConfig.x - qrConfig.margin, qrConfig.y - qrConfig.margin);
    
    // Add new QR code
    template.composite(newQRImage, qrConfig.x, qrConfig.y);
    
    // 5. Add amount if specified
    if (merchantInfo.amount && merchantInfo.amount > 0) {
      console.log("💰 Adding amount...");
      await addText(template, `Rp ${merchantInfo.amount.toLocaleString('id-ID')}`, ADVANCED_TEMPLATE_CONFIG.amount);
    }
    
    // 6. Add timestamp
    console.log("📅 Adding timestamp...");
    const now = new Date();
    const timestamp = now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    }) + ' ' + now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    await clearArea(template, ADVANCED_TEMPLATE_CONFIG.timestamp);
    await addText(template, `Generated: ${timestamp}`, ADVANCED_TEMPLATE_CONFIG.timestamp);
    
    // 7. Add merchant city if available
    if (merchantInfo.city && merchantInfo.city !== 'INDONESIA') {
      console.log("🏙️ Adding city information...");
      await clearArea(template, ADVANCED_TEMPLATE_CONFIG.city);
      await addText(template, merchantInfo.city, ADVANCED_TEMPLATE_CONFIG.city);
    }
    
    console.log("✅ Advanced QRIS created successfully!");
    return template;
    
  } catch (error) {
    console.error("❌ Error creating advanced QRIS:", error);
    throw error;
  }
}

// Alternative QR Code reader function
async function readQRCodeFromImageFile(imagePath) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('🔍 Trying my-qris readQRCodeFromFile...');
      
      // Try method 1: my-qris readQRCodeFromFile  
      try {
        console.log(imagePath)
        const result = await readQRCodeFromFile(imagePath);
        if (result && result.length > 50) {
          console.log('✅ Success with readQRCodeFromFile');
          return resolve(result);
        }
      } catch (error) {
        console.log('⚠️ my-qris readQRCodeFromFile failed:', error.message);
      }

      console.log('🔍 Trying Jimp + qrcode-reader...');
      
      // Try method 2: Jimp + qrcode-reader
      const image = await Jimp.read(imagePath);
      const qr = new QrCode();
      
      // Set timeout to prevent hanging
      const timeout = setTimeout(() => {
        reject(new Error('QR code reading timeout after 10 seconds'));
      }, 10000);
      
      qr.callback = (err, value) => {
        clearTimeout(timeout);
        if (err) {
          console.log('⚠️ qrcode-reader failed:', err.message);
          reject(new Error('QR Code tidak dapat dibaca dari gambar. Pastikan gambar jelas dan berisi QR Code QRIS yang valid.'));
        } else if (value && value.result && value.result.length > 50) {
          console.log('✅ Success with qrcode-reader');
          resolve(value.result);
        } else {
          reject(new Error('QR Code tidak ditemukan atau tidak valid dalam gambar.'));
        }
      };
      
      qr.decode(image.bitmap);
      
    } catch (error) {
      console.error('❌ All QR reading methods failed:', error);
      reject(new Error('Gagal membaca QR Code dari gambar. Silakan gunakan gambar yang lebih jelas.'));
    }
  });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Setup multer untuk upload file ke public folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join('public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'qris-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Validasi tipe file
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Hanya file gambar (JPEG, JPG, PNG) yang diperbolehkan!'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Validasi input
const validateQRISInput = [
  body('amount')
    .isFloat({ min: 1000, max: 10000000 })
    .withMessage('Nominal pembayaran harus antara Rp 1.000 - Rp 10.000.000'),
  
  body('adminFee')
    .optional()
    .isFloat({ min: 0, max: 100000 })
    .withMessage('Biaya admin harus antara Rp 0 - Rp 100.000')
];

// Validasi input untuk auto-extract (lebih sederhana)
const validateQRISInputAuto = [
  body('amount')
    .isFloat({ min: 1, max: 50000000 })
    .withMessage('Nominal pembayaran harus antara Rp 1 - Rp 50.000.000'),
  
  body('adminFee')
    .optional()
    .isFloat({ min: 0, max: 500000 })
    .withMessage('Biaya admin harus antara Rp 0 - Rp 500.000')
];

// Route untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qris-auto.html'));
});

// Route untuk halaman advanced QRIS
app.get('/advanced', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qris-advanced.html'));
});

// Route untuk debug - lihat file yang diupload
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'uploads', filename);
  
  console.log('🔍 Debug: Accessing uploaded file:', filePath);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({
      success: false,
      message: 'File tidak ditemukan'
    });
  }
});

// Route untuk generate QRIS
app.post('/generate-qris', upload.single('qrisImage'), validateQRISInput, async (req, res) => {
  try {
    // Validasi input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Hapus file yang diupload jika ada error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        success: false,
        message: 'Data input tidak valid',
        errors: errors.array()
      });
    }

    // Validasi file upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File gambar QRIS wajib diupload'
      });
    }

    const { amount, adminFee = 0 } = req.body;
    const qrisImagePath = req.file.path;

    console.log('📷 Processing QRIS image...');
    console.log('💰 Amount:', amount);
    console.log('🔧 Admin Fee:', adminFee);
    
    // Read original QRIS from uploaded image
    let originalQRIS;
    try {
      let urlQris =  `http://localhost:${PORT}/uploads/${req.file.filename}`;
      originalQRIS = await readQRCodeFromImageFile(urlQris);
      
      // Validate QR code
      if (!originalQRIS || originalQRIS.length < 50) {
        throw new Error('QR Code tidak valid atau tidak dapat dibaca');
      }
      
      console.log('✅ Original QRIS read successfully');
      console.log('📝 QRIS length:', originalQRIS.length);
      console.log('🔤 QRIS preview:', originalQRIS.substring(0, 100) + '...');
    } catch (error) {
      // Delete uploaded file
      fs.unlinkSync(qrisImagePath);
      
      return res.status(400).json({
        success: false,
        message: 'Gambar QRIS tidak valid',
        details: error.message || 'QR Code tidak dapat dibaca dari gambar yang diupload. Pastikan gambar jelas dan berisi QR Code QRIS yang valid.'
      });
    }

    // Extract merchant info from QRIS string menggunakan parser advanced
    const templatePath = path.join(__dirname, 'base_template.png');
    const merchantInfo = parseAdvancedQRIS(originalQRIS);
    
    console.log('🏪 Extracted advanced merchant info:', merchantInfo);

    // Validate QRIS format
    if (!originalQRIS.startsWith('00020') && !originalQRIS.includes('ID.CO.QRIS')) {
      // Delete uploaded file
      fs.unlinkSync(qrisImagePath);
      
      return res.status(400).json({
        success: false,
        message: 'Format QRIS tidak valid',
        details: 'QR Code yang diupload bukan format QRIS Indonesia yang valid. Silakan gunakan QRIS dari bank atau e-wallet Indonesia.'
      });
    }

    console.log('💳 Creating payment QRIS...');
    
    // Create payment QRIS with amount and admin fee
    const totalAmount = parseFloat(amount) + parseFloat(adminFee);
    let paymentQRIS;
    
    try {
      // Try my-qris first
      paymentQRIS = makeQRPayment({
        qrCode: originalQRIS,
        amount: totalAmount,
        fee: 0,
        feeType: "flat"
      });
      
      console.log('✅ Payment QRIS created successfully with my-qris');
    } catch (error) {
      console.error('❌ my-qris failed:', error.message);
      
      // Hapus file upload
      fs.unlinkSync(qrisImagePath);
      
      return res.status(400).json({
        success: false,
        message: 'Gagal membuat payment QRIS',
        details: `Error: ${error.message}`
      });
    }

    console.log('🎨 Generating advanced QRIS template...');
    
    // Setup merchant data dari hasil ekstraksi advanced
    const merchantData = {
      name: merchantInfo.name,
      city: merchantInfo.city,
      merchantId: merchantInfo.merchantId,
      areaCode: merchantInfo.areaCode,
      amount: totalAmount,
      countryCode: merchantInfo.countryCode,
      currencyCode: merchantInfo.currencyCode
    };

    // Generate advanced QRIS dengan template yang lebih realistis
    // Cek apakah template ada
    if (!fs.existsSync(templatePath)) {
      // Hapus file upload
      fs.unlinkSync(qrisImagePath);
      
      return res.status(500).json({
        success: false,
        message: 'Template QRIS tidak ditemukan',
        details: 'File base_template.png tidak ada di server'
      });
    }

    const qrisImage = await createAdvancedQRIS(paymentQRIS, merchantData, templatePath);

    // Simpan hasil QRIS
    const outputFilename = `qris-${Date.now()}.png`;
    const outputPath = path.join(__dirname, 'public', 'generated', outputFilename);
    
    // Pastikan folder generated ada
    const generatedDir = path.join(__dirname, 'public', 'generated');
    if (!fs.existsSync(generatedDir)) {
      fs.mkdirSync(generatedDir, { recursive: true });
    }

    await qrisImage.writeAsync(outputPath);

    // Hapus file upload asli (sudah tidak diperlukan)
    fs.unlinkSync(qrisImagePath);

    console.log('🎉 QRIS generated successfully!');

    // Response sukses
    res.json({
      success: true,
      message: 'QRIS berhasil digenerate!',
      data: {
        filename: outputFilename,
        downloadUrl: `/generated/${outputFilename}`,
        merchantName: merchantData.name,
        merchantCity: merchantData.city,
        merchantId: merchantData.merchantId,
        amount: parseFloat(amount),
        adminFee: parseFloat(adminFee),
        totalAmount: totalAmount,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error generating QRIS:', error);
    
    // Hapus file upload jika ada error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      details: error.message
    });
  }
});

// Route untuk download file
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'generated', filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, filename);
  } else {
    res.status(404).json({
      success: false,
      message: 'File tidak ditemukan'
    });
  }
});

// Route untuk health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'QRIS Generator API is running',
    timestamp: new Date().toISOString()
  });
});

// Route untuk simple QRIS payment generation (using my-qris properly)
app.post('/simple-payment', upload.single('qrisImage'), validateQRISInputAuto, async (req, res) => {
  try {
    const { amount, adminFee } = req.body;
    const qrisImagePath = req.file.path;
    
    console.log('📷 Processing QRIS image (simple version)...');
    console.log('💰 Amount:', amount);
    console.log('🔧 Admin Fee:', adminFee);
    
    let originalQRIS;
    
    try {
      // Read QRIS from uploaded image using my-qris
      console.log('📖 Reading QR code from file...');
      originalQRIS = await readQRCodeFromFile(qrisImagePath);
      console.log('✅ QRIS read successfully');
      console.log('📝 QRIS length:', originalQRIS.length);
      console.log('🔤 QRIS preview:', originalQRIS.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ Failed to read QR code:', error.message);
      fs.unlinkSync(qrisImagePath);
      return res.status(400).json({
        success: false,
        message: 'Gagal membaca QR Code',
        details: 'QR Code tidak dapat dibaca dari gambar yang diupload. Pastikan gambar jelas dan berisi QR code QRIS yang valid.'
      });
    }
    
    // Calculate total amount
    const totalAmount = parseFloat(amount) + parseFloat(adminFee);
    console.log('💵 Total amount:', totalAmount);
    
    try {
      console.log('💳 Creating payment QRIS with my-qris...');
      
      // Create payment QRIS using my-qris exactly like documentation
      const paymentQRIS = makeQRPayment({
        qrCode: originalQRIS,
        amount: totalAmount,
        fee: 0,
        feeType: "flat"
      });
      
      console.log('✅ Payment QRIS created successfully');
      console.log('📝 Payment QRIS length:', paymentQRIS.length);
      console.log('🔤 Payment QRIS preview:', paymentQRIS.substring(0, 50) + '...');
      
      // Generate QR code data URL
      console.log('🎨 Generating QR code image...');
      const qrDataUrl = await generateQRDataUrl(paymentQRIS);
      
      console.log('✅ QR code image generated successfully');
      
      // Clean up uploaded file
      fs.unlinkSync(qrisImagePath);
      
      res.json({
        success: true,
        message: 'QRIS payment berhasil dibuat',
        qrCodeData: qrDataUrl,
        paymentAmount: parseFloat(amount),
        adminFee: parseFloat(adminFee),
        totalAmount: totalAmount,
        qrisString: paymentQRIS
      });
      
    } catch (error) {
      console.error('❌ Error creating payment QRIS:', error.message);
      console.error('🔍 Error details:', error);
      fs.unlinkSync(qrisImagePath);
      
      res.status(400).json({
        success: false,
        message: 'Gagal membuat payment QRIS',
        details: error.message
      });
    }
    
  } catch (error) {
    console.error('❌ Server error:', error.message);
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      details: error.message
    });
  }
});

// Route untuk generate payment QRIS (simple & clean)
app.post('/generate-payment', upload.single('qrisImage'), async (req, res) => {
  try {
    const { amount, fee = 0, feeType = "percentage" } = req.body;
    
    console.log('📥 Request received:', { amount, fee, feeType });
    console.log('📁 File uploaded:', req.file ? req.file.filename : 'No file');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File QRIS wajib diupload'
      });
    }

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({
        success: false,
        message: 'Amount harus diisi dan berupa angka'
      });
    }

    console.log('📷 Processing QRIS...');
    console.log('💰 Amount:', amount);
    console.log('🔧 Fee:', fee);
    console.log('📊 Fee Type:', feeType);
    
    let qris, newCode, qrUrl, filename, filepath;
    
    try {
      // Step 1: Read QRIS from uploaded file using HTTP URL
      const qrisImagePath = req.file.path;
      const filename = req.file.filename;
      const qrisUrl = `http://localhost:${PORT}/uploads/${filename}`;
      
      console.log('📖 Reading QRIS from URL:', qrisUrl);
      console.log('📁 File path:', qrisImagePath);
      console.log('📊 File size:', req.file.size, 'bytes');
      console.log('📝 File type:', req.file.mimetype);
      
      // Check if file exists and has content
      if (!fs.existsSync(qrisImagePath)) {
        throw new Error('File tidak ditemukan setelah upload');
      }
      
      const fileStats = fs.statSync(qrisImagePath);
      if (fileStats.size === 0) {
        throw new Error('File kosong atau corrupt');
      }
      
      console.log('✅ File validation passed');
      
      try {
        // Try readQRCodeFromURL first
        console.log('🔄 Trying readQRCodeFromURL...');
        qris = await readQRCodeFromURL(qrisUrl);
        console.log('✅ QRIS read successfully with readQRCodeFromURL');
      } catch (urlError) {
        console.log('⚠️ readQRCodeFromURL failed:', urlError.message);
        console.log('🔄 Trying readQRCodeFromFile as fallback...');
        
        try {
          qris = await readQRCodeFromFile(qrisImagePath);
          console.log('✅ QRIS read successfully with readQRCodeFromFile');
        } catch (fileError) {
          console.log('⚠️ readQRCodeFromFile also failed:', fileError.message);
          console.log('🔄 Trying alternative QR reader...');
          
          // Last resort: use our alternative reader
          qris = await readQRCodeFromImageFile(qrisImagePath);
          console.log('✅ QRIS read successfully with alternative method');
        }
      }
      
      if (!qris || qris.length < 20) {
        throw new Error('QR Code tidak mengandung data QRIS yang valid');
      }
      
      console.log('📏 QRIS length:', qris.length);
      console.log('🔤 QRIS preview:', qris.substring(0, 50) + '...');
      
    } catch (readError) {
      console.error('❌ Failed to read QRIS:', readError.message);
      console.error('🔍 Full error:', readError);
      
      return res.status(400).json({
        success: false,
        message: 'Gagal membaca QR Code dari gambar',
        details: readError.message || 'Gambar tidak berisi QR Code QRIS yang valid. Pastikan gambar jelas dan mengandung QR code yang benar.'
      });
    }
    
    try {
      // Step 2: Generate payment QRIS
      console.log('💳 Generating payment QRIS...');
      
      newCode = makeQRPayment({
        qrCode: qris,
        amount: parseFloat(amount),
        fee: parseFloat(fee),
        feeType: feeType,
      });
      
      console.log('✅ Payment QRIS created, length:', newCode.length);
      
    } catch (paymentError) {
      console.error('❌ Failed to create payment QRIS:', paymentError.message);
      return res.status(400).json({
        success: false,
        message: 'Gagal membuat payment QRIS',
        details: paymentError.message
      });
    }
    
    try {
      // Step 3: Generate QR code data URL
      console.log('🎨 Generating QR image...');
      
      qrUrl = await generateQRDataUrl(newCode);
      console.log('✅ QR code image generated, data URL length:', qrUrl.length);
      
    } catch (imageError) {
      console.error('❌ Failed to generate QR image:', imageError.message);
      return res.status(400).json({
        success: false,
        message: 'Gagal generate QR image',
        details: imageError.message
      });
    }
    
    try {
      // Step 4: Convert data URL to image and save to public folder
      console.log('💾 Saving QR image to file...');
      
      const base64Data = qrUrl.replace(/^data:image\/png;base64,/, "");
      filename = `qris-payment-${Date.now()}.png`;
      filepath = path.join(__dirname, 'public', 'generated', filename);
      
      // Ensure generated folder exists
      const generatedDir = path.join(__dirname, 'public', 'generated');
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
        console.log('📁 Created generated directory');
      }
      
      // Save image file
      fs.writeFileSync(filepath, base64Data, 'base64');
      console.log('✅ QR image saved to:', filepath);
      
    } catch (saveError) {
      console.error('❌ Failed to save QR image:', saveError.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan QR image',
        details: saveError.message
      });
    }
    
    // Step 5: Return response to user
    console.log('🎉 All steps completed successfully!');
    
    res.json({
      success: true,
      message: 'Payment QRIS berhasil dibuat',
      data: {
        filename: filename,
        downloadUrl: `/generated/${filename}`,
        qrCodeData: qrUrl,
        qrisString: newCode,
        amount: parseFloat(amount),
        fee: parseFloat(fee),
        feeType: feeType,
        uploadedFile: req.file.filename
      }
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.error('🔍 Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server yang tidak terduga',
      details: error.message
    });
  }
});

// Route untuk generate advanced QRIS dengan template yang lebih realistis
app.post('/generate-advanced-qris', upload.single('qrisImage'), async (req, res) => {
  try {
    const { amount, fee = 0, feeType = "flat", merchantName, merchantCity } = req.body;
    
    console.log('📥 Advanced QRIS request received:', { amount, fee, feeType, merchantName, merchantCity });
    console.log('📁 File uploaded:', req.file ? req.file.filename : 'No file');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File QRIS wajib diupload'
      });
    }

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({
        success: false,
        message: 'Amount harus diisi dan berupa angka'
      });
    }

    console.log('📷 Processing advanced QRIS...');
    console.log('💰 Amount:', amount);
    console.log('🔧 Fee:', fee);
    console.log('📊 Fee Type:', feeType);
    
    let qris, newCode, filename, filepath, advancedQRIS;
    
    try {
      // Step 1: Read QRIS dari file yang diupload
      const qrisImagePath = req.file.path;
      const uploadedFilename = req.file.filename;
      const qrisUrl = `http://localhost:${PORT}/uploads/${uploadedFilename}`;
      
      console.log('📖 Reading QRIS from URL:', qrisUrl);
      console.log('📁 File path:', qrisImagePath);
      console.log('📊 File size:', req.file.size, 'bytes');
      console.log('📝 File type:', req.file.mimetype);
      
      // Check if file exists and has content
      if (!fs.existsSync(qrisImagePath)) {
        throw new Error('File tidak ditemukan setelah upload');
      }
      
      const fileStats = fs.statSync(qrisImagePath);
      if (fileStats.size === 0) {
        throw new Error('File kosong atau corrupt');
      }
      
      console.log('✅ File validation passed');
      
      try {
        // Try readQRCodeFromURL first
        console.log('🔄 Trying readQRCodeFromURL...');
        qris = await readQRCodeFromURL(qrisUrl);
        console.log('✅ QRIS read successfully with readQRCodeFromURL');
      } catch (urlError) {
        console.log('⚠️ readQRCodeFromURL failed:', urlError.message);
        console.log('🔄 Trying readQRCodeFromFile as fallback...');
        
        try {
          qris = await readQRCodeFromFile(qrisImagePath);
          console.log('✅ QRIS read successfully with readQRCodeFromFile');
        } catch (fileError) {
          console.log('⚠️ readQRCodeFromFile also failed:', fileError.message);
          console.log('🔄 Trying alternative QR reader...');
          
          // Last resort: use our alternative reader
          qris = await readQRCodeFromImageFile(qrisImagePath);
          console.log('✅ QRIS read successfully with alternative method');
        }
      }
      
      if (!qris || qris.length < 20) {
        throw new Error('QR Code tidak mengandung data QRIS yang valid');
      }
      
      console.log('📏 QRIS length:', qris.length);
      console.log('🔤 QRIS preview:', qris.substring(0, 50) + '...');
      
    } catch (readError) {
      console.error('❌ Failed to read QRIS:', readError.message);
      console.error('🔍 Full error:', readError);
      
      // Clean up
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Gagal membaca QR Code dari gambar',
        details: readError.message || 'Gambar tidak berisi QR Code QRIS yang valid. Pastikan gambar jelas dan mengandung QR code yang benar.'
      });
    }
    
    try {
      // Step 2: Calculate total amount dan generate payment QRIS
      const totalAmount = parseFloat(amount) + parseFloat(fee);
      console.log('💵 Total amount:', totalAmount);
      
      // Generate payment QRIS
      console.log('💳 Generating payment QRIS...');
      
      newCode = makeQRPayment({
        qrCode: qris,
        amount: totalAmount,
        fee: 0, // Fee sudah dihitung di total amount
        feeType: "flat",
      });
      
      console.log('✅ Payment QRIS created, length:', newCode.length);
      
    } catch (paymentError) {
      console.error('❌ Failed to create payment QRIS:', paymentError.message);
      
      // Clean up
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Gagal membuat payment QRIS',
        details: paymentError.message
      });
    }
    
    try {
      // Step 3: Generate advanced QRIS image dengan template
      console.log('🎨 Generating advanced QRIS image...');
      
      const templatePath = path.join(__dirname, 'base_template.png');
      
      if (!fs.existsSync(templatePath)) {
        throw new Error('Template QRIS tidak ditemukan: base_template.png');
      }
      
      // Parse merchant info dengan data yang sudah di-override
      const finalMerchantInfo = parseAdvancedQRIS(qris);
      if (merchantName) finalMerchantInfo.name = merchantName.toUpperCase();
      if (merchantCity) finalMerchantInfo.city = merchantCity.toUpperCase();
      finalMerchantInfo.amount = parseFloat(amount) + parseFloat(fee);
      
      console.log('🏪 Final merchant info for template:', finalMerchantInfo);
      
      advancedQRIS = await createAdvancedQRIS(newCode, finalMerchantInfo, templatePath);
      
      console.log('✅ Advanced QRIS image generated');
      
    } catch (imageError) {
      console.error('❌ Failed to generate advanced QRIS image:', imageError.message);
      
      // Clean up
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Gagal generate advanced QRIS image',
        details: imageError.message
      });
    }
    
    try {
      // Step 4: Save advanced QRIS image
      console.log('💾 Saving advanced QRIS image...');
      
      filename = `advanced-qris-${Date.now()}.png`;
      filepath = path.join(__dirname, 'public', 'generated', filename);
      
      // Ensure generated folder exists
      const generatedDir = path.join(__dirname, 'public', 'generated');
      if (!fs.existsSync(generatedDir)) {
        fs.mkdirSync(generatedDir, { recursive: true });
        console.log('📁 Created generated directory');
      }
      
      // Save advanced QRIS image
      await advancedQRIS.writeAsync(filepath);
      console.log('✅ Advanced QRIS image saved to:', filepath);
      
    } catch (saveError) {
      console.error('❌ Failed to save advanced QRIS image:', saveError.message);
      
      // Clean up
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan advanced QRIS image',
        details: saveError.message
      });
    }
    
    // Step 5: Clean up uploaded file
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Cleaned up uploaded file');
      }
    } catch (cleanupError) {
      console.log('⚠️ Warning: Could not clean up uploaded file:', cleanupError.message);
    }
    
    // Step 6: Return success response
    console.log('🎉 Advanced QRIS generation completed successfully!');
    
    const finalMerchantInfo = parseAdvancedQRIS(qris);
    if (merchantName) finalMerchantInfo.name = merchantName;
    if (merchantCity) finalMerchantInfo.city = merchantCity;
    
    res.json({
      success: true,
      message: 'Advanced QRIS berhasil dibuat',
      data: {
        filename: filename,
        downloadUrl: `/generated/${filename}`,
        previewUrl: `/generated/${filename}`,
        qrisString: newCode,
        merchantInfo: {
          name: finalMerchantInfo.name,
          city: finalMerchantInfo.city,
          merchantId: finalMerchantInfo.merchantId,
          areaCode: finalMerchantInfo.areaCode
        },
        paymentInfo: {
          amount: parseFloat(amount),
          fee: parseFloat(fee),
          totalAmount: parseFloat(amount) + parseFloat(fee),
          feeType: feeType
        },
        templateInfo: {
          templateUsed: 'base_template.png',
          generationType: 'advanced',
          outputDimensions: `${advancedQRIS.getWidth()}x${advancedQRIS.getHeight()}`
        },
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Unexpected error in advanced QRIS generation:', error);
    console.error('🔍 Stack trace:', error.stack);
    
    // Clean up on unexpected error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.log('⚠️ Could not clean up file on error:', cleanupError.message);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server yang tidak terduga',
      details: error.message
    });
  }
});

// Error handler untuk multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ukuran file terlalu besar (maksimal 5MB)'
      });
    }
  }
  
  if (error.message.includes('Hanya file gambar')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan server',
    details: error.message
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404 - Endpoint not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    requestedPath: req.path,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 QRIS Generator Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload folder: ${path.join(__dirname, 'public', 'uploads')}`);
  console.log(`🎨 Generated files: ${path.join(__dirname, 'public', 'generated')}`);
});