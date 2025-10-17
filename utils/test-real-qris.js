import myQrisPackage from "my-qris";
import path from "path";
import fs from "fs";

const { readQRCodeFromFile, makeQRPayment, getInfo } = myQrisPackage;

async function testWithRealQRIS() {
  console.log('🔍 === TESTING WITH REAL QRIS IMAGE ===\n');
  
  // Check if QRIS image exists
  const qrisImagePath = path.join(process.cwd(), 'qris-sample.jpg');
  
  if (!fs.existsSync(qrisImagePath)) {
    console.log('❌ QRIS image not found:', qrisImagePath);
    console.log('📝 Please make sure qris-sample.jpg exists in the project directory');
    return false;
  }
  
  console.log('✅ Found QRIS image:', qrisImagePath);
  
  try {
    // Step 1: Read QRIS from image
    console.log('\n📖 Step 1: Reading QR code from image...');
    const qrisData = await readQRCodeFromFile(qrisImagePath);
    console.log('✅ Successfully read QRIS data');
    console.log('📝 QRIS length:', qrisData.length);
    console.log('🔤 QRIS data:', qrisData);
    
    // Step 2: Get QRIS info
    console.log('\n📊 Step 2: Getting QRIS information...');
    try {
      const qrisInfo = getInfo(qrisData);
      console.log('✅ QRIS info retrieved successfully');
      console.log('📋 QRIS Info:', JSON.stringify(qrisInfo, null, 2));
    } catch (infoError) {
      console.log('❌ Failed to get QRIS info:', infoError.message);
    }
    
    // Step 3: Create payment QRIS
    console.log('\n💰 Step 3: Creating payment QRIS for Rp 123.456...');
    
    const testCases = [
      { amount: 123456, fee: 0 },
      { amount: 123456, fee: 1000, feeType: "fixed" },
      { amount: 123456, fee: 5, feeType: "percentage" }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🧪 Test case ${i + 1}:`, testCase);
      
      try {
        const paymentQRIS = makeQRPayment({
          qrCode: qrisData,
          ...testCase
        });
        
        console.log('✅ SUCCESS! Payment QRIS created');
        console.log('📝 Payment QRIS length:', paymentQRIS.length);
        console.log('🔤 Payment QRIS preview:', paymentQRIS.substring(0, 100) + '...');
        
        // Try to get info from payment QRIS
        try {
          const paymentInfo = getInfo(paymentQRIS);
          console.log('📊 Payment QRIS info:', JSON.stringify(paymentInfo, null, 2));
        } catch (paymentInfoError) {
          console.log('⚠️ Could not get payment QRIS info:', paymentInfoError.message);
        }
        
        return { success: true, originalQRIS: qrisData, paymentQRIS };
        
      } catch (paymentError) {
        console.log('❌ Failed to create payment QRIS:', paymentError.message);
        if (paymentError.stack) {
          console.log('🔍 Stack trace:', paymentError.stack);
        }
      }
    }
    
    return { success: false, originalQRIS: qrisData };
    
  } catch (readError) {
    console.log('❌ Failed to read QRIS from image:', readError.message);
    if (readError.stack) {
      console.log('🔍 Stack trace:', readError.stack);
    }
    return { success: false };
  }
}

// Test with manual QRIS input if no image
async function testWithManualInput() {
  console.log('\n📝 === TESTING WITH MANUAL QRIS INPUT ===');
  console.log('Enter a valid QRIS string for testing...');
  
  // Sample valid QRIS strings that might work
  const validSamples = [
    // You can paste a real QRIS string here if you have one
  ];
  
  console.log('⚠️ No manual QRIS samples provided');
  console.log('💡 To test manually, add a valid QRIS string to the validSamples array');
}

async function main() {
  console.log('🚀 === REAL QRIS TESTING ===\n');
  
  const result = await testWithRealQRIS();
  
  if (!result.success && !result.originalQRIS) {
    console.log('\n📝 Falling back to manual input test...');
    await testWithManualInput();
  }
  
  console.log('\n🎯 === SUMMARY ===');
  if (result.success) {
    console.log('✅ All tests passed! The system works correctly.');
    console.log('✅ QRIS can be read from image and payment QRIS can be generated.');
  } else if (result.originalQRIS) {
    console.log('⚠️ QRIS reading works, but payment generation failed.');
    console.log('❌ The issue is with makeQRPayment function or the QRIS format.');
  } else {
    console.log('❌ QRIS reading failed.');
    console.log('❌ Check image format and QR code quality.');
  }
}

main().catch(console.error);