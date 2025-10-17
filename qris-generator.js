import { makeQRPayment, readQRCodeFromURL, readQRCodeFromFile } from "my-qris";
import QRCode from "qrcode";
import Jimp from "jimp";
import fs from "fs";
import path from "path";

/**
 * QRIS Template Generator
 * Menggunakan base template dan membuatnya dinamis dengan data merchant
 */

class QRISGenerator {
  constructor(templatePath) {
    this.templatePath = templatePath;
    this.config = {
      merchantName: { x: 0, y: 175, width: 735, height: 50, font: 'FONT_SANS_32_BLACK', align: 'center', clear: false },
      merchantCity: { x: 0, y: 215, width: 735, height: 25, font: 'FONT_SANS_14_BLACK', align: 'center', clear: false },
      nmid: { x: 0, y: 245, width: 735, height: 30, font: 'FONT_SANS_16_BLACK', align: 'center', clear: false },
      areaCode: { x: 0, y: 290, width: 735, height: 25, font: 'FONT_SANS_16_BLACK', align: 'center', clear: false },
      qrCode: { x: 196, y: 350, size: 342, margin: 10 },
      amount: { x: 0, y: 698, width: 735, height: 40, font: 'FONT_SANS_32_BLACK', align: 'center', clear: false },
      timestamp: { x: 50, y: 985, width: 300, height: 25, font: 'FONT_SANS_14_BLACK', align: 'left', clear: false }
    };
  }

  /**
   * Extract merchant data from QRIS image file
   */
  async extractMerchantData(imagePath) {
    try {
      console.log("🔍 Extracting merchant data from QRIS...");
      
      // Read QR code from uploaded image
      const qrisData = await readQRCodeFromFile(imagePath);
      
      console.log("📊 Raw QRIS data:", qrisData);
      
      // Parse QRIS string to extract merchant information
      const merchantInfo = this.parseQRISString(qrisData);
      
      console.log("🏪 Extracted merchant info:", merchantInfo);
      
      return {
        originalQRIS: qrisData,
        merchantInfo: merchantInfo
      };
      
    } catch (error) {
      console.error("❌ Error extracting merchant data:", error);
      throw new Error(`Failed to extract merchant data: ${error.message}`);
    }
  }

  /**
   * Parse QRIS string to extract merchant information
   */
  parseQRISString(qrisString) {
    try {
      const merchantInfo = {
        name: 'MERCHANT',
        city: 'KOTA',
        merchantId: 'ID0000000000000',
        areaCode: 'A01'
      };

      // Parse QRIS format - simplified parsing
      if (qrisString && qrisString.length > 0) {
        // Extract merchant name (tag 59)
        const merchantNameMatch = qrisString.match(/59(\d{2})([^60]*)/);
        if (merchantNameMatch) {
          const length = parseInt(merchantNameMatch[1]);
          merchantInfo.name = merchantNameMatch[2].substring(0, length).trim().toUpperCase();
        }

        // Extract merchant city (tag 60)
        const merchantCityMatch = qrisString.match(/60(\d{2})([^61]*)/);
        if (merchantCityMatch) {
          const length = parseInt(merchantCityMatch[1]);
          merchantInfo.city = merchantCityMatch[2].substring(0, length).trim().toUpperCase();
        }

        // Extract merchant ID from tag 26 or similar
        const merchantIdMatch = qrisString.match(/26(\d{2})([^27]*)/);
        if (merchantIdMatch) {
          const fullData = merchantIdMatch[2];
          // Look for merchant ID pattern
          const idMatch = fullData.match(/01(\d{2})([^02]*)/);
          if (idMatch) {
            const idLength = parseInt(idMatch[1]);
            merchantInfo.merchantId = idMatch[2].substring(0, idLength);
          }
        }
      }

      return merchantInfo;
    } catch (error) {
      console.log("⚠️  Warning: Could not parse QRIS string fully, using defaults");
      return {
        name: 'MERCHANT',
        city: 'KOTA',
        merchantId: 'ID0000000000000',
        areaCode: 'A01'
      };
    }
  }

  async loadFonts() {
    return {
      'FONT_SANS_14_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK),
      'FONT_SANS_16_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
      'FONT_SANS_32_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    };
  }

  async clearArea(image, config) {
    if (config.clear) {
      const clearRect = new Jimp(config.width, config.height, '#FFFFFF');
      image.composite(clearRect, config.x, config.y);
    }
  }

  async addText(image, text, config, fonts) {
    const font = fonts[config.font];
    const alignmentX = config.align === 'center' ? Jimp.HORIZONTAL_ALIGN_CENTER : Jimp.HORIZONTAL_ALIGN_LEFT;
    
    image.print(font, config.x, config.y, {
      text: text,
      alignmentX: alignmentX,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, config.width);
  }

  async generateQRIS(qrCodeData, merchantInfo) {
    try {
      console.log("📷 Loading template...");
      
      if (!fs.existsSync(this.templatePath)) {
        throw new Error(`Template not found: ${this.templatePath}`);
      }

      const template = await Jimp.read(this.templatePath);
      const fonts = await this.loadFonts();
      
      console.log(`📐 Template: ${template.getWidth()}x${template.getHeight()}`);

      // Generate QR Code
      console.log("🔲 Generating QR code...");
      const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
        width: this.config.qrCode.size,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' }
      });

      const qrImage = await Jimp.read(qrCodeBuffer);

      // Replace merchant name
      console.log("✏️  Adding merchant name...");
      await this.clearArea(template, this.config.merchantName);
      await this.addText(template, merchantInfo.name, this.config.merchantName, fonts);

      // Add city if provided
      if (merchantInfo.city) {
        console.log("🏙️  Adding city...");
        await this.clearArea(template, this.config.merchantCity);
        await this.addText(template, merchantInfo.city, this.config.merchantCity, fonts);
      }

      // Replace NMID
      console.log("🆔 Adding NMID...");
      await this.clearArea(template, this.config.nmid);
      await this.addText(template, `NMID : ${merchantInfo.merchantId}`, this.config.nmid, fonts);

      // Replace area code
      console.log("🔤 Adding area code...");
      await this.clearArea(template, this.config.areaCode);
      await this.addText(template, merchantInfo.areaCode || "A01", this.config.areaCode, fonts);

      // Replace QR Code
      console.log("🔄 Replacing QR code...");
      const qrConfig = this.config.qrCode;
      const qrBackground = new Jimp(qrConfig.size + (qrConfig.margin * 2), qrConfig.size + (qrConfig.margin * 2), '#FFFFFF');
      template.composite(qrBackground, qrConfig.x - qrConfig.margin, qrConfig.y - qrConfig.margin);
      template.composite(qrImage, qrConfig.x, qrConfig.y);

      // Add amount
      if (merchantInfo.amount && merchantInfo.amount > 0) {
        console.log("💰 Adding amount...");
        await this.addText(template, `Rp ${merchantInfo.amount.toLocaleString('id-ID')}`, this.config.amount, fonts);
      }

      // Add timestamp
      console.log("📅 Adding timestamp...");
      const timestamp = new Date().toLocaleDateString('id-ID') + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      await this.clearArea(template, this.config.timestamp);
      await this.addText(template, `Generated: ${timestamp}`, this.config.timestamp, fonts);

      console.log("✅ QRIS generated successfully!");
      return template;

    } catch (error) {
      console.error("❌ Error generating QRIS:", error);
      throw error;
    }
  }

  // Method untuk mengupdate konfigurasi posisi
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Demo usage
async function demo() {
  try {
    // Read original QR code
    console.log("🔍 Reading QR code from URL...");
    const originalQRIS = await readQRCodeFromURL("https://jabalarafahbatam.com/wp-content/uploads/2020/10/image-1.jpg");

    // Create new payment QR
    console.log("💳 Creating payment QR...");
    const paymentQR = makeQRPayment({
      qrCode: originalQRIS,
      amount: 75000,
      fee: 0,
      feeType: "percentage",
    });

    // Merchant data
    const merchantData = {
      name: "CAFE MODERN NUSANTARA",
      city: "BANDUNG, JAWA BARAT", 
      merchantId: "ID2025101600002",
      areaCode: "D04",
      amount: 75000
    };

    // Generate QRIS
    const templatePath = path.join(process.cwd(), "base_template.png");
    const generator = new QRISGenerator(templatePath);
    
    const qrisImage = await generator.generateQRIS(paymentQR, merchantData);

    // Save file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `qris-${merchantData.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.png`;
    const filePath = path.join(process.cwd(), fileName);

    await qrisImage.writeAsync(filePath);

    console.log(`🎉 QRIS berhasil dibuat!`);
    console.log(`📁 File: ${fileName}`);
    console.log(`📍 Lokasi: ${filePath}`);
    console.log(`🏪 Merchant: ${merchantData.name}`);
    console.log(`🆔 NMID: ${merchantData.merchantId}`);
    console.log(`📍 Kota: ${merchantData.city}`);
    console.log(`💰 Nominal: Rp ${merchantData.amount.toLocaleString('id-ID')}`);

  } catch (error) {
    console.error("❌ Demo error:", error.message);
  }
}

// Export untuk digunakan di file lain
export { QRISGenerator };

// Jalankan demo jika file dijalankan langsung
if (process.argv[1].endsWith('qris-generator.js')) {
  demo();
}