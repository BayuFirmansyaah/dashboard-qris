import QRISParser from './qris-parser.js';
import myQrisPackage from "my-qris";
import Jimp from 'jimp';
import QrReader from 'qrcode-reader';
import fs from 'fs';
import path from 'path';

const { readQRCodeFromFile, getInfo } = myQrisPackage;

async function analyzeGeneratedQR() {
  console.log('🔍 === ANALYZING GENERATED QR CODES ===\n');
  
  const generatedDir = './public/generated';
  const files = fs.readdirSync(generatedDir);
  
  console.log('📁 Found generated files:', files);
  
  for (const file of files) {
    if (file.endsWith('.png')) {
      console.log(`\n📱 Analyzing: ${file}`);
      const filePath = path.join(generatedDir, file);
      
      await analyzeQRFile(filePath);
    }
  }
}

async function analyzeQRFile(filePath) {
  console.log(`🔍 File: ${filePath}`);
  
  // Method 1: Try my-qris readQRCodeFromFile
  try {
    console.log('📖 Method 1: Using my-qris...');
    const qrisData = await readQRCodeFromFile(filePath);
    console.log('✅ QR Code read successfully with my-qris');
    console.log('📝 Length:', qrisData.length);
    console.log('🔤 Data preview:', qrisData.substring(0, 100) + '...');
    
    // Validate with getInfo
    try {
      const qrisInfo = getInfo(qrisData);
      console.log('✅ QRIS validation successful');
      console.log('📊 QRIS Info:', JSON.stringify(qrisInfo, null, 2));
    } catch (infoError) {
      console.log('❌ QRIS validation failed:', infoError.message);
    }
    
  } catch (error) {
    console.log('❌ my-qris failed:', error.message);
    
    // Method 2: Try Jimp + qrcode-reader
    try {
      console.log('📖 Method 2: Using Jimp + qrcode-reader...');
      const qrisData = await readQRWithJimp(filePath);
      console.log('✅ QR Code read successfully with Jimp');
      console.log('📝 Length:', qrisData.length);
      console.log('🔤 Data preview:', qrisData.substring(0, 100) + '...');
      
      // Validate with custom parser
      const parser = new QRISParser();
      try {
        const parsed = parser.parseQRIS(qrisData);
        console.log('✅ Custom parser validation successful');
        console.log('🏪 Merchant:', parsed.merchant.merchantName);
        console.log('🏙️ City:', parsed.merchant.merchantCity);
        console.log('💰 Amount:', parsed.merchant.amount || 'Not set');
        console.log('✅ Valid CRC16:', parsed.isValid);
      } catch (parseError) {
        console.log('❌ Custom parser failed:', parseError.message);
      }
      
    } catch (jimpError) {
      console.log('❌ Jimp method also failed:', jimpError.message);
    }
  }
  
  // Method 3: Check image properties
  try {
    console.log('📐 Method 3: Checking image properties...');
    const image = await Jimp.read(filePath);
    console.log('📏 Image size:', `${image.bitmap.width}x${image.bitmap.height}`);
    console.log('🎨 Color type:', image.bitmap.colorType);
    
    // Check if image is too small or has quality issues
    if (image.bitmap.width < 200 || image.bitmap.height < 200) {
      console.log('⚠️ WARNING: Image might be too small for reliable scanning');
    }
    
  } catch (imageError) {
    console.log('❌ Image analysis failed:', imageError.message);
  }
}

async function readQRWithJimp(imagePath) {
  return new Promise((resolve, reject) => {
    Jimp.read(imagePath, (err, image) => {
      if (err) {
        reject(err);
        return;
      }
      
      const qr = new QrReader();
      qr.callback = (err, value) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(value.result);
      };
      
      qr.decode(image.bitmap);
    });
  });
}

async function testQRISValidity() {
  console.log('\n🧪 === TESTING QRIS DATA VALIDITY ===\n');
  
  // Test known valid QRIS
  const parser = new QRISParser();
  
  // Generate a test QRIS
  const testResult = parser.generatePaymentQRIS(
    "00020101021226370014ID.CO.QRIS.WWW0118ID10233046725965204599953033605802ID5919ES TEH WARGA BANTEN6007JAKARTA62070703A0163048344",
    100000,
    2500
  );
  
  if (testResult.success) {
    console.log('✅ Test QRIS generated successfully');
    console.log('📝 QRIS Data:', testResult.qrisData);
    console.log('🔍 Valid CRC16:', testResult.isValid);
    console.log('💰 Total Amount:', testResult.totalAmount);
    
    // Test if this QRIS can be validated by my-qris
    try {
      const qrisInfo = getInfo(testResult.qrisData);
      console.log('✅ Test QRIS validates with my-qris');
      console.log('📊 Info:', JSON.stringify(qrisInfo, null, 2));
    } catch (error) {
      console.log('❌ Test QRIS fails my-qris validation:', error.message);
      console.log('🔍 This might be why QR codes are not scannable');
    }
  }
}

async function main() {
  console.log('🚀 === QR CODE SCANNING DIAGNOSIS ===\n');
  
  await analyzeGeneratedQR();
  await testQRISValidity();
  
  console.log('\n🎯 === RECOMMENDATIONS ===');
  console.log('1. Check if generated QRIS data is valid');
  console.log('2. Ensure QR code image quality is sufficient');
  console.log('3. Verify CRC16 checksum is correct');
  console.log('4. Test with different QR scanning apps');
  console.log('5. Consider adjusting QR code generation parameters');
}

main().catch(console.error);