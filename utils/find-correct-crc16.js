// Implementasi CRC16-CCITT yang benar untuk QRIS
function calculateQRISCRC16(data) {
  let crc = 0xFFFF;
  const bytes = Buffer.from(data, 'utf8');
  
  for (const byte of bytes) {
    crc ^= (byte << 8);
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
    crc &= 0xFFFF;
  }
  
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Test dengan data yang diketahui
function testQRISCRC16() {
  console.log('🧪 === TESTING QRIS CRC16 IMPLEMENTATION ===\n');
  
  const testData = "00020101021126710024ID.CO.MANDIRISYARIAH.WWW0118936004510000003986021000000039860303URE51440014ID.CO.QRIS.WWW0115936004510000003985204599953033605802ID5918MASJID JABAL ARAFAH6005BATAM62070703A016304";
  const expectedCRC = "71E8";
  
  console.log('🔤 Test data length:', testData.length);
  console.log('📝 Expected CRC:', expectedCRC);
  
  const calculatedCRC = calculateQRISCRC16(testData);
  console.log('🧮 Calculated CRC:', calculatedCRC);
  console.log('✅ Match:', calculatedCRC === expectedCRC);
  
  return calculatedCRC === expectedCRC;
}

// Test dengan beberapa implementasi CRC16 lainnya
function testVariousImplementations() {
  console.log('\n🔬 === TESTING VARIOUS CRC16 IMPLEMENTATIONS ===\n');
  
  const testData = "00020101021126710024ID.CO.MANDIRISYARIAH.WWW0118936004510000003986021000000039860303URE51440014ID.CO.QRIS.WWW0115936004510000003985204599953033605802ID5918MASJID JABAL ARAFAH6005BATAM62070703A016304";
  const expectedCRC = "71E8";
  
  // Implementation 1: CRC16-CCITT (Standard)
  function crc16_ccitt(data) {
    let crc = 0xFFFF;
    const bytes = Buffer.from(data, 'utf8');
    
    for (const byte of bytes) {
      crc ^= (byte << 8);
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
      crc &= 0xFFFF;
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  
  // Implementation 2: CRC16-CCITT with different init
  function crc16_ccitt_0000(data) {
    let crc = 0x0000;
    const bytes = Buffer.from(data, 'utf8');
    
    for (const byte of bytes) {
      crc ^= (byte << 8);
      for (let i = 0; i < 8; i++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
      crc &= 0xFFFF;
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  
  // Implementation 3: CRC16-CCITT FALSE
  function crc16_ccitt_false(data) {
    let crc = 0xFFFF;
    const bytes = Buffer.from(data, 'utf8');
    
    for (const byte of bytes) {
      let temp = (crc >>> 8) ^ byte;
      crc = (crc << 8) ^ crcTable[temp];
      crc &= 0xFFFF;
    }
    
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }
  
  // CRC table for implementation 3
  const crcTable = [
    0x0000, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
    0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
    0x1231, 0x0210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
    0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de
  ];
  
  // Generate full CRC table
  for (let i = 32; i < 256; i++) {
    let temp = i << 8;
    for (let j = 0; j < 8; j++) {
      if (temp & 0x8000) {
        temp = (temp << 1) ^ 0x1021;
      } else {
        temp = temp << 1;
      }
    }
    crcTable[i] = temp & 0xFFFF;
  }
  
  const results = [
    { name: 'CRC16-CCITT (0xFFFF)', result: crc16_ccitt(testData) },
    { name: 'CRC16-CCITT (0x0000)', result: crc16_ccitt_0000(testData) },
    { name: 'CRC16-CCITT FALSE', result: crc16_ccitt_false(testData) }
  ];
  
  console.log('📊 Results:');
  results.forEach((impl, index) => {
    const isMatch = impl.result === expectedCRC;
    console.log(`${index + 1}. ${impl.name}: ${impl.result} ${isMatch ? '✅' : '❌'}`);
    if (isMatch) {
      console.log(`   🎉 FOUND CORRECT IMPLEMENTATION: ${impl.name}`);
    }
  });
  
  return results.find(impl => impl.result === expectedCRC);
}

// Main test function
async function main() {
  console.log('🚀 === FINDING CORRECT QRIS CRC16 ===\n');
  
  const basicTest = testQRISCRC16();
  console.log(`\nBasic test result: ${basicTest ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (!basicTest) {
    const correctImpl = testVariousImplementations();
    
    if (correctImpl) {
      console.log(`\n🎯 SOLUTION FOUND: Use ${correctImpl.name} implementation`);
      console.log('🔧 Need to update qris-parser.js with correct CRC16 method');
    } else {
      console.log('\n❌ No matching CRC16 implementation found');
      console.log('🔍 May need to research QRIS specification document');
    }
  } else {
    console.log('\n✅ Basic CRC16-CCITT implementation is correct!');
  }
}

main().catch(console.error);