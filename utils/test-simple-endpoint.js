// Test simple endpoint
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testSimpleEndpoint() {
  console.log('🧪 === TESTING SIMPLE ENDPOINT ===\n');
  
  // Create test QRIS file
  const testQRISContent = "00020101021126710024ID.CO.MANDIRISYARIAH.WWW0118936004510000003986021000000039860303URE51440014ID.CO.QRIS.WWW0115936004510000003985204599953033605802ID5918MASJID JABAL ARAFAH6005BATAM62070703A01630471E8";
  
  const testFile = 'test-qris-simple.txt';
  fs.writeFileSync(testFile, testQRISContent);
  
  try {
    const formData = new FormData();
    formData.append('qrisImage', fs.createReadStream(testFile));
    formData.append('amount', '50000');
    formData.append('adminFee', '2500');
    
    console.log('🌐 Sending request to /simple-payment...');
    
    const response = await fetch('http://localhost:3000/simple-payment', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Body:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SUCCESS! Simple endpoint working!');
      console.log('✅ QR code data URL generated');
      console.log('✅ Payment QRIS created with my-qris library');
      console.log('💰 Total amount:', result.totalAmount);
    } else {
      console.log('\n❌ FAILED:', result.message);
      console.log('📝 Details:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
}

testSimpleEndpoint().catch(console.error);