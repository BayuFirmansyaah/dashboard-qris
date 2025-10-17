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

async function createQRISTemplate(qrCodeData, merchantInfo) {
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

    // Buat template QRIS (540x700 pixel - ukuran standar QRIS)
    const template = new Jimp(540, 700, '#FFFFFF');
    
    // Load QR code
    const qrImage = await Jimp.read(qrCodeBuffer);
    
    // Load font
    const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);
    const fontBold = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_BLACK);

    // Header QRIS
    template.print(fontBold, 0, 30, {
      text: "QRIS",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 540);

    // Subtitle
    template.print(fontSmall, 0, 70, {
      text: "Scan untuk bayar",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 540);

    // Logo QRIS area (placeholder)
    template.scan(0, 100, 540, 80, function (x, y, idx) {
      if (y === 100 || y === 179 || x === 50 || x === 489) {
        this.bitmap.data[idx] = 200; // Red
        this.bitmap.data[idx + 1] = 200; // Green
        this.bitmap.data[idx + 2] = 200; // Blue
      }
    });

    // Merchant name
    template.print(fontBold, 0, 200, {
      text: merchantInfo.name,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 540);

    // Merchant city
    template.print(font, 0, 240, {
      text: merchantInfo.city,
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 540);

    // QR Code di tengah
    const qrX = (540 - 200) / 2;
    const qrY = 280;
    template.composite(qrImage, qrX, qrY);

    // Amount info jika ada
    if (merchantInfo.amount && merchantInfo.amount > 0) {
      template.print(fontBold, 0, 500, {
        text: `Rp ${merchantInfo.amount.toLocaleString('id-ID')}`,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, 540);
    }

    // Footer info
    template.print(fontSmall, 0, 550, {
      text: "Tunjukkan kode QR ini untuk pembayaran",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 540);

    // Logo bank/provider (placeholder)
    const logoY = 600;
    template.print(fontSmall, 0, logoY, {
      text: "Powered by Bank Indonesia",
      alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
      alignmentY: Jimp.VERTICAL_ALIGN_TOP
    }, 540);

    // Border frame
    template.scan(0, 0, 540, 700, function (x, y, idx) {
      if (x < 3 || x >= 537 || y < 3 || y >= 697) {
        this.bitmap.data[idx] = 100; // Red
        this.bitmap.data[idx + 1] = 100; // Green
        this.bitmap.data[idx + 2] = 100; // Blue
      }
    });

    return template;
  } catch (error) {
    console.error("Error creating QRIS template:", error);
    throw error;
  }
}

(async () => {
  try {
    // Membaca QR code dari URL
    console.log("Membaca QR code dari URL...");
    const qris = await readQRCodeFromURL("https://jabalarafahbatam.com/wp-content/uploads/2020/10/image-1.jpg");

    // Membuat QR payment baru
    console.log("Membuat QR payment...");
    const newCode = makeQRPayment({
      qrCode: qris,
      amount: 10000,
      fee: 0,
      feeType: "percentage",
    });

    console.log("QR Code Generated:", newCode);

    // Info merchant (bisa diambil dari parsing QR code atau input manual)
    const merchantInfo = {
      name: "BAYU FIRMANSYAH",
      city: "SURABAYA",
      amount: 1000000,
      merchantId: "936004510000003986"
    };

    // Membuat QRIS template
    console.log("Membuat template QRIS...");
    const qrisTemplate = await createQRISTemplate(newCode, merchantInfo);

    // Membuat nama file dengan timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `qris-payment-${timestamp}.png`;
    const filePath = path.join(process.cwd(), fileName);

    // Menyimpan gambar QRIS
    await qrisTemplate.writeAsync(filePath);

    console.log(`QRIS berhasil disimpan sebagai: ${fileName}`);
    console.log(`Lokasi file: ${filePath}`);
    console.log(`Ukuran: 540x700 pixel (format standar QRIS)`);

  } catch (error) {
    console.error("Error:", error.message);
  }
})();