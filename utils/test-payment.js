import myQrisPackage from "my-qris";

const { makeQRPayment } = myQrisPackage;

// Test dengan QRIS string sample yang valid
async function testMakeQRPayment() {
  console.log('🧪 === TESTING MAKE QR PAYMENT ===');
  
  // Sample QRIS strings untuk testing
  const sampleQRISList = [
    // Sample 1: Standard QRIS format
    "00020126580014ID.CO.QRIS.WWW0118ID10233046725960215ID.LINKAJA.WWW02150363050300000271630303UME51440014ID.CO.QRIS.WWW0118ID10233046725960208QRIS12345204512353033605802ID5918ES TEH WARGA BANTEN6007JAKARTA610561234462070703A016304A7C8",
    
    // Sample 2: Basic QRIS without amount
    "00020126580014ID.CO.QRIS.WWW0118ID1023304672596021500000000000000000000000000051440014ID.CO.QRIS.WWW0118ID10233046725960208QRIS12345204512353033605802ID5918ES TEH WARGA BANTEN6007JAKARTA62070703A016304ABCD",
    
    // Sample 3: Minimal QRIS
    "00020126330014ID.CO.QRIS.WWW0115ID102330467259651440014ID.CO.QRIS.WWW0115ID102330467259653033605802ID5918ES TEH WARGA BANTEN6007JAKARTA62070703A0163045678"
  ];
  
  for (let i = 0; i < sampleQRISList.length; i++) {
    const sampleQRIS = sampleQRISList[i];
    console.log(`\n--- Testing Sample QRIS ${i + 1} ---`);
    console.log('📝 QRIS length:', sampleQRIS.length);
    console.log('🔤 QRIS preview:', sampleQRIS.substring(0, 100) + '...');
    
    const testAmounts = [123456];
    
    for (const amount of testAmounts) {
      console.log(`\n💰 Testing amount: Rp ${amount.toLocaleString('id-ID')}`);
      
      const testCases = [
        { qrCode: sampleQRIS, amount: amount, fee: 0, feeType: "fixed" },
        { qrCode: sampleQRIS, amount: amount, fee: 0, feeType: "percentage" },
        { qrCode: sampleQRIS, amount: amount },
        { qrCode: sampleQRIS, amount: amount, fee: 1000, feeType: "fixed" }
      ];
      
      for (let j = 0; j < testCases.length; j++) {
        const testCase = testCases[j];
        console.log(`\n🧪 Test case ${j + 1}:`, JSON.stringify(testCase, null, 2));
        
        try {
          const paymentQRIS = makeQRPayment(testCase);
          
          console.log('✅ SUCCESS! Payment QRIS created');
          console.log('📝 Result length:', paymentQRIS?.length);
          console.log('🔤 Result preview:', paymentQRIS?.substring(0, 100) + '...');
          
          // If successful, we found a working format
          console.log('\n🎉 Found working QRIS format!');
          console.log('✅ This QRIS can be used for payment generation');
          return true;
          
        } catch (error) {
          console.log('❌ FAILED:', error.message);
          
          // Log more details for debugging
          if (error.stack) {
            console.log('🔍 Stack trace:', error.stack);
          }
        }
      }
    }
  }
  
  console.log('\n❌ All test cases failed');
  return false;
}

// Test untuk mengecek semua fungsi yang tersedia
function inspectMyQris() {
  console.log('\n🔍 === INSPECTING MY-QRIS LIBRARY ===');
  console.log('📦 Library object:', myQrisPackage);
  console.log('\n📚 Available functions:');
  
  Object.keys(myQrisPackage).forEach(key => {
    const value = myQrisPackage[key];
    console.log(`  ${key}: ${typeof value}`);
    
    if (typeof value === 'function') {
      console.log(`    Function: ${value.toString().substring(0, 200)}...`);
    }
  });
}

// Main test
async function runCompleteTest() {
  console.log('🚀 === QRIS PAYMENT TESTING ===\n');
  
  inspectMyQris();
  
  const success = await testMakeQRPayment();
  
  console.log('\n🎯 === FINAL RESULT ===');
  if (success) {
    console.log('✅ makeQRPayment function works correctly');
    console.log('✅ The issue might be with QR code reading, not payment generation');
  } else {
    console.log('❌ makeQRPayment function has issues');
    console.log('❌ Need to investigate library compatibility');
  }
}

runCompleteTest().catch(console.error);