// Test dengan QRIS yang valid dari dokumentasi my-qris
import myQrisPackage from "my-qris";

const { makeQRPayment, generateQRDataUrl } = myQrisPackage;

async function testWithValidQRIS() {
  console.log('🧪 === TESTING WITH PROPER QRIS ===\n');
  
  // Mari kita buat QRIS yang minimal dan valid
  // Berdasarkan standar QRIS Indonesia
  
  const testCases = [
    {
      name: "Minimal QRIS",
      qris: "00020101021229300012ID.LINKAJA.WWW0118936009990000000205204599953033605802ID5909Test Merch6007Jakarta61051234562070703A016304A61C"
    },
    {
      name: "Standard QRIS Format",
      qris: "00020101021226280009ID.CO.QRIS0118936002030000000352045999530336058021D5913Coffee Shop6007Jakarta62070703A01630440C1"
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: ${testCase.name}`);
    console.log(`🔤 QRIS: ${testCase.qris}`);
    console.log(`📏 Length: ${testCase.qris.length}`);
    
    try {
      // Test makeQRPayment
      const paymentQRIS = makeQRPayment({
        qrCode: testCase.qris,
        amount: 50000,
        fee: 0,
        feeType: "fixed"
      });
      
      console.log('✅ makeQRPayment succeeded!');
      console.log(`📝 Payment QRIS: ${paymentQRIS}`);
      console.log(`📏 Payment length: ${paymentQRIS.length}`);
      
      // Test generateQRDataUrl
      const qrDataUrl = await generateQRDataUrl(paymentQRIS);
      console.log('✅ generateQRDataUrl succeeded!');
      console.log(`📱 QR Data URL length: ${qrDataUrl.length}`);
      
      console.log(`🎉 ${testCase.name} - ALL TESTS PASSED!`);
      return { success: true, paymentQRIS, qrDataUrl };
      
    } catch (error) {
      console.log(`❌ ${testCase.name} failed: ${error.message}`);
    }
  }
  
  return { success: false };
}

// Backup: Generate a simple valid QRIS manually
function generateSimpleValidQRIS() {
  console.log('\n🔧 === GENERATING SIMPLE VALID QRIS ===\n');
  
  // Build QRIS manually dengan CRC yang benar
  let qris = '';
  
  // Payload Format Indicator
  qris += '00' + '02' + '01';
  
  // Point of Initiation Method
  qris += '01' + '02' + '11'; // 11 = static QR
  
  // Merchant Account Information - simplified
  const merchantAccount = '0012ID.CO.QRIS0118936000000000001';
  qris += '26' + merchantAccount.length.toString().padStart(2, '0') + merchantAccount;
  
  // Merchant Category Code
  qris += '52' + '04' + '5999';
  
  // Transaction Currency (IDR)
  qris += '53' + '03' + '360';
  
  // Country Code
  qris += '58' + '02' + 'ID';
  
  // Merchant Name
  const merchantName = 'Test Merchant';
  qris += '59' + merchantName.length.toString().padStart(2, '0') + merchantName;
  
  // Merchant City
  const merchantCity = 'Jakarta';
  qris += '60' + merchantCity.length.toString().padStart(2, '0') + merchantCity;
  
  // Additional Data Field Template
  const additionalData = '0703A01';
  qris += '62' + additionalData.length.toString().padStart(2, '0') + additionalData;
  
  // CRC16 placeholder
  qris += '6304';
  
  console.log('🔤 Generated QRIS (without CRC):', qris);
  console.log('📏 Length:', qris.length);
  
  // Calculate CRC16 (simple implementation)
  const crcData = qris;
  let crc = 0xFFFF;
  
  for (let i = 0; i < crcData.length; i++) {
    crc ^= crcData.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  const crcHex = crc.toString(16).toUpperCase().padStart(4, '0');
  qris = qris.substr(0, qris.length - 4) + '63' + '04' + crcHex;
  
  console.log('🧮 Calculated CRC16:', crcHex);
  console.log('🔤 Final QRIS:', qris);
  console.log('📏 Final length:', qris.length);
  
  return qris;
}

async function main() {
  console.log('🚀 === QRIS VALIDATION TESTING ===\n');
  
  // Test 1: Try with known formats
  const result = await testWithValidQRIS();
  
  if (!result.success) {
    console.log('\n🔧 Trying to generate a simple valid QRIS...');
    const generatedQRIS = generateSimpleValidQRIS();
    
    try {
      console.log('\n🧪 Testing generated QRIS...');
      const paymentQRIS = makeQRPayment({
        qrCode: generatedQRIS,
        amount: 25000,
        fee: 0,
        feeType: "fixed"
      });
      
      console.log('✅ Generated QRIS works!');
      console.log('📝 Payment QRIS:', paymentQRIS);
      
      const qrDataUrl = await generateQRDataUrl(paymentQRIS);
      console.log('✅ QR image generated successfully!');
      
    } catch (error) {
      console.log('❌ Generated QRIS also failed:', error.message);
    }
  }
  
  console.log('\n🎯 === CONCLUSION ===');
  if (result.success) {
    console.log('✅ Found working QRIS format');
    console.log('✅ my-qris library functions correctly');
    console.log('✅ Issue resolved - use proper QRIS format');
  } else {
    console.log('❌ All QRIS formats failed CRC16 validation');
    console.log('💡 Recommendation: Use real QRIS from actual merchants');
  }
}

main().catch(console.error);