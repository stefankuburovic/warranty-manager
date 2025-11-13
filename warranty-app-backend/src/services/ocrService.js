const vision = require('@google-cloud/vision');
const Tesseract = require('tesseract.js');
const { isValid } = require('date-fns');
const sharp = require('sharp');

// PDF support - convert PDF to image then OCR using system poppler binaries
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

let pdfConversionAvailable = false;
// Check if poppler is available on the system
try {
  const fs = require('fs');
  // Try common poppler binary locations
  const popplerPaths = [
    '/opt/homebrew/bin/pdftoppm',  // Homebrew on Apple Silicon
    '/usr/local/bin/pdftoppm',     // Homebrew on Intel Mac
    '/usr/bin/pdftoppm'            // System default
  ];
  
  for (const path of popplerPaths) {
    if (fs.existsSync(path)) {
      pdfConversionAvailable = true;
      console.log(`✓ PDF to image conversion available using ${path}`);
      break;
    }
  }
  
  if (!pdfConversionAvailable) {
    console.warn('PDF conversion not available: pdftoppm not found. Install poppler: brew install poppler');
  }
} catch (error) {
  console.warn('PDF conversion check failed:', error.message);
}

class OCRService {
  constructor() {
    // Initialize Google Cloud Vision client if key path is provided
    try {
      if (process.env.GOOGLE_VISION_KEY_PATH) {
        this.visionClient = new vision.ImageAnnotatorClient({
          keyFilename: process.env.GOOGLE_VISION_KEY_PATH
        });
        this.useGoogleVision = true;
      } else {
        this.useGoogleVision = false;
      }
    } catch (error) {
      console.warn('Google Vision not configured, using Tesseract fallback:', error.message);
      this.useGoogleVision = false;
    }
  }

  // Convert PDF first page to image buffer using system pdftoppm
  async convertPDFToImage(pdfBuffer) {
    if (!pdfConversionAvailable) {
      throw new Error('PDF to image conversion is not available. Please install poppler-utils system dependency (brew install poppler) or use Google Vision API which supports PDFs natively.');
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const tempDir = os.tmpdir();
      const tempPdfPath = path.join(tempDir, `receipt_${Date.now()}.pdf`);
      const tempImagePrefix = `receipt_${Date.now()}`;
      const tempImagePath = path.join(tempDir, `${tempImagePrefix}-1.png`);
      
      // Write PDF buffer to temp file
      fs.writeFileSync(tempPdfPath, pdfBuffer);
      
      // Find pdftoppm binary
      let pdftoppmPath = null;
      const popplerPaths = [
        '/opt/homebrew/bin/pdftoppm',  // Homebrew on Apple Silicon
        '/usr/local/bin/pdftoppm',     // Homebrew on Intel Mac
        '/usr/bin/pdftoppm'            // System default
      ];
      
      for (const p of popplerPaths) {
        if (fs.existsSync(p)) {
          pdftoppmPath = p;
          break;
        }
      }
      
      if (!pdftoppmPath) {
        // Try to find it in PATH
        try {
          const { stdout } = await execAsync('which pdftoppm');
          pdftoppmPath = stdout.trim();
        } catch (e) {
          throw new Error('pdftoppm not found. Please install poppler: brew install poppler');
        }
      }
      
      // Convert first page (page 1) to PNG at 300 DPI
      // pdftoppm -png -f 1 -l 1 -r 300 input.pdf output_prefix
      const command = `"${pdftoppmPath}" -png -f 1 -l 1 -r 300 "${tempPdfPath}" "${path.join(tempDir, tempImagePrefix)}"`;
      
      await execAsync(command);
      
      // Clean up temp PDF file
      try {
        fs.unlinkSync(tempPdfPath);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      // Check if image was created
      if (!fs.existsSync(tempImagePath)) {
        throw new Error(`Converted image file not found at: ${tempImagePath}`);
      }
      
      // Read the converted image file into buffer
      const imageBuffer = fs.readFileSync(tempImagePath);
      
      // Clean up temp image file
      try {
        fs.unlinkSync(tempImagePath);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return imageBuffer;
    } catch (error) {
      console.error('PDF to image conversion error:', error);
      throw new Error(`Failed to convert PDF to image: ${error.message}. Make sure poppler-utils is installed on your system (brew install poppler on macOS).`);
    }
  }

  // Main OCR function
  async extractReceiptData(imageBuffer, isPDF = false) {
    try {
      let text = '';
      let processedBuffer = imageBuffer;
      
      // If PDF, convert to image first, then OCR
      if (isPDF) {
        try {
          // Convert PDF first page to image
          processedBuffer = await this.convertPDFToImage(imageBuffer);
          console.log('✓ Converted PDF to image');
          
          // Now process as regular image with OCR
          if (this.useGoogleVision) {
            try {
              text = await this.extractTextWithGoogleVision(processedBuffer, false);
              console.log('✓ Using Google Cloud Vision API on converted PDF image');
            } catch (error) {
              console.error('Google Vision failed, falling back to Tesseract:', error.message);
              text = await this.extractTextWithTesseract(processedBuffer);
            }
          } else {
            text = await this.extractTextWithTesseract(processedBuffer);
            console.log('✓ Using Tesseract OCR on converted PDF image');
          }
        } catch (pdfError) {
          console.error('PDF conversion error:', pdfError);
          // If conversion fails, try Google Vision API directly (it supports PDFs natively)
          if (this.useGoogleVision) {
            try {
              console.log('PDF conversion failed, trying Google Vision API directly');
              text = await this.extractTextWithGoogleVision(imageBuffer, true);
              console.log('✓ Using Google Cloud Vision API for PDF directly');
            } catch (visionError) {
              throw new Error(`PDF processing failed: ${pdfError.message}. Please convert PDF to image manually or ensure poppler-utils is installed.`);
            }
          } else {
            throw new Error(`PDF processing failed: ${pdfError.message}. Please install poppler-utils system dependency, configure Google Vision API, or convert PDF to image manually.`);
          }
        }
      } else {
        // Regular image processing
        // Try Google Vision API first (if configured)
        if (this.useGoogleVision) {
          try {
            text = await this.extractTextWithGoogleVision(processedBuffer, false);
            console.log('✓ Using Google Cloud Vision API');
          } catch (error) {
            console.error('Google Vision failed, falling back to Tesseract:', error.message);
            text = await this.extractTextWithTesseract(processedBuffer);
          }
        } else {
          // Use Tesseract as fallback
          text = await this.extractTextWithTesseract(processedBuffer);
          console.log('✓ Using Tesseract OCR');
        }
      }

      // Parse extracted text
      const extractedData = await this.parseReceiptText(text);
      
      return {
        success: true,
        raw_text: text,
        extracted_data: extractedData,
        confidence: extractedData.confidence
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      return {
        success: false,
        error: error.message,
        raw_text: null,
        extracted_data: null
      };
    }
  }

  // Google Cloud Vision API extraction (supports both images and PDFs)
  async extractTextWithGoogleVision(imageBuffer, isPDF = false) {
    try {
      if (isPDF) {
        // Google Vision API can handle PDFs via textDetection
        // Note: For multi-page PDFs, you'd use asyncBatchAnnotateFiles
        // For single-page receipts, textDetection works fine
        const [result] = await this.visionClient.textDetection(imageBuffer);
        const detections = result.textAnnotations;
        
        if (!detections || detections.length === 0) {
          throw new Error('No text detected in PDF');
        }
        
        // First annotation contains full text
        return detections[0].description;
      } else {
        // Regular image processing
        const [result] = await this.visionClient.textDetection(imageBuffer);
        const detections = result.textAnnotations;
        
        if (!detections || detections.length === 0) {
          throw new Error('No text detected in image');
        }
        
        // First annotation contains full text
        return detections[0].description;
      }
    } catch (error) {
      // If PDF processing fails, provide helpful error
      if (isPDF && error.message.includes('Invalid image data')) {
        throw new Error('PDF processing failed. Google Vision API may require PDFs to be uploaded to Cloud Storage for processing. Please convert PDF to image or use asyncBatchAnnotateFiles.');
      }
      throw error;
    }
  }

  // Tesseract.js extraction
  async extractTextWithTesseract(imageBuffer) {
    const { data } = await Tesseract.recognize(imageBuffer, 'eng+srp', {
      logger: () => {} // Suppress logs
    });
    
    return data.text;
  }

  // Parse extracted text into structured data
  async parseReceiptText(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    const extractedData = {
      store_name: this.extractStoreName(lines),
      purchase_date: this.extractDate(text),
      total_amount: this.extractTotalAmount(text),
      currency: this.extractCurrency(text),
      items: this.extractItems(lines),
      product_name: this.extractProductName(text, lines),
      tax_amount: this.extractTaxAmount(text),
      store_address: this.extractAddress(lines),
      receipt_number: this.extractReceiptNumber(text),
      confidence: 0
    };

    // Calculate confidence score
    extractedData.confidence = this.calculateConfidence(extractedData);

    return extractedData;
  }

  // Extract store name (usually in first few lines)
  extractStoreName(lines) {
    // Common Serbian store chains
    const knownStores = [
      'TEHNOMANIJA', 'GIGATRON', 'EMMI', 'TEMPO', 'JYSK',
      'METRO', 'IDEA', 'MAXI', 'RODA', 'WIN WIN',
      'SPORTS VISION', 'BUZZ', 'PLANET SPORT', 'OFFICE SHOES'
    ];

    // Check first 5 lines for known stores
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].toUpperCase();
      for (const store of knownStores) {
        if (line.includes(store)) {
          return lines[i];
        }
      }
    }

    // If no known store, return first line that's not too short
    for (const line of lines.slice(0, 5)) {
      if (line.length > 3 && line.length < 50 && !line.match(/^\d+$/)) {
        return line;
      }
    }

    return null;
  }

  // Extract purchase date
  extractDate(text) {
    const datePatterns = [
      // DD.MM.YYYY or DD/MM/YYYY (Serbian format)
      /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/,
      // DD.MM.YY or DD/MM/YY
      /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2})/,
      // YYYY-MM-DD
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      // ПЕР време: DD.MM.YYYY HH:MM:SS (Serbian receipt format)
      /ПЕР\s+време:\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        let day, month, year;
        
        if (pattern.toString().includes('4')) {
          // YYYY format
          if (match[1].length === 4) {
            [, year, month, day] = match;
          } else {
            [, day, month, year] = match;
          }
        } else {
          // YY format
          [, day, month, year] = match;
          year = `20${year}`;
        }

        // Create date in local timezone to avoid UTC conversion issues
        // Use Date.UTC and then convert to local date string to avoid timezone shifts
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isValid(date)) {
          // Format as YYYY-MM-DD without timezone conversion
          const yearStr = date.getFullYear();
          const monthStr = String(date.getMonth() + 1).padStart(2, '0');
          const dayStr = String(date.getDate()).padStart(2, '0');
          return `${yearStr}-${monthStr}-${dayStr}`;
        }
      }
    }

    return null;
  }

  // Extract total amount (handles Serbian format: 31.999,00)
  extractTotalAmount(text) {
    // Patterns for total amount (Serbian receipts)
    const totalPatterns = [
      /ЗА\s+УПЛАТУ[:\s\|]+(\d{1,3}(?:\.\d{3})*,\d{2})/i,  // ЗА УПЛАТУ 31.999,00
      /UKUPNO[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /TOTAL[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /SUMA[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /ZA\s+UPLATU[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      /AMOUNT[:\s]+(\d{1,3}(?:\.\d{3})*,\d{2})/i,
      // Also try with comma as decimal separator
      /ЗА\s+УПЛАТУ[:\s\|]+(\d{1,3}(?:\.\d{3})*,\d{2})/i
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        const amountStr = match[1];
        // Serbian format: dot = thousands separator, comma = decimal separator
        // Convert to standard format: remove dots, replace comma with dot
        const normalized = amountStr.replace(/\./g, '').replace(',', '.');
        return parseFloat(normalized);
      }
    }

    // Find largest amount in text (likely the total)
    // Match Serbian format: digits with dots (thousands) and comma (decimal)
    const amounts = text.match(/\d{1,3}(?:\.\d{3})*,\d{2}/g);
    if (amounts && amounts.length > 0) {
      const largestAmount = amounts
        .map(a => {
          // Convert Serbian format to number
          const normalized = a.replace(/\./g, '').replace(',', '.');
          return parseFloat(normalized);
        })
        .sort((a, b) => b - a)[0];
      return largestAmount;
    }

    // Fallback: try simple format
    const simpleAmounts = text.match(/\d+[.,]\d{2}/g);
    if (simpleAmounts && simpleAmounts.length > 0) {
      const largestAmount = simpleAmounts
        .map(a => parseFloat(a.replace(',', '.')))
        .sort((a, b) => b - a)[0];
      return largestAmount;
    }

    return null;
  }

  // Extract currency
  extractCurrency(text) {
    // Serbian receipts commonly use RSD, EUR, or din
    const currencyPatterns = [
      { pattern: /RSD/i, currency: 'RSD' },
      { pattern: /EUR/i, currency: 'EUR' },
      { pattern: /€/i, currency: 'EUR' },
      { pattern: /DINARA/i, currency: 'RSD' },
      { pattern: /DIN[.\s]/i, currency: 'RSD' }
    ];

    for (const { pattern, currency } of currencyPatterns) {
      if (pattern.test(text)) {
        return currency;
      }
    }

    return 'RSD'; // Default to RSD for Serbia
  }

  // Extract product name from receipt
  extractProductName(text, lines) {
    // Look for product names after "Артикли:" or "Articles:" section
    // Pattern: Look for lines with product names (usually before price/quantity)
    // Common patterns:
    // - "SAMSUNG Smart medium telefoni A36 6/128 Crni (h)"
    // - Product name followed by barcode or price
    
    // Try to find product name in "Артикли" section
    const artikliIndex = lines.findIndex(line => 
      line.toUpperCase().includes('АРТИКЛИ') || 
      line.toUpperCase().includes('ARTICLES') ||
      line.toUpperCase().includes('НАЗИВ')
    );
    
    if (artikliIndex !== -1) {
      // Look for product name in next few lines after "Артикли"
      for (let i = artikliIndex + 1; i < Math.min(artikliIndex + 10, lines.length); i++) {
        const line = lines[i].trim();
        
        // Skip header lines
        if (line.match(/^(Назив|Цена|Количина|Укупно|Name|Price|Quantity|Total)/i)) {
          continue;
        }
        
        // Skip lines that are just numbers or barcodes
        if (line.match(/^\d{8,}$/)) {
          continue;
        }
        
        // Look for product name patterns
        // Product names usually contain letters and may have model numbers
        // Examples: "SAMSUNG Smart medium telefoni A36 6/128 Crni (h)"
        if (line.length > 10 && line.match(/[A-Za-zА-Яа-я]{3,}/)) {
          // Extract product name (remove trailing barcode/price info)
          // Split by common separators: |, tab, multiple spaces
          const parts = line.split(/[\|\t]/);
          const productName = parts[0].trim();
          
          // Clean up: remove trailing numbers that might be barcodes
          // But keep model numbers like "A36 6/128"
          const cleaned = productName.replace(/\s+\d{8,}$/, '').trim();
          
          if (cleaned.length > 5) {
            return cleaned;
          }
        }
      }
    }
    
    // Fallback: Look for common product brand patterns
    const brandPatterns = [
      /(SAMSUNG|APPLE|LG|SONY|XIAOMI|HUAWEI|NOKIA|MOTOROLA|ONEPLUS|GOOGLE|DELL|HP|LENOVO|ASUS|ACER|MSI|RAZER)\s+[A-Za-zА-Яа-я0-9\s\/\-]+/i
    ];
    
    for (const pattern of brandPatterns) {
      const match = text.match(pattern);
      if (match) {
        const productName = match[0].trim();
        // Remove trailing barcode/price if present
        const cleaned = productName.split(/\s+\d{8,}/)[0].trim();
        if (cleaned.length > 5) {
          return cleaned;
        }
      }
    }
    
    return null;
  }

  // Extract individual items
  extractItems(lines) {
    const items = [];
    const itemPattern = /^(.+?)\s+(\d+[.,]\d{2})$/;

    for (const line of lines) {
      const match = line.match(itemPattern);
      if (match) {
        const [, name, price] = match;
        // Skip if line looks like a total or subtotal
        if (!name.match(/UKUPNO|TOTAL|SUMA|SUBTOTAL/i)) {
          items.push({
            name: name.trim(),
            price: parseFloat(price.replace(',', '.'))
          });
        }
      }
    }

    return items.length > 0 ? items : null;
  }

  // Extract tax amount
  extractTaxAmount(text) {
    const taxPatterns = [
      /PDV[:\s]+(\d+[.,]\d{2})/i,
      /VAT[:\s]+(\d+[.,]\d{2})/i,
      /TAX[:\s]+(\d+[.,]\d{2})/i,
      /POREZ[:\s]+(\d+[.,]\d{2})/i
    ];

    for (const pattern of taxPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(',', '.'));
      }
    }

    return null;
  }

  // Extract store address
  extractAddress(lines) {
    // Look for address indicators
    const addressIndicators = [
      'ULICA', 'BULEVAR', 'TRG', 'ADRESA', 'ADDRESS',
      'BEOGRAD', 'NOVI SAD', 'NIŠ', 'SRBIJA'
    ];

    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toUpperCase();
      for (const indicator of addressIndicators) {
        if (line.includes(indicator)) {
          // Return this line and possibly the next one
          const address = lines[i];
          if (i + 1 < lines.length && lines[i + 1].length < 50) {
            return `${address}, ${lines[i + 1]}`;
          }
          return address;
        }
      }
    }

    return null;
  }

  // Extract receipt number
  extractReceiptNumber(text) {
    const receiptPatterns = [
      /RAČUN[:\s#]+(\d+)/i,
      /RECEIPT[:\s#]+(\d+)/i,
      /BR[.:\s]+(\d+)/i,
      /NO[.:\s]+(\d+)/i,
      /#(\d+)/
    ];

    for (const pattern of receiptPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Calculate confidence score
  calculateConfidence(data) {
    let score = 0;
    let maxScore = 0;

    // Store name (20 points)
    maxScore += 20;
    if (data.store_name) score += 20;

    // Date (25 points)
    maxScore += 25;
    if (data.purchase_date) score += 25;

    // Amount (25 points)
    maxScore += 25;
    if (data.total_amount) score += 25;

    // Currency (10 points)
    maxScore += 10;
    if (data.currency) score += 10;

    // Items (15 points)
    maxScore += 15;
    if (data.items && data.items.length > 0) score += 15;

    // Receipt number (5 points)
    maxScore += 5;
    if (data.receipt_number) score += 5;

    return Math.round((score / maxScore) * 100);
  }

  // Suggest product name from items
  suggestProductName(extractedData) {
    if (!extractedData.items || extractedData.items.length === 0) {
      return null;
    }

    // If only one item, that's likely the product
    if (extractedData.items.length === 1) {
      return extractedData.items[0].name;
    }

    // If multiple items, find the most expensive one
    const mostExpensive = extractedData.items
      .sort((a, b) => b.price - a.price)[0];
    
    return mostExpensive.name;
  }
}

module.exports = new OCRService();

