// Test server dengan custom parser
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testServerWithCustomParser() {
  console.log('🧪 === TESTING SERVER WITH CUSTOM PARSER ===\n');
  
  // Create a minimal test QRIS image
  console.log('📝 Creating test QRIS image...');
  
  // Buat QRIS string yang valid menggunakan custom parser
  const validQRIS = "00020101021226370014ID.CO.QRIS.WWW0118ID10233046725965204599953033605802ID5919ES TEH WARGA BANTEN6007JAKARTA62070703A0163048344";
  
  console.log('🔤 Test QRIS:', validQRIS);
  console.log('📏 Length:', validQRIS.length);
  
  // Create a simple text file dengan QRIS string (simulasi QR image)
  const testFilePath = path.join(process.cwd(), 'test-qris.txt');
  fs.writeFileSync(testFilePath, validQRIS);
  
  try {
    // Test endpoint
    const formData = new FormData();
    formData.append('qrisImage', fs.createReadStream(testFilePath));
    formData.append('amount', '100000');
    formData.append('adminFee', '2500');
    
    console.log('🌐 Testing server endpoint...');
    console.log('💰 Amount: Rp 100.000');
    console.log('🏦 Admin Fee: Rp 2.500');
    
    const response = await fetch('http://localhost:3000/auto-extract', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    console.log('\n📊 Server Response:');
    console.log('🔢 Status:', response.status);
    console.log('📋 Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ SUCCESS! Server dengan custom parser bekerja!');
      
      if (result.downloadUrl) {
        console.log('📥 Download URL:', result.downloadUrl);
      }
      
      if (result.qrCodeData) {
        console.log('📱 QR Code generated successfully');
      }
      
      return true;
    } else {
      console.log('\n❌ Server returned error:', result.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing server:', error.message);
    return false;
  } finally {
    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Cleaned up test file');
    }
  }
}

async function testRealScenario() {
  console.log('\n🎯 === TESTING REAL SCENARIO ===\n');
  
  console.log('💡 Simulasi skenario real:');
  console.log('1. User upload QRIS "ES TEH WARGA BANTEN"');
  console.log('2. my-qris library gagal dengan "QRIS asli tidak dapat digunakan"');
  console.log('3. Custom parser mengambil alih');
  console.log('4. Payment QRIS berhasil dibuat');
  
  const result = await testServerWithCustomParser();
  
  if (result) {
    console.log('\n🎉 SOLVED! Masalah "QRIS asli tidak dapat digunakan" sudah teratasi!');
    console.log('✅ Custom parser berhasil menangani QRIS yang tidak support di my-qris');
    console.log('✅ User sekarang bisa menggunakan QRIS apapun untuk generate payment');
  } else {
    console.log('\n❌ Masih ada masalah yang perlu diperbaiki');
  }
}

testRealScenario().catch(console.error);