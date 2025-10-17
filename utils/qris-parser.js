// Custom QRIS Parser and Generator
// Untuk mengatasi limitasi library my-qris dengan QRIS asli

class QRISParser {
  constructor() {
    this.crcTable = this.generateCRCTable();
  }

  // Generate CRC16 table untuk QRIS
  generateCRCTable() {
    const table = [];
    for (let i = 0; i < 256; i++) {
      let crc = i;
      for (let j = 0; j < 8; j++) {
        if (crc & 1) {
          crc = (crc >>> 1) ^ 0x8408;
        } else {
          crc = crc >>> 1;
        }
      }
      table[i] = crc;
    }
    return table;
  }

  // Calculate CRC16 checksum (ISO 13239 standard for QRIS)
  calculateCRC16(data) {
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
    
    crc = (~crc) & 0xFFFF;
    // Swap bytes for correct endianness
    const swapped = ((crc & 0xFF) << 8) | ((crc >>> 8) & 0xFF);
    return swapped.toString(16).toUpperCase().padStart(4, '0');
  }

  // Parse QRIS data menjadi object
  parseQRIS(qrisString) {
    try {
      console.log('🔍 Parsing QRIS string...');
      const data = {};
      let index = 0;

      while (index < qrisString.length - 4) { // -4 untuk CRC
        if (index + 4 > qrisString.length) break;
        
        const tag = qrisString.substr(index, 2);
        const length = parseInt(qrisString.substr(index + 2, 2));
        
        if (isNaN(length) || index + 4 + length > qrisString.length) {
          break;
        }
        
        const value = qrisString.substr(index + 4, length);
        data[tag] = value;
        
        index += 4 + length;
      }

      // Extract merchant info
      const merchantInfo = this.extractMerchantInfo(data);
      
      console.log('✅ QRIS parsed successfully');
      console.log('📊 Merchant Info:', merchantInfo);
      
      return {
        raw: qrisString,
        parsed: data,
        merchant: merchantInfo,
        isValid: this.validateQRIS(qrisString)
      };
      
    } catch (error) {
      console.error('❌ Error parsing QRIS:', error.message);
      throw new Error('Failed to parse QRIS data');
    }
  }

  // Extract merchant information dari parsed data
  extractMerchantInfo(data) {
    const merchantInfo = {
      merchantName: '',
      merchantCity: '',
      merchantId: '',
      acquirer: '',
      amount: '0'
    };

    // Tag 59: Merchant Name
    if (data['59']) {
      merchantInfo.merchantName = data['59'];
    }

    // Tag 60: Merchant City
    if (data['60']) {
      merchantInfo.merchantCity = data['60'];
    }

    // Tag 54: Transaction Amount (jika ada)
    if (data['54']) {
      merchantInfo.amount = data['54'];
    }

    // Extract dari tag 26 (Merchant Account Information)
    if (data['26']) {
      const tag26 = data['26'];
      merchantInfo.acquirer = 'QRIS Indonesia';
      
      // Try to extract merchant ID dari dalam tag 26
      let subIndex = 0;
      while (subIndex < tag26.length - 4) {
        const subTag = tag26.substr(subIndex, 2);
        const subLength = parseInt(tag26.substr(subIndex + 2, 2));
        
        if (isNaN(subLength)) break;
        
        const subValue = tag26.substr(subIndex + 4, subLength);
        
        if (subTag === '01') { // Merchant ID biasanya di sub-tag 01
          merchantInfo.merchantId = subValue;
        }
        
        subIndex += 4 + subLength;
      }
    }

    return merchantInfo;
  }

  // Validate QRIS checksum
  validateQRIS(qrisString) {
    if (qrisString.length < 4) return false;
    
    const dataWithoutCRC = qrisString.substr(0, qrisString.length - 4);
    const providedCRC = qrisString.substr(-4);
    const calculatedCRC = this.calculateCRC16(dataWithoutCRC);
    
    return providedCRC.toLowerCase() === calculatedCRC.toLowerCase();
  }

  // Generate payment QRIS dengan amount baru
  generatePaymentQRIS(originalQRIS, amount, adminFee = 0) {
    try {
      console.log('💰 Generating payment QRIS...');
      console.log(`💵 Amount: Rp ${amount.toLocaleString('id-ID')}`);
      console.log(`🏦 Admin Fee: Rp ${adminFee.toLocaleString('id-ID')}`);
      
      const parsed = this.parseQRIS(originalQRIS);
      
      if (!parsed.isValid) {
        console.log('⚠️ Original QRIS checksum invalid, but proceeding...');
      }

      // Calculate total amount
      const totalAmount = amount + adminFee;
      const amountStr = totalAmount.toString();
      
      // Build new QRIS string
      let newQRIS = '';
      const data = parsed.parsed;
      
      // Add all tags except amount (54) and CRC (63)
      const orderedTags = Object.keys(data).sort();
      
      for (const tag of orderedTags) {
        if (tag === '54' || tag === '63') continue; // Skip amount and CRC
        
        const value = data[tag];
        const length = value.length.toString().padStart(2, '0');
        newQRIS += tag + length + value;
      }
      
      // Add amount tag (54)
      const amountLength = amountStr.length.toString().padStart(2, '0');
      newQRIS += '54' + amountLength + amountStr;
      
      // Add CRC placeholder
      newQRIS += '6304';
      
      // Calculate and add real CRC
      const crc = this.calculateCRC16(newQRIS);
      newQRIS = newQRIS.substr(0, newQRIS.length - 4) + '63' + '04' + crc;
      
      console.log('✅ Payment QRIS generated successfully');
      console.log('📝 New QRIS length:', newQRIS.length);
      
      // Validate new QRIS
      const isValid = this.validateQRIS(newQRIS);
      console.log('🔍 New QRIS valid:', isValid);
      
      return {
        success: true,
        qrisData: newQRIS,
        originalMerchant: parsed.merchant,
        paymentAmount: amount,
        adminFee: adminFee,
        totalAmount: totalAmount,
        isValid: isValid
      };
      
    } catch (error) {
      console.error('❌ Error generating payment QRIS:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate QR code data URL dari QRIS string
  async generateQRCodeDataURL(qrisString) {
    try {
      // Import QRCode library
      const QRCode = await import('qrcode');
      
      const dataURL = await QRCode.default.toDataURL(qrisString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return dataURL;
    } catch (error) {
      console.error('❌ Error generating QR code:', error.message);
      throw error;
    }
  }
}

export default QRISParser;