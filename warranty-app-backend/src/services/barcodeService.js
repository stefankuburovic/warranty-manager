const axios = require('axios');
const NodeCache = require('node-cache');

// Cache barcode lookups for 24 hours
const barcodeCache = new NodeCache({ stdTTL: 86400 });

class BarcodeService {
  
  // Main lookup function - tries multiple APIs
  async lookupBarcode(barcode) {
    try {
      // Check cache first
      const cached = barcodeCache.get(barcode);
      if (cached) {
        console.log('Barcode found in cache:', barcode);
        return { success: true, source: 'cache', ...cached };
      }

      // Try Open Food Facts first (best for food/consumer products)
      let result = await this.lookupOpenFoodFacts(barcode);
      if (result.success) {
        barcodeCache.set(barcode, result);
        return result;
      }

      // Try UPC Database
      result = await this.lookupUPCDatabase(barcode);
      if (result.success) {
        barcodeCache.set(barcode, result);
        return result;
      }

      // Try Barcode Lookup
      result = await this.lookupBarcodeLookup(barcode);
      if (result.success) {
        barcodeCache.set(barcode, result);
        return result;
      }

      // No results found
      return {
        success: false,
        message: 'Product not found in any database',
        barcode
      };

    } catch (error) {
      console.error('Barcode lookup error:', error);
      return {
        success: false,
        message: 'Error looking up barcode',
        error: error.message,
        barcode
      };
    }
  }

  // Open Food Facts API (Free, no API key needed)
  async lookupOpenFoodFacts(barcode) {
    try {
      const response = await axios.get(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        { timeout: 5000 }
      );

      if (response.data.status === 1 && response.data.product) {
        const product = response.data.product;
        
        return {
          success: true,
          source: 'openfoodfacts',
          product: {
            barcode,
            name: product.product_name || product.product_name_en,
            brand: product.brands,
            model: product.product_name,
            category: this.mapCategory(product.categories),
            description: product.generic_name || product.product_name,
            image_url: product.image_url,
            manufacturer: product.brands,
            origin_country: product.countries,
            raw_data: {
              categories: product.categories,
              labels: product.labels,
              stores: product.stores
            }
          }
        };
      }

      return { success: false };
    } catch (error) {
      console.error('OpenFoodFacts lookup error:', error.message);
      return { success: false };
    }
  }

  // UPC Database API (Free tier: 100 requests/day)
  async lookupUPCDatabase(barcode) {
    try {
      // Get API key from environment
      const apiKey = process.env.UPC_DATABASE_API_KEY;
      if (!apiKey) {
        return { success: false };
      }

      const response = await axios.get(
        `https://api.upcdatabase.org/product/${barcode}`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'WarrantyManager/1.0'
          },
          timeout: 5000
        }
      );

      if (response.data.success && response.data.product) {
        const product = response.data.product;
        
        return {
          success: true,
          source: 'upcdatabase',
          product: {
            barcode,
            name: product.title,
            brand: product.brand,
            model: product.model,
            category: this.mapCategory(product.category),
            description: product.description,
            image_url: product.images?.[0],
            manufacturer: product.brand,
            ean: product.ean,
            upc: product.upc,
            raw_data: product
          }
        };
      }

      return { success: false };
    } catch (error) {
      console.error('UPC Database lookup error:', error.message);
      return { success: false };
    }
  }

  // Barcode Lookup API (Free tier available)
  async lookupBarcodeLookup(barcode) {
    try {
      const apiKey = process.env.BARCODE_LOOKUP_API_KEY;
      if (!apiKey) {
        return { success: false };
      }

      const response = await axios.get(
        `https://api.barcodelookup.com/v3/products`,
        {
          params: {
            barcode,
            key: apiKey
          },
          timeout: 5000
        }
      );

      if (response.data.products && response.data.products.length > 0) {
        const product = response.data.products[0];
        
        return {
          success: true,
          source: 'barcodelookup',
          product: {
            barcode,
            name: product.title,
            brand: product.brand,
            model: product.model,
            category: this.mapCategory(product.category),
            description: product.description,
            image_url: product.images?.[0],
            manufacturer: product.manufacturer,
            stores: product.stores,
            raw_data: product
          }
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Barcode Lookup error:', error.message);
      return { success: false };
    }
  }

  // Map external categories to our app categories
  mapCategory(externalCategory) {
    if (!externalCategory) return null;

    const categoryString = externalCategory.toLowerCase();
    
    // Electronics
    if (categoryString.includes('electronic') || 
        categoryString.includes('computer') ||
        categoryString.includes('phone') ||
        categoryString.includes('tablet')) {
      return 'Electronics';
    }

    // Appliances
    if (categoryString.includes('appliance') ||
        categoryString.includes('home') ||
        categoryString.includes('kitchen')) {
      return 'Home Appliances';
    }

    // Tools
    if (categoryString.includes('tool') ||
        categoryString.includes('hardware')) {
      return 'Tools';
    }

    // Furniture
    if (categoryString.includes('furniture') ||
        categoryString.includes('home décor')) {
      return 'Furniture';
    }

    // Vehicles
    if (categoryString.includes('automotive') ||
        categoryString.includes('vehicle') ||
        categoryString.includes('car')) {
      return 'Vehicles';
    }

    // Fashion
    if (categoryString.includes('clothing') ||
        categoryString.includes('fashion') ||
        categoryString.includes('apparel')) {
      return 'Fashion';
    }

    return 'Other';
  }

  // Parse QR code warranty data
  parseWarrantyQR(qrData) {
    try {
      // Try to parse as JSON first
      if (qrData.startsWith('{')) {
        const data = JSON.parse(qrData);
        return {
          success: true,
          type: 'warranty_certificate',
          data: {
            product_name: data.product || data.productName,
            serial_number: data.serial || data.serialNumber,
            purchase_date: data.purchaseDate || data.purchase_date,
            warranty_duration: data.warrantyMonths || data.warranty_months,
            warranty_end_date: data.warrantyEndDate || data.warranty_end_date,
            store: data.store || data.retailer,
            raw_data: data
          }
        };
      }

      // Try URL format
      if (qrData.startsWith('http')) {
        return {
          success: true,
          type: 'warranty_url',
          url: qrData
        };
      }

      // Try custom format (e.g., "PRODUCT:iPhone 15;SERIAL:ABC123;DATE:2024-01-01")
      if (qrData.includes(':') && qrData.includes(';')) {
        const parts = qrData.split(';');
        const data = {};
        
        parts.forEach(part => {
          const [key, value] = part.split(':');
          if (key && value) {
            data[key.toLowerCase()] = value.trim();
          }
        });

        return {
          success: true,
          type: 'warranty_data',
          data: {
            product_name: data.product,
            serial_number: data.serial,
            purchase_date: data.date || data.purchase,
            warranty_duration: data.warranty,
            raw_data: data
          }
        };
      }

      // Plain text (might be a serial number or product code)
      return {
        success: true,
        type: 'text',
        text: qrData
      };

    } catch (error) {
      console.error('QR parsing error:', error);
      return {
        success: false,
        message: 'Could not parse QR code data',
        raw: qrData
      };
    }
  }

  // Validate barcode format
  validateBarcode(barcode) {
    // Remove any spaces or dashes
    const cleaned = barcode.replace(/[\s-]/g, '');

    // Check if it's numeric and has valid length
    if (!/^\d+$/.test(cleaned)) {
      return { valid: false, message: 'Barcode must contain only numbers' };
    }

    const length = cleaned.length;

    // Valid barcode lengths
    const validLengths = [8, 12, 13, 14]; // EAN-8, UPC-A, EAN-13, ITF-14
    
    if (!validLengths.includes(length)) {
      return { 
        valid: false, 
        message: `Invalid barcode length (${length}). Must be 8, 12, 13, or 14 digits.` 
      };
    }

    // Validate EAN/UPC check digit
    if ([8, 12, 13].includes(length)) {
      const isValid = this.validateCheckDigit(cleaned);
      if (!isValid) {
        return { valid: false, message: 'Invalid check digit' };
      }
    }

    return { valid: true, barcode: cleaned, type: this.getBarcodeType(cleaned) };
  }

  // Validate EAN/UPC check digit
  validateCheckDigit(barcode) {
    const digits = barcode.split('').map(Number);
    const checkDigit = digits.pop();
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      // For EAN-13: multiply odd positions by 1, even by 3 (from right)
      const multiplier = (digits.length - i) % 2 === 0 ? 3 : 1;
      sum += digits[i] * multiplier;
    }
    
    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }

  getBarcodeType(barcode) {
    const length = barcode.length;
    
    switch (length) {
      case 8: return 'EAN-8';
      case 12: return 'UPC-A';
      case 13: return 'EAN-13';
      case 14: return 'ITF-14';
      default: return 'Unknown';
    }
  }
}

module.exports = new BarcodeService();

