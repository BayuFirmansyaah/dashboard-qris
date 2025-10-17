import QRISParser from './qris-parser.js';

// Test custom QRIS parser
async function testCustomParser() {
  console.log('🧪 === TESTING CUSTOM QRIS PARSER ===\n');
  
  const parser = new QRISParser();
  
  // Test dengan sample QRIS yang bisa kita buat sendiri
  const sampleQRIS = "00020126580014ID.CO.QRIS.WWW0118ID10233046725960215ID.LINKAJA.WWW02150363050300000271630303UME51440014ID.CO.QRIS.WWW0118ID10233046725960208QRIS12345204512353033605802ID5918ES TEH WARGA BANTEN6007JAKARTA610561234462070703A0163041234";
  
  console.log('📝 Testing with sample QRIS:');
  console.log('🔤 QRIS:', sampleQRIS);
  console.log('📏 Length:', sampleQRIS.length);
  
  try {
    // Test parsing
    console.log('\n📖 Step 1: Parsing QRIS...');
    const parsed = parser.parseQRIS(sampleQRIS);
    
    console.log('📊 Parsed data:', JSON.stringify(parsed.parsed, null, 2));
    console.log('🏪 Merchant info:', JSON.stringify(parsed.merchant, null, 2));
    console.log('✅ Valid:', parsed.isValid);
    
    // Test CRC calculation
    console.log('\n🔍 Step 2: Testing CRC calculation...');
    const dataWithoutCRC = sampleQRIS.substr(0, sampleQRIS.length - 4);
    const providedCRC = sampleQRIS.substr(-4);
    const calculatedCRC = parser.calculateCRC16(dataWithoutCRC);
    
    console.log('🔤 Data without CRC:', dataWithoutCRC);
    console.log('📝 Provided CRC:', providedCRC);
    console.log('🧮 Calculated CRC:', calculatedCRC);
    console.log('✅ CRC Match:', providedCRC.toLowerCase() === calculatedCRC.toLowerCase());
    
    // Test payment generation
    console.log('\n💰 Step 3: Generating payment QRIS...');
    const paymentResult = parser.generatePaymentQRIS(sampleQRIS, 123456, 1000);
    
    console.log('📊 Payment result:', JSON.stringify(paymentResult, null, 2));
    
    if (paymentResult.success) {
      console.log('\n🎉 SUCCESS! Custom parser works correctly');
      
      // Test validasi payment QRIS
      const paymentValid = parser.validateQRIS(paymentResult.qrisData);
      console.log('✅ Payment QRIS valid:', paymentValid);
      
      return true;
    } else {
      console.log('\n❌ Payment generation failed');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing custom parser:', error.message);
    if (error.stack) {
      console.error('🔍 Stack trace:', error.stack);
    }
    return false;
  }
}

// Test dengan QRIS string minimal yang kita buat sendiri
async function testMinimalQRIS() {
  console.log('\n🔬 === TESTING MINIMAL QRIS ===\n');
  
  const parser = new QRISParser();
  
  // Buat QRIS minimal yang valid
  let minimalQRIS = '';
  
  // Format Indicator (00)
  minimalQRIS += '00' + '02' + '01';
  
  // Point of Initiation Method (01) 
  minimalQRIS += '01' + '02' + '12'; // 12 = static
  
  // Merchant Account Information (26)
  const merchantAccount = '0014ID.CO.QRIS.WWW0118ID1023304672596';
  minimalQRIS += '26' + merchantAccount.length.toString().padStart(2, '0') + merchantAccount;
  
  // Merchant Category Code (52)
  minimalQRIS += '52' + '04' + '5999';
  
  // Transaction Currency (53)
  minimalQRIS += '53' + '03' + '360';
  
  // Country Code (58)
  minimalQRIS += '58' + '02' + 'ID';
  
  // Merchant Name (59)
  const merchantName = 'ES TEH WARGA BANTEN';
  minimalQRIS += '59' + merchantName.length.toString().padStart(2, '0') + merchantName;
  
  // Merchant City (60)
  const merchantCity = 'JAKARTA';
  minimalQRIS += '60' + merchantCity.length.toString().padStart(2, '0') + merchantCity;
  
  // Additional Data Field Template (62)
  const additionalData = '0703A01';
  minimalQRIS += '62' + additionalData.length.toString().padStart(2, '0') + additionalData;
  
  // CRC placeholder
  minimalQRIS += '6304';
  
  // Calculate CRC
  const crc = parser.calculateCRC16(minimalQRIS);
  minimalQRIS = minimalQRIS.substr(0, minimalQRIS.length - 4) + '63' + '04' + crc;
  
  console.log('📝 Generated minimal QRIS:');
  console.log('🔤 QRIS:', minimalQRIS);
  console.log('📏 Length:', minimalQRIS.length);
  
  // Test dengan minimal QRIS
  try {
    const parsed = parser.parseQRIS(minimalQRIS);
    console.log('✅ Minimal QRIS parsed successfully');
    console.log('🏪 Merchant info:', JSON.stringify(parsed.merchant, null, 2));
    
    // Test payment generation
    const paymentResult = parser.generatePaymentQRIS(minimalQRIS, 50000, 500);
    console.log('💰 Payment result:', paymentResult.success ? 'SUCCESS' : 'FAILED');
    
    if (paymentResult.success) {
      console.log('✅ Payment QRIS valid:', parser.validateQRIS(paymentResult.qrisData));
    }
    
    return paymentResult.success;
    
  } catch (error) {
    console.error('❌ Error with minimal QRIS:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 === CUSTOM QRIS PARSER TESTS ===\n');
  
  const test1 = await testCustomParser();
  const test2 = await testMinimalQRIS();
  
  console.log('\n🎯 === FINAL RESULTS ===');
  console.log('✅ Sample QRIS test:', test1 ? 'PASSED' : 'FAILED');
  console.log('✅ Minimal QRIS test:', test2 ? 'PASSED' : 'FAILED');
  
  if (test1 || test2) {
    console.log('\n🎉 Custom parser works! Ready to use as fallback.');
  } else {
    console.log('\n❌ Custom parser needs fixes.');
  }
}

main().catch(console.error);