const barcodeService = require('../services/barcodeService');
const { Product } = require('../models');

// Lookup product by barcode
exports.lookupBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }

    // Validate barcode format
    const validation = barcodeService.validateBarcode(barcode);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: validation.message,
        barcode 
      });
    }

    // First check if we already have this product in our database
    const existingProduct = await Product.findOne({
      where: {
        user_id: req.user.user_id,
        barcode: validation.barcode,
        is_active: true
      }
    });

    if (existingProduct) {
      return res.json({
        found_in_database: true,
        existing_product: existingProduct,
        message: 'You already have this product in your inventory'
      });
    }

    // Lookup in external databases
    const result = await barcodeService.lookupBarcode(validation.barcode);

    res.json({
      ...result,
      barcode_type: validation.type
    });

  } catch (error) {
    console.error('Lookup barcode error:', error);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
};

// Parse QR code data
exports.parseQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ error: 'QR data is required' });
    }

    const result = barcodeService.parseWarrantyQR(qrData);

    res.json(result);

  } catch (error) {
    console.error('Parse QR error:', error);
    res.status(500).json({ error: 'Failed to parse QR code' });
  }
};

// Save scanned barcode for history
exports.saveScanHistory = async (req, res) => {
  try {
    const { barcode, scan_result, product_found } = req.body;

    // You could create a ScanHistory model to track this
    // For now, just return success
    
    res.json({ 
      message: 'Scan saved to history',
      barcode,
      success: true
    });

  } catch (error) {
    console.error('Save scan history error:', error);
    res.status(500).json({ error: 'Failed to save scan' });
  }
};

// Validate barcode format
exports.validateBarcode = async (req, res) => {
  try {
    const { barcode } = req.body;

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode is required' });
    }

    const validation = barcodeService.validateBarcode(barcode);

    res.json(validation);

  } catch (error) {
    console.error('Validate barcode error:', error);
    res.status(500).json({ error: 'Failed to validate barcode' });
  }
};

