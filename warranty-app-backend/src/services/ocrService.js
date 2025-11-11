const vision = require('@google-cloud/vision');
const Tesseract = require('tesseract.js');
const { isValid } = require('date-fns');

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

  // Main OCR function
  async extractReceiptData(imageBuffer) {
    try {
      let text = '';
      
      // Try Google Vision API first (if configured)
      if (this.useGoogleVision) {
        try {
          text = await this.extractTextWithGoogleVision(imageBuffer);
          console.log('✓ Using Google Cloud Vision API');
        } catch (error) {
          console.error('Google Vision failed, falling back to Tesseract:', error.message);
          text = await this.extractTextWithTesseract(imageBuffer);
        }
      } else {
        // Use Tesseract as fallback
        text = await this.extractTextWithTesseract(imageBuffer);
        console.log('✓ Using Tesseract OCR');
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

  // Google Cloud Vision API extraction
  async extractTextWithGoogleVision(imageBuffer) {
    const [result] = await this.visionClient.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      throw new Error('No text detected in image');
    }
    
    // First annotation contains full text
    return detections[0].description;
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
      // DD.MM.YYYY or DD/MM/YYYY
      /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})/,
      // DD.MM.YY or DD/MM/YY
      /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2})/,
      // YYYY-MM-DD
      /(\d{4})-(\d{1,2})-(\d{1,2})/
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

        const date = new Date(year, month - 1, day);
        if (isValid(date)) {
          return date.toISOString().split('T')[0]; // Return YYYY-MM-DD
        }
      }
    }

    return null;
  }

  // Extract total amount
  extractTotalAmount(text) {
    // Patterns for total amount (Serbian receipts)
    const totalPatterns = [
      /UKUPNO[:\s]+(\d+[.,]\d{2})/i,
      /TOTAL[:\s]+(\d+[.,]\d{2})/i,
      /SUMA[:\s]+(\d+[.,]\d{2})/i,
      /ZA\s+UPLATU[:\s]+(\d+[.,]\d{2})/i,
      /AMOUNT[:\s]+(\d+[.,]\d{2})/i
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Replace comma with dot for decimal
        return parseFloat(match[1].replace(',', '.'));
      }
    }

    // Find largest amount in text (likely the total)
    const amounts = text.match(/\d+[.,]\d{2}/g);
    if (amounts && amounts.length > 0) {
      const largestAmount = amounts
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

