// Test generate-payment endpoint
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testGeneratePayment() {
  console.log('🧪 === TESTING /generate-payment ENDPOINT ===\n');
  
  // Create a dummy image file for testing
  const testImagePath = 'test-qris-temp.txt';
  fs.writeFileSync(testImagePath, 'dummy qris content for testing');
  
  try {
    const formData = new FormData();
    formData.append('qrisImage', fs.createReadStream(testImagePath));
    formData.append('amount', '75000');
    formData.append('fee', '2500');
    formData.append('feeType', 'fixed');
    
    console.log('🌐 Sending request to /generate-payment...');
    console.log('💰 Amount: 75000');
    console.log('🔧 Fee: 2500 (fixed)');
    
    const response = await fetch('http://localhost:3000/generate-payment', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('\n📊 Response:');
    console.log('🔢 Status:', response.status);
    console.log('📋 Body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SUCCESS!');
      console.log('✅ Payment QRIS generated');
      console.log('✅ File saved:', result.data.filename);
      console.log('✅ Download URL:', result.data.downloadUrl);
      console.log('✅ QR code data URL length:', result.data.qrCodeData?.length || 0);
    } else {
      console.log('\n❌ FAILED:', result.message);
      console.log('📝 Details:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
  }
}

// Test dengan real scenario
async function testRealScenario() {
  console.log('\n🎯 === REAL SCENARIO TEST ===\n');
  
  console.log('📝 Expected flow:');
  console.log('1. User uploads QRIS image');
  console.log('2. Server reads QRIS from image');
  console.log('3. Server generates payment QRIS with amount & fee');
  console.log('4. Server creates QR image and saves to public folder');
  console.log('5. Server returns download URL to user');
  
  await testGeneratePayment();
}

testRealScenario().catch(console.error);