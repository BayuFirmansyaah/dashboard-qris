// Test generate-payment endpoint on port 3001
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';

async function testNewEndpoint() {
  console.log('🧪 === TESTING NEW ENDPOINT ON PORT 3001 ===\n');
  
  // Create a sample QRIS image content
  const sampleQRIS = "00020101021126710024ID.CO.MANDIRISYARIAH.WWW0118936004510000003986021000000039860303URE51440014ID.CO.QRIS.WWW0115936004510000003985204599953033605802ID5918MASJID JABAL ARAFAH6005BATAM62070703A01630471E8";
  
  // Create temporary file
  const testFile = 'temp-qris-test.txt';
  fs.writeFileSync(testFile, sampleQRIS);
  
  try {
    const formData = new FormData();
    formData.append('qrisImage', fs.createReadStream(testFile), 'test-qris.txt');
    formData.append('amount', '25000');
    formData.append('fee', '1000');
    formData.append('feeType', 'fixed');
    
    console.log('🌐 Testing endpoint: http://localhost:3001/generate-payment');
    console.log('💰 Amount: 25000');
    console.log('🔧 Fee: 1000 (fixed)');
    
    const response = await fetch('http://localhost:3001/generate-payment', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('\n📊 Response:');
    console.log('🔢 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n🎉 SUCCESS!');
      console.log('✅ File uploaded to public folder');
      console.log('✅ QR read from HTTP URL');
      console.log('✅ Payment QRIS generated');
      console.log('✅ QR image saved');
      console.log('📱 Access uploaded file at: http://localhost:3001/uploads/' + result.data.uploadedFile);
      console.log('📥 Download QR at: http://localhost:3001' + result.data.downloadUrl);
    } else {
      console.log('\n❌ FAILED:', result.message);
      console.log('📝 Details:', result.details);
    }
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  }
}

testNewEndpoint().catch(console.error);