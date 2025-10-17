// Monitor script untuk melihat log server saat testing
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 === QRIS SERVER MONITOR ===');
console.log('📊 Monitoring server activity...');
console.log('🌐 Server should be running at: http://localhost:3000');
console.log('📱 Auto-extract page: http://localhost:3000/qris-auto.html');
console.log('📁 Upload directory: ./uploads');
console.log('📁 Generated files: ./public/generated');

// Monitor uploads folder
const uploadsDir = './uploads';
const generatedDir = './public/generated';

function watchDirectory(dir, label) {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Creating ${label} directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
  
  console.log(`👀 Watching ${label} directory: ${dir}`);
  
  fs.watch(dir, (eventType, filename) => {
    if (filename) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`📁 [${timestamp}] ${label} - ${eventType}: ${filename}`);
      
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`   📊 Size: ${stats.size} bytes`);
        console.log(`   🕐 Modified: ${stats.mtime.toLocaleString()}`);
      }
    }
  });
}

// Watch both directories
watchDirectory(uploadsDir, 'UPLOADS');
watchDirectory(generatedDir, 'GENERATED');

console.log('\n🎯 === TESTING GUIDE ===');
console.log('1. Open browser: http://localhost:3000/qris-auto.html');
console.log('2. Upload QRIS image (ES TEH WARGA BANTEN)');
console.log('3. Enter amount: 123456');
console.log('4. Enter admin fee: 1000');
console.log('5. Click "Generate Payment QRIS"');
console.log('6. Watch the logs below for activity...');
console.log('\n⏰ Monitoring started. Press Ctrl+C to stop.\n');

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n🛑 Monitoring stopped.');
  process.exit(0);
});