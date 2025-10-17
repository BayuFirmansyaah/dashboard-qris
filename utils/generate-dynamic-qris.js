import { makeQRPayment, readQRCodeFromURL } from "my-qris";
import QRCode from "qrcode";
import Jimp from "jimp";
import fs from "fs";
import path from "path";

async function createDynamicQRIS(qrCodeData, merchantInfo, templatePath) {
  try {
    console.log("📷 Loading base template...");
    
    // Load template image
    const template = await Jimp.read(templatePath);
    
    console.log(`📐 Template size: ${template.getWidth()}x${template.getHeight()}`);
    
    // Generate QR code sebagai buffer
    console.log("🔲 Generating new QR code...");
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 360, // Ukuran QR diperbesar 120% (300 * 1.2 = 360)
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Load QR code image
    const newQRImage = await Jimp.read(qrCodeBuffer);
    
    // Load fonts
    const fontLarge = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontMedium = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);
    
    // Berdasarkan template yang Anda berikan, saya akan mengganti area-area berikut:
    
    // 1. Ganti nama merchant (langsung tulis tanpa clear area)
    console.log("✏️  Replacing merchant name...");
    // Tulis nama merchant baru langsung tanpa clear area karena template sudah putih
    template.print(fontLarge, 0, 175, {
      text: merchantInfo.name,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, template.getWidth());
    
    // 2. Ganti NMID (langsung tulis tanpa clear area)
    console.log("🆔 Replacing NMID...");
    template.print(fontMedium, 0, 245, {
      text: `NMID : ${merchantInfo.merchantId}`,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, template.getWidth());
    
    // 3. Ganti area kode (langsung tulis tanpa clear area)
    console.log("🔤 Replacing area code...");
    template.print(fontMedium, 0, 275, {
      text: merchantInfo.areaCode || "A01",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, template.getWidth());
    
    // 4. Ganti QR Code (area tengah)
    console.log("🔄 Replacing QR code...");
    // Tentukan posisi QR code berdasarkan template (approximate center)
    const qrX = Math.floor((template.getWidth() - 336) / 2); // Center horizontally untuk ukuran 336px (280 * 1.2)
    const qrY = 330; // Position dari atas
    
    // Buat background putih untuk QR code
    const qrBackground = new Jimp(360, 360, '#FFFFFF'); // Background diperbesar 120%
    template.composite(qrBackground, qrX - 12, qrY - 12); // Margin juga diperbesar
    
    // Resize QR code untuk fit dengan area template
    newQRImage.resize(336, 336); // QR code diperbesar 120% (280 * 1.2 = 336)
    template.composite(newQRImage, qrX, qrY);
    
    // 5. Tambahkan informasi amount jika ada (langsung tulis tanpa clear area)
    if (merchantInfo.amount && merchantInfo.amount > 0) {
      console.log("💰 Adding amount information...");
      template.print(fontLarge, 0, 720, { // Turunkan posisi dari 655 ke 720
        text: `Rp ${merchantInfo.amount.toLocaleString('id-ID')}`,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, template.getWidth());
    }
    
    // 6. Update timestamp (langsung tulis tanpa clear area)
    console.log("📅 Adding timestamp...");
    const now = new Date();
    const timestamp = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID');
    
    template.print(fontSmall, 50, 985, {
      text: `Generated: ${timestamp}`,
      alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 300);
    
    console.log("✅ Dynamic QRIS template created!");
    
    return template;
    
  } catch (error) {
    console.error("❌ Error creating dynamic QRIS:", error);
    throw error;
  }
}

(async () => {
  try {
    console.log("🔍 Membaca QR code dari URL...");
    const qris = await readQRCodeFromURL("https://jabalarafahbatam.com/wp-content/uploads/2020/10/image-1.jpg");

    console.log("💳 Membuat QR payment baru...");
    const newCode = makeQRPayment({
      qrCode: qris,
      amount: 25000,
      fee: 0,
      feeType: "percentage",
    });

    console.log("✅ QR Code Generated!");

    // Info merchant dinamis
    const merchantInfo = {
      name: "WARUNG MAKAN BAROKAH",
      merchantId: "ID1023304672596",
      areaCode: "B02",
      amount: 25000,
      city: "JAKARTA SELATAN"
    };

    console.log("🎨 Membuat QRIS dinamis dari base template...");
    
    // Path ke base template
    const templatePath = path.join(process.cwd(), "base_template.png");
    
    // Cek apakah template ada
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template tidak ditemukan di: ${templatePath}`);
    }
    
    const dynamicQRIS = await createDynamicQRIS(newCode, merchantInfo, templatePath);

    // Simpan file hasil
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `dynamic-qris-${timestamp}.png`;
    const filePath = path.join(process.cwd(), fileName);

    await dynamicQRIS.writeAsync(filePath);

    console.log(`🎉 QRIS dinamis berhasil dibuat!`);
    console.log(`📁 File: ${fileName}`);
    console.log(`📍 Lokasi: ${filePath}`);
    console.log(`🏪 Merchant: ${merchantInfo.name}`);
    console.log(`🆔 NMID: ${merchantInfo.merchantId}`);
    console.log(`💰 Amount: Rp ${merchantInfo.amount.toLocaleString('id-ID')}`);
    console.log(`📏 Menggunakan template: base_template.png`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
})();