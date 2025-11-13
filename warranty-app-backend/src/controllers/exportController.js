const pdfService = require('../services/pdfService');
const { Product, Store, Category, Document, UserCustomStore } = require('../models');
const { Op } = require('sequelize');
const { normalizeLanguage } = require('../utils/pdfTranslations');

// Helper function to normalize store data for PDF (similar to productController)
const normalizeStoreDataForPDF = (product) => {
  const productData = product.toJSON ? product.toJSON() : product;
  
  // Priority: Regular Store > UserCustomStore
  if (productData.Store) {
    productData.Store.type = 'regular';
    if (productData.UserCustomStore) {
      delete productData.UserCustomStore;
    }
  } else if (productData.UserCustomStore) {
    // Only use UserCustomStore if no regular Store exists
    productData.Store = {
      store_id: `custom_${productData.UserCustomStore.user_custom_store_id}`,
      store_name: productData.UserCustomStore.store_name,
      store_chain: null,
      city: null,
      address: null,
      phone: null,
      website: null,
      type: 'custom'
    };
  }
  
  return productData;
};

// Export single product as PDF
exports.exportProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate that id is a number (to prevent route confusion)
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Get product with all relations
    const product = await Product.findOne({
      where: {
        product_id: id,
        user_id: req.user.user_id
      },
      include: [
        { model: Store, required: false },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        },
        { 
          model: UserCustomStore, 
          attributes: ['user_custom_store_id', 'store_name'], 
          required: false 
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Normalize store data
    const normalizedProduct = normalizeStoreDataForPDF(product);

    // Prepare user object for PDF generation
    const userForPDF = {
      user_id: req.user.user_id,
      email: req.user.email,
      full_name: req.user.full_name || req.user.username || req.user.email,
      username: req.user.username
    };

    // Get user's preferred language, default to 'en', and normalize it
    const rawLanguage = req.user.preferred_language || 'en';
    const language = normalizeLanguage(rawLanguage);

    console.log('Generating PDF for product:', id, 'User:', userForPDF.email, 'Language:', language, '(raw:', rawLanguage + ')');

    // Generate PDF
    const pdfBuffer = await pdfService.generateProductPDF(normalizedProduct, userForPDF, language);

    // Set headers for PDF download
    const filename = `warranty-${product.product_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export product error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to export product',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
        { model: Store, required: false },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        },
        { 
          model: UserCustomStore, 
          attributes: ['user_custom_store_id', 'store_name'], 
          required: false 
        }
      ],
      order: [['purchase_date', 'DESC']]
    });

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products to export' });
    }

    // Normalize store data for all products
    const normalizedProducts = products.map(p => normalizeStoreDataForPDF(p));

    // Prepare user object for PDF generation
    const userForPDF = {
      user_id: req.user.user_id,
      email: req.user.email,
      full_name: req.user.full_name || req.user.username || req.user.email,
      username: req.user.username
    };

    // Get user's preferred language, default to 'en', and normalize it
    const rawLanguage = req.user.preferred_language || 'en';
    const language = normalizeLanguage(rawLanguage);

    console.log('Generating bulk PDF for', normalizedProducts.length, 'products, User:', userForPDF.email, 'Language:', language, '(raw:', rawLanguage + ')');

    // Generate bulk PDF
    const pdfBuffer = await pdfService.generateBulkPDF(normalizedProducts, userForPDF, language);

    // Set headers for PDF download
    const filename = `warranty-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export all products error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to export products',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
        { model: Store, required: false },
        { model: Category },
        { 
          model: Document,
          where: { is_primary: true },
          required: false
        },
        { 
          model: UserCustomStore, 
          attributes: ['user_custom_store_id', 'store_name'], 
          required: false 
        }
      ],
      order: [['purchase_date', 'DESC']]
    });

    if (products.length === 0) {
      return res.status(404).json({ error: 'No products match the filter' });
    }

    // Normalize store data for all products
    const normalizedProducts = products.map(p => normalizeStoreDataForPDF(p));

    // Prepare user object for PDF generation
    const userForPDF = {
      user_id: req.user.user_id,
      email: req.user.email,
      full_name: req.user.full_name || req.user.username || req.user.email,
      username: req.user.username
    };

    // Get user's preferred language, default to 'en', and normalize it
    const rawLanguage = req.user.preferred_language || 'en';
    const language = normalizeLanguage(rawLanguage);

    console.log('Generating filtered PDF for', normalizedProducts.length, 'products, User:', userForPDF.email, 'Language:', language, '(raw:', rawLanguage + ')');

    const pdfBuffer = await pdfService.generateBulkPDF(normalizedProducts, userForPDF, language);

    const filename = `warranty-${status || 'filtered'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Export filtered error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to export filtered products',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

