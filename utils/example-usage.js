import { QRISGenerator } from './qris-generator.js';
import { makeQRPayment, readQRCodeFromURL } from "my-qris";
import path from "path";

/**
 * Contoh penggunaan QRISGenerator untuk berbagai skenario
 */

async function createMultipleQRIS() {
  try {
    // Read base QR code
    console.log("🔍 Membaca QR code dasar...");
    const baseQRIS = await readQRCodeFromURL("https://jabalarafahbatam.com/wp-content/uploads/2020/10/image-1.jpg");

    // Initialize generator
    const templatePath = path.join(process.cwd(), "base_template.png");
    const generator = new QRISGenerator(templatePath);

    // Skenario 1: Warung Makan
    console.log("\n🍽️  === SKENARIO 1: WARUNG MAKAN ===");
    const warungQR = makeQRPayment({
      qrCode: baseQRIS,
      amount: 35000,
      fee: 0,
      feeType: "percentage",
    });

    const warungData = {
      name: "WARUNG MAKAN SEDERHANA",
      city: "YOGYAKARTA, D.I. YOGYAKARTA",
      merchantId: "ID2025101600003",
      areaCode: "E05",
      amount: 35000
    };

    const warungQRIS = await generator.generateQRIS(warungQR, warungData);
    await warungQRIS.writeAsync(`warung-qris-${Date.now()}.png`);
    console.log("✅ Warung QRIS berhasil dibuat!");

    // Skenario 2: Toko Kelontong
    console.log("\n🏪 === SKENARIO 2: TOKO KELONTONG ===");
    const tokoQR = makeQRPayment({
      qrCode: baseQRIS,
      amount: 45000,
      fee: 0,
      feeType: "percentage",
    });

    const tokoData = {
      name: "TOKO KELONTONG BERKAH",
      city: "MEDAN, SUMATERA UTARA",
      merchantId: "ID2025101600004", 
      areaCode: "F06",
      amount: 45000
    };

    const tokoQRIS = await generator.generateQRIS(tokoQR, tokoData);
    await tokoQRIS.writeAsync(`toko-qris-${Date.now()}.png`);
    console.log("✅ Toko QRIS berhasil dibuat!");

    // Skenario 3: Salon Kecantikan
    console.log("\n💅 === SKENARIO 3: SALON KECANTIKAN ===");
    const salonQR = makeQRPayment({
      qrCode: baseQRIS,
      amount: 125000,
      fee: 0,
      feeType: "percentage",
    });

    const salonData = {
      name: "SALON CANTIK MODERN",
      city: "BALI, DENPASAR",
      merchantId: "ID2025101600005",
      areaCode: "G07", 
      amount: 125000
    };

    const salonQRIS = await generator.generateQRIS(salonQR, salonData);
    await salonQRIS.writeAsync(`salon-qris-${Date.now()}.png`);
    console.log("✅ Salon QRIS berhasil dibuat!");

    // Skenario 4: Tanpa nominal (flexible amount)
    console.log("\n💳 === SKENARIO 4: FLEXIBLE AMOUNT ===");
    const flexibleQR = makeQRPayment({
      qrCode: baseQRIS,
      amount: 1000, // Minimal amount untuk validasi
      fee: 0,
      feeType: "percentage",
    });

    const flexibleData = {
      name: "BENGKEL MOTOR JAYA",
      city: "PALEMBANG, SUMATERA SELATAN",
      merchantId: "ID2025101600006",
      areaCode: "H08",
      amount: 0 // Tidak menampilkan nominal di template
    };

    const flexibleQRIS = await generator.generateQRIS(flexibleQR, flexibleData);
    await flexibleQRIS.writeAsync(`flexible-qris-${Date.now()}.png`);
    console.log("✅ Flexible QRIS berhasil dibuat!");

    // Skenario 5: Custom positioning (advanced)
    console.log("\n⚙️  === SKENARIO 5: CUSTOM POSITIONING ===");
    
    // Update konfigurasi untuk positioning khusus
    generator.updateConfig({
      merchantName: { 
        x: 0, y: 160, width: 735, height: 60, 
        font: 'FONT_SANS_32_BLACK', align: 'center', clear: true 
      },
      amount: { 
        x: 0, y: 700, width: 735, height: 50, 
        font: 'FONT_SANS_32_BLACK', align: 'center', clear: false 
      }
    });

    const customQR = makeQRPayment({
      qrCode: baseQRIS,
      amount: 250000,
      fee: 0,
      feeType: "percentage",
    });

    const customData = {
      name: "PREMIUM RESTO & CAFE",
      city: "JAKARTA PUSAT, DKI JAKARTA",
      merchantId: "ID2025101600007",
      areaCode: "I09",
      amount: 250000
    };

    const customQRIS = await generator.generateQRIS(customQR, customData);
    await customQRIS.writeAsync(`custom-qris-${Date.now()}.png`);
    console.log("✅ Custom QRIS berhasil dibuat!");

    console.log("\n🎉 === SEMUA QRIS BERHASIL DIBUAT ===");
    console.log("📁 Periksa folder untuk melihat hasil QRIS yang telah dibuat");
    console.log("📏 Semua menggunakan template: base_template.png");
    console.log("🔧 Template dapat disesuaikan dengan mudah");

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Jalankan contoh
createMultipleQRIS();