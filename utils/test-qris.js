import myQrisPackage from "my-qris";
import Jimp from 'jimp';
import QrCode from 'qrcode-reader';
import path from 'path';
import fs from 'fs';

const { makeQRPayment, readQRCodeFromImage, readQRCodeFromFile } = myQrisPackage;

// Test function untuk membaca QR code
async function testReadQRCode(imagePath) {
  console.log('🧪 === TESTING QR CODE READING ===');
  console.log('📁 Image path:', imagePath);
  
  if (!fs.existsSync(imagePath)) {
    console.log('❌ File not found:', imagePath);
    return null;
  }
  
  console.log('✅ File exists, size:', fs.statSync(imagePath).size, 'bytes');
  
  let qrisData = null;
  
  // Test 1: my-qris readQRCodeFromImage
  console.log('\n🔍 Test 1: my-qris readQRCodeFromImage');
  try {
    qrisData = await readQRCodeFromImage(imagePath);
    console.log('✅ Success! Length:', qrisData?.length);
    console.log('📝 Preview:', qrisData?.substring(0, 100) + '...');
    if (qrisData && qrisData.length > 50) {
      return qrisData;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  // Test 2: my-qris readQRCodeFromFile
  console.log('\n🔍 Test 2: my-qris readQRCodeFromFile');
  try {
    qrisData = await readQRCodeFromFile(imagePath);
    console.log('✅ Success! Length:', qrisData?.length);
    console.log('📝 Preview:', qrisData?.substring(0, 100) + '...');
    if (qrisData && qrisData.length > 50) {
      return qrisData;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  // Test 3: Jimp + qrcode-reader
  console.log('\n🔍 Test 3: Jimp + qrcode-reader');
  try {
    const image = await Jimp.read(imagePath);
    console.log('📐 Image size:', image.getWidth(), 'x', image.getHeight());
    
    const qr = new QrCode();
    qrisData = await new Promise((resolve, reject) => {
      qr.callback = (err, value) => {
        if (err) {
          reject(err);
        } else {
          resolve(value?.result);
        }
      };
      qr.decode(image.bitmap);
    });
    
    console.log('✅ Success! Length:', qrisData?.length);
    console.log('📝 Preview:', qrisData?.substring(0, 100) + '...');
    if (qrisData && qrisData.length > 50) {
      return qrisData;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
  }
  
  console.log('\n❌ All methods failed to read QR code');
  return null;
}

// Test function untuk validasi QRIS
function testQRISValidation(qrisString) {
  console.log('\n🧪 === TESTING QRIS VALIDATION ===');
  console.log('📝 QRIS Length:', qrisString?.length);
  console.log('🔤 QRIS Preview:', qrisString?.substring(0, 150));
  
  // Test basic validation
  const isValidLength = qrisString && qrisString.length >= 50;
  const startsWithQRIS = qrisString && qrisString.startsWith('00020');
  const containsQRIS = qrisString && qrisString.includes('ID.CO.QRIS');
  
  console.log('✅ Valid length (>=50):', isValidLength);
  console.log('✅ Starts with "00020":', startsWithQRIS);
  console.log('✅ Contains "ID.CO.QRIS":', containsQRIS);
  
  return isValidLength && (startsWithQRIS || containsQRIS);
}

// Test function untuk makeQRPayment
async function testMakeQRPayment(qrisString, amount) {
  console.log('\n🧪 === TESTING MAKE QR PAYMENT ===');
  console.log('💰 Amount:', amount);
  
  try {
    const paymentQRIS = makeQRPayment({
      qrCode: qrisString,
      amount: amount,
      fee: 0,
      feeType: "fixed"
    });
    
    console.log('✅ Payment QRIS created successfully!');
    console.log('📝 Payment QRIS Length:', paymentQRIS?.length);
    console.log('🔤 Payment QRIS Preview:', paymentQRIS?.substring(0, 150));
    return paymentQRIS;
    
  } catch (error) {
    console.log('❌ Failed to create payment QRIS:', error.message);
    console.log('🔍 Error details:', error);
    return null;
  }
}

// Main test function
async function runTest() {
  console.log('🚀 === QRIS TESTING STARTED ===\n');
  
  // Test dengan file sample (jika ada)
  const testImagePath = path.join(process.cwd(), 'test-qris.png');
  
  // Atau gunakan file dari uploads folder jika ada
  const uploadsDir = path.join(process.cwd(), 'uploads');
  let imagePath = testImagePath;
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
    if (files.length > 0) {
      imagePath = path.join(uploadsDir, files[files.length - 1]); // Use latest file
      console.log('📁 Using latest uploaded file:', files[files.length - 1]);
    }
  }
  
  // Step 1: Read QR Code
  const qrisData = await testReadQRCode(imagePath);
  if (!qrisData) {
    console.log('\n❌ Cannot proceed without valid QRIS data');
    return;
  }
  
  // Step 2: Validate QRIS
  const isValid = testQRISValidation(qrisData);
  if (!isValid) {
    console.log('\n❌ QRIS validation failed');
    return;
  }
  
  // Step 3: Test makeQRPayment
  const paymentQRIS = await testMakeQRPayment(qrisData, 123456);
  if (!paymentQRIS) {
    console.log('\n❌ Failed to create payment QRIS');
    return;
  }
  
  console.log('\n🎉 === ALL TESTS PASSED ===');
  console.log('✅ QR Code reading: SUCCESS');
  console.log('✅ QRIS validation: SUCCESS');
  console.log('✅ Payment QRIS creation: SUCCESS');
}

// Jalankan test
runTest().catch(console.error);