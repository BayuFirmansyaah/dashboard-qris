import { makeQRPayment, readQRCodeFromURL } from "my-qris";
import QRCode from "qrcode";
import Jimp from "jimp";
import axios from "axios";
import fs from "fs";
import path from "path";

async function downloadImage(url) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      timeout: 10000
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.log(`⚠️  Gagal download template dari ${url}, menggunakan template default`);
    return null;
  }
}

async function createQRISFromTemplate(qrCodeData, merchantInfo, templateUrl) {
  try {
    // Generate QR code sebagai buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    let template;
    
    // Try to download template, fallback to created template
    const templateBuffer = await downloadImage(templateUrl);
    
    if (templateBuffer) {
      // Gunakan template yang didownload
      template = await Jimp.read(templateBuffer);
      
      // Resize template jika perlu untuk memastikan ukuran yang konsisten
      if (template.getWidth() !== 600 || template.getHeight() !== 800) {
        template.resize(600, 800);
      }
    } else {
      // Buat template custom jika download gagal
      template = await createCustomQRISTemplate();
    }
    
    // Load QR code
    const qrImage = await Jimp.read(qrCodeBuffer);
    
    // Load fonts
    const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontRegular = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);

    // Overlay merchant information
    // Merchant name (biasanya di area atas-tengah)
    template.print(fontMedium, 0, 250, {
      text: merchantInfo.name,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    // Merchant city
    template.print(fontRegular, 0, 290, {
      text: merchantInfo.city,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    // QR Code di area tengah (biasanya koordinat sekitar 200, 350)
    const qrX = (600 - 200) / 2; // Center horizontally
    const qrY = 350; // Position vertically
    
    // Buat background putih untuk QR code
    const qrBackground = new Jimp(220, 220, '#FFFFFF');
    qrBackground.composite(qrImage, 10, 10);
    template.composite(qrBackground, qrX - 10, qrY - 10);

    // Amount information jika ada
    if (merchantInfo.amount && merchantInfo.amount > 0) {
      template.print(fontMedium, 0, 580, {
        text: `Rp ${merchantInfo.amount.toLocaleString('id-ID')}`,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, 600);
    }

    // Merchant ID (biasanya di bawah)
    template.print(fontSmall, 0, 620, {
      text: `Merchant ID: ${merchantInfo.merchantId}`,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    return template;
  } catch (error) {
    console.error("Error creating QRIS from template:", error);
    throw error;
  }
}

async function createCustomQRISTemplate() {
  // Template custom dengan design yang mirip QRIS resmi
  const template = new Jimp(600, 800, '#FFFFFF');
  
  const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
  const fontRegular = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
  
  // Header dengan background gradient
  template.scan(0, 0, 600, 100, function (x, y, idx) {
    const gradient = Math.floor(235 + (y * 0.2));
    this.bitmap.data[idx] = 70; // Red
    this.bitmap.data[idx + 1] = 130; // Green
    this.bitmap.data[idx + 2] = gradient; // Blue
    this.bitmap.data[idx + 3] = 255; // Alpha
  });

  // QRIS text
  template.print(fontLarge, 0, 30, {
    text: "QRIS",
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, 600);

  // Bank Indonesia section
  const bankSection = new Jimp(500, 80, '#F8F9FA');
  bankSection.print(fontRegular, 0, 30, {
    text: "BANK INDONESIA - QUICK RESPONSE CODE INDONESIAN STANDARD",
    alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, 500);
  template.composite(bankSection, 50, 120);

  return template;
}

(async () => {
  try {
    console.log("🔍 Membaca QR code dari URL...");
    const qris = await readQRCodeFromURL("https://jabalarafahbatam.com/wp-content/uploads/2020/10/image-1.jpg");

    console.log("💳 Membuat QR payment...");
    const newCode = makeQRPayment({
      qrCode: qris,
      amount: 10000,
      fee: 0,
      feeType: "percentage",
    });

    console.log("✅ QR Code Generated!");

    // Info merchant
    const merchantInfo = {
      name: "Masjid Jabal Arafah",
      city: "BATAM, KEPULAUAN RIAU",
      amount: 10000,
      merchantId: "936004510000003986"
    };

    console.log("🎨 Membuat QRIS dengan template...");
    
    // URL template yang Anda berikan
    const templateUrl = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1ZF8PVF2LzOoM9yRp7tijTCpvy6iRoE5Bsw&s";
    
    const qrisTemplate = await createQRISFromTemplate(newCode, merchantInfo, templateUrl);

    // Simpan file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `qris-template-${timestamp}.png`;
    const filePath = path.join(process.cwd(), fileName);

    await qrisTemplate.writeAsync(filePath);

    console.log(`🎉 QRIS dengan template berhasil disimpan!`);
    console.log(`📁 File: ${fileName}`);
    console.log(`📍 Lokasi: ${filePath}`);
    console.log(`💰 Nominal: Rp ${merchantInfo.amount.toLocaleString('id-ID')}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();