const { Store, Product, ServiceCenter, Category } = require('../models');
const locationService = require('../services/locationService');
const { Op } = require('sequelize');

// Get stores with locations
exports.getStoresWithLocations = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { userLat, userLon, radius } = req.query;

    // Get all stores where user has products
    const stores = await Store.findAll({
      include: [{
        model: Product,
        where: { 
          user_id: userId,
          is_active: true
        },
        attributes: ['product_id', 'product_name'],
        required: true
      }],
      where: {
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
      }
    });

    let storesWithDistance = stores.map(store => store.toJSON());

    // Calculate distance if user location provided
    if (userLat && userLon) {
      storesWithDistance = storesWithDistance.map(store => ({
        ...store,
        distance: locationService.calculateDistance(
          parseFloat(userLat),
          parseFloat(userLon),
          parseFloat(store.latitude),
          parseFloat(store.longitude)
        )
      }));

      // Filter by radius if provided
      if (radius) {
        storesWithDistance = storesWithDistance.filter(
          store => store.distance <= parseFloat(radius)
        );
      }

      // Sort by distance
      storesWithDistance.sort((a, b) => a.distance - b.distance);
    }

    res.json({ 
      stores: storesWithDistance,
      total: storesWithDistance.length
    });

  } catch (error) {
    console.error('Get stores with locations error:', error);
    res.status(500).json({ error: 'Failed to get store locations' });
  }
};

// Get service centers
exports.getServiceCenters = async (req, res) => {
  try {
    const { 
      userLat, 
      userLon, 
      radius = 50, 
      brand, 
      categoryId,
      city
    } = req.query;

    const where = { is_active: true };

    if (brand) {
      where.brand = brand;
    }

    if (categoryId) {
      where.category_id = parseInt(categoryId);
    }

    if (city) {
      where.city = { [Op.iLike]: `%${city}%` };
    }

    let serviceCenters = await ServiceCenter.findAll({
      where,
      include: [{
        model: Category,
        attributes: ['category_id', 'category_name']
      }],
      order: [['rating', 'DESC NULLS LAST']]
    });

    serviceCenters = serviceCenters.map(sc => sc.toJSON());

    // Calculate distance if user location provided
    if (userLat && userLon) {
      serviceCenters = serviceCenters.map(sc => ({
        ...sc,
        distance: locationService.calculateDistance(
          parseFloat(userLat),
          parseFloat(userLon),
          parseFloat(sc.latitude),
          parseFloat(sc.longitude)
        )
      }));

      // Filter by radius
      serviceCenters = serviceCenters.filter(
        sc => sc.distance <= parseFloat(radius)
      );

      // Sort by distance
      serviceCenters.sort((a, b) => a.distance - b.distance);
    }

    res.json({ 
      serviceCenters,
      total: serviceCenters.length
    });

  } catch (error) {
    console.error('Get service centers error:', error);
    res.status(500).json({ error: 'Failed to get service centers' });
  }
};

// Find service centers for a product
exports.getServiceCentersForProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userLat, userLon, radius = 50 } = req.query;
    const userId = req.user.user_id;

    // Get product
    const product = await Product.findOne({
      where: { 
        product_id: parseInt(productId),
        user_id: userId
      },
      include: [{ model: Category }]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Find service centers by brand or category
    const where = { is_active: true };
    
    if (product.brand) {
      where[Op.or] = [
        { brand: { [Op.iLike]: `%${product.brand}%` } },
        { category_id: product.category_id }
      ];
    } else if (product.category_id) {
      where.category_id = product.category_id;
    }

    let serviceCenters = await ServiceCenter.findAll({
      where,
      include: [{
        model: Category,
        attributes: ['category_id', 'category_name']
      }]
    });

    serviceCenters = serviceCenters.map(sc => sc.toJSON());

    // Calculate distance
    if (userLat && userLon) {
      serviceCenters = serviceCenters.map(sc => ({
        ...sc,
        distance: locationService.calculateDistance(
          parseFloat(userLat),
          parseFloat(userLon),
          parseFloat(sc.latitude),
          parseFloat(sc.longitude)
        )
      }));

      serviceCenters = serviceCenters.filter(
        sc => sc.distance <= parseFloat(radius)
      );

      serviceCenters.sort((a, b) => a.distance - b.distance);
    }

    res.json({ 
      product: {
        product_id: product.product_id,
        product_name: product.product_name,
        brand: product.brand
      },
      serviceCenters,
      total: serviceCenters.length
    });

  } catch (error) {
    console.error('Get service centers for product error:', error);
    res.status(500).json({ error: 'Failed to get service centers' });
  }
};

// Geocode address
exports.geocodeAddress = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    const location = await locationService.geocodeAddress(address);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({ location });

  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: 'Geocoding failed' });
  }
};

// Reverse geocode
exports.reverseGeocode = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const location = await locationService.reverseGeocode(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    if (!location) {
      return res.status(404).json({ error: 'Address not found' });
    }

    res.json({ location });

  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: 'Reverse geocoding failed' });
  }
};

// Get location analytics
exports.getLocationAnalytics = async (req, res) => {
  try {
    const userId = req.user.user_id;

    // Get all stores with products
    const stores = await Store.findAll({
      include: [{
        model: Product,
        where: { 
          user_id: userId,
          is_active: true
        },
        attributes: ['product_id', 'purchase_price']
      }],
      where: {
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
      }
    });

    // Calculate analytics
    const storeAnalytics = stores.map(store => {
      const products = store.Products || [];
      const totalSpent = products.reduce((sum, p) => 
        sum + (parseFloat(p.purchase_price) || 0), 0
      );

      return {
        store_id: store.store_id,
        store_name: store.store_name,
        latitude: store.latitude,
        longitude: store.longitude,
        city: store.city,
        product_count: products.length,
        total_spent: totalSpent
      };
    });

    // Get spending by city
    const spendingByCity = {};
    storeAnalytics.forEach(store => {
      const city = store.city || 'Unknown';
      if (!spendingByCity[city]) {
        spendingByCity[city] = {
          city,
          total_spent: 0,
          product_count: 0,
          store_count: 0
        };
      }
      spendingByCity[city].total_spent += store.total_spent;
      spendingByCity[city].product_count += store.product_count;
      spendingByCity[city].store_count += 1;
    });

    res.json({
      stores: storeAnalytics,
      spending_by_city: Object.values(spendingByCity),
      total_stores: stores.length
    });

  } catch (error) {
    console.error('Get location analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

