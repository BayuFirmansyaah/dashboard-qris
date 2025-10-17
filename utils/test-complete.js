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
  
  const stats = fs.statSync(imagePath);
  console.log('✅ File exists');
  console.log('📊 File size:', stats.size, 'bytes');
  console.log('📅 Modified:', stats.mtime);
  
  let qrisData = null;
  
  // Test 1: my-qris readQRCodeFromImage
  console.log('\n🔍 Test 1: my-qris readQRCodeFromImage');
  try {
    qrisData = await readQRCodeFromImage(imagePath);
    console.log('✅ Success! Length:', qrisData?.length);
    console.log('📝 Full QRIS:', qrisData);
    if (qrisData && qrisData.length > 50) {
      return qrisData;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('🔍 Error stack:', error.stack);
  }
  
  // Test 2: my-qris readQRCodeFromFile
  console.log('\n🔍 Test 2: my-qris readQRCodeFromFile');
  try {
    qrisData = await readQRCodeFromFile(imagePath);
    console.log('✅ Success! Length:', qrisData?.length);
    console.log('📝 Full QRIS:', qrisData);
    if (qrisData && qrisData.length > 50) {
      return qrisData;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('🔍 Error stack:', error.stack);
  }
  
  // Test 3: Jimp + qrcode-reader
  console.log('\n🔍 Test 3: Jimp + qrcode-reader');
  try {
    const image = await Jimp.read(imagePath);
    console.log('📐 Image loaded successfully');
    console.log('📏 Image dimensions:', image.getWidth(), 'x', image.getHeight());
    console.log('🎨 Image type:', image.getMIME());
    
    const qr = new QrCode();
    qrisData = await new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000);
      
      qr.callback = (err, value) => {
        if (err) {
          reject(err);
        } else if (value && value.result) {
          resolve(value.result);
        } else {
          reject(new Error('No QR code found'));
        }
      };
      
      qr.decode(image.bitmap);
    });
    
    console.log('✅ Success! Length:', qrisData?.length);
    console.log('📝 Full QRIS:', qrisData);
    if (qrisData && qrisData.length > 50) {
      return qrisData;
    }
  } catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('🔍 Error stack:', error.stack);
  }
  
  console.log('\n❌ All methods failed to read QR code');
  return null;
}

// Test function untuk validasi QRIS
function testQRISValidation(qrisString) {
  console.log('\n🧪 === TESTING QRIS VALIDATION ===');
  console.log('📝 QRIS Length:', qrisString?.length);
  console.log('🔤 QRIS Full String:', qrisString);
  
  if (!qrisString) {
    console.log('❌ QRIS string is null or undefined');
    return false;
  }
  
  // Test basic validation
  const isValidLength = qrisString.length >= 50;
  const startsWithQRIS = qrisString.startsWith('00020');
  const containsQRIS = qrisString.includes('ID.CO.QRIS');
  const containsStandardQRIS = qrisString.includes('ID.CO.QRIS.WWW');
  
  console.log('✅ Valid length (>=50):', isValidLength);
  console.log('✅ Starts with "00020":', startsWithQRIS);
  console.log('✅ Contains "ID.CO.QRIS":', containsQRIS);
  console.log('✅ Contains "ID.CO.QRIS.WWW":', containsStandardQRIS);
  
  // Extract merchant info manually
  console.log('\n🔍 Manual QRIS parsing:');
  try {
    // Look for merchant name (tag 59)
    const merchantMatch = qrisString.match(/59(\d{2})([^60]*)/);
    if (merchantMatch) {
      const length = parseInt(merchantMatch[1]);
      const merchantName = merchantMatch[2].substring(0, length);
      console.log('🏪 Merchant Name:', merchantName);
    }
    
    // Look for city (tag 60)
    const cityMatch = qrisString.match(/60(\d{2})([^61]*)/);
    if (cityMatch) {
      const length = parseInt(cityMatch[1]);
      const city = cityMatch[2].substring(0, length);
      console.log('🏙️ City:', city);
    }
    
  } catch (parseError) {
    console.log('⚠️ Manual parsing failed:', parseError.message);
  }
  
  return isValidLength && (startsWithQRIS || containsQRIS);
}

// Test function untuk makeQRPayment
async function testMakeQRPayment(qrisString, amount) {
  console.log('\n🧪 === TESTING MAKE QR PAYMENT ===');
  console.log('💰 Amount:', amount);
  console.log('📝 Input QRIS length:', qrisString?.length);
  
  const testCases = [
    { amount: amount, fee: 0, feeType: "fixed" },
    { amount: amount, fee: 0, feeType: "percentage" },
    { amount: amount }, // minimal parameters
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n🧪 Test case ${i + 1}:`, testCase);
    
    try {
      const paymentQRIS = makeQRPayment({
        qrCode: qrisString,
        ...testCase
      });
      
      console.log('✅ Payment QRIS created successfully!');
      console.log('📝 Payment QRIS Length:', paymentQRIS?.length);
      console.log('🔤 Payment QRIS Full:', paymentQRIS);
      return paymentQRIS;
      
    } catch (error) {
      console.log('❌ Failed:', error.message);
      console.log('🔍 Error stack:', error.stack);
      
      if (error.message.includes('Invalid') || error.message.includes('tidak valid')) {
        console.log('🔍 This seems to be a validation error from my-qris library');
        console.log('🔍 The QRIS format might not be supported by the library');
      }
    }
  }
  
  console.log('❌ All test cases failed');
  return null;
}

// Test function untuk mengecek available functions
function testAvailableFunctions() {
  console.log('\n🧪 === TESTING AVAILABLE FUNCTIONS ===');
  console.log('📚 Available functions in my-qris:');
  const functions = Object.keys(myQrisPackage);
  functions.forEach(fn => {
    console.log(`  - ${fn}: ${typeof myQrisPackage[fn]}`);
  });
  
  // Test if functions exist
  console.log('\n✅ Function availability:');
  console.log('  - makeQRPayment:', typeof makeQRPayment);
  console.log('  - readQRCodeFromImage:', typeof readQRCodeFromImage);
  console.log('  - readQRCodeFromFile:', typeof readQRCodeFromFile);
}

// Main test function
async function runTestWithFile() {
  console.log('🚀 === QRIS TESTING WITH ES TEH WARGA BANTEN ===\n');
  
  // Test available functions first
  testAvailableFunctions();
  
  // Check for uploaded files
  const uploadsDir = path.join(process.cwd(), 'uploads');
  let imagePath = null;
  
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir)
      .filter(f => f.toLowerCase().endsWith('.png') || f.toLowerCase().endsWith('.jpg') || f.toLowerCase().endsWith('.jpeg'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(uploadsDir, a));
        const statB = fs.statSync(path.join(uploadsDir, b));
        return statB.mtime - statA.mtime; // newest first
      });
    
    if (files.length > 0) {
      imagePath = path.join(uploadsDir, files[0]);
      console.log('📁 Using latest uploaded file:', files[0]);
    } else {
      console.log('📁 No image files found in uploads folder');
    }
  } else {
    console.log('📁 Uploads folder does not exist');
  }
  
  if (!imagePath) {
    console.log('❌ No image file available for testing');
    console.log('📝 Please upload a QRIS image through the web interface first');
    return;
  }
  
  // Step 1: Read QR Code
  console.log('\n='.repeat(60));
  const qrisData = await testReadQRCode(imagePath);
  if (!qrisData) {
    console.log('\n❌ Cannot proceed without valid QRIS data');
    return;
  }
  
  // Step 2: Validate QRIS
  console.log('\n='.repeat(60));
  const isValid = testQRISValidation(qrisData);
  if (!isValid) {
    console.log('\n⚠️ QRIS validation failed, but continuing with payment test...');
  }
  
  // Step 3: Test makeQRPayment
  console.log('\n='.repeat(60));
  const paymentQRIS = await testMakeQRPayment(qrisData, 123456);
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🎯 === TEST SUMMARY ===');
  console.log('✅ QR Code reading:', qrisData ? 'SUCCESS' : 'FAILED');
  console.log('✅ QRIS validation:', isValid ? 'SUCCESS' : 'FAILED');
  console.log('✅ Payment QRIS creation:', paymentQRIS ? 'SUCCESS' : 'FAILED');
  
  if (paymentQRIS) {
    console.log('\n🎉 === ALL TESTS PASSED ===');
    console.log('✅ The QRIS can be processed successfully');
  } else {
    console.log('\n❌ === SOME TESTS FAILED ===');
    console.log('❌ The QRIS might have compatibility issues with my-qris library');
  }
}

// Run the test
runTestWithFile().catch(console.error);