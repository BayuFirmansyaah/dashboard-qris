import { makeQRPayment, readQRCodeFromURL } from "my-qris";
import QRCode from "qrcode";
import Jimp from "jimp";
import axios from "axios";
import fs from "fs";
import path from "path";

async function downloadImage(url) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'arraybuffer'
  });
  return Buffer.from(response.data);
}

async function createEnhancedQRISTemplate(qrCodeData, merchantInfo) {
  try {
    // Generate QR code sebagai buffer
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 220,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Buat template QRIS dengan ukuran yang lebih besar (600x800 pixel)
    const template = new Jimp(600, 800, '#FFFFFF');
    
    // Load QR code
    const qrImage = await Jimp.read(qrCodeBuffer);
    
    // Load fonts
    const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontRegular = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);

    // Background gradient effect (simple)
    template.scan(0, 0, 600, 120, function (x, y, idx) {
      const gradient = Math.floor(240 - (y * 0.3));
      this.bitmap.data[idx] = gradient; // Red
      this.bitmap.data[idx + 1] = gradient; // Green
      this.bitmap.data[idx + 2] = 255; // Blue
      this.bitmap.data[idx + 3] = 255; // Alpha
    });

    // Header QRIS dengan styling
    template.print(fontLarge, 0, 40, {
      text: "QRIS",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    // Divider line
    template.scan(50, 120, 500, 3, function (x, y, idx) {
      this.bitmap.data[idx] = 100; // Red
      this.bitmap.data[idx + 1] = 100; // Green
      this.bitmap.data[idx + 2] = 100; // Blue
    });

    // Bank Indonesia logo area (placeholder dengan border)
    const logoArea = new Jimp(120, 60, '#F0F0F0');
    logoArea.print(fontSmall, 0, 20, {
      text: "BANK\nINDONESIA",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 120);
    template.composite(logoArea, 240, 140);

    // QPN Logo area (placeholder)
    const qpnArea = new Jimp(100, 40, '#E0E0E0');
    qpnArea.print(fontSmall, 0, 12, {
      text: "QPN",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 100);
    template.composite(qpnArea, 250, 220);

    // Merchant Information Section
    template.print(fontMedium, 0, 280, {
      text: merchantInfo.name,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    template.print(fontRegular, 0, 320, {
      text: merchantInfo.city,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    // Merchant ID
    template.print(fontSmall, 0, 350, {
      text: `ID: ${merchantInfo.merchantId}`,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    // QR Code dengan border
    const qrBorder = new Jimp(240, 240, '#FFFFFF');
    qrBorder.composite(qrImage, 10, 10);
    
    // Shadow effect untuk QR code
    const shadow = new Jimp(245, 245, '#00000020');
    template.composite(shadow, 180, 385);
    template.composite(qrBorder, 178, 383);

    // Amount section jika ada
    if (merchantInfo.amount && merchantInfo.amount > 0) {
      // Amount background
      template.scan(50, 640, 500, 60, function (x, y, idx) {
        this.bitmap.data[idx] = 240; // Red
        this.bitmap.data[idx + 1] = 248; // Green
        this.bitmap.data[idx + 2] = 255; // Blue
      });

      template.print(fontSmall, 0, 650, {
        text: "Nominal Pembayaran:",
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, 600);

      template.print(fontMedium, 0, 670, {
        text: `Rp ${merchantInfo.amount.toLocaleString('id-ID')}`,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, 600);
    }

    // Footer instructions
    template.print(fontSmall, 0, 720, {
      text: "Tunjukkan kode QR ini kepada kasir",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    template.print(fontSmall, 0, 740, {
      text: "atau scan dengan aplikasi pembayaran digital",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 600);

    // Bottom border dengan warna
    template.scan(0, 770, 600, 30, function (x, y, idx) {
      this.bitmap.data[idx] = 200; // Red
      this.bitmap.data[idx + 1] = 220; // Green
      this.bitmap.data[idx + 2] = 255; // Blue
    });

    // Outer border frame
    template.scan(0, 0, 600, 800, function (x, y, idx) {
      if (x < 2 || x >= 598 || y < 2 || y >= 798) {
        this.bitmap.data[idx] = 80; // Red
        this.bitmap.data[idx + 1] = 80; // Green
        this.bitmap.data[idx + 2] = 80; // Blue
      }
    });

    return template;
  } catch (error) {
    console.error("Error creating enhanced QRIS template:", error);
    throw error;
  }
}

(async () => {
  try {
    // Membaca QR code dari URL
    console.log("🔍 Membaca QR code dari URL...");
    const qris = await readQRCodeFromURL("https://jabalarafahbatam.com/wp-content/uploads/2020/10/image-1.jpg");

    // Membuat QR payment baru
    console.log("💳 Membuat QR payment...");
    const newCode = makeQRPayment({
      qrCode: qris,
      amount: 10000,
      fee: 0,
      feeType: "percentage",
    });

    console.log("✅ QR Code Generated:", newCode.substring(0, 50) + "...");

    // Info merchant (parsing dari QR code atau input manual)
    const merchantInfo = {
      name: "Masjid Jabal Arafah",
      city: "BATAM, KEPULAUAN RIAU",
      amount: 10000,
      merchantId: "936004510000003986"
    };

    // Membuat enhanced QRIS template
    console.log("🎨 Membuat template QRIS enhanced...");
    const qrisTemplate = await createEnhancedQRISTemplate(newCode, merchantInfo);

    // Membuat nama file dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `qris-enhanced-${timestamp}.png`;
    const filePath = path.join(process.cwd(), fileName);

    // Menyimpan gambar QRIS
    await qrisTemplate.writeAsync(filePath);

    console.log(`🎉 QRIS Enhanced berhasil disimpan!`);
    console.log(`📁 File: ${fileName}`);
    console.log(`📍 Lokasi: ${filePath}`);
    console.log(`📐 Ukuran: 600x800 pixel (enhanced format)`);
    console.log(`💰 Nominal: Rp ${merchantInfo.amount.toLocaleString('id-ID')}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();