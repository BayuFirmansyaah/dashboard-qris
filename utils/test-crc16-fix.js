import QRISParser from './qris-parser.js';
import myQrisPackage from "my-qris";

const { getInfo } = myQrisPackage;

async function testCRC16Fix() {
  console.log('🔧 === TESTING CRC16 FIX ===\n');
  
  const parser = new QRISParser();
  
  // Test dengan QRIS yang diketahui valid
  const knownValidQRIS = "00020101021126710024ID.CO.MANDIRISYARIAH.WWW0118936004510000003986021000000039860303URE51440014ID.CO.QRIS.WWW0115936004510000003985204599953033605802ID5918MASJID JABAL ARAFAH6005BATAM62070703A01630471E8";
  
  console.log('📝 Testing known valid QRIS...');
  console.log('🔤 QRIS:', knownValidQRIS);
  
  // Test CRC validation
  const isValid = parser.validateQRIS(knownValidQRIS);
  console.log('✅ Is valid (custom parser):', isValid);
  
  // Test dengan my-qris
  try {
    const qrisInfo = getInfo(knownValidQRIS);
    console.log('✅ Valid with my-qris too!');
    console.log('📊 Info:', JSON.stringify(qrisInfo, null, 2));
  } catch (error) {
    console.log('❌ Still invalid with my-qris:', error.message);
  }
  
  // Generate new payment QRIS
  console.log('\n💰 Generating payment QRIS...');
  const paymentResult = parser.generatePaymentQRIS(knownValidQRIS, 50000, 1000);
  
  if (paymentResult.success) {
    console.log('✅ Payment QRIS generated');
    console.log('📝 New QRIS:', paymentResult.qrisData);
    console.log('🔍 Valid (custom):', paymentResult.isValid);
    
    // Test dengan my-qris
    try {
      const newQrisInfo = getInfo(paymentResult.qrisData);
      console.log('🎉 NEW QRIS VALIDATES WITH MY-QRIS!');
      console.log('📊 Payment Info:', JSON.stringify(newQrisInfo, null, 2));
      return true;
    } catch (error) {
      console.log('❌ New QRIS still fails my-qris:', error.message);
      
      // Debug: show CRC details
      const dataWithoutCRC = paymentResult.qrisData.substr(0, paymentResult.qrisData.length - 4);
      const providedCRC = paymentResult.qrisData.substr(-4);
      const calculatedCRC = parser.calculateCRC16(dataWithoutCRC);
      
      console.log('🔍 Debug CRC:');
      console.log('   Data:', dataWithoutCRC);
      console.log('   Provided:', providedCRC);
      console.log('   Calculated:', calculatedCRC);
      
      return false;
    }
  } else {
    console.log('❌ Failed to generate payment QRIS:', paymentResult.error);
    return false;
  }
}

// Test dengan implementasi CRC16 alternatif
function testAlternativeCRC16() {
  console.log('\n🧪 === TESTING ALTERNATIVE CRC16 IMPLEMENTATIONS ===\n');
  
  const testData = "00020101021126710024ID.CO.MANDIRISYARIAH.WWW0118936004510000003986021000000039860303URE51440014ID.CO.QRIS.WWW0115936004510000003985204599953033605802ID5918MASJID JABAL ARAFAH6005BATAM62070703A016304";
  const expectedCRC = "71E8";
  
  console.log('🔤 Test data:', testData);
  console.log('📝 Expected CRC:', expectedCRC);
  
  // Method 1: Current implementation
  const parser = new QRISParser();
  const crc1 = parser.calculateCRC16(testData);
  console.log('🧮 Method 1 (current):', crc1);
  
  // Method 2: Alternative implementation
  function calculateCRC16Alt(data) {
    let crc = 0xFFFF;
    const bytes = Buffer.from(data, 'utf8');
    
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if (crc & 1) {
          crc = (crc >>> 1) ^ 0x8408;
        } else {
          crc = crc >>> 1;
        }
      }
    }
    
    // Different way to handle final result
    crc = ~crc & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  
  const crc2 = calculateCRC16Alt(testData);
  console.log('🧮 Method 2 (alt):', crc2);
  
  // Method 3: With byte swapping
  function calculateCRC16Swap(data) {
    let crc = 0xFFFF;
    const bytes = Buffer.from(data, 'utf8');
    
    for (const byte of bytes) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) {
        if (crc & 1) {
          crc = (crc >>> 1) ^ 0x8408;
        } else {
          crc = crc >>> 1;
        }
      }
    }
    
    crc = ~crc & 0xFFFF;
    // Swap high and low bytes
    const swapped = ((crc << 8) | (crc >>> 8)) & 0xFFFF;
    return swapped.toString(16).toUpperCase().padStart(4, '0');
  }
  
  const crc3 = calculateCRC16Swap(testData);
  console.log('🧮 Method 3 (swap):', crc3);
  
  console.log('\n🎯 Results:');
  console.log(`Expected: ${expectedCRC}`);
  console.log(`Method 1: ${crc1} ${crc1 === expectedCRC ? '✅' : '❌'}`);
  console.log(`Method 2: ${crc2} ${crc2 === expectedCRC ? '✅' : '❌'}`);
  console.log(`Method 3: ${crc3} ${crc3 === expectedCRC ? '✅' : '❌'}`);
  
  // Return the correct method
  if (crc1 === expectedCRC) return 1;
  if (crc2 === expectedCRC) return 2;
  if (crc3 === expectedCRC) return 3;
  return 0;
}

async function main() {
  console.log('🚀 === CRC16 DEBUGGING ===\n');
  
  const correctMethod = testAlternativeCRC16();
  
  if (correctMethod > 0) {
    console.log(`\n✅ Found correct CRC16 method: ${correctMethod}`);
    
    if (correctMethod !== 1) {
      console.log('🔧 Need to update custom parser with correct CRC16 implementation');
    }
    
    const success = await testCRC16Fix();
    if (success) {
      console.log('\n🎉 CRC16 FIXED! QR codes should now be scannable!');
    } else {
      console.log('\n❌ Still having CRC16 issues');
    }
  } else {
    console.log('\n❌ None of the CRC16 methods match expected result');
    console.log('🔍 Need to investigate QRIS CRC16 standard further');
  }
}

main().catch(console.error);