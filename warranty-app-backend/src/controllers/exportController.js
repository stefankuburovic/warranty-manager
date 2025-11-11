const pdfService = require('../services/pdfService');
const { Product, Store, Category, Document } = require('../models');
const { Op } = require('sequelize');

// Export single product as PDF
exports.exportProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Get product with all relations
    const product = await Product.findOne({
      where: {
        product_id: id,
        user_id: req.user.user_id
      },
      include: [
        { model: Store },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generateProductPDF(product, req.user);

    // Set headers for PDF download
    const filename = `warranty-${product.product_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export product error:', error);
    res.status(500).json({ error: 'Failed to export product' });
  }
};

// Export all products as PDF
exports.exportAllProducts = async (req, res) => {
  try {
    // Get all products for user
    const products = await Product.findAll({
      where: {
        user_id: req.user.user_id,
        is_active: true
      },
      include: [
        { model: Store },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        }
      ],
      order: [['purchase_date', 'DESC']]
    });

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products to export' });
    }

    // Generate bulk PDF
    const pdfBuffer = await pdfService.generateBulkPDF(products, req.user);

    // Set headers for PDF download
    const filename = `warranty-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export all products error:', error);
    res.status(500).json({ error: 'Failed to export products' });
  }
};

// Export filtered products
exports.exportFiltered = async (req, res) => {
  try {
    const { category, status, store_id } = req.query;
    const where = { user_id: req.user.user_id, is_active: true };

    if (category) {
      where.category_id = category;
    }

    if (store_id) {
      where.store_id = store_id;
    }

    if (status === 'active') {
      where.warranty_end_date = { [Op.gte]: new Date() };
    } else if (status === 'expired') {
      where.warranty_end_date = { [Op.lt]: new Date() };
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: Store },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        }
      ],
      order: [['purchase_date', 'DESC']]
    });

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products match the filter' });
    }

    const pdfBuffer = await pdfService.generateBulkPDF(products, req.user);

    const filename = `warranty-${status || 'filtered'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export filtered error:', error);
    res.status(500).json({ error: 'Failed to export filtered products' });
  }
};

