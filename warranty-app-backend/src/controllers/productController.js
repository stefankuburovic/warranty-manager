const { Product, Store, Category, Document, User, SharedProduct, FamilyMember, UserCustomStore } = require('../models');
const { Op } = require('sequelize');
const { deleteFile, getSignedUrl } = require('../config/storage');

// Helper function to normalize store data for frontend
const normalizeStoreData = (product) => {
  const productData = product.toJSON ? product.toJSON() : product;
  
  // Priority: Regular Store > UserCustomStore
  // If product has a regular Store, use it (even if UserCustomStore also exists)
  if (productData.Store) {
    productData.Store.type = 'regular';
    // Remove UserCustomStore reference if Store exists (switched from custom to regular)
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

// Create new product
exports.createProduct = async (req, res) => {
  try {
    const {
      product_name,
      brand,
      model_number,
      serial_number,
      barcode,
      purchase_date,
      purchase_price,
      currency,
      warranty_duration_months,
      category_id,
      store_id,
      notes
    } = req.body;

    // Validation
    if (!product_name || !purchase_date) {
      return res.status(400).json({ 
        error: 'Product name and purchase date are required' 
      });
    }

    // Parse store_id - could be regular store_id or custom store (format: "custom_123")
    let parsedStoreId = null;
    let parsedUserCustomStoreId = null;
    
    if (store_id !== undefined && store_id !== null) {
      const storeIdStr = String(store_id);
      
      if (storeIdStr.startsWith('custom_')) {
        // It's a custom store
        const customStoreId = parseInt(storeIdStr.replace('custom_', ''));
        if (!isNaN(customStoreId)) {
          parsedUserCustomStoreId = customStoreId;
        }
      } else {
        // It's a regular store
        const regularStoreId = parseInt(storeIdStr);
        if (!isNaN(regularStoreId)) {
          parsedStoreId = regularStoreId;
        }
      }
    }

    // Create product
    const product = await Product.create({
      user_id: req.user.user_id,
      product_name,
      brand,
      model_number,
      serial_number,
      barcode,
      purchase_date,
      purchase_price,
      currency: currency || 'RSD',
      warranty_duration_months: warranty_duration_months || 12,
      category_id,
      store_id: parsedStoreId,
      user_custom_store_id: parsedUserCustomStoreId,
      notes
    });

    // Fetch complete product with associations
    const completeProduct = await Product.findByPk(product.product_id, {
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'], required: false },
        { model: UserCustomStore, attributes: ['user_custom_store_id', 'store_name'], required: false },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ]
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: normalizeStoreData(completeProduct)
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// Get all products for user
exports.getProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      status, 
      sort = 'purchase_date',
      order = 'DESC',
      search
    } = req.query;

    const offset = (page - 1) * limit;
    const where = { user_id: req.user.user_id };

    // Filter by category
    if (category) {
      where.category_id = category;
    }

    // Filter by status (active/expired)
    if (status === 'active') {
      where.warranty_end_date = { [Op.gte]: new Date() };
      where.is_active = true;
    } else if (status === 'expired') {
      where.warranty_end_date = { [Op.lt]: new Date() };
    } else if (status === 'inactive') {
      where.is_active = false;
    }

    // Search functionality
    if (search) {
      where[Op.or] = [
        { product_name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { model_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Optimize query: separate count and data queries, remove Document include from main query
    // Documents can be loaded separately if needed (they're only used for thumbnails)
    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { 
          model: Store, 
          attributes: ['store_id', 'store_name', 'store_chain', 'city'],
          required: false
        },
        { 
          model: UserCustomStore, 
          attributes: ['user_custom_store_id', 'store_name'],
          required: false
        },
        { 
          model: Category, 
          attributes: ['category_id', 'category_name', 'icon_name'],
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sort, order]],
      distinct: true // Important: prevents duplicate counting when using includes
    });

    // Normalize store data for all products
    const normalizedProducts = rows.map(normalizeStoreData);

    res.json({
      products: normalizedProducts,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

// Get single product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { 
        product_id: id,
        user_id: req.user.user_id 
      },
      include: [
        { 
          model: Store, 
          attributes: ['store_id', 'store_name', 'store_chain', 'address', 'city', 'phone', 'website'],
          required: false
        },
        { 
          model: UserCustomStore, 
          attributes: ['user_custom_store_id', 'store_name'],
          required: false
        },
        { 
          model: Category, 
          attributes: ['category_id', 'category_name', 'icon_name', 'default_warranty_months'] 
        },
        {
          model: Document,
          attributes: ['document_id', 'document_type', 'cloud_storage_url', 'thumbnail_url', 'file_name', 'is_primary', 'upload_date']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is shared with family
    let isShared = false;
    try {
      const familyMember = await FamilyMember.findOne({
        where: { user_id: req.user.user_id }
      });
      
      if (familyMember) {
        const sharedProduct = await SharedProduct.findOne({
          where: {
            product_id: id,
            family_id: familyMember.family_id,
            shared_by: req.user.user_id
          }
        });
        isShared = !!sharedProduct;
      }
    } catch (error) {
      console.error('Error checking shared status:', error);
      // Continue without shared status if check fails
    }

    // Calculate warranty status
    const today = new Date();
    const warrantyEnd = new Date(product.warranty_end_date);
    const daysRemaining = Math.ceil((warrantyEnd - today) / (1000 * 60 * 60 * 24));
    
    const productData = normalizeStoreData(product);
    productData.warranty_status = {
      is_expired: daysRemaining < 0,
      days_remaining: daysRemaining,
      expires_soon: daysRemaining > 0 && daysRemaining <= 30
    };
    productData.is_shared = isShared;

    // Convert document S3 keys to signed URLs for display
    if (productData.Documents && productData.Documents.length > 0) {
      productData.Documents = productData.Documents.map(doc => ({
        ...doc,
        cloud_storage_url: getSignedUrl(doc.cloud_storage_url),
        thumbnail_url: doc.thumbnail_url ? getSignedUrl(doc.thumbnail_url) : null
      }));
    }

    res.json({ product: productData });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name,
      brand,
      model_number,
      serial_number,
      barcode,
      purchase_date,
      purchase_price,
      currency,
      warranty_duration_months,
      category_id,
      store_id,
      notes,
      is_active
    } = req.body;

    const product = await Product.findOne({
      where: { 
        product_id: id,
        user_id: req.user.user_id 
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Parse store_id - could be regular store_id or custom store (format: "custom_123")
    let parsedStoreId = null;
    let parsedUserCustomStoreId = null;
    
    if (store_id !== undefined) {
      if (store_id === null || store_id === '') {
        // Explicitly clear store
        parsedStoreId = null;
        parsedUserCustomStoreId = null;
      } else {
        const storeIdStr = String(store_id);
        
        if (storeIdStr.startsWith('custom_')) {
          // It's a custom store
          const customStoreId = parseInt(storeIdStr.replace('custom_', ''));
          if (!isNaN(customStoreId)) {
            parsedUserCustomStoreId = customStoreId;
            parsedStoreId = null; // Clear regular store
          }
        } else {
          // It's a regular store - handle both number and string
          const regularStoreId = typeof store_id === 'number' ? store_id : parseInt(storeIdStr);
          if (!isNaN(regularStoreId) && regularStoreId !== null && regularStoreId >= 0) {
            parsedStoreId = regularStoreId;
            parsedUserCustomStoreId = null; // Clear custom store
          }
        }
      }
    }

    // Update product
    const updateData = {
      product_name,
      brand,
      model_number,
      serial_number,
      barcode,
      purchase_date,
      purchase_price,
      currency,
      warranty_duration_months,
      category_id,
      notes,
      is_active
    };

    // Always update store fields if store_id was provided (even if null to clear)
    if (store_id !== undefined) {
      updateData.store_id = parsedStoreId;
      updateData.user_custom_store_id = parsedUserCustomStoreId;
    } else {
      // If store_id is not provided, don't change existing store
      // This allows partial updates without affecting store
    }

    await product.update(updateData);

    // Fetch updated product with associations
    const updatedProduct = await Product.findByPk(product.product_id, {
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'], required: false },
        { model: UserCustomStore, attributes: ['user_custom_store_id', 'store_name'], required: false },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ]
    });

    res.json({
      message: 'Product updated successfully',
      product: normalizeStoreData(updatedProduct)
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { 
        product_id: id,
        user_id: req.user.user_id 
      },
      include: [{
        model: Document,
        attributes: ['document_id', 'cloud_storage_url', 'thumbnail_url']
      }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete all associated documents and their files from S3
    // First, fetch all documents separately to ensure we get them
    const documents = await Document.findAll({
      where: { product_id: id },
      attributes: ['document_id', 'cloud_storage_url', 'thumbnail_url']
    });

    if (documents && documents.length > 0) {
      console.log(`Deleting ${documents.length} documents for product ${id}`);
      
      for (const document of documents) {
        try {
          // Delete main file from S3
          // cloud_storage_url is stored as S3 key (e.g., "users/123/documents/uuid.pdf")
          if (document.cloud_storage_url) {
            // Extract key from URL if it's a full signed URL, otherwise use as-is (it's already a key)
            let fileKey = document.cloud_storage_url;
            if (fileKey.includes('amazonaws.com')) {
              // Extract key from signed URL: https://bucket.s3.region.amazonaws.com/key?signature
              const urlParts = fileKey.split('.com/');
              if (urlParts.length > 1) {
                fileKey = urlParts[1].split('?')[0]; // Remove query parameters
              }
            }
            if (fileKey) {
              console.log(`Deleting file from S3: ${fileKey}`);
              const deleted = await deleteFile(fileKey);
              if (!deleted) {
                console.warn(`Failed to delete file: ${fileKey}`);
              }
            }
          }
          
          // Delete thumbnail from S3
          // thumbnail_url is also stored as S3 key
          if (document.thumbnail_url) {
            let thumbnailKey = document.thumbnail_url;
            if (thumbnailKey.includes('amazonaws.com')) {
              const urlParts = thumbnailKey.split('.com/');
              if (urlParts.length > 1) {
                thumbnailKey = urlParts[1].split('?')[0];
              }
            }
            if (thumbnailKey) {
              console.log(`Deleting thumbnail from S3: ${thumbnailKey}`);
              const deleted = await deleteFile(thumbnailKey);
              if (!deleted) {
                console.warn(`Failed to delete thumbnail: ${thumbnailKey}`);
              }
            }
          }
        } catch (fileError) {
          console.error(`Error deleting file for document ${document.document_id}:`, fileError);
          // Continue with other files even if one fails
        }
      }
      
      // Delete all document records from database
      const deletedCount = await Document.destroy({
        where: { product_id: id }
      });
      console.log(`Deleted ${deletedCount} document records from database`);
    }

    // Delete shared product associations
    await SharedProduct.destroy({
      where: { product_id: id }
    });

    // Hard delete the product
    await product.destroy();

    res.json({ 
      message: 'Product deleted successfully',
      product_id: id
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// Get products expiring soon
exports.getExpiringProducts = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const products = await Product.findAll({
      where: {
        user_id: req.user.user_id,
        is_active: true,
        warranty_end_date: {
          [Op.between]: [today, futureDate]
        }
      },
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'], required: false },
        { model: UserCustomStore, attributes: ['user_custom_store_id', 'store_name'], required: false },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ],
      order: [['warranty_end_date', 'ASC']]
    });

    const normalizedProducts = products.map(normalizeStoreData);
    res.json({ products: normalizedProducts });
  } catch (error) {
    console.error('Get expiring products error:', error);
    res.status(500).json({ error: 'Failed to fetch expiring products' });
  }
};

// Get expired products
exports.getExpiredProducts = async (req, res) => {
  try {
    const today = new Date();

    const products = await Product.findAll({
      where: {
        user_id: req.user.user_id,
        is_active: true,
        warranty_end_date: {
          [Op.lt]: today
        }
      },
      include: [
        { model: Store, attributes: ['store_id', 'store_name', 'store_chain'], required: false },
        { model: UserCustomStore, attributes: ['user_custom_store_id', 'store_name'], required: false },
        { model: Category, attributes: ['category_id', 'category_name', 'icon_name'] }
      ],
      order: [['warranty_end_date', 'DESC']]
    });

    const normalizedProducts = products.map(normalizeStoreData);
    res.json({ products: normalizedProducts });
  } catch (error) {
    console.error('Get expired products error:', error);
    res.status(500).json({ error: 'Failed to fetch expired products' });
  }
};

// Get product statistics
exports.getProductStats = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const today = new Date();

    // Total products
    const totalProducts = await Product.count({
      where: { user_id: userId, is_active: true }
    });

    // Active warranties
    const activeWarranties = await Product.count({
      where: {
        user_id: userId,
        is_active: true,
        warranty_end_date: { [Op.gte]: today }
      }
    });

    // Expired warranties
    const expiredWarranties = await Product.count({
      where: {
        user_id: userId,
        is_active: true,
        warranty_end_date: { [Op.lt]: today }
      }
    });

    // Total spent
    const totalSpentResult = await Product.sum('purchase_price', {
      where: { user_id: userId, is_active: true }
    });

    // Categories breakdown
    const categoriesBreakdown = await Product.findAll({
      where: { user_id: userId, is_active: true },
      attributes: [
        [Product.sequelize.col('Product.category_id'), 'category_id'],
        [Product.sequelize.fn('COUNT', Product.sequelize.col('Product.product_id')), 'count']
      ],
      include: [
        { model: Category, attributes: ['category_name', 'icon_name'] }
      ],
      group: [Product.sequelize.col('Product.category_id'), Product.sequelize.col('Category.category_id')],
      raw: false
    });

    // Stores breakdown
    const storesBreakdown = await Product.findAll({
      where: { user_id: userId, is_active: true },
      attributes: [
        [Product.sequelize.col('Product.store_id'), 'store_id'],
        [Product.sequelize.fn('COUNT', Product.sequelize.col('Product.product_id')), 'count'],
        [Product.sequelize.fn('SUM', Product.sequelize.col('Product.purchase_price')), 'total_spent']
      ],
      include: [
        { model: Store, attributes: ['store_name', 'store_chain'] }
      ],
      group: [Product.sequelize.col('Product.store_id'), Product.sequelize.col('Store.store_id')],
      raw: false
    });

    res.json({
      stats: {
        total_products: totalProducts,
        active_warranties: activeWarranties,
        expired_warranties: expiredWarranties,
        total_spent: totalSpentResult || 0,
        categories_breakdown: categoriesBreakdown,
        stores_breakdown: storesBreakdown
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};
