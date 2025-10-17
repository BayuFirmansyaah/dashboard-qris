import { makeQRPayment, readQRCodeFromURL } from "my-qris";
import QRCode from "qrcode";
import Jimp from "jimp";
import fs from "fs";
import path from "path";

// Konfigurasi posisi untuk berbagai elemen di template
const TEMPLATE_CONFIG = {
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
  }
};

async function clearArea(image, config) {
  if (config.clearArea) {
    const clearRect = new Jimp(config.width, config.height, '#FFFFFF');
    image.composite(clearRect, config.x, config.y);
  }
}

async function addText(image, text, config) {
  const fonts = {
    'FONT_SANS_14_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK),
    'FONT_SANS_16_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK),
    'FONT_SANS_32_BLACK': await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
  };
  
  const font = fonts[config.font];
  const alignmentX = config.align === 'center' ? Jimp.HORIZONTAL_ALIGN_CENTER : Jimp.HORIZONTAL_ALIGN_LEFT;
  
  image.print(font, config.x, config.y, {
    text: text,
    alignmentX: alignmentX,
    alignmentY: Jimp.VERTICAL_ALIGN_TOP
  }, config.width);
}

async function createAdvancedDynamicQRIS(qrCodeData, merchantInfo, templatePath) {
  try {
    console.log("📷 Loading base template...");
    const template = await Jimp.read(templatePath);
    
    console.log(`📐 Template dimensions: ${template.getWidth()}x${template.getHeight()}`);
    
    // Generate QR code
    console.log("🔲 Generating QR code...");
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: TEMPLATE_CONFIG.qrCode.size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    const newQRImage = await Jimp.read(qrCodeBuffer);
    
    // 1. Replace merchant name
    console.log("✏️  Adding merchant name...");
    await clearArea(template, TEMPLATE_CONFIG.merchantName);
    await addText(template, merchantInfo.name, TEMPLATE_CONFIG.merchantName);
    
    // 2. Replace NMID
    console.log("🆔 Adding NMID...");
    await clearArea(template, TEMPLATE_CONFIG.nmid);
    await addText(template, `NMID : ${merchantInfo.merchantId}`, TEMPLATE_CONFIG.nmid);
    
    // 3. Replace area code
    console.log("🔤 Adding area code...");
    await clearArea(template, TEMPLATE_CONFIG.areaCode);
    await addText(template, merchantInfo.areaCode || "A01", TEMPLATE_CONFIG.areaCode);
    
    // 4. Replace QR Code
    console.log("🔄 Replacing QR code...");
    const qrConfig = TEMPLATE_CONFIG.qrCode;
    
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
      await addText(template, `Rp ${merchantInfo.amount.toLocaleString('id-ID')}`, TEMPLATE_CONFIG.amount);
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
    
    await clearArea(template, TEMPLATE_CONFIG.timestamp);
    await addText(template, `Generated: ${timestamp}`, TEMPLATE_CONFIG.timestamp);
    
    // 7. Optional: Add merchant city if available
    if (merchantInfo.city) {
      console.log("🏙️  Adding city information...");
      const cityConfig = {
        x: 0,
        y: 215,
        width: 735,
        height: 25,
        clearArea: true,
        font: 'FONT_SANS_14_BLACK',
        align: 'center'
      };
      await clearArea(template, cityConfig);
      await addText(template, merchantInfo.city, cityConfig);
    }
    
    console.log("✅ Advanced dynamic QRIS created!");
    return template;
    
  } catch (error) {
    console.error("❌ Error creating advanced dynamic QRIS:", error);
    throw error;
  }
}

// Function untuk kustomisasi merchant data
function createMerchantData(overrides = {}) {
  const defaultData = {
    name: "WARUNG MAKAN BAROKAH",
    merchantId: "ID1023304672596", 
    areaCode: "B02",
    amount: 25000,
    city: "JAKARTA SELATAN"
  };
  
  return { ...defaultData, ...overrides };
}

(async () => {
  try {
    console.log("🔍 Reading QR code from URL...");
    const qris = await readQRCodeFromURL("https://jabalarafahbatam.com/wp-content/uploads/2020/10/image-1.jpg");

    console.log("💳 Creating QR payment...");
    const newCode = makeQRPayment({
      qrCode: qris,
      amount: 50000,
      fee: 0,
      feeType: "percentage",
    });

    console.log("✅ QR Code Generated!");

    // Merchant data - bisa dikustomisasi sesuai kebutuhan
    const merchantInfo = createMerchantData({
      name: "TOKO ELEKTRONIK JAYA",
      merchantId: "ID2025101600001",
      areaCode: "C03", 
      amount: 50000,
      city: "SURABAYA, JAWA TIMUR"
    });

    console.log("🎨 Creating advanced dynamic QRIS...");
    
    const templatePath = path.join(process.cwd(), "base_template.png");
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    const dynamicQRIS = await createAdvancedDynamicQRIS(newCode, merchantInfo, templatePath);

    // Save result
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `advanced-qris-${timestamp}.png`;
    const filePath = path.join(process.cwd(), fileName);

    await dynamicQRIS.writeAsync(filePath);

    console.log(`🎉 Advanced QRIS successfully created!`);
    console.log(`📁 File: ${fileName}`);
    console.log(`📍 Location: ${filePath}`);
    console.log(`🏪 Merchant: ${merchantInfo.name}`);
    console.log(`🆔 NMID: ${merchantInfo.merchantId}`);
    console.log(`📍 City: ${merchantInfo.city}`);
    console.log(`💰 Amount: Rp ${merchantInfo.amount.toLocaleString('id-ID')}`);
    console.log(`🔧 Template: base_template.png`);
    console.log(`📐 Output size: ${dynamicQRIS.getWidth()}x${dynamicQRIS.getHeight()}`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();