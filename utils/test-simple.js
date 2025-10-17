import myQrisPackage from "my-qris";

const { makeQRPayment } = myQrisPackage;

// Test dengan QRIS string sample yang valid
async function testWithSampleQRIS() {
  console.log('🧪 === TESTING WITH SAMPLE QRIS ===');
  
  // Sample QRIS string yang valid (contoh dari dokumentasi)
  const sampleQRIS = "00020126580014ID.CO.QRIS.WWW0118ID10233046725960215ID.LINKAJA.WWW02150363050300000271630303UME51440014ID.CO.QRIS.WWW0118ID10233046725960208QRIS12345204512353033605802ID5918ES TEH WARGA BANTEN6007JAKARTA610561234462070703A016304A7C8";
  
  console.log('📝 Sample QRIS length:', sampleQRIS.length);
  console.log('🔤 Sample QRIS preview:', sampleQRIS.substring(0, 150));
  
  // Test validation
  console.log('\n🧪 === TESTING QRIS VALIDATION ===');
  const isValidLength = sampleQRIS.length >= 50;
  const startsWithQRIS = sampleQRIS.startsWith('00020');
  const containsQRIS = sampleQRIS.includes('ID.CO.QRIS');
  
  console.log('✅ Valid length (>=50):', isValidLength);
  console.log('✅ Starts with "00020":', startsWithQRIS);
  console.log('✅ Contains "ID.CO.QRIS":', containsQRIS);
  
  if (!isValidLength || (!startsWithQRIS && !containsQRIS)) {
    console.log('❌ QRIS validation failed');
    return;
  }
  
  // Test makeQRPayment dengan different amounts
  const testAmounts = [1000, 50000, 123456];
  
  for (const amount of testAmounts) {
    console.log(`\n🧪 === TESTING MAKE QR PAYMENT (Rp ${amount.toLocaleString('id-ID')}) ===`);
    
    try {
      const paymentQRIS = makeQRPayment({
        qrCode: sampleQRIS,
        amount: amount,
        fee: 0,
        feeType: "fixed"
      });
      
      console.log('✅ Payment QRIS created successfully!');
      console.log('📝 Payment QRIS Length:', paymentQRIS?.length);
      console.log('🔤 Payment QRIS Preview:', paymentQRIS?.substring(0, 150));
      
      // Test different fee types
      console.log('\n🔍 Testing with fee...');
      const paymentQRISWithFee = makeQRPayment({
        qrCode: sampleQRIS,
        amount: amount,
        fee: 1000,
        feeType: "fixed"
      });
      
      console.log('✅ Payment QRIS with fee created successfully!');
      console.log('📝 Payment QRIS with fee Length:', paymentQRISWithFee?.length);
      
    } catch (error) {
      console.log('❌ Failed to create payment QRIS:', error.message);
      console.log('🔍 Error details:', error.stack);
      
      // Try different approaches
      console.log('\n🔍 Trying different parameters...');
      
      try {
        const altPayment = makeQRPayment({
          qrCode: sampleQRIS,
          amount: amount
        });
        console.log('✅ Alternative approach succeeded!');
      } catch (altError) {
        console.log('❌ Alternative approach also failed:', altError.message);
      }
    }
  }
}

// Test untuk cek fungsi yang tersedia di my-qris
function testAvailableFunctions() {
  console.log('\n🧪 === TESTING AVAILABLE FUNCTIONS ===');
  console.log('📚 Available functions in my-qris:');
  console.log(Object.keys(myQrisPackage));
  
  console.log('\n📋 Function types:');
  Object.keys(myQrisPackage).forEach(key => {
    console.log(`${key}: ${typeof myQrisPackage[key]}`);
  });
}

// Main test
async function runTest() {
  console.log('🚀 === QRIS DEBUGGING STARTED ===\n');
  
  testAvailableFunctions();
  await testWithSampleQRIS();
  
  console.log('\n🎯 === TESTING COMPLETE ===');
}

runTest().catch(console.error);